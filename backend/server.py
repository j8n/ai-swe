from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import zipfile
import io
import base64
import json
import aiofiles
import shutil
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'devai-super-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))
REFRESH_TOKEN_EXPIRATION_DAYS = int(os.environ.get('REFRESH_TOKEN_EXPIRATION_DAYS', 7))

# GitHub OAuth Settings
GITHUB_CLIENT_ID = os.environ.get('GITHUB_CLIENT_ID', '')
GITHUB_CLIENT_SECRET = os.environ.get('GITHUB_CLIENT_SECRET', '')
GITHUB_REDIRECT_URI = os.environ.get('GITHUB_REDIRECT_URI', '')

# LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI(title="DevAI - AI Software Developer")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ======================
# PYDANTIC MODELS
# ======================

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    github_connected: bool = False
    github_username: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Project Models
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    tech_stack: List[str] = []

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    tech_stack: List[str]
    source_type: str  # 'github' or 'upload'
    github_repo: Optional[str] = None
    github_owner: Optional[str] = None
    summary: Optional[str] = None
    file_count: int = 0
    status: str = "analyzing"
    created_at: str
    updated_at: str

# Task Models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: str = "medium"  # low, medium, high

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    status: str  # pending, in_progress, completed, failed
    priority: str
    ai_response: Optional[str] = None
    pr_id: Optional[str] = None
    created_at: str
    updated_at: str

# PR Models
class PRCreate(BaseModel):
    task_id: str
    title: str
    description: str
    branch_name: str
    base_branch: str = "main"

class PRResponse(BaseModel):
    id: str
    project_id: str
    task_id: str
    title: str
    description: str
    branch_name: str
    base_branch: str
    status: str  # open, merged, closed
    github_pr_number: Optional[int] = None
    github_pr_url: Optional[str] = None
    files_changed: List[Dict[str, Any]] = []
    created_at: str
    updated_at: str

# Settings Models
class UserSettings(BaseModel):
    ai_model: str = "gpt-5.2"
    ai_provider: str = "openai"
    theme: str = "dark"

class SettingsUpdate(BaseModel):
    ai_model: Optional[str] = None
    ai_provider: Optional[str] = None
    theme: Optional[str] = None

# GitHub Models
class GitHubRepoResponse(BaseModel):
    id: int
    name: str
    full_name: str
    description: Optional[str]
    url: str
    language: Optional[str]
    stars: int
    is_private: bool
    default_branch: str

# ======================
# HELPER FUNCTIONS
# ======================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, token_type: str = "access") -> str:
    if token_type == "access":
        expires = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    else:
        expires = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRATION_DAYS)
    
    payload = {
        "sub": user_id,
        "exp": expires,
        "iat": datetime.now(timezone.utc),
        "type": token_type
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def format_datetime(dt) -> str:
    if isinstance(dt, str):
        return dt
    return dt.isoformat() if dt else datetime.now(timezone.utc).isoformat()

# ======================
# AUTH ENDPOINTS
# ======================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "avatar_url": None,
        "github_connected": False,
        "github_username": None,
        "github_access_token": None,
        "settings": {
            "ai_model": "gpt-5.2",
            "ai_provider": "openai",
            "theme": "dark"
        },
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    access_token = create_token(user_id, "access")
    refresh_token = create_token(user_id, "refresh")
    
    # Store refresh token
    await db.refresh_tokens.insert_one({
        "user_id": user_id,
        "token": refresh_token,
        "created_at": now,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRATION_DAYS)).isoformat()
    })
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user_id,
            email=data.email,
            name=data.name,
            avatar_url=None,
            github_connected=False,
            github_username=None,
            created_at=now
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_token(user["id"], "access")
    refresh_token = create_token(user["id"], "refresh")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.refresh_tokens.insert_one({
        "user_id": user["id"],
        "token": refresh_token,
        "created_at": now,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRATION_DAYS)).isoformat()
    })
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            avatar_url=user.get("avatar_url"),
            github_connected=user.get("github_connected", False),
            github_username=user.get("github_username"),
            created_at=format_datetime(user["created_at"])
        )
    )

@api_router.post("/auth/refresh", response_model=dict)
async def refresh_token(data: RefreshTokenRequest):
    try:
        payload = jwt.decode(data.refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("sub")
        
        # Verify token exists
        stored = await db.refresh_tokens.find_one({"user_id": user_id, "token": data.refresh_token})
        if not stored:
            raise HTTPException(status_code=401, detail="Token not found")
        
        new_access_token = create_token(user_id, "access")
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        avatar_url=current_user.get("avatar_url"),
        github_connected=current_user.get("github_connected", False),
        github_username=current_user.get("github_username"),
        created_at=format_datetime(current_user["created_at"])
    )

@api_router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    await db.refresh_tokens.delete_many({"user_id": current_user["id"]})
    return {"message": "Logged out successfully"}

# ======================
# GITHUB OAUTH ENDPOINTS
# ======================

@api_router.get("/github/auth-url")
async def get_github_auth_url(current_user: dict = Depends(get_current_user)):
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=400, detail="GitHub OAuth not configured. Please set GITHUB_CLIENT_ID in environment variables.")
    
    state = str(uuid.uuid4())
    
    # Store state for CSRF protection
    await db.oauth_states.insert_one({
        "state": state,
        "user_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_REDIRECT_URI}"
        f"&scope=repo user"
        f"&state={state}"
    )
    
    return {"auth_url": auth_url, "state": state}

@api_router.post("/github/callback")
async def github_callback(
    code: str = Form(...),
    state: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    # Verify state
    stored_state = await db.oauth_states.find_one({"state": state, "user_id": current_user["id"]})
    if not stored_state:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    await db.oauth_states.delete_one({"state": state})
    
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=400, detail="GitHub OAuth not configured")
    
    # Exchange code for token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI
            },
            headers={"Accept": "application/json"}
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        
        token_data = token_response.json()
        
        if "error" in token_data:
            raise HTTPException(status_code=400, detail=token_data.get("error_description", "GitHub OAuth error"))
        
        github_token = token_data.get("access_token")
        
        # Get GitHub user info
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {github_token}"}
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get GitHub user info")
        
        github_user = user_response.json()
    
    # Update user with GitHub info
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "github_connected": True,
            "github_username": github_user["login"],
            "github_access_token": github_token,
            "avatar_url": github_user.get("avatar_url"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": "GitHub connected successfully",
        "github_username": github_user["login"]
    }

@api_router.post("/github/disconnect")
async def disconnect_github(current_user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "github_connected": False,
            "github_username": None,
            "github_access_token": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "GitHub disconnected successfully"}

@api_router.get("/github/repos", response_model=List[GitHubRepoResponse])
async def list_github_repos(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    if not user.get("github_connected") or not user.get("github_access_token"):
        raise HTTPException(status_code=400, detail="GitHub not connected")
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user/repos",
            headers={"Authorization": f"Bearer {user['github_access_token']}"},
            params={"sort": "updated", "per_page": 100, "type": "all"}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch repositories")
        
        repos = response.json()
    
    return [
        GitHubRepoResponse(
            id=repo["id"],
            name=repo["name"],
            full_name=repo["full_name"],
            description=repo.get("description"),
            url=repo["html_url"],
            language=repo.get("language"),
            stars=repo["stargazers_count"],
            is_private=repo["private"],
            default_branch=repo.get("default_branch", "main")
        )
        for repo in repos
    ]

@api_router.get("/github/repos/{owner}/{repo}/contents")
async def get_repo_contents(
    owner: str,
    repo: str,
    path: str = "",
    current_user: dict = Depends(get_current_user)
):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    if not user.get("github_connected") or not user.get("github_access_token"):
        raise HTTPException(status_code=400, detail="GitHub not connected")
    
    url = f"https://api.github.com/repos/{owner}/{repo}/contents"
    if path:
        url += f"/{path}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            headers={"Authorization": f"Bearer {user['github_access_token']}"}
        )
        
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Repository or path not found")
        elif response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch contents")
        
        contents = response.json()
    
    if isinstance(contents, dict):
        # Single file
        return {
            "type": "file",
            "name": contents["name"],
            "path": contents["path"],
            "content": contents.get("content", ""),
            "encoding": contents.get("encoding", "base64"),
            "size": contents["size"]
        }
    else:
        # Directory
        return {
            "type": "directory",
            "items": [
                {
                    "name": item["name"],
                    "type": item["type"],
                    "path": item["path"],
                    "size": item.get("size", 0)
                }
                for item in contents
            ]
        }

# ======================
# PROJECT ENDPOINTS
# ======================

@api_router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [
        ProjectResponse(
            id=p["id"],
            name=p["name"],
            description=p.get("description", ""),
            tech_stack=p.get("tech_stack", []),
            source_type=p["source_type"],
            github_repo=p.get("github_repo"),
            github_owner=p.get("github_owner"),
            summary=p.get("summary"),
            file_count=p.get("file_count", 0),
            status=p.get("status", "analyzing"),
            created_at=format_datetime(p["created_at"]),
            updated_at=format_datetime(p["updated_at"])
        )
        for p in projects
    ]

@api_router.post("/projects", response_model=ProjectResponse)
async def create_project(data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    project_doc = {
        "id": project_id,
        "user_id": current_user["id"],
        "name": data.name,
        "description": data.description,
        "tech_stack": data.tech_stack,
        "source_type": "manual",
        "github_repo": None,
        "github_owner": None,
        "summary": None,
        "file_count": 0,
        "files": [],
        "status": "created",
        "created_at": now,
        "updated_at": now
    }
    
    await db.projects.insert_one(project_doc)
    
    return ProjectResponse(
        id=project_id,
        name=data.name,
        description=data.description or "",
        tech_stack=data.tech_stack,
        source_type="manual",
        github_repo=None,
        github_owner=None,
        summary=None,
        file_count=0,
        status="created",
        created_at=now,
        updated_at=now
    )

@api_router.post("/projects/from-github", response_model=ProjectResponse)
async def create_project_from_github(
    owner: str = Form(...),
    repo: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    if not user.get("github_connected") or not user.get("github_access_token"):
        raise HTTPException(status_code=400, detail="GitHub not connected")
    
    # Check if project already exists
    existing = await db.projects.find_one({
        "user_id": current_user["id"],
        "github_repo": repo,
        "github_owner": owner
    })
    if existing:
        raise HTTPException(status_code=400, detail="Project from this repository already exists")
    
    # Get repo info
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers={"Authorization": f"Bearer {user['github_access_token']}"}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Repository not found")
        
        repo_info = response.json()
    
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Detect tech stack
    tech_stack = []
    language = repo_info.get("language")
    if language:
        tech_stack.append(language)
    
    project_doc = {
        "id": project_id,
        "user_id": current_user["id"],
        "name": repo_info["name"],
        "description": repo_info.get("description") or "",
        "tech_stack": tech_stack,
        "source_type": "github",
        "github_repo": repo,
        "github_owner": owner,
        "github_default_branch": repo_info.get("default_branch", "main"),
        "summary": None,
        "file_count": 0,
        "files": [],
        "status": "analyzing",
        "created_at": now,
        "updated_at": now
    }
    
    await db.projects.insert_one(project_doc)
    
    return ProjectResponse(
        id=project_id,
        name=repo_info["name"],
        description=repo_info.get("description") or "",
        tech_stack=tech_stack,
        source_type="github",
        github_repo=repo,
        github_owner=owner,
        summary=None,
        file_count=0,
        status="analyzing",
        created_at=now,
        updated_at=now
    )

@api_router.post("/projects/upload", response_model=ProjectResponse)
async def upload_project(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only ZIP files are supported")
    
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Read and process ZIP file
    content = await file.read()
    files_data = []
    tech_stack = set()
    
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            for file_info in zf.filelist:
                if file_info.is_dir():
                    continue
                
                filename = file_info.filename
                # Skip hidden files and common non-code files
                if any(part.startswith('.') for part in filename.split('/')):
                    continue
                if any(filename.endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot']):
                    continue
                
                # Detect tech stack
                if filename.endswith('.php') or 'laravel' in filename.lower():
                    tech_stack.add('Laravel')
                    tech_stack.add('PHP')
                if filename.endswith('.vue'):
                    tech_stack.add('Vue.js')
                if filename.endswith('.dart') or 'flutter' in filename.lower():
                    tech_stack.add('Flutter')
                    tech_stack.add('Dart')
                if filename.endswith('.js') or filename.endswith('.jsx'):
                    tech_stack.add('JavaScript')
                if filename.endswith('.ts') or filename.endswith('.tsx'):
                    tech_stack.add('TypeScript')
                if filename.endswith('.py'):
                    tech_stack.add('Python')
                
                # Read file content (limit size)
                if file_info.file_size < 100000:  # 100KB limit
                    try:
                        file_content = zf.read(filename).decode('utf-8', errors='ignore')
                        files_data.append({
                            "path": filename,
                            "content": file_content[:50000],  # Truncate if too long
                            "size": file_info.file_size
                        })
                    except Exception:
                        pass
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file")
    
    project_doc = {
        "id": project_id,
        "user_id": current_user["id"],
        "name": name,
        "description": description,
        "tech_stack": list(tech_stack),
        "source_type": "upload",
        "github_repo": None,
        "github_owner": None,
        "summary": None,
        "file_count": len(files_data),
        "files": files_data,
        "status": "analyzing",
        "created_at": now,
        "updated_at": now
    }
    
    await db.projects.insert_one(project_doc)
    
    return ProjectResponse(
        id=project_id,
        name=name,
        description=description,
        tech_stack=list(tech_stack),
        source_type="upload",
        github_repo=None,
        github_owner=None,
        summary=None,
        file_count=len(files_data),
        status="analyzing",
        created_at=now,
        updated_at=now
    )

@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one(
        {"id": project_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return ProjectResponse(
        id=project["id"],
        name=project["name"],
        description=project.get("description", ""),
        tech_stack=project.get("tech_stack", []),
        source_type=project["source_type"],
        github_repo=project.get("github_repo"),
        github_owner=project.get("github_owner"),
        summary=project.get("summary"),
        file_count=project.get("file_count", 0),
        status=project.get("status", "analyzing"),
        created_at=format_datetime(project["created_at"]),
        updated_at=format_datetime(project["updated_at"])
    )

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.projects.delete_one({"id": project_id, "user_id": current_user["id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete associated tasks and PRs
    await db.tasks.delete_many({"project_id": project_id})
    await db.pull_requests.delete_many({"project_id": project_id})
    
    return {"message": "Project deleted successfully"}

@api_router.post("/projects/{project_id}/analyze")
async def analyze_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Analyze project with AI and generate summary"""
    project = await db.projects.find_one(
        {"id": project_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    settings = user.get("settings", {})
    ai_provider = settings.get("ai_provider", "openai")
    ai_model = settings.get("ai_model", "gpt-5.2")
    
    # Gather project files content for analysis
    files_content = ""
    
    if project["source_type"] == "github" and user.get("github_access_token"):
        # Fetch files from GitHub
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{project['github_owner']}/{project['github_repo']}/contents",
                headers={"Authorization": f"Bearer {user['github_access_token']}"}
            )
            if response.status_code == 200:
                contents = response.json()
                file_list = [item["name"] for item in contents if item["type"] == "file"]
                files_content = f"Repository files: {', '.join(file_list[:50])}"
    elif project.get("files"):
        # Use uploaded files
        for f in project["files"][:20]:  # Limit files
            files_content += f"\n--- {f['path']} ---\n{f['content'][:2000]}\n"
    
    # Generate summary with AI
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"project-analysis-{project_id}",
            system_message="""You are an expert software architect. Analyze the provided project and generate a comprehensive summary including:
1. Project overview and purpose
2. Tech stack and frameworks used
3. Architecture patterns
4. Key components and their responsibilities
5. Potential areas for improvement
Be concise but thorough."""
        ).with_model(ai_provider, ai_model)
        
        prompt = f"""Analyze this {', '.join(project.get('tech_stack', []))} project:

Project Name: {project['name']}
Description: {project.get('description', 'No description')}

{files_content}

Provide a comprehensive analysis."""
        
        user_message = UserMessage(text=prompt)
        summary = await chat.send_message(user_message)
        
        # Update project with summary
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {
                "summary": summary,
                "status": "ready",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"summary": summary, "status": "ready"}
    
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {
                "status": "error",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

# ======================
# TASK ENDPOINTS
# ======================

@api_router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
async def list_tasks(project_id: str, current_user: dict = Depends(get_current_user)):
    # Verify project ownership
    project = await db.projects.find_one(
        {"id": project_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tasks = await db.tasks.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [
        TaskResponse(
            id=t["id"],
            project_id=t["project_id"],
            title=t["title"],
            description=t.get("description", ""),
            status=t["status"],
            priority=t.get("priority", "medium"),
            ai_response=t.get("ai_response"),
            pr_id=t.get("pr_id"),
            created_at=format_datetime(t["created_at"]),
            updated_at=format_datetime(t["updated_at"])
        )
        for t in tasks
    ]

@api_router.post("/projects/{project_id}/tasks", response_model=TaskResponse)
async def create_task(
    project_id: str,
    data: TaskCreate,
    current_user: dict = Depends(get_current_user)
):
    # Verify project ownership
    project = await db.projects.find_one(
        {"id": project_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    task_doc = {
        "id": task_id,
        "project_id": project_id,
        "user_id": current_user["id"],
        "title": data.title,
        "description": data.description,
        "status": "pending",
        "priority": data.priority,
        "ai_response": None,
        "pr_id": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.tasks.insert_one(task_doc)
    
    return TaskResponse(
        id=task_id,
        project_id=project_id,
        title=data.title,
        description=data.description or "",
        status="pending",
        priority=data.priority,
        ai_response=None,
        pr_id=None,
        created_at=now,
        updated_at=now
    )

@api_router.put("/projects/{project_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    project_id: str,
    task_id: str,
    data: TaskUpdate,
    current_user: dict = Depends(get_current_user)
):
    task = await db.tasks.find_one(
        {"id": task_id, "project_id": project_id},
        {"_id": 0}
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if data.title is not None:
        update_data["title"] = data.title
    if data.description is not None:
        update_data["description"] = data.description
    if data.status is not None:
        update_data["status"] = data.status
    if data.priority is not None:
        update_data["priority"] = data.priority
    
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    updated_task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    
    return TaskResponse(
        id=updated_task["id"],
        project_id=updated_task["project_id"],
        title=updated_task["title"],
        description=updated_task.get("description", ""),
        status=updated_task["status"],
        priority=updated_task.get("priority", "medium"),
        ai_response=updated_task.get("ai_response"),
        pr_id=updated_task.get("pr_id"),
        created_at=format_datetime(updated_task["created_at"]),
        updated_at=format_datetime(updated_task["updated_at"])
    )

@api_router.delete("/projects/{project_id}/tasks/{task_id}")
async def delete_task(
    project_id: str,
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    result = await db.tasks.delete_one({"id": task_id, "project_id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully"}

@api_router.post("/projects/{project_id}/tasks/{task_id}/execute")
async def execute_task(
    project_id: str,
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Execute task with AI developer"""
    task = await db.tasks.find_one(
        {"id": task_id, "project_id": project_id},
        {"_id": 0}
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    project = await db.projects.find_one(
        {"id": project_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    settings = user.get("settings", {})
    ai_provider = settings.get("ai_provider", "openai")
    ai_model = settings.get("ai_model", "gpt-5.2")
    
    # Update task status
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {"status": "in_progress", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"task-execution-{task_id}",
            system_message=f"""You are an expert {', '.join(project.get('tech_stack', ['']))} developer.
You are working on the project: {project['name']}
Project description: {project.get('description', 'No description')}
Project summary: {project.get('summary', 'Not analyzed yet')}

Your task is to implement the requested feature or fix. Provide:
1. A clear explanation of the approach
2. The code changes needed (with file paths)
3. Any dependencies or migrations required
4. Testing suggestions

Format code changes as:
```filename.ext
// code here
```"""
        ).with_model(ai_provider, ai_model)
        
        user_message = UserMessage(
            text=f"""Task: {task['title']}

Description: {task.get('description', 'No additional details')}

Please implement this task and provide the complete solution."""
        )
        
        ai_response = await chat.send_message(user_message)
        
        # Update task with response
        await db.tasks.update_one(
            {"id": task_id},
            {"$set": {
                "status": "completed",
                "ai_response": ai_response,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"status": "completed", "ai_response": ai_response}
    
    except Exception as e:
        logger.error(f"Task execution failed: {e}")
        await db.tasks.update_one(
            {"id": task_id},
            {"$set": {
                "status": "failed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        raise HTTPException(status_code=500, detail=f"Task execution failed: {str(e)}")

# ======================
# PULL REQUEST ENDPOINTS
# ======================

@api_router.get("/projects/{project_id}/prs", response_model=List[PRResponse])
async def list_pull_requests(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one(
        {"id": project_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    prs = await db.pull_requests.find(
        {"project_id": project_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [
        PRResponse(
            id=pr["id"],
            project_id=pr["project_id"],
            task_id=pr["task_id"],
            title=pr["title"],
            description=pr.get("description", ""),
            branch_name=pr["branch_name"],
            base_branch=pr.get("base_branch", "main"),
            status=pr["status"],
            github_pr_number=pr.get("github_pr_number"),
            github_pr_url=pr.get("github_pr_url"),
            files_changed=pr.get("files_changed", []),
            created_at=format_datetime(pr["created_at"]),
            updated_at=format_datetime(pr["updated_at"])
        )
        for pr in prs
    ]

@api_router.post("/projects/{project_id}/prs", response_model=PRResponse)
async def create_pull_request(
    project_id: str,
    data: PRCreate,
    current_user: dict = Depends(get_current_user)
):
    project = await db.projects.find_one(
        {"id": project_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    task = await db.tasks.find_one({"id": data.task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    pr_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    pr_doc = {
        "id": pr_id,
        "project_id": project_id,
        "task_id": data.task_id,
        "title": data.title,
        "description": data.description,
        "branch_name": data.branch_name,
        "base_branch": data.base_branch,
        "status": "open",
        "github_pr_number": None,
        "github_pr_url": None,
        "files_changed": [],
        "created_at": now,
        "updated_at": now
    }
    
    # If GitHub connected and project is from GitHub, create actual PR
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    if (project["source_type"] == "github" and 
        user.get("github_connected") and 
        user.get("github_access_token")):
        try:
            async with httpx.AsyncClient() as client:
                # Create PR on GitHub
                pr_response = await client.post(
                    f"https://api.github.com/repos/{project['github_owner']}/{project['github_repo']}/pulls",
                    headers={"Authorization": f"Bearer {user['github_access_token']}"},
                    json={
                        "title": data.title,
                        "body": data.description,
                        "head": data.branch_name,
                        "base": data.base_branch
                    }
                )
                
                if pr_response.status_code == 201:
                    gh_pr = pr_response.json()
                    pr_doc["github_pr_number"] = gh_pr["number"]
                    pr_doc["github_pr_url"] = gh_pr["html_url"]
        except Exception as e:
            logger.error(f"Failed to create GitHub PR: {e}")
    
    await db.pull_requests.insert_one(pr_doc)
    
    # Update task with PR reference
    await db.tasks.update_one({"id": data.task_id}, {"$set": {"pr_id": pr_id}})
    
    return PRResponse(
        id=pr_id,
        project_id=project_id,
        task_id=data.task_id,
        title=data.title,
        description=data.description,
        branch_name=data.branch_name,
        base_branch=data.base_branch,
        status="open",
        github_pr_number=pr_doc.get("github_pr_number"),
        github_pr_url=pr_doc.get("github_pr_url"),
        files_changed=[],
        created_at=now,
        updated_at=now
    )

@api_router.get("/projects/{project_id}/prs/{pr_id}", response_model=PRResponse)
async def get_pull_request(
    project_id: str,
    pr_id: str,
    current_user: dict = Depends(get_current_user)
):
    pr = await db.pull_requests.find_one(
        {"id": pr_id, "project_id": project_id},
        {"_id": 0}
    )
    if not pr:
        raise HTTPException(status_code=404, detail="Pull request not found")
    
    return PRResponse(
        id=pr["id"],
        project_id=pr["project_id"],
        task_id=pr["task_id"],
        title=pr["title"],
        description=pr.get("description", ""),
        branch_name=pr["branch_name"],
        base_branch=pr.get("base_branch", "main"),
        status=pr["status"],
        github_pr_number=pr.get("github_pr_number"),
        github_pr_url=pr.get("github_pr_url"),
        files_changed=pr.get("files_changed", []),
        created_at=format_datetime(pr["created_at"]),
        updated_at=format_datetime(pr["updated_at"])
    )

@api_router.post("/projects/{project_id}/prs/{pr_id}/merge")
async def merge_pull_request(
    project_id: str,
    pr_id: str,
    current_user: dict = Depends(get_current_user)
):
    pr = await db.pull_requests.find_one(
        {"id": pr_id, "project_id": project_id},
        {"_id": 0}
    )
    if not pr:
        raise HTTPException(status_code=404, detail="Pull request not found")
    
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    # If GitHub PR, merge on GitHub
    if (pr.get("github_pr_number") and 
        user.get("github_connected") and 
        user.get("github_access_token")):
        try:
            async with httpx.AsyncClient() as client:
                merge_response = await client.put(
                    f"https://api.github.com/repos/{project['github_owner']}/{project['github_repo']}/pulls/{pr['github_pr_number']}/merge",
                    headers={"Authorization": f"Bearer {user['github_access_token']}"},
                    json={"merge_method": "squash"}
                )
                
                if merge_response.status_code not in [200, 201, 202]:
                    raise HTTPException(status_code=400, detail="Failed to merge PR on GitHub")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to merge GitHub PR: {e}")
    
    # Update local PR status
    await db.pull_requests.update_one(
        {"id": pr_id},
        {"$set": {"status": "merged", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Pull request merged successfully"}

@api_router.post("/projects/{project_id}/prs/{pr_id}/close")
async def close_pull_request(
    project_id: str,
    pr_id: str,
    current_user: dict = Depends(get_current_user)
):
    await db.pull_requests.update_one(
        {"id": pr_id, "project_id": project_id},
        {"$set": {"status": "closed", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Pull request closed"}

# ======================
# SETTINGS ENDPOINTS
# ======================

@api_router.get("/settings", response_model=UserSettings)
async def get_settings(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    settings = user.get("settings", {})
    
    return UserSettings(
        ai_model=settings.get("ai_model", "gpt-5.2"),
        ai_provider=settings.get("ai_provider", "openai"),
        theme=settings.get("theme", "dark")
    )

@api_router.put("/settings", response_model=UserSettings)
async def update_settings(
    data: SettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    settings = user.get("settings", {})
    
    if data.ai_model is not None:
        settings["ai_model"] = data.ai_model
    if data.ai_provider is not None:
        settings["ai_provider"] = data.ai_provider
    if data.theme is not None:
        settings["theme"] = data.theme
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"settings": settings, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return UserSettings(
        ai_model=settings.get("ai_model", "gpt-5.2"),
        ai_provider=settings.get("ai_provider", "openai"),
        theme=settings.get("theme", "dark")
    )

# ======================
# DASHBOARD/STATS ENDPOINTS
# ======================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Count projects
    projects_count = await db.projects.count_documents({"user_id": user_id})
    
    # Count tasks by status
    tasks_pending = await db.tasks.count_documents({"user_id": user_id, "status": "pending"})
    tasks_in_progress = await db.tasks.count_documents({"user_id": user_id, "status": "in_progress"})
    tasks_completed = await db.tasks.count_documents({"user_id": user_id, "status": "completed"})
    
    # Count PRs by status
    prs_open = await db.pull_requests.count_documents({"project_id": {"$in": await get_user_project_ids(user_id)}, "status": "open"})
    prs_merged = await db.pull_requests.count_documents({"project_id": {"$in": await get_user_project_ids(user_id)}, "status": "merged"})
    
    return {
        "projects": projects_count,
        "tasks": {
            "pending": tasks_pending,
            "in_progress": tasks_in_progress,
            "completed": tasks_completed,
            "total": tasks_pending + tasks_in_progress + tasks_completed
        },
        "pull_requests": {
            "open": prs_open,
            "merged": prs_merged
        }
    }

async def get_user_project_ids(user_id: str) -> List[str]:
    projects = await db.projects.find({"user_id": user_id}, {"id": 1, "_id": 0}).to_list(1000)
    return [p["id"] for p in projects]

@api_router.get("/dashboard/recent")
async def get_recent_activity(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Get recent projects
    recent_projects = await db.projects.find(
        {"user_id": user_id},
        {"_id": 0, "files": 0}
    ).sort("updated_at", -1).limit(5).to_list(5)
    
    # Get recent tasks
    recent_tasks = await db.tasks.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("updated_at", -1).limit(5).to_list(5)
    
    project_ids = await get_user_project_ids(user_id)
    
    # Get recent PRs
    recent_prs = await db.pull_requests.find(
        {"project_id": {"$in": project_ids}},
        {"_id": 0}
    ).sort("updated_at", -1).limit(5).to_list(5)
    
    return {
        "projects": recent_projects,
        "tasks": recent_tasks,
        "pull_requests": recent_prs
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
