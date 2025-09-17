param([string]$TaskId="general")
$ErrorActionPreference="SilentlyContinue"

$root   = (Get-Location).Path
$docs   = Join-Path $root "docs"
$logs   = Join-Path $docs "session_logs"
$artRoot= Join-Path $root "artifacts"
$today  = (Get-Date).ToString("yyyy-MM-dd")
$art    = Join-Path $artRoot $today
New-Item -ItemType Directory -Force -Path $docs,$logs,$art | Out-Null

$branch   = (git rev-parse --abbrev-ref HEAD).Trim()
$shaShort = (git rev-parse --short HEAD).Trim()
$subject  = (git log -1 --pretty=%s).Trim()
$whenIso  = (git log -1 --date=iso-strict --pretty=%cd).Trim()
$dirty    = "clean"; if (git status --porcelain) { $dirty = "dirty" }
$changed  = (git status --porcelain | Measure-Object -Line).Lines

# --- HANDOFF.md ---
$handoffPath = Join-Path $docs "HANDOFF.md"
$handoff=@"
# WinCallem — Handoff

## Snapshot
- Branch: $branch
- Last commit: $shaShort — $subject ($whenIso)
- Status: $dirty ($changed files)

## Commands
web: cd apps/web && pnpm install && pnpm dev
api: cd apps/api && .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000

## Open Work (Next Up)
- [ ] $TaskId — define AC + Test Plan
"@
$handoff | Set-Content -Encoding UTF8 $handoffPath

# --- session log ---
$sessionPath=Join-Path $logs ("$today.md")
Add-Content -Path $sessionPath -Value "## $today — $TaskId`n- Branch: $branch @ $shaShort — $subject"

# --- summary block for next chat ---
$summary=@"
=== HANDOFF SUMMARY ===
PLAYBOOK: docs/PLAYBOOK.md (v1.0) — tiny PRs · squash-only · DoR/DoD · stubs · stack checks · handoff required
branch: $branch @ $shaShort — $subject
status: $dirty ($changed files)
commands:
  web: cd apps/web && pnpm dev
  api: cd apps/api && .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000
artifacts: $art
=======================
"@
$sumPath=Join-Path $art "handoff_summary.txt"
$summary | Set-Content -Encoding UTF8 $sumPath

Write-Host "Handoff updated. Paste this into next chat: $sumPath"

