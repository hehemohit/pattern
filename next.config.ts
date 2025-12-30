import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'cdn.architextures.org',
      },
      {
        protocol: 'https',
        hostname: 'assets.architextures.org',
      },
    ],
  },
};

export default nextConfig;
