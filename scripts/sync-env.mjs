import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, '..');
const rootEnvPath = resolve(rootDir, '.env');
const rootEnvExamplePath = resolve(rootDir, '.env.example');
const processEnvOverrides = [
  'DATABASE_URL',
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG',
  'NEXT_PUBLIC_ENV_PROFILE',
  'NEXT_PUBLIC_LOOKUP_HINT_PHONE',
  'NEXT_PUBLIC_LOOKUP_HINT_EMAIL',
];

function mergeEnvContent(envContent) {
  const lines = envContent.split(/\r?\n/);
  const mergedLines = [...lines];
  const existingKeys = new Set();

  for (const [index, line] of lines.entries()) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    existingKeys.add(key);

    if (processEnvOverrides.includes(key) && process.env[key]) {
      mergedLines[index] = `${key}=${process.env[key]}`;
    }
  }

  for (const key of processEnvOverrides) {
    if (!existingKeys.has(key) && process.env[key]) {
      mergedLines.push(`${key}=${process.env[key]}`);
    }
  }

  return mergedLines.join('\n');
}

if (!existsSync(rootEnvPath) && existsSync(rootEnvExamplePath)) {
  copyFileSync(rootEnvExamplePath, rootEnvPath);
  console.log('Created root .env from .env.example');
}

if (!existsSync(rootEnvPath)) {
  console.warn('Root .env not found. Skipping env sync.');
  process.exit(0);
}

const envContent = mergeEnvContent(readFileSync(rootEnvPath, 'utf8'));

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
