param([string]$TaskId="general")
$ErrorActionPreference="SilentlyContinue"
function ReadText($p){ if(Test-Path $p){ Get-Content -Raw $p } else { "" } }

$root=(Get-Location).Path
$docs=Join-Path $root "docs"
$logs=Join-Path $docs "session_logs"
$artRoot=Join-Path $root "artifacts"
$today=(Get-Date).ToString("yyyy-MM-dd")
$art=Join-Path $artRoot $today
New-Item -ItemType Directory -Force -Path $docs,$logs,$art | Out-Null

$branch=(git rev-parse --abbrev-ref HEAD).Trim()
$shaShort=(git rev-parse --short HEAD).Trim()
$subject=(git log -1 --pretty=%s).Trim()
$whenIso=(git log -1 --date=iso-strict --pretty=%cd).Trim()
$dirty= if(git status --porcelain){"dirty"}else{"clean"}
$changed=(git status --porcelain | Measure-Object -Line).Lines

$pkgPath=Join-Path $root "apps/web/package.json"
$pkg= if(Test-Path $pkgPath){ Get-Content -Raw $pkgPath | ConvertFrom-Json } else { $null }
$nextVersion= if($pkg){ $pkg.dependencies.next } else { $null }

$handoff=@"
# WinCallem — Handoff
## Snapshot
- Branch: $branch
- Last commit: $shaShort — $subject ($whenIso)
- Status: $dirty ($changed files)
## Stack (quick)
- Next: $nextVersion
## Commands
web: cd apps/web && pnpm install && pnpm dev
api: cd apps/api && .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000
## Open Work
- [ ] $TaskId — define AC + Test Plan
"@
$handoff | Set-Content -Encoding UTF8 (Join-Path $docs "HANDOFF.md")

$summary=@"
=== HANDOFF SUMMARY ===
PLAYBOOK: docs/PLAYBOOK.md (v1.0)
branch: $branch @ $shaShort — $subject
status: $dirty ($changed files)
stack: next=$nextVersion
commands:
  web: cd apps/web && pnpm dev
  api: cd apps/api && .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000
artifacts: $art
=======================
"@
$sumPath=Join-Path $art "handoff_summary.txt"
$summary | Set-Content -Encoding UTF8 $sumPath
