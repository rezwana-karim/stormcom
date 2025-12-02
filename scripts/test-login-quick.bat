@echo off
REM Quick Login Test Script for Windows
echo ========================================
echo StormCom Login Test
echo ========================================
echo.

echo [1/5] Checking database...
node scripts\test-login.js
if %errorlevel% neq 0 (
    echo ERROR: Database check failed
    echo Run: npm run seed
    exit /b 1
)

echo.
echo [2/5] Checking environment variables...
if not exist ".env.local" (
    echo ERROR: .env.local file not found
    exit /b 1
)
echo OK: .env.local exists

echo.
echo [3/5] Killing any existing Node processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [4/5] Starting development server...
start /B npm run dev
timeout /t 8 /nobreak >nul

echo.
echo [5/5] Testing auth endpoint...
curl -s http://localhost:3000/api/auth/providers
echo.

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Now open your browser:
echo   http://localhost:3000/login
echo.
echo Test with:
echo   Email: test@example.com
echo   Password: Test123!@#
echo.
echo Or Super Admin:
echo   Email: superadmin@example.com
echo   Password: SuperAdmin123!@#
echo ========================================
