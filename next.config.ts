import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },
  // Socket.io necesita que Next.js no intercepte /api/socket
  webpack: (config) => {
    config.externals.push({ bufferutil: "bufferutil", "utf-8-validate": "utf-8-validate" });
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "randomuser.me" },
    ],
  },
};

export default nextConfig;
