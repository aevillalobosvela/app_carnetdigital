const fs = require('fs');
const path = require('path');
const os = require('os');

// 1. Obtener la IP a utilizar
let ip = process.env.REACT_NATIVE_PACKAGER_HOSTNAME;

if (!ip) {
  // Si no está definida en la variable de entorno, buscar en las interfaces de red
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const address of addresses) {
      // Filtrar por IPv4 y que no sea loopback
      if (address.family === 'IPv4' && !address.internal) {
        // Ignorar las interfaces de docker o virtuales
        if (
          interfaceName.startsWith('docker') ||
          interfaceName.startsWith('br-') ||
          interfaceName.startsWith('veth') ||
          interfaceName.startsWith('lo') ||
          address.address.startsWith('172.')
        ) {
          continue;
        }
        ip = address.address;
        // Preferir interfaces físicas como wlo/wlan/eno/eth o subredes 192.168
        if (
          address.address.startsWith('192.168.') ||
          interfaceName.startsWith('wlo') ||
          interfaceName.startsWith('wlan') ||
          interfaceName.startsWith('eno') ||
          interfaceName.startsWith('eth')
        ) {
          break;
        }
      }
    }
    if (
      ip &&
      (ip.startsWith('192.168.') ||
        interfaceName.startsWith('wlo') ||
        interfaceName.startsWith('wlan') ||
        interfaceName.startsWith('eno') ||
        interfaceName.startsWith('eth'))
    ) {
      break;
    }
  }
}

// Si aún no se encuentra, usar localhost
if (!ip) {
  ip = 'localhost';
}

console.log(`[Env Generator] Detectada IP del host: ${ip}`);

// 2. Escribir el archivo .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = `EXPO_PUBLIC_API_URL=http://${ip}:3333/api/v1\n`;

try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log(`[Env Generator] Archivo .env.local generado exitosamente con EXPO_PUBLIC_API_URL=http://${ip}:3333/api/v1`);
} catch (error) {
  console.error('[Env Generator] Error al escribir .env.local:', error);
}
