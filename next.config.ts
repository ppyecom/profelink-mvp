import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modo standalone: genera .next/standalone con server.js + deps mínimas
  // → permite empaquetar en Docker liviano para Cloud Run
  output: "standalone",
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
          "img-src 'self' data: blob: https: https://*.googleusercontent.com https://ui-avatars.com https://i.pravatar.cc https://randomuser.me https://i.ytimg.com https://i.vimeocdn.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "media-src 'self' blob: https:",
          "connect-src 'self' https://accounts.google.com https://www.youtube.com https://player.vimeo.com https://www.loom.com wss: ws:",
          "frame-src https://accounts.google.com https://meet.jit.si https://excalidraw.com https://www.youtube.com https://www.youtube-nocookie.com https://youtu.be https://player.vimeo.com https://www.loom.com",
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
