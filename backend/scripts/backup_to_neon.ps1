$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Split-Path -Parent $scriptRoot
$envFile = Join-Path $backendRoot ".env"

function Import-EnvFile($path) {
  if (-not (Test-Path $path)) { return }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) { return }
    if ($line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }
    $key = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if (-not [Environment]::GetEnvironmentVariable($key, "Process")) {
      [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
  }
}

Import-EnvFile $envFile

$localDb = [Environment]::GetEnvironmentVariable("LOCAL_PG_DB", "Process")
$localUser = [Environment]::GetEnvironmentVariable("LOCAL_PG_USER", "Process")
$localPassword = [Environment]::GetEnvironmentVariable("LOCAL_PG_PASSWORD", "Process")
$localHost = [Environment]::GetEnvironmentVariable("LOCAL_PG_HOST", "Process")
$localPort = [Environment]::GetEnvironmentVariable("LOCAL_PG_PORT", "Process")
$neonUrl = [Environment]::GetEnvironmentVariable("NEON_DATABASE_URL", "Process")
$pgBin = [Environment]::GetEnvironmentVariable("PG_BIN", "Process")
$localBackupDir = [Environment]::GetEnvironmentVariable("BACKUP_LOCAL_DIR", "Process")

if (-not $localBackupDir) {
  $localBackupDir = Join-Path $backendRoot "backups"
}

if (-not $localDb -or -not $localUser -or -not $localPassword -or -not $localHost -or -not $localPort -or -not $neonUrl) {
  throw "Missing required env vars. Set LOCAL_PG_DB, LOCAL_PG_USER, LOCAL_PG_PASSWORD, LOCAL_PG_HOST, LOCAL_PG_PORT, NEON_DATABASE_URL in backend/.env."
}

$pgDump = $null
$pgRestore = $null

if ($pgBin) {
  $pgDump = Join-Path $pgBin "pg_dump.exe"
  $pgRestore = Join-Path $pgBin "pg_restore.exe"
} else {
  $candidateBins = @(
    "C:\\Program Files\\PostgreSQL\\18\\bin",
    "C:\\Program Files\\PostgreSQL\\17\\bin",
    "C:\\Program Files\\PostgreSQL\\16\\bin",
    "C:\\Program Files\\PostgreSQL\\15\\bin"
  )
  foreach ($bin in $candidateBins) {
    $dumpCandidate = Join-Path $bin "pg_dump.exe"
    $restoreCandidate = Join-Path $bin "pg_restore.exe"
    if ((Test-Path $dumpCandidate) -and (Test-Path $restoreCandidate)) {
      $pgDump = $dumpCandidate
      $pgRestore = $restoreCandidate
      break
    }
  }
}

if (-not $pgDump -or -not $pgRestore) {
  throw "pg_dump/pg_restore not found. Set PG_BIN in backend/.env to your PostgreSQL bin path."
}

$dumpPath = Join-Path $scriptRoot "backup_mastergym.dump"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$localCopyPath = Join-Path $localBackupDir ("backup_{0}_{1}.dump" -f $localDb, $timestamp)
$maxTries = 10
$delaySeconds = 300

[Environment]::SetEnvironmentVariable("PGPASSWORD", $localPassword, "Process")
New-Item -ItemType Directory -Force -Path $localBackupDir | Out-Null

for ($i = 1; $i -le $maxTries; $i++) {
  try {
    Write-Host "Backup attempt $i of $maxTries..."
    & $pgDump -h $localHost -p $localPort -U $localUser -Fc -f $dumpPath $localDb
    if (-not (Test-Path $localCopyPath)) {
      Copy-Item $dumpPath $localCopyPath -Force
    }
    & $pgRestore --clean --if-exists --no-owner --no-privileges -d $neonUrl $dumpPath
    Write-Host "Backup completed."
    break
  } catch {
    if ($i -eq $maxTries) { throw }
    Write-Host "Backup failed. Retrying in $delaySeconds seconds..."
    Start-Sleep -Seconds $delaySeconds
  }
}

Remove-Item $dumpPath -ErrorAction SilentlyContinue
