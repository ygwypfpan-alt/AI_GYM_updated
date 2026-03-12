const LOCAL_API_PORT = '3001';
const LOCAL_DEFAULT_BUSINESS_SLUG = 'ai-gym-demo';
const LOCAL_LOOKUP_HINT = {
  phone: '0911111111',
  email: 'ming@example.com',
};
const LOCALHOST_API_PATTERN =
  /^https?:\/\/(localhost|127(?:\.\d{1,3}){3})(:\d+)?(?:\/|$)/i;

function isVercelDeployment() {
  return process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
}

function isBrowserLocalHost() {
  if (typeof window === 'undefined') {
    return false;
  }

  return /^(localhost|127(?:\.\d{1,3}){3})$/i.test(window.location.hostname);
}

function isLocalDevelopment() {
  return process.env.NODE_ENV === 'development' && !isVercelDeployment();
}

function normalizeUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function resolveLocalApiBaseUrl() {
  const localHost =
    typeof window === 'undefined' ? '127.0.0.1' : window.location.hostname;
  return `http://${localHost}:${LOCAL_API_PORT}`;
}

function resolvePublicApiBaseUrl() {
  const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!configuredApiBaseUrl) {
    if (isLocalDevelopment() || isBrowserLocalHost() || !isVercelDeployment()) {
      return resolveLocalApiBaseUrl();
    }

    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is required outside local development.',
    );
  }

  if (
    LOCALHOST_API_PATTERN.test(configuredApiBaseUrl) &&
    !isLocalDevelopment() &&
    !isBrowserLocalHost() &&
    isVercelDeployment()
  ) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL must not point to localhost outside local development.',
    );
  }

  return normalizeUrl(configuredApiBaseUrl);
}

function resolvePublicBusinessSlug() {
  const configuredBusinessSlug =
    process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG?.trim();

  if (configuredBusinessSlug) {
    return configuredBusinessSlug;
  }

  if (isLocalDevelopment() || isBrowserLocalHost()) {
    return LOCAL_DEFAULT_BUSINESS_SLUG;
  }

  throw new Error(
    'NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG is required outside local development.',
  );
}

function resolveLookupHint() {
  const phone = process.env.NEXT_PUBLIC_LOOKUP_HINT_PHONE?.trim();
  const email = process.env.NEXT_PUBLIC_LOOKUP_HINT_EMAIL?.trim();

  if (phone && email) {
    return { phone, email };
  }

  if (phone || email) {
    throw new Error(
      'NEXT_PUBLIC_LOOKUP_HINT_PHONE and NEXT_PUBLIC_LOOKUP_HINT_EMAIL must be set together.',
    );
  }

  if (isLocalDevelopment() || isBrowserLocalHost()) {
    return LOCAL_LOOKUP_HINT;
  }

  return null;
}

export const PUBLIC_API_BASE_URL = resolvePublicApiBaseUrl();
export const PUBLIC_API_HEALTH_URL = `${PUBLIC_API_BASE_URL}/health`;
export const PUBLIC_DEFAULT_BUSINESS_SLUG = resolvePublicBusinessSlug();
export const PUBLIC_ENV_PROFILE = PUBLIC_DEFAULT_BUSINESS_SLUG.includes('pilot')
  ? 'pilot'
  : 'demo';
export const PUBLIC_LOOKUP_HINT = resolveLookupHint();
