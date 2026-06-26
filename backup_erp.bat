@echo off
setlocal

:: PostgreSQL bin folder
set PGBIN=C:\Program Files\PostgreSQL\18\bin

:: Database details
set PGHOST=localhost
set PGPORT=5432
set PGUSER=postgres
set PGPASSWORD=7416910518
set DBNAME=erp_system

:: Backup destination (NAS)
set BACKUP_DIR=\\192.168.1.3\Volume_1\LDP\2. MEDIA\PLANNING-BACKUP

:: Generate timestamp
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set DATETIME=%%i

:: Backup file
set BACKUP_FILE=%BACKUP_DIR%\%DBNAME%_%DATETIME%.backup

echo ===========================================
echo Starting PostgreSQL Backup...
echo ===========================================

"%PGBIN%\pg_dump.exe" ^
-h %PGHOST% ^
-p %PGPORT% ^
-U %PGUSER% ^
-F c ^
-b ^
-v ^
-f "%BACKUP_FILE%" ^
%DBNAME%

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo Backup Successful!
    echo Saved to:
    echo %BACKUP_FILE%
) ELSE (
    echo.
    echo Backup FAILED!
)
forfiles /P "%BACKUP_DIR%" /M *.backup /D -30 /C "cmd /c del @path"
pause