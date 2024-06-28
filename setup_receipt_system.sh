#!/bin/bash

# Define the folder and repository variables
folder="receipt_system"
repo_url="https://github.com/chyavanphadke/sri-sharadamba-temple-adminpanel.git"
repo_folder="sri-sharadamba-temple-adminpanel"

# Check if Docker is running and stop all running containers
echo "Stopping any running Docker containers..."
docker ps -q | xargs -I {} docker stop {}

# Remove all Docker containers, images, and volumes
echo "Removing all Docker containers, images, and volumes..."
docker system prune -a -f --volumes

# Check if the folder exists
if [ ! -d "$folder" ]; then
    mkdir "$folder"
fi

# Change to the specified folder
cd "$folder"

# Check if the repository folder exists and delete it if it does
if [ -d "$repo_folder" ]; then
    echo "Deleting existing repository folder..."
    rm -rf "$repo_folder"
fi

# Clone the repository
echo "Cloning the repository..."
git clone "$repo_url"
cd "$repo_folder"

# Run node replace-localhost.js
echo "Running node replace-localhost.js..."
node replace-localhost.js

# Start Docker using docker-compose
echo "Starting Docker containers..."
docker-compose up -d

# Check if Docker containers started successfully
if [ $? -ne 0 ]; then
    echo "Failed"
else
    echo "Passed"
fi

# Wait for 10 seconds before closing
echo "Task completed. Waiting for 10 seconds..."
sleep 10
