# WinCallem Project Log

This is the living diary of the WinCallem project.  
Keep this file updated with milestones, decisions, and next steps.  
(Think of it as our “memory” so nothing gets lost between chats or meetings.)

---

## 2025-09-01 → Kickoff
- Repo created: [timmytshirt/wincallem](https://github.com/timmytshirt/wincallem)
- Added: boilerplate stack
  - Next.js frontend (`apps/web`)
  - FastAPI backend (`apps/api`)
  - Celery worker
  - Redis via docker-compose
- Docs folder created with:
  - `STEP_ZERO.md`
  - `Week1_Starter/` onboarding package
  - `Setup_Log_Template.md`

---

## 2025-09-02 → Environment & Setup
- `.gitignore` added (ignores `.env`, `node_modules`, `.venv`, build artifacts, etc.).
- Vision Doc + Feature List saved in `docs/planning/`.
- Docker Desktop installed and verified.
- Backend & frontend run successfully:
  - FastAPI docs visible at http://localhost:8000/docs
  - Next.js frontend live at http://localhost:3000
  - Dashboard working (Ping API, Fetch Odds, Run Model Job → Check Result).
- First full round-trip test successful: frontend → backend → Celery → Redis → back.

---

## Current Week (Week 1)
**Focus:**
- All collaborators (Tim, Adrian, Aaron) run the project locally.
- Each writes their `Setup_Log_[Name].md` in `/docs/`.
- One small contribution each (doc edit or UI tweak).
- Tim (Project Lead): draft Vision Doc + Feature List, set branch conventions, confirm PWA patch.

**Deliverables by Sunday:**
- Dashboard running on all machines.
- Logs written and committed.
- Vision Doc + Feature List shared and reviewed.
- Repo clean and documented.

---

## Next Week (Week 2 — Planned)
**Focus:**
- Add Auth (Auth.js/NextAuth) with email magic link login.
- Integrate Stripe (test mode) for subscriptions.
- Add `subscriptions` table in Postgres.
- Collaborators test signup/login flows and update docs.

---

## Decisions Made
- Repo structure: keep planning and onboarding docs in `/docs/`.
- Vision Doc + Feature List remain in Word (`.docx`) for readability.
- `.gitignore` required to keep secrets and build artifacts out of repo.
- Weekly sync on Sundays.

---

## Open Questions
- Should we generate Markdown versions of Vision/Feature docs later for GitHub readability?
- What’s the cleanest way to integrate affiliate links into odds ingestion (Week 3/4)?

---

## Meetings
- [Meeting Notes Template](meetings/meeting_notes_template.md)  
- [2025-09-07 Meeting Notes](meetings/2025-09-07.md) *(to be created at Sunday sync)*
