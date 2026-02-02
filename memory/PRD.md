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
- AI task execution (GPT-5.2, Claude Sonnet 4.5)
- Pull request creation and management
- Theme switching (dark/light)

## Architecture
- **Backend**: FastAPI + MongoDB
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **AI Integration**: Emergent LLM (OpenAI GPT-5.2, Claude Sonnet 4.5)
- **Authentication**: JWT tokens with refresh mechanism
- **File Handling**: ZIP upload with tech-stack detection

## What's Been Implemented (v1.0 - Jan 2026)

### Backend
- [x] JWT Authentication (register, login, refresh, logout)
- [x] GitHub OAuth flow (auth URL, callback, disconnect)
- [x] GitHub repository listing and contents fetching
- [x] Project CRUD (create, list, get, delete)
- [x] Project upload (ZIP file with auto tech-stack detection)
- [x] Project import from GitHub
- [x] AI project analysis endpoint
- [x] Task CRUD (create, list, update, delete)
- [x] Task execution with AI (GPT-5.2, Claude Sonnet 4.5)
- [x] Pull request management
- [x] User settings (AI model, theme)
- [x] Dashboard stats and recent activity

### Frontend
- [x] Landing page with hero section
- [x] User registration and login
- [x] Protected routes
- [x] Dashboard with stats cards
- [x] Projects list with search
- [x] New project wizard (GitHub, Upload, Manual)
- [x] Project detail page with tabs (Overview, Tasks, PRs)
- [x] Task management with execute/delete
- [x] Settings page with AI model selection
- [x] Dark/Light theme toggle
- [x] Responsive design

## Prioritized Backlog

### P0 - Critical (Required for GitHub OAuth)
- [ ] User provides GitHub OAuth credentials (CLIENT_ID, CLIENT_SECRET)

### P1 - High Priority
- [ ] AI-generated pull request with actual code changes
- [ ] Code diff viewer for PRs
- [ ] PR merge functionality for GitHub repos
- [ ] Real-time task execution status

### P2 - Medium Priority
- [ ] Project file browser/explorer
- [ ] Code editor integration
- [ ] Task templates for common patterns
- [ ] Batch task execution

### P3 - Future Enhancements
- [ ] Team collaboration features
- [ ] Project analytics dashboard
- [ ] CI/CD integration
- [ ] Mobile app (Flutter)

## Next Tasks
1. Configure GitHub OAuth credentials to enable repository integration
2. Enhance AI task execution to generate actual file changes
3. Implement PR code diff viewer
4. Add project file browser for uploaded/connected projects
