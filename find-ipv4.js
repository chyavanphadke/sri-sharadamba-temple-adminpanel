const os = require('os');

function getPreferredIPv4Address() {
  const interfaces = os.networkInterfaces();
  const preferredInterfaces = ['Wi-Fi', 'Ethernet']; // List your preferred interface names

  let fallbackAddress = null;

  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const addressInfo of addresses) {
      if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
        // Check if this interface is in the preferred list
        if (preferredInterfaces.includes(interfaceName)) {
          return addressInfo.address;
        }
        // If no preferred interface is found, keep a fallback
        if (!fallbackAddress) {
          fallbackAddress = addressInfo.address;
        }
      }
    }
  }
  // Return the fallback address if no preferred interface is found
  return fallbackAddress;
}

const ipAddress = getPreferredIPv4Address();
if (ipAddress) {
  console.log(`IPv4 Address: ${ipAddress}`);
} else {
  console.log('IPv4 Address not found');
}

module.exports = getPreferredIPv4Address;
