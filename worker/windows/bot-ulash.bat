@echo off
rem Bot Steam akkauntini ulash (bir marta)
cd /d "%~dp0.."
npx tsx src/bot-login.ts
pause
