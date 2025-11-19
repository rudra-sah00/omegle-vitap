import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for proper static export
  trailingSlash: true,
  // Generate static params for dynamic routes
  experimental: {
    optimizePackageImports: ['@/components', '@/hooks'],
  },
};

export default nextConfig;
