param(
  [string]$TaskId = "general",
  [switch]$Strict,
  [switch]$Minimal,
  [switch]$NoPRs
)


# Quiet errors by default; script prints paths on success
$ErrorActionPreference = "SilentlyContinue"

function ReadText($p) { if (Test-Path $p) { Get-Content -Raw $p } else { "" } }
function Get-Version($exe, $args=@()) { try { & $exe @args } catch { $null } }

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
$hasPrismaDev    = $false; if ($pkg) { $hasPrismaDev = ($pkg.devDependencies -and $pkg.devDependencies.prisma -ne $null) }

$schemaPath = Join-Path $root "apps/web/prisma/schema.prisma"
$schemaText = ReadText $schemaPath
$dbProvider = ""
if ($schemaText -match 'provider\s*=\s*"(.*?)"') { $dbProvider = $matches[1] }

# next.config (adjust if your project uses .mjs/.ts)
$nextCfgPath = Join-Path $root "apps/web/next.config.js"
$nextCfg     = ReadText $nextCfgPath
$proxiesAuth = $false; if ($nextCfg -match "(?ms)rewrites\s*:\s*.*?/api/auth") { $proxiesAuth = $true }

# --- playbook compliance verdicts ---
$frontVerdict   = if (($nextVersion -like "14.*") -and $hasRQ) { "OK - next@$nextVersion, react-query present" } else { "NEEDS ATTENTION - Next 14 and/or React Query missing" }
$authVerdict    = if ($hasNextAuth -and $hasPrismaClient -and $hasPrismaDev) { "OK - next-auth + prisma deps present" } else { "NEEDS ATTENTION - add next-auth/prisma deps" }
$dbVerdict      = if ($dbProvider -eq "postgresql") { "OK - Prisma provider=postgresql" } else { "NEEDS ATTENTION - Prisma provider is '$dbProvider' (expected 'postgresql')" }
$rewriteVerdict = if (-not $proxiesAuth) { "OK - /api/auth is NOT proxied" } else { "NEEDS ATTENTION - /api/auth appears in rewrites (will break NextAuth)" }

# === Minimal-mode helpers ===
# Blockers: only true stoppers
$blockers = @()
if ($dbProvider -ne "" -and $dbProvider -ne "postgresql") { $blockers += "Prisma provider='$dbProvider' (expected 'postgresql')" }
if ($proxiesAuth) { $blockers += "next.config.js proxies /api/auth (breaks NextAuth)" }
$blockersLine = "none"; if ($blockers.Count -gt 0) { $blockersLine = ($blockers -join " · ") }

# One relevant PR (current branch if available) via GitHub CLI
$prLine = ""
if (Get-Command gh -ErrorAction SilentlyContinue) {
  try {
    $prInfo = gh pr list --head $branch --state all --json number,title,url | ConvertFrom-Json | Select-Object -First 1
    if ($prInfo) { $prLine = ("#{0}: {1} — {2}" -f $prInfo.number, $prInfo.title, $prInfo.url) }
  } catch { }
}
# === end minimal helpers ===

# --- latest change summary (WHY/WHAT/FILES) ---
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
    foreach ($f in $latestChange.files) { $filesList += ("{0} {1}" -f $f.status, $f.path) }
  }
} else {
  $body = (git log -1 --pretty=%B)
  if ($body -match "(?ms)^\s*WHY\s*:\s*(.*?)($|^\s*[A-Z ]+:\s*)") { $whyText = $matches[1].Trim() }
  if ($body -match "(?ms)^\s*WHAT CHANGED\s*:\s*(.*?)($|^\s*[A-Z ]+:\s*)") { $whatText = $matches[1].Trim() }
  $filesList = @( git diff-tree --no-commit-id --name-status -r HEAD 2>$null ) | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" }
}
if (-not $whyText)  { $whyText  = "_(not provided)_" }
if (-not $whatText) { $whatText = "_(not provided)_" }

# --- branch diff vs origin/main (commits/files/shortstat + lists) ---
$base  = ""; $range = ""
try {
  $base = (git merge-base origin/main HEAD).Trim()
} catch { }
if (-not $base) {
  try { $base = (git merge-base main HEAD).Trim() } catch { }
}
if ($base) { $range = "$base..HEAD" }

$commitCount = 0; $commitLines = ""; $filesRaw = @(); $filesCount = 0; $shortstat = ""; $filesShown = ""
if ($range) {
  $commitCount = [int](git rev-list $range --count)
  $commitLines = (git log --pretty=format:'- %h - %s' $range -n 10) -join "`n"
  $filesRaw    = @(git diff --name-status $range)
  $filesCount  = $filesRaw.Count
  $shortstat   = (git diff --shortstat $range) -join ' '
  $filesShown  = ($filesRaw | Select-Object -First 12) -join "`n  "
}

# --- environment presence ---
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
$envLines = @()
foreach ($kv in $webEnv.GetEnumerator()) { $envLines += ("  - {0}: {1}" -f $kv.Key, $kv.Value) }
$envLines = ($envLines -join "`n")

# --- PRs in this session (via gh CLI) ---
$prBlock = ""
if (Get-Command gh -ErrorAction SilentlyContinue) {
  try {
    $branchesWanted = @($branch,'feature/handoff-clean','chore/handoff-replacement','chore/handoff-enhanced')
    $prs = gh pr list --state all --json number,title,body,url,headRefName,baseRefName,updatedAt --limit 50 | ConvertFrom-Json
    $cutoff = (Get-Date).Date
    $wanted = @()

    if ($prs) {
      $byHead = $prs | Where-Object { $branchesWanted -contains $_.headRefName }
      foreach ($p in $byHead) { $wanted += $p }

      $todayPRs = $prs | Where-Object { [DateTime]$_.updatedAt -ge $cutoff } | Sort-Object updatedAt -Descending
      foreach ($p in $todayPRs) { $wanted += $p }

      # dedupe by PR number, keep order
      $seen = @{}; $dedup = @()
      foreach ($p in $wanted) {
        if (-not $seen.ContainsKey($p.number)) { $seen[$p.number] = $true; $dedup += $p }
      }
      $wanted = $dedup | Select-Object -First 3

      if ($wanted.Count -gt 0) {
        $lines = @("prs in this session:")
        foreach ($pr in $wanted) {
          $body = ""; if ($pr.body) { $body = ($pr.body -replace "(`r`n|`n|`r)","`n> ") }
          $lines += ("- #{0}: {1}  [{2} -> {3}]" -f $pr.number, $pr.title, $pr.headRefName, $pr.baseRefName)
          $lines += ("  url: {0}" -f $pr.url)
          if ($body -ne "") { $lines += "  notes:"; $lines += ("> " + $body) }
          $lines += ""
        }
        $prBlock = ($lines -join "`n")
      }
    }
  } catch {
    $prBlock = "prs in this session:`n- (gh CLI error - paste PR notes manually)"
  }
} else {
  $prBlock = "prs in this session:`n- (Install GitHub CLI 'gh' to auto pull PR notes, or paste notes here)"
}

# --- HANDOFF.md ---
$handoffPath = Join-Path $docs "HANDOFF.md"
$filesPreview = if ($filesList.Count -gt 0) { ($filesList | Select-Object -First 6) -join "`n  " } else { "(no files listed)" }

$handoff = @"
# WinCallem — Handoff (Single Source of Truth)

## Snapshot
- Branch: $branch
- Last commit: $shaShort - $subject ($whenIso)
- Status: $dirty ($changed files)

## Latest Change Summary
- WHY:  $whyText
- WHAT: $whatText
- FILES:
  $filesPreview
  $(if ($filesList.Count -gt 6) { "...(more)" } else { "" })

## Branch Diff vs origin/main
- commits: $commitCount
- files:   $filesCount
- stats:   $shortstat

### recent commits (top 10)
$commitLines

### files changed (top 12)
  $filesShown

## Stack & Alignment
| Component | Verdict |
|---|---|
| Frontend (Next 14 + React Query) | $frontVerdict |
| Auth (NextAuth + Prisma)         | $authVerdict  |
| DB (Prisma provider)             | $dbVerdict    |
| Rewrites (no /api/auth proxy)    | $rewriteVerdict |

## Environment (presence only)
- apps/web/.env.local:
$envLines

## PR Notes
$prBlock

## Commands
**Web**
cd apps/web && pnpm install && pnpm dev

**API**
cd apps/api && if (!(Test-Path .venv)) { py -m venv .venv }; .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000

## Open Work (Next Up)
- [ ] $TaskId - define AC + Test Plan
"@
$handoff | Set-Content -Encoding UTF8 $handoffPath

# --- session log ---
$sessionPath = Join-Path $logs ("$today.md")
$logEntry = @"
## $today — $TaskId
- Branch: $branch @ $shaShort - $subject
- Dirty: $dirty ($changed files)
- Node: $node | pnpm: $pnpm | Python: $py
- Artifacts: $art
"@
Add-Content -Path $sessionPath -Value $logEntry

# --- summary block (for next chat) ---
$whyOneLine  = ($whyText -replace "(`r`n|`n|`r)"," ") -replace "\s+"," "
$whatOneLine = ($whatText -replace "(`r`n|`n|`r)"," ") -replace "\s+"," "
$filesOneLine = if ($filesList.Count -gt 0) { ($filesList | Select-Object -First 3) -join " · " } else { "(none)" }

if ($Minimal) {
  $summary = @"
=== NEXT CHAT ===
branch: $branch @ $shaShort — $subject
next:
- $TaskId  (write AC as bullets)
blockers: $blockersLine
pr: $prLine
artifacts: $art
commands:
  web: cd apps/web && pnpm dev
  api: cd apps/api && .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000
================
"@
} else {
  $summary = @"
=== HANDOFF SUMMARY ===
PLAYBOOK: docs/PLAYBOOK.md (v1.0) — tiny PRs · squash-only · DoR/DoD · stubs · stack checks · handoff required
branch: $branch @ $shaShort - $subject
status: branch diff vs main → commits=$commitCount, files=$filesCount, $shortstat

latest change:
  why:  $whyOneLine
  what: $whatOneLine
  files: $filesOneLine$(if ($filesList.Count -gt 3) { " · ..." } else { "" })

commands:
  web: cd apps/web && pnpm dev
  api: cd apps/api && .\.venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000

$prBlock

artifacts: $art
=======================
"@
}

$sumPath = Join-Path $art "handoff_summary.txt"
$summary | Set-Content -Encoding UTF8 $sumPath

# --- strict mode enforcement ---
if ($Strict) {
  $errors = @()
  if ($dbProvider -ne "" -and $dbProvider -ne "postgresql") { $errors += "Prisma provider is '$dbProvider' (expected 'postgresql')." }
  if ($proxiesAuth) { $errors += "next.config.js rewrites include '/api/auth' (breaks NextAuth)." }
  if ($errors.Count -gt 0) {
    Write-Host "ERROR: Playbook misalignment detected:" -ForegroundColor Red
    foreach ($e in $errors) { Write-Host " - $e" -ForegroundColor Red }
    throw "Handoff failed due to Playbook misalignment. Fix and re-run."
  }
}

Write-Host ">> Handoff written: $handoffPath"
Write-Host ">> Summary written: $sumPath"

