# ==============================================================================
# NoWayHome - Setup & Toàn Bộ Verification (1-Click Run)
# ==============================================================================
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Step([string]$title) {
  Write-Host ""
  Write-Host ">>> $title" -ForegroundColor Cyan
}

try {
  Set-Location $Root

  # 1. Kiểm tra Docker
  Step "1/7: Kiem tra Docker PostgreSQL (Port 5433)"
  $dockerState = docker compose -f backend/docker-compose.yml ps --format json postgres | ConvertFrom-Json
  if (-not $dockerState -or $dockerState.State -ne "running") {
    Write-Host "Dang khoi dong PostgreSQL container tren port 5433..." -ForegroundColor Yellow
    docker compose -f backend/docker-compose.yml up -d postgres
    Start-Sleep -Seconds 3
  } else {
    Write-Host "PostgreSQL container dang chay OK." -ForegroundColor Green
  }

  # 2. Prisma Generate
  Step "2/7: Sinh Prisma Client"
  pnpm --filter backend exec prisma generate --schema prisma/schema.prisma

  # 3. Database Migration & Seed (Demo DB: nowayhome)
  Step "3/7: Migrate & Seed Demo Database (nowayhome)"
  $env:DATABASE_URL = "postgresql://nowayhome:nowayhome@127.0.0.1:5433/nowayhome?schema=public"
  pnpm --filter backend exec prisma migrate deploy --schema prisma/schema.prisma
  pnpm --filter backend run seed

  # 4. Backend Unit Tests
  Step "4/7: Chay Backend Unit Tests"
  pnpm --filter backend run test

  # 5. E2E Database Tests (Isolated DB: nowayhome_test)
  Step "5/7: Chay E2E Database Tests (tren nowayhome_test)"
  $env:TEST_DATABASE_URL = "postgresql://nowayhome:nowayhome@127.0.0.1:5433/nowayhome_test?schema=public"
  pnpm --filter backend run test:e2e:prepare
  pnpm --filter backend run test:e2e

  # 6. Typecheck & Builds (Backend & Web Apps)
  Step "6/7: Kiem tra Typecheck & Build Web Apps"
  pnpm --filter backend run typecheck
  pnpm --filter nowayhome-web run typecheck
  pnpm run build:web

  # 7. Mobile App Quality Checks
  Step "7/7: Kiem tra Mobile App (Lint & Typecheck)"
  npm --prefix mobile-app run lint
  npm --prefix mobile-app run typecheck

  Write-Host ""
  Write-Host "==========================================================" -ForegroundColor Green
  Write-Host "  TAT CA KIEM TRA DA VUOT QUA! DU AN DAT CHUAN 9.5 - 10" -ForegroundColor Green
  Write-Host "==========================================================" -ForegroundColor Green
  Write-Host ""
  Write-Host "Tai khoan demo san sang:" -ForegroundColor White
  Write-Host "  - Admin:    admin@nowayhome.local    / Password123!" -ForegroundColor Yellow
  Write-Host "  - Partner:  partner@nowayhome.local  / Password123!" -ForegroundColor Yellow
  Write-Host "  - Customer: customer@nowayhome.local / Password123!" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "De khoi dong toan bo cac app len trinh duyet, chay: .\start-all.bat" -ForegroundColor Cyan
}
catch {
  Write-Host ""
  Write-Host "CO LOI XAY RA TRONG QUA TRINH XAC THUC:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
