@echo off
echo ========================================
echo Starting Laravel Backend Server
echo ========================================
echo.
echo Server will start on: http://127.0.0.1:8001
echo API endpoint: http://127.0.0.1:8001/api
echo.
netstat -ano | findstr :3306 >nul
if errorlevel 1 (
  echo [WARNING] MySQL tidak terdeteksi di port 3306.
  echo [WARNING] Login admin / reload data akan gagal (500) sampai MySQL aktif.
  echo.
)

echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd C:\xampp\htdocs\ModulCDC
php artisan serve --host=127.0.0.1 --port=8001
