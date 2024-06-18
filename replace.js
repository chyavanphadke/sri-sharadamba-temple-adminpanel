const fs = require('fs');
const path = require('path');

const srcDirectory = path.join(__dirname, 'src');
const backendFilePath = path.join(__dirname, 'backend', 'server.js');
const oldString = 'localhost:5001';
const newString = '10.0.0.204:5001';

// Function to replace strings in a file
function replaceInFile(filePath, searchString, replaceString) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return console.error(err);
    }
    const result = data.replace(new RegExp(searchString, 'g'), replaceString);
    fs.writeFile(filePath, result, 'utf8', (err) => {
      if (err) return console.error(err);
    });
  });
}

// Function to process files in a directory recursively
function processDirectory(directory) {
  fs.readdir(directory, (err, files) => {
    if (err) {
      return console.error('Unable to scan directory:', err);
    }

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      if (fs.statSync(filePath).isDirectory()) {
        if (file !== 'assets') {
          processDirectory(filePath);
        }
      } else if (path.extname(file) === '.js') {
        replaceInFile(filePath, oldString, newString);
      }
    });
  });
}

// Specifically modify backend/server.js
function modifyBackendFile() {
  fs.readFile(backendFilePath, 'utf8', (err, data) => {
    if (err) {
      return console.error(err);
    }
    const result = data.replace(
      /app\.listen\((port, )?\(/,
      "app.listen(port, '10.0.0.204', ("
    );
    fs.writeFile(backendFilePath, result, 'utf8', (err) => {
      if (err) return console.error(err);
    });
  });
}

// Process the src directory
processDirectory(srcDirectory);

// Modify the backend/server.js file
modifyBackendFile();
