import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@mermaid-js/parser'],
  experimental: {
    optimizePackageImports: ['streamdown'],
  },
};

export default nextConfig;
