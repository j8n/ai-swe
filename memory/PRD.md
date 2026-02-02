# DevAI - AI Software Developer App

## Original Problem Statement
Build an AI software developer app where users can connect GitHub or upload a project directory. The AI developer will check the source and set the summary of the project uploaded. Users can add tasks (todo list), and the AI Developer will start working on these features/tasks. The AI developer will create pull requests and users can check and merge those PRs. Tech-stack focus: Laravel (backend), Vue.js (frontend), Flutter (mobile).

## User Choices
- GitHub OAuth integration for connecting repositories
- ZIP file upload for project directories
- OpenAI GPT-5.2 and Claude Sonnet 4.5 with dynamic model switching
- JWT-based custom authentication
- Dark theme default with light theme support

## User Personas
1. **Solo Developer** - Wants AI assistance to accelerate feature development
2. **Tech Lead** - Needs to manage multiple projects with AI-powered code analysis
3. **Development Team** - Collaborative task management with AI execution

## Core Requirements (Static)
- User authentication (JWT-based)
- GitHub OAuth integration
- Project management (create, upload, GitHub import)
- AI-powered project analysis and summarization
- Task/Todo management
- **REAL AI task execution (generates actual code files)**
- **Creates branches on GitHub**
- **Commits multiple files in single commit**
- **Creates Pull Requests with actual diffs**
- Theme switching (dark/light)

## Architecture
- **Backend**: FastAPI + MongoDB
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **AI Integration**: Emergent LLM (OpenAI GPT-5.2, Claude Sonnet 4.5)
- **Authentication**: JWT tokens with refresh mechanism
- **File Handling**: ZIP upload with tech-stack detection
- **GitHub Integration**: Full Git Data API for branches, commits, PRs

## What's Been Implemented (v2.0 - Jan 2026)

### Backend - Core
- [x] JWT Authentication (register, login, refresh, logout)
- [x] GitHub OAuth flow (auth URL, callback, disconnect)
- [x] GitHub repository listing and contents fetching
- [x] Project CRUD (create, list, get, delete)
- [x] Project upload (ZIP file with auto tech-stack detection)
- [x] Project import from GitHub
- [x] AI project analysis endpoint
- [x] Task CRUD (create, list, update, delete)
- [x] User settings (AI model, theme)
- [x] Dashboard stats and recent activity

### Backend - AI Code Generation (NEW)
- [x] **GitHubService class** - Full GitHub API integration
- [x] **Create branches** from default branch
- [x] **Get branch SHA** for commits
- [x] **Commit multiple files** in single commit using Git Data API
- [x] **Create pull requests** with proper descriptions
- [x] **Parse AI code responses** - Extract file paths and content
- [x] **Generate branch names** from task titles
- [x] Task execution generates REAL code files
- [x] For GitHub projects: creates branch → commits files → creates PR
- [x] For uploaded/manual projects: saves files directly to project storage
- [x] PR files_changed includes actual code content

### Frontend
- [x] Landing page with hero section
- [x] User registration and login
- [x] Protected routes
- [x] Dashboard with stats cards
- [x] Projects list with search
- [x] New project wizard (GitHub, Upload, Manual)
- [x] **Project detail page with file change viewer**
- [x] **Task management with execute button**
- [x] **View generated files with syntax highlighting**
- [x] **PR list with expandable file diffs**
- [x] Settings page with AI model selection
- [x] Dark/Light theme toggle
- [x] Responsive design

## API Endpoints

### New/Enhanced Endpoints
- `POST /api/projects/{id}/tasks/{id}/execute` - Executes task with AI, creates branch, commits files, creates PR
- Returns: `{ status, ai_response, files_changed[], branch_name, pr_id, pr_data }`

### File Change Format
```json
{
  "path": "app/Http/Controllers/UserController.php",
  "content": "<?php\n\nnamespace App\\Http\\Controllers;\n...",
  "action": "create"
}
```

## Prioritized Backlog

### P0 - Required for GitHub Integration
- [ ] User provides GitHub OAuth credentials (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

### P1 - High Priority
- [ ] Async task execution with WebSocket progress updates
- [ ] Retry mechanism for failed GitHub API calls
- [ ] Better error handling for AI response parsing failures

### P2 - Medium Priority  
- [ ] Interactive code diff viewer (side-by-side)
- [ ] Revert PR functionality
- [ ] Task dependencies
- [ ] Code review comments

### P3 - Future Enhancements
- [ ] Team collaboration features
- [ ] CI/CD integration
- [ ] Mobile app (Flutter)
- [ ] Custom AI prompts

## Configuration Required

### GitHub OAuth Setup
Add to `/app/backend/.env`:
```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=https://your-domain/github/callback
```

## How It Works

1. **User creates a task** (e.g., "Add user authentication")
2. **AI analyzes the project context** (existing files, tech stack, summary)
3. **AI generates code files** with proper structure
4. **System parses AI response** to extract file paths and content
5. **For GitHub projects**:
   - Creates a new branch (e.g., `feature/add-user-auth-202601281530`)
   - Commits all generated files in a single commit
   - Creates a PR with file list and description
6. **For uploaded projects**:
   - Saves files directly to project storage
   - Creates a local PR record for tracking
7. **User reviews files** in the app with expandable code viewer
8. **User merges PR** when satisfied
