@echo off
chcp 65001 >nul
echo =====================================================================
echo   BK PARKING MANAGEMENT SYSTEM - BACKEND MVP SERVER (SPRING BOOT 3)
echo   CO3011 - Quan Ly Du An Phan Mem (HK261) - Owner: TV1 (Backend Lead)
echo =====================================================================
echo.
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080 " ^| findstr "LISTENING"') do (
    echo [!] Phat hien cong 8080 dang bi chiem boi PID %%a. Dang dong tien trinh cu...
    taskkill /F /PID %%a >nul 2>&1
)
echo [1/2] Dang khoi dong Spring Boot Server tai http://localhost:8080 ...
echo [2/2] Tai lieu Swagger UI: http://localhost:8080/swagger-ui.html
echo.
cd /d "%~dp0"
start "" "http://localhost:8080/swagger-ui.html"
mvn spring-boot:run
pause
