param(
  [string]$TaskId = "general",
  [switch]$Strict
)

$ErrorActionPreference = "SilentlyContinue"

function ReadText($p) {
  if (Test-Path $p) { return Get-Content -Raw $p } else { return "" }
}
function Get-Version($exe, $args=@()) {
  try { return (& $exe @args) } catch { return $null }
}

# --- paths & dates ---
$root    = (Get-Location).Path
$docs    = Join-Path $root "docs"
$logs    = Join-Path $docs "session_logs"
$artRoot = Join-Path $root "artifacts"
$today   = (Get-Date).ToString("yyyy-MM-dd")
$art     = Join-Path $artRoot $today
New-Item -ItemType Directory -Force -Path $docs,$logs,$art | Out-Null

# --- git snapshot ---
$branch   = (git rev-parse --abbrev-ref HEAD).Trim()
$shaShort = (git rev-parse --short HEAD).Trim()
$subject  = (git log -1 --pretty=%s).Trim()
$whenIso  = (git log -1 --date=iso-strict --pretty=%cd).Trim()
$dirty    = "clean"; if (git status --porcelain) { $dirty = "dirty" }
$changed  = (git status --porcelain | Measure-Object -Line).Lines

# --- quick versions ---
$node = Get-Version "node" "-v"
$pnpm = Get-Version "pnpm" "-v"
$py   = Get-Version "python" "-V"

# --- stack detection ---
$pkgPath = Join-Path $root "apps/web/package.json"
$pkg     = $null; if (Test-Path $pkgPath) { $pkg = (Get-Content -Raw $pkgPath | ConvertFrom-Json) }
$nextVersion     = $null; if ($pkg) { $nextVersion = $pkg.dependencies.next }
$hasRQ           = $false; if ($pkg) { $hasRQ = ($pkg.dependencies."@tanstack/react-query" -ne $null) }
$hasNextAuth     = $false; if ($pkg) { $hasNextAuth = ($pkg.dependencies."next-auth" -ne $null) }
$hasPrismaClient = $false; if ($pkg) { $hasPrismaClient = ($pkg.dependencies."@prisma/client" -ne $null) }
$hasPrismaDev    = $false; if ($pkg) { $hasPrismaDev = ($pkg.devDependencies.prisma -ne $null) }

$schemaPath = Join-Path $root "apps/web/prisma/schema.prisma"
$schemaText = ReadText $schemaPath
$dbProvider = ""
if ($schemaText -match 'provider\s*=\s*"(.*?)"') { $dbProvider = $matches[1] }

$webEnvPath = Join-Path $root "apps/web/.env.local"
$webEnv = @{}
if (Test-Path $webEnvPath) {
  $t = Get-Content -Raw $webEnvPath
  foreach ($k in @(
    "NEXT_PUBLIC_API_URL","NEXTAUTH_URL","NEXTAUTH_SECRET","EMAIL_SERVER","EMAIL_FROM",
    "DATABASE_URL","DIRECT_DATABASE_URL","STRIPE_SECRET_KEY","NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  )) {
    if ($t -match ("(?m)^\s*"+[regex]::Escape($k)+"=")) { $webEnv[$k] = "present" } else { $webEnv[$k] = "missing" }
  }
}

$nextCfgPath = Join-Path $root "apps/web/next.config.js"
$nextCfg     = ReadText $nextCfgPath
$proxiesAuth = $false; if ($nextCfg -match "(?ms)rewrites\s*:\s*.*?/api/auth") { $proxiesAuth = $true }

# --- playbook compliance verdicts ---
$frontVerdict   = if (($nextVersion -like "14.*") -and $hasRQ) { "OK — next@$nextVersion, react-query present" } else { "NEEDS ATTENTION — Next 14 and/or React Query missing" }
$authVerdict    = if ($hasNextAuth -and $hasPrismaClient -and $hasPrismaDev) { "OK — next-auth + prisma deps present" } else { "NEEDS ATTENTION — add next-auth/prisma deps" }
$dbVerdict      = if ($dbProvider -eq "postgresql") { "OK — Prisma provider=postgresql" } else { "NEEDS ATTENTION — Prisma provider is '$dbProvider' (expected 'postgresql')" }
$rewriteVerdict = if (-not $proxiesAuth) { "OK — /api/auth is NOT proxied" } else { "NEEDS ATTENTION — /api/auth appears in rewrites (will break NextAuth)" }

$misaligned = $false
if ($dbProvider -ne "" -and $dbProvider -ne "postgresql") { $misaligned = $true }
if ($proxiesAuth) { $misaligned  = $true }

# --- latest change summary (WHY/WHAT/files) ---
$latestChange = $null
$logRoot = Join-Path $docs "file_change_log"
if (Test-Path $logRoot) {
  $days = Get-ChildItem $logRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
  foreach ($d in $days) {
    $jsons = Get-ChildItem $d.FullName -Filter "*.json" -File -ErrorAction SilentlyContinue | Sort-Object Name -Descending
    if ($jsons.Count -gt 0) {
      try { $latestChange = Get-Content -Raw $jsons[0].FullName | ConvertFrom-Json } catch { $latestChange = $null }
      if ($latestChange) { break }
    }
  }
}

$whyText  = ""
$whatText = ""
$filesList = @()
if ($latestChange) {
  $whyText  = $latestChange.why
  $whatText = $latestChange.what
  if ($latestChange.files) {
    foreach ($f in $latestChange.files) { $filesList += "$($f.status) $($f.path)" }
  }
} else {
  $body = (git log -1 --pretty=%B)
  if ($body -match "(?ms)^\s*WHY\s*:\s*(.*?)($|^\s*[A-Z ]+:\s*)") { $whyText = $matches[1].Trim() }
  if ($body -match "(?ms)^\s*WHAT CHANGED\s*:\s*(.*?)($|^\s*[A-Z ]+:\s*)") { $whatText = $matches[1].Trim() }
  $filesList = @( git diff-tree --no-commit-id --name-status -r HEAD 2>$null ) | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
}
if (-not $whyText)  { $whyText  = "_(not provided)_" }
if (-not $whatText) { $whatText = "_(not provided)_" }

# --- HANDOFF.md ---
$handoffPath = Join-Path $docs "HANDOFF.md"
$envLines = @()
foreach ($kv in $webEnv.GetEnumerator()) { $envLines += ("  - {0}: {1}" -f $kv.Key, $kv.Value) }
$envLines = ($envLines -join "`n")
$filesPreview = if ($filesList.Count -gt 0) { ($filesList | Select-Object -First 6) -join "`n  " } else { "(no files listed)" }

$handoff = @"
# WinCallem — Handoff (Single Source of Truth)

## Snapshot
- Branch: $branch
- Last commit: $shaShort — $subject ($whenIso)
- Status: $dirty ($changed files)

## Latest Change Summary
- WHY:  $whyText
- WHAT: $whatText
- FILES:
  $filesPreview
  $(if ($filesList.Count -gt 6) { "...(more)" } else { "" })

## Stack & Alignment
| Component | Verdict |
|---|---|
| Frontend (Next 14 + React Query) | $frontVerdict |
| Auth (NextAuth + Prisma)         | $authVerdict |
| DB (Prisma provider)             | $dbVerdict |
| Rewrites (no /api/auth proxy)    | $rewriteVerdict |

## Environment (presence only)
- apps/web/.env.local:
$envLines

## Commands
**Web**
cd apps/web && pnpm install && pnpm dev

**API**
cd apps/api && if (!(Test-Path .venv)) { py -m venv .venv }; .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000

## Open Work (Next Up)
- [ ] $TaskId — define AC + Test Plan
"@
$handoff | Set-Content -Encoding UTF8 $handoffPath

# --- session log ---
$sessionPath = Join-Path $logs ("$today.md")
$logEntry = @"
## $today — $TaskId
- Branch: $branch @ $shaShort — $subject
- Dirty: $dirty ($changed files)
- Node: $node | pnpm: $pnpm | Python: $py
- Artifacts: $art
"@
Add-Content -Path $sessionPath -Value $logEntry

# --- summary block (for next chat) ---
$whyOneLine  = ($whyText -replace "\r?\n"," ") -replace "\s+"," "
$whatOneLine = ($whatText -replace "\r?\n"," ") -replace "\s+"," "
$filesOneLine = if ($filesList.Count -gt 0) { ($filesList | Select-Object -First 3) -join " · " } else { "(none)" }

$summary = @"
=== HANDOFF SUMMARY ===
PLAYBOOK: docs/PLAYBOOK.md (v1.0) — tiny PRs · squash-only · DoR/DoD · stubs · stack checks · handoff required
branch: $branch @ $shaShort — $subject
status: $dirty ($changed files)

latest change:
  why:  $whyOneLine
  what: $whatOneLine
  files: $filesOneLine$(if ($filesList.Count -gt 3) { " · ..." } else { "" })

commands:
  web: cd apps/web && pnpm dev
  api: cd apps/api && .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000

artifacts: $art
=======================
"@
$sumPath = Join-Path $art "handoff_summary.txt"
$summary | Set-Content -Encoding UTF8 $sumPath

# --- strict mode enforcement ---
if ($Strict) {
  $errors = @()
  if ($dbProvider -ne "" -and $dbProvider -ne "postgresql") { $errors += "Prisma provider is '$dbProvider' (expected 'postgresql')." }
  if ($proxiesAuth) { $errors += "next.config.js rewrites include '/api/auth' (breaks NextAuth)." }
  if ($errors.Count -gt 0) {
    Write-Host "❌ Playbook misalignment detected:" -ForegroundColor Red
    foreach ($e in $errors) { Write-Host " - $e" -ForegroundColor Red }
    throw "Handoff failed due to Playbook misalignment. Fix and re-run."
  }
}

Write-Host "Handoff updated:"
Write-Host " - $handoffPath"
Write-Host " - $sessionPath"
Write-Host " - $sumPath"

