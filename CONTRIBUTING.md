# Contributing to WinCallem

Thanks for helping build WinCallem! This doc explains how we work with branches, commits, and pull requests.

---

## Branching

- **Never push directly to `main`.** `main` is protected and always deployable.
- Create short-lived branches with these prefixes:
  - `feat/<short-name>` – new features (e.g., `feat/auth-js`)
  - `fix/<short-name>` – bug fixes (e.g., `fix/celery-timeout`)
  - `docs/<short-name>` – docs-only changes (e.g., `docs/readme-update`)
  - `chore/<short-name>` – maintenance, infra, or deps (e.g., `chore/bump-deps`)

> Use kebab-case; keep names short and specific.

---

## Daily Workflow

1. **Sync main**
   ```bash
   git checkout main
   git pull --ff-only
   ```

2. **Create a branch**
   ```bash
   git checkout -b feat/your-feature
   ```

3. **Commit (Conventional Commits)**
   ```bash
   git add .
   git commit -m "feat(auth): add GitHub + Google providers"
   ```

   Examples:
   ```text
   fix(worker): handle redis reconnects
   docs(readme): add developer setup
   chore(deps): bump fastapi to 0.115.2
   ```

4. **Push & open a PR**
   ```bash
   git push -u origin feat/your-feature
   ```

   - Request one review.
   - Keep PRs focused and small (1–3 sentences in the description).

5. **Keep branch current**
   ```bash
   git fetch origin
   git rebase origin/main      # fix conflicts, then:
   git push --force-with-lease
   ```

6. **Merge**
   - After approval, **Squash & Merge** (linear history is required).
   - Branches auto-delete after merge.

7. **Clean up local**
   ```bash
   git checkout main
   git pull --ff-only
   git branch -d feat/your-feature
   git remote prune origin
   ```

---

## Pre-commit Hooks

We use pre-commit to enforce formatting/linting:

```bash
pip install -r apps/api/requirements.txt -r apps/api/requirements-dev.txt
pre-commit install
pre-commit run --all-files   # optional: run once before first PR
```

Hooks: **black**, **isort**, **flake8**, **mypy**.  
Fix issues locally, then re-commit.

---

## PR Checklist

- Branch named with the proper prefix (`feat/`, `fix/`, `docs/`, `chore/`)
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- Pre-commit passes locally
- PR has a clear, short description
- ✅ Request at least one review
- ✅ Use **Squash & Merge** only
- Tests updated/added when applicable (coming soon)

---

## Hotfixes

For urgent production issues:
- Branch from `main`: `hotfix/<short-name>`
- Small fix → PR → **Squash & Merge**

---

## Security & Secrets

- Never commit secrets or real `.env` files.
- Always use `*.env.example` templates.
- `.env` must be in `.gitignore`.
- Report security issues privately to the maintainer.

