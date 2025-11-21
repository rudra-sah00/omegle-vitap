import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Disabled for development - enable for production build
  // output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
