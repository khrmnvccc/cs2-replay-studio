# Windows render worker'ni ishga tushirish (PowerShell).
# Talablar: Node.js 22+, Steam + CS2, CS Demo Manager (HLAE va FFmpeg'ni o'zi o'rnatadi), ffmpeg PATH'da.
# Foydalanish:  cd worker; copy .env.example .env  (to'ldiring); .\windows\start-render-worker.ps1
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
if (-not (Test-Path ".env")) { throw ".env topilmadi. .env.example dan nusxa oling." }
Get-Content .env | Where-Object { $_ -match '^\s*[A-Z_]+=' } | ForEach-Object {
  $k, $v = $_ -split '=', 2
  [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim().Trim('"'), "Process")
}
if (-not $env:WORKER_CAPABILITIES) { $env:WORKER_CAPABILITIES = "render" }
if (-not $env:RENDER_BACKEND) { $env:RENDER_BACKEND = "csdm" }
npm install
npx tsx src/index.ts
