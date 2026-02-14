import { writeFileSync, readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uiEnvPath = path.resolve(__dirname, '../ui/.env');

function isPrivateIPv4(address) {
  if (address.startsWith('10.')) return true;
  if (address.startsWith('192.168.')) return true;
  if (address.startsWith('172.')) {
    const secondOctet = Number(address.split('.')[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  }
  return false;
}

function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal && isPrivateIPv4(addr.address)) {
        return addr.address;
      }
    }
  }
  return '127.0.0.1';
}

function parseEnvFile(content) {
  const entries = new Map();
  content
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line) => {
      if (line.trim().startsWith('#')) return;
      const [key, ...rest] = line.split('=');
      if (!key) return;
      entries.set(key.trim(), rest.join('=').trim());
    });
  return entries;
}

function formatEnvFile(entries, headerComment) {
  const lines = [];
  if (headerComment) lines.push(`# ${headerComment}`);
  for (const [key, value] of entries.entries()) {
    lines.push(`${key}=${value}`);
  }
  lines.push('');
  return lines.join('\n');
}

function main() {
  const localIp = getLocalIPv4();
  const useHttps = process.env.USE_HTTPS !== 'false';
  const protocol = useHttps ? 'https' : 'http';
  const defaultPort = process.env.API_PORT || process.env.PORT || '3000';
  const currentContent = readFileSync(uiEnvPath, 'utf8');
  const envMap = parseEnvFile(currentContent);

  envMap.set('VITE_API_BASE_URL', `${protocol}://${localIp}`);
  envMap.set('VITE_API_BASE_PORT', envMap.get('VITE_API_BASE_PORT') || defaultPort);
  if (envMap.has('VITE_API_SOCKET_PORT')) {
    envMap.set('VITE_API_SOCKET_PORT', envMap.get('VITE_API_SOCKET_PORT'));
  }

  const next = formatEnvFile(envMap, 'Auto-generated at dev start to point UI to current local IP');
  writeFileSync(uiEnvPath, next, 'utf8');
  console.log(`Updated ui/.env -> ${protocol}://${localIp}:${envMap.get('VITE_API_BASE_PORT')}`);
}

main();
