import type { NextConfig } from "next";

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

export default nextConfig;
