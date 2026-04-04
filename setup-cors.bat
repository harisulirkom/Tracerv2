@echo off
echo ========================================
echo CORS Configuration Setup Script
echo ========================================
echo.

REM Check if backend directory exists
if not exist "C:\xampp\htdocs\ModulCDC" (
    echo ERROR: Backend directory not found at C:\xampp\htdocs\ModulCDC
    pause
    exit /b 1
)

echo [1/4] Copying CORS configuration file...
copy /Y "C:\PelatihanVue\Tracerv2\.cors-config-cors.php" "C:\xampp\htdocs\ModulCDC\config\cors.php"
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy cors.php
    pause
    exit /b 1
)
echo SUCCESS: cors.php copied

echo.
echo [2/4] Creating Cors middleware directory...
if not exist "C:\xampp\htdocs\ModulCDC\app\Http\Middleware" mkdir "C:\xampp\htdocs\ModulCDC\app\Http\Middleware"

echo [3/4] Copying Cors middleware...
copy /Y "C:\PelatihanVue\Tracerv2\.cors-middleware-Cors.php" "C:\xampp\htdocs\ModulCDC\app\Http\Middleware\Cors.php"
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy Cors middleware
    pause
    exit /b 1
)
echo SUCCESS: Cors.php middleware copied

echo.
echo [4/4] Files copied successfully!
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo 1. Edit C:\xampp\htdocs\ModulCDC\bootstrap\app.php
echo    Add this code in withMiddleware section:
echo.
echo    -^>withMiddleware(function (Middleware $middleware) {
echo        $middleware-^>api(prepend: [
echo            \App\Http\Middleware\Cors::class,
echo        ]);
echo    })
echo.
echo 2. Restart Laravel server:
echo    cd C:\xampp\htdocs\ModulCDC
echo    php artisan serve --host=localhost --port=8000
echo.
echo 3. Refresh browser at http://localhost:5174/admin
echo ========================================
echo.
pause
