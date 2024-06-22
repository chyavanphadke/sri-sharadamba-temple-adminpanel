@echo off
setlocal

:: Define the folder and repository variables
set folder=receipt_system
set repo_url=https://github.com/chyavanphadke/sri-sharadamba-temple-adminpanel.git
set repo_folder=sri-sharadamba-temple-adminpanel

:: Check if the folder exists
if not exist "%folder%" (
    mkdir "%folder%"
)

:: Change to the specified folder
cd "%folder%"

:: Check if the repository folder exists
if exist "%repo_folder%" (
    echo Repository already cloned. Performing git pull...
    cd "%repo_folder%"
    git pull
) else (
    echo Cloning the repository...
    git clone %repo_url%
    cd "%repo_folder%"
)

:: Run node replace-localhost.js
echo Running node replace-localhost.js...
node replace-localhost.js

:: Remove Docker images related to the project
echo Removing existing Docker images...
docker-compose down --rmi all

:: Start Docker using docker-compose
echo Starting Docker containers...
docker-compose up -d

:: Wait for 10 seconds before closing
echo Task completed. Waiting for 10 seconds...
timeout /t 10 /nobreak

endlocal
