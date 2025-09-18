param([string]$TaskId="general")

$ErrorActionPreference = "Stop"

$day = Get-Date -Format yyyy-MM-dd
$art = "artifacts\$day"
New-Item -ItemType Directory -Force -Path $art | Out-Null

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
$sha    = (git rev-parse --short HEAD).Trim()
$subject= (git --no-pager log -1 --pretty=%s).Trim()

$summary = @"
=== NEXT CHAT ===
branch: $branch @ $sha - $subject
next:
- $TaskId
blockers: none
artifacts: $art
commands:
  web: cd apps/web && pnpm dev
  api: cd apps/api && .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000
================
"@

$path = Join-Path $art "handoff_summary.txt"
$summary | Set-Content -Encoding UTF8 $path
Write-Host "`n--- paste this in the next chat ---`n$summary`n--- end ---"
