$ErrorActionPreference = "SilentlyContinue"

$repo   = Split-Path -Leaf (Get-Location)
$nl     = [Environment]::NewLine
$report = "REPORT.md"

# Start fresh
Set-Content -Path $report -Value ("## WinCallem Repo Snapshot: {0}{1}" -f $repo, $nl)
Add-Content $report ("**Date:** {0}{1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss K'), $nl)

# Git section
Add-Content $report "### Git"
Add-Content $report "**Remote:**"
git remote -v 2>$null | Add-Content $report
Add-Content $report ""
Add-Content $report ("**Branch:** {0}" -f (git rev-parse --abbrev-ref HEAD))
Add-Content $report ""
Add-Content $report "**Recent commits:**"
git log --oneline --graph -n 20 2>$null | Add-Content $report

# Monorepo layout
Add-Content $report ""
Add-Content $report "### Monorepo Layout"
Add-Content $report "```"
$base = (Get-Location).Path
Get-ChildItem -Recurse -Directory |
  Where-Object { $_.FullName -notmatch '\\(\.git|node_modules|\.venv|\.mypy_cache|__pycache__|dist|build)\\' } |
  ForEach-Object { $_.FullName.Substring($base.Length).TrimStart('\') } | Add-Content $report
Add-Content $report "```"

# Key files
Add-Content $report ""
Add-Content $report "### Key Files"
$files = @(
  "README.md","STATUS.md","ROADMAP.md","docker-compose.yml","compose.yml",
  "apps\web\package.json","apps\web\next.config.js","apps\web\.env.example",
  "apps\api\pyproject.toml","apps\api\requirements.txt","apps\api\.env.example",
  "workers\pyproject.toml","workers\requirements.txt"
) | Where-Object { Test-Path $_ }

foreach ($f in $files) {
  Add-Content $report ""
  Add-Content $report ("#### {0}" -f $f)
  Add-Content $report "```"
  Get-Content $f -ErrorAction SilentlyContinue | Add-Content $report
  Add-Content $report "```"
}

# Dependencies
Add-Content $report ""
Add-Content $report "### Dependency Tops"

if (Test-Path "apps\web") {
  Push-Location "apps\web"
  Add-Content ..\..\$report ""
  Add-Content ..\..\$report "**apps/web (npm ls --depth=0):**"
  Add-Content ..\..\$report "```"
  npm ls --depth=0 2>$null | Add-Content ..\..\$report
  Add-Content ..\..\$report "```"
  Pop-Location
}

if (Test-Path "apps\api") {
  Push-Location "apps\api"
  Add-Content ..\..\$report ""
  Add-Content ..\..\$report "**apps/api (pip freeze | top 30):**"
  Add-Content ..\..\$report "```"
  (pip freeze 2>$null | Select-Object -First 30) | Add-Content ..\..\$report
  Add-Content ..\..\$report "```"
  Pop-Location
}

# Local commands
Add-Content $report ""
Add-Content $report "### Local Commands"
Add-Content $report "- Start web: npm run dev (apps/web)"
Add-Content $report "- Start API: uvicorn app.main:app --reload (apps/api)"
Add-Content $report "- Workers: celery -A worker.app worker -l info (workers)"

Write-Host "Wrote REPORT.md - upload that file here."
