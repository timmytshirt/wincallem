## WinCallem Repo Snapshot: wincallem

**Date:** 2025-09-02 23:08:40 -07:00

### Git
**Remote:**
origin	https://github.com/timmytshirt/wincallem.git (fetch)
origin	https://github.com/timmytshirt/wincallem.git (push)

**Branch:** main

**Recent commits:**
* 1d21c36 Create snapshot.ps1
* 8e8d8e8 Create REPORT.md
* 2f7aee5 renamed to meeting_notes_template,md
* 52d8676 Create meeting_note_template.md
* bcf7f33 Create project_log.md
* c39da88 chore: update Next.js and npm lockfiles
* 7785aa2 Update README.md
* 594a3a2 Update README.md
* 559bdf9 Update README.md
* eb49e4e Update README.md
* cf7a781 Update README.md
* a3815b5 docs: add vision doc and feature list
* 4ec7a66 Create .gitignore
* cc2e2cf Create Setup_Log_Template.md
* ef6f1d2 Create STEP_ZERO.md
* 3d4d826 docs: add Week 1 Starter package
* 83efe3b docs: remove mistaken Week1_Starter shortcut
* 8b1fa42 chore: add boilerplate code (Next.js + FastAPI + Celery)

### Monorepo Layout

### Key Files

#### README.md

#### docker-compose.yml

#### apps\web\package.json

#### apps\web\next.config.js

#### apps\web\.env.example

#### apps\api\requirements.txt

#### apps\api\.env.example

### Dependency Tops

**apps/web (npm ls --depth=0):**

**apps/api (pip freeze | top 30):**

### Local Commands
- Start web: npm run dev (apps/web)
- Start API: uvicorn app.main:app --reload (apps/api)
- Workers: celery -A worker.app worker -l info (workers)
