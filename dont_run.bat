@echo off
setlocal

:: Define the folder and repository variables
set folder=receipt_system
set repo_url=https://github.com/chyavanphadke/sri-sharadamba-temple-adminpanel.git
set repo_folder=sri-sharadamba-temple-adminpanel

:: Check if Docker is running and stop all running containers
echo Stopping any running Docker containers...
docker ps -q | for /F "tokens=*" %%i IN ('findstr /r /c:"^[0-9a-fA-F]\{12\}$"') do docker stop %%i

:: Remove all Docker containers, images, and volumes
echo Removing all Docker containers, images, and volumes...
docker system prune -a -f --volumes

:: Check if the folder exists
if not exist "%folder%" (
    mkdir "%folder%"
)

:: Change to the specified folder
cd "%folder%"

:: Check if the repository folder exists
if exist "%repo_folder%" (
    echo Deleting existing repository folder...
    rd /s /q "%repo_folder%"
)

:: Clone the repository
echo Cloning the repository...
git clone %repo_url%
cd "%repo_folder%"

:: Run node replace-localhost.js
echo Running node replace-localhost.js...
node replace-localhost.js

:: Start Docker using docker-compose
echo Starting Docker containers...
docker-compose up -d

:: Check if Docker containers started successfully
if %errorlevel% neq 0 (
    echo Failed
) else (
    echo Passed
)

:: Wait for 10 seconds before closing
echo Task completed. Waiting for 10 seconds...
timeout /t 10 /nobreak

endlocal
