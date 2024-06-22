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

function replaceLineInFile(filePath, searchValue, replaceValue) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      return;
    }
    const result = data.replace(searchValue, replaceValue);
    fs.writeFile(filePath, result, 'utf8', (err) => {
      if (err) console.error(`Error writing file ${filePath}:`, err);
      else console.log(`Replaced line in file ${filePath}`);
    });
  });
}

function replaceLocalhost(ipAddress) {
  const localhost5001 = 'localhost:5001';
  const localhostDBHost = 'DB_HOST=localhost';
  const localhostIndexJs = /host:\s*process\.env\.DB_HOST\s*\|\|\s*'localhost',/g;

  const ip5001 = `${ipAddress}:5001`;
  const ipDBHost = `DB_HOST=${ipAddress}`;
  const ipIndexJs = `host: process.env.DB_HOST || '${ipAddress}',`;

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

    // Replace "localhost:5001" with IP address and port in all specified files
    filesToReplace.forEach(filePath => {
      replaceInFile(filePath, localhost5001, ip5001);
    });

    // Replace "DB_HOST=localhost" with IP address in docker-compose.yml
    const dockerComposePath = path.join(__dirname, 'docker-compose.yml');
    replaceInFile(dockerComposePath, localhostDBHost, ipDBHost);

    // Replace "host: process.env.DB_HOST || 'localhost'," with IP address in backend/models/index.js
    const indexJsPath = path.join(__dirname, 'backend', 'models', 'index.js');
    replaceLineInFile(indexJsPath, localhostIndexJs, ipIndexJs);
  });
}

const ipv4Address = getIPv4Address();
if (ipv4Address) {
  console.log(`IPv4 Address: ${ipv4Address}`);
  replaceLocalhost(ipv4Address);
} else {
  console.log('IPv4 Address not found');
}

module.exports = replaceLocalhost;
