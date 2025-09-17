# WinCallem Build Playbook (v1.0)
- Tiny PRs; squash only; no long rebases
- DoR before code (WHY/IO/AC/Test/Rollback)
- DoD to merge (CI green, smoke green, artifacts, docs)
- Stubs with "disabled on preview"
- Stack checks (Next14, NextAuth+Prisma, Postgres, FastAPI; no /api/auth proxy)
- Handoff Summary Block required each session
