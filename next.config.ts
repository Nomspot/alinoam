import type { NextConfig } from "next";

const nextConfig = {
    allowedDevOrigins: ['10.100.102.11'],
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
};


export default nextConfig;