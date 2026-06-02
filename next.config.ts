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
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/api/uploads/**" },
    ],
    unoptimized: true,
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options",        value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy",     value: "camera=(self \"https://meet.jit.si\"), microphone=(self \"https://meet.jit.si\"), display-capture=(self \"https://meet.jit.si\"), geolocation=(), browsing-topics=()" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      // CSP relajado para soportar Next.js (inline scripts en hydration) + Google OAuth + Resend
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://*.googleusercontent.com https://ui-avatars.com https://i.pravatar.cc https://randomuser.me",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://accounts.google.com wss: ws:",
          "frame-src https://accounts.google.com https://meet.jit.si",
          "form-action 'self' https://accounts.google.com",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-ancestors 'none'",
        ].join("; "),
      },
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
