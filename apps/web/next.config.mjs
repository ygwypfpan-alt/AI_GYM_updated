const isVercelDeployment =
  process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);
const localhostApiPattern =
  /^https?:\/\/(localhost|127(?:\.\d{1,3}){3})(:\d+)?(?:\/|$)/i;
const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

if (isVercelDeployment && !configuredApiBaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_API_BASE_URL is required for Vercel preview and production builds.',
  );
}

if (
  isVercelDeployment &&
  configuredApiBaseUrl &&
  localhostApiPattern.test(configuredApiBaseUrl)
) {
  throw new Error(
    'NEXT_PUBLIC_API_BASE_URL must not point to localhost in Vercel preview or production builds.',
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
