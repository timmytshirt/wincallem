# scripts/snapshot.ps1  (run from the repo root)
$ErrorActionPreference = "SilentlyContinue"
$repo = Split-Path -Leaf (Get-Location)

"## WinCallem Repo Snapshot: $repo" | Out-File REPORT.md
"`n**Date:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')" | Add-Content REPORT.md
"`n### Git" | Add-Content REPORT.md
"**Remote:**" | Add-Content REPORT.md
git remote -v 2>$null | Add-Content REPORT.md
"`n**Branch:** $(git rev-parse --abbrev-ref HEAD)" | Add-Content REPORT.md
"`n**Recent commits:**" | Add-Content REPORT.md
git log --oneline --graph -n 20 2>$null | Add-Content REPORT.md

"`n### Monorepo Layout" | Add-Content REPORT.md
function TreeLike($path) {
  Get-ChildItem $path -Recurse -Directory |
    Where-Object { $_.FullName -notmatch '\\(\.git|node_modules|.venv|.mypy_cache|__pycache__|dist|build)\\' } |
    Select-Object FullName |
    ForEach-Object { $_.FullName.Replace((Get-Location).Path,'').TrimStart('\') }
}
"```
" | Add-Content REPORT.md
TreeLike "." | Add-Content REPORT.md
"```" | Add-Content REPORT.md

"`n### Key Files" | Add-Content REPORT.md
$files = @(
  "README.md","STATUS.md","ROADMAP.md","docker-compose.yml","compose.yml",
  "apps\web\package.json","apps\web\next.config.js","apps\web\.env.example",
  "apps\api\pyproject.toml","apps\api\requirements.txt","apps\api\.env.example",
  "workers\pyproject.toml","workers\requirements.txt"
) | Where-Object { Test-Path $_ }
foreach ($f in $files) {
  "`n#### $f`n```" | Add-Content REPORT.md
  Get-Content $f -ErrorAction SilentlyContinue | Add-Content REPORT.md
  "```" | Add-Content REPORT.md
}

"`n### Dependency Tops" | Add-Content REPORT.md
if (Test-Path "apps\web") {
  Push-Location apps\web
  "`n**apps/web (npm ls --depth=0):**`n```" | Add-Content ..\..\REPORT.md
  npm ls --depth=0 2>$null | Add-Content ..\..\REPORT.md
  "```" | Add-Content ..\..\REPORT.md
  Pop-Location
}
if (Test-Path "apps\api") {
  Push-Location apps\api
  "`n**apps/api (pip freeze | top 30):**`n```" | Add-Content ..\..\REPORT.md
  pip freeze 2>$null | Select-Object -First 30 | Add-Content ..\..\REPORT.md
  "```" | Add-Content ..\..\REPORT.md
  Pop-Location
}

"`n### Local Commands" | Add-Content REPORT.md
"`n- Start web: `npm run dev` (apps/web)" | Add-Content REPORT.md
"`n- Start API: `uvicorn app.main:app --reload` (apps/api)`" | Add-Content REPORT.md
"`n- Workers: `celery -A worker.app worker -l info` (workers)`" | Add-Content REPORT.md

Write-Host "Wrote REPORT.md — upload that file here."
