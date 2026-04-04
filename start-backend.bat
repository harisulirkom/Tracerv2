@echo off
echo ========================================
echo Starting Laravel Backend Server
echo ========================================
echo.
echo Server will start on: http://localhost:8000
echo API endpoint: http://localhost:8000/api
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd C:\xampp\htdocs\ModulCDC
php artisan serve --host=localhost --port=8000
