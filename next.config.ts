import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const isVercel = process.env.VERCEL === "1";
const disablePWA =
  process.env.DISABLE_PWA === "true" ||
  process.env.NODE_ENV === "development" ||
  isVercel; // disable on Vercel to avoid SW build/minify overhead; override with DISABLE_PWA=false locally

const withPWA = withPWAInit({
  dest: "public",
  disable: disablePWA,
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  serverExternalPackages: ['@mermaid-js/parser'],
  // Force Turbopack to treat this workspace as the root to avoid parent lockfile warnings
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizePackageImports: ['streamdown'],
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default withPWA(nextConfig);
