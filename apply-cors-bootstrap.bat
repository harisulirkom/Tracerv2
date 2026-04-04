@echo off
echo ========================================
echo CORS Bootstrap Configuration
echo ========================================
echo.

echo [STEP 1] Backing up original bootstrap/app.php...
if exist "C:\xampp\htdocs\ModulCDC\bootstrap\app.php" (
    copy "C:\xampp\htdocs\ModulCDC\bootstrap\app.php" "C:\xampp\htdocs\ModulCDC\bootstrap\app.php.backup"
    echo SUCCESS: Backup created
) else (
    echo WARNING: Original file not found
)

echo.
echo [STEP 2] Copying new bootstrap/app.php with CORS enabled...
copy /Y "C:\PelatihanVue\Tracerv2\.cors-bootstrap-app.php" "C:\xampp\htdocs\ModulCDC\bootstrap\app.php"
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy bootstrap/app.php
    pause
    exit /b 1
)
echo SUCCESS: bootstrap/app.php updated with CORS middleware

echo.
echo ========================================
echo Configuration Complete!
echo ========================================
echo.
echo CORS has been configured with:
echo - Config file: config/cors.php
echo - Middleware: app/Http/Middleware/Cors.php  
echo - Bootstrap: bootstrap/app.php (CORS enabled)
echo.
echo ========================================
echo NEXT: Restart Laravel Server
echo ========================================
echo.
echo Run these commands:
echo   cd C:\xampp\htdocs\ModulCDC
echo   php artisan serve --host=localhost --port=8000
echo.
echo Then refresh browser at: http://localhost:5174/admin
echo ========================================
echo.
pause
