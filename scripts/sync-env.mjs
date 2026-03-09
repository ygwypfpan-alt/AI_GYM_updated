import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, '..');
const rootEnvPath = resolve(rootDir, '.env');
const rootEnvExamplePath = resolve(rootDir, '.env.example');

if (!existsSync(rootEnvPath) && existsSync(rootEnvExamplePath)) {
  copyFileSync(rootEnvExamplePath, rootEnvPath);
  console.log('Created root .env from .env.example');
}

if (!existsSync(rootEnvPath)) {
  console.warn('Root .env not found. Skipping env sync.');
  process.exit(0);
}

const envContent = readFileSync(rootEnvPath, 'utf8');

const targets = [
  resolve(rootDir, 'apps', 'api', '.env'),
  resolve(rootDir, 'apps', 'web', '.env.local'),
  resolve(rootDir, 'packages', 'db', '.env'),
];

for (const target of targets) {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, envContent, 'utf8');
}

console.log('Synchronized env files to apps/api, apps/web, and packages/db.');
