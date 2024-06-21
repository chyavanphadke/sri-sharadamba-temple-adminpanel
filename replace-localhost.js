const fs = require('fs');
const path = require('path');
const getIPv4Address = require('./find-ipv4');

function replaceInFile(filePath, searchValue, replaceValue) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      return;
    }
    const result = data.replace(new RegExp(searchValue, 'g'), replaceValue);
    fs.writeFile(filePath, result, 'utf8', (err) => {
      if (err) console.error(`Error writing file ${filePath}:`, err);
      else console.log(`Replaced in file ${filePath}`);
    });
  });
}

function replaceLocalhost(ipAddress) {
  const filesToReplace = [
    path.join(__dirname, 'docker-compose.yml'),
    path.join(__dirname, 'backend', 'server.js'),
    path.join(__dirname, 'backend', 'models', 'index.js'),
  ];

  // Add all .js files in src/components
  const componentsDir = path.join(__dirname, 'src', 'components');
  fs.readdir(componentsDir, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${componentsDir}:`, err);
      return;
    }
    files
      .filter(file => file.endsWith('.js'))
      .forEach(file => {
        filesToReplace.push(path.join(componentsDir, file));
      });

    // Replace "localhost" with IP address in all specified files
    filesToReplace.forEach(filePath => {
      replaceInFile(filePath, 'localhost', ipAddress);
    });
  });
}

const ipv4Address = getIPv4Address();
if (ipv4Address) {
  console.log(`IPv4 Address: ${ipv4Address}`);
  replaceLocalhost(ipv4Address);
} else {
  console.log('IPv4 Address not found');
}
