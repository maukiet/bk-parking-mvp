@echo off
chcp 65001 >nul
echo =====================================================================
echo   BK PARKING MVP - DOCKER COMPOSE LAUNCHER (POSTGRES 16 + BACKEND)
echo =====================================================================
echo.
docker info >nul 2>&1
if errorlevel 1 (
    echo [LOI] Docker Desktop chua duoc mo hoac Docker daemon chua san sang.
    echo Vui long mo ung dung Docker Desktop tren Windows, doi trang thai Running roi chay lai file nay.
    pause
    exit /b 1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 " ^| findstr "LISTENING"') do (
    echo [!] Phat hien cong 8080 dang bi chiem boi PID %%a. Dang dong tien trinh cu...
    taskkill /F /PID %%a >nul 2>&1
)

cd /d "%~dp0"
echo [1/2] Dang build va khoi chay PostgreSQL 16 + Backend Spring Boot...
docker compose up --build -d
if errorlevel 1 (
    echo [LOI] Khoi chay Docker Compose that bai.
    pause
    exit /b 1
)

echo.
echo [2/2] Hoan tat!
echo - Backend API: http://localhost:8080
echo - Swagger UI:  http://localhost:8080/swagger-ui.html
echo - PostgreSQL:  localhost:5432 (db: bk_parking, user: bkparking)
echo.
start "" "http://localhost:8080/swagger-ui.html"
docker compose ps
pause
