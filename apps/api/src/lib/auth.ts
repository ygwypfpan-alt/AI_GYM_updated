import { createHmac, timingSafeEqual } from 'node:crypto';

import { AppError } from './http.js';

type AdminTokenPayload = {
  sub: 'admin';
  username: string;
  exp: number;
};

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function signPart(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function createAdminToken(input: {
  username: string;
  secret: string;
  expiresInHours?: number;
}): string {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const expiresInHours = input.expiresInHours ?? 12;
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: 'admin',
      username: input.username,
      exp: Math.floor(Date.now() / 1000) + expiresInHours * 60 * 60,
    } satisfies AdminTokenPayload),
  );
  const unsigned = `${header}.${payload}`;
  const signature = signPart(unsigned, input.secret);
  return `${unsigned}.${signature}`;
}

export function verifyAdminToken(token: string, secret: string): AdminTokenPayload {
  const [header, payload, signature] = token.split('.');

  if (!header || !payload || !signature) {
    throw new AppError('Unauthorized.', 401);
  }

  const expectedSignature = signPart(`${header}.${payload}`, secret);
  const providedBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new AppError('Unauthorized.', 401);
  }

  const parsedPayload = decodeBase64Url<AdminTokenPayload>(payload);

  if (
    parsedPayload.sub !== 'admin' ||
    !parsedPayload.username ||
    parsedPayload.exp <= Math.floor(Date.now() / 1000)
  ) {
    throw new AppError('Unauthorized.', 401);
  }

  return parsedPayload;
}
