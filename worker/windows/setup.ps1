# CS2 Replay Studio worker: Windows uchun bir martalik o'rnatish va ishga tushirish.
# Ishga tushirish: shu papkadagi "ishga-tushirish.bat" ni ikki marta bosing.
# Nima qiladi: Node.js va FFmpeg'ni (yo'q bo'lsa) winget orqali o'rnatadi, .env yaratadi,
# kerakli paketlarni o'rnatadi va worker'ni ishga tushiradi. Keyingi safar faqat ishga tushiradi.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

function Have($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}
function Winget-Install($id, $name) {
  if (-not (Have winget)) { throw "winget topilmadi. $name ni qo'lda o'rnating va skriptni qayta ishga tushiring." }
  Write-Host "==> $name o'rnatilmoqda..." -ForegroundColor Cyan
  winget install -e --id $id --accept-source-agreements --accept-package-agreements
  Refresh-Path
}

if (-not (Have node)) { Winget-Install "OpenJS.NodeJS.LTS" "Node.js" }
if (-not (Have ffmpeg)) { Winget-Install "Gyan.FFmpeg" "FFmpeg" }
if (-not (Have node)) { throw "Node.js o'rnatildi, lekin topilmadi. Oynani yopib, skriptni qayta ishga tushiring." }

# CS Demo Manager (MP4 render uchun) - bo'lsa render ham yoqiladi
$csdm = @(
  "$env:LOCALAPPDATA\Programs\cs-demo-manager\csdm.exe",
  "$env:LOCALAPPDATA\Programs\cs-demo-manager\cs-demo-manager.exe",
  "$env:ProgramFiles\CS Demo Manager\csdm.exe",
  "$env:ProgramFiles\CS Demo Manager\cs-demo-manager.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not (Test-Path ".env")) {
  Write-Host ""
  Write-Host "Supabase service_role kalitini joylang (Ctrl+V, keyin Enter). Yozganingiz ekranda ko'rinmaydi." -ForegroundColor Yellow
  $secure = Read-Host "service_role" -AsSecureString
  $key = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)).Trim()
  if ($key.Length -lt 20) { throw "Kalit juda qisqa. Skriptni qayta ishga tushiring." }
  $caps = "parse,zip"
  $lines = @(
    "SUPABASE_URL=https://cwwpekjrszklwfrhtein.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY=$key",
    "WORKER_CONCURRENCY=1",
    "FFMPEG_PATH=ffmpeg",
    "FFPROBE_PATH=ffprobe"
  )
  if ($csdm) {
    $caps += ",render"
    $lines += "RENDER_BACKEND=csdm"
    $lines += "CSDM_PATH=$csdm"
  }
  $lines += "WORKER_CAPABILITIES=$caps"
  Set-Content -Path ".env" -Value $lines -Encoding ascii
  Write-Host ".env yaratildi (vazifalar: $caps)" -ForegroundColor Green
}

Get-Content .env | Where-Object { $_ -match '^\s*[A-Z_]+=' } | ForEach-Object {
  $k, $v = $_ -split '=', 2
  [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim().Trim('"'), "Process")
}
if (-not $csdm -and $env:WORKER_CAPABILITIES -notmatch "render") {
  Write-Host "Eslatma: CS Demo Manager topilmadi, MP4 render o'chiq. O'rnatgach .env ni o'chirib, skriptni qayta ishga tushiring." -ForegroundColor DarkYellow
}

Write-Host "==> Paketlar o'rnatilmoqda (birinchi safar 1-2 daqiqa)..." -ForegroundColor Cyan
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm install xato bilan tugadi" }

Write-Host "==> Worker ishga tushdi. Bu oynani yopmang - yopsangiz worker to'xtaydi." -ForegroundColor Green
npx tsx src/index.ts
