param(
  [string]$TaskId = "general",
  [switch]$Strict
)

# Chatty enough to debug, quiet by default
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
$hasPrismaDev    = $false; if ($pkg) { $hasPrismaDev = ($pkg.devDependencies.prisma -ne $null) }

$schemaPath = Join-Path $root "apps/web/prisma/schema.prisma"
$schemaText = ReadText $schemaPath
$dbProvider = ""
if ($schemaText -match 'provider\s*=\s*"(.*?)"') { $dbProvider = $matches[1] }

$nextCfgPath = Join-Path $root "apps/web/next.config.js"
$nextCfg     = ReadText $nextCfgPath
$proxiesAuth = $false; if ($nextCfg -match "(?ms)rewrites\s*:\s*.*?/api/auth") { $proxiesAuth = $true }

# --- playbook compliance verdicts ---
$frontVerdict   = if (($nextVersion -like "14.*") -and $hasRQ) { "OK - next@$nextVersion, react-query present" } else { "NEEDS ATTENTION - Next 14 and/or React Query missing" }
$authVerdict    = if ($hasNextAuth -and $hasPrismaClient -and $hasPrismaDev) { "OK - next-auth + prisma deps present" } else { "NEEDS ATTENTION - add next-auth/prisma deps" }
$dbVerdict      = if ($dbProvider -eq "postgresql") { "OK - Prisma provider=postgresql" } else { "NEEDS ATTENTION - Prisma provider is '$dbProvider' (expected 'postgresql')" }
$rewriteVerdict = if (-not $proxiesAuth) { "OK - /api/auth is NOT proxied" } else { "NEEDS ATTENTION - /api/auth appears in rewrites (will break NextAuth)" }

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

# --- branch diff vs origin/main (commits/files/shortstat + tops) ---
$base  = (git merge-base origin/main HEAD).Trim()
