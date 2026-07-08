/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // NOTE: Do NOT put REDIS_URL here — the env block bakes values at build time.
  // Server-side code (API routes) reads process.env at runtime automatically.
};

module.exports = nextConfig;
