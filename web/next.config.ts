import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";
loadEnv({ path: "../.env.local", quiet: true });
const config: NextConfig = {
  transpilePackages: ["@watchsync/shared"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async headers() {
    const realtime =
      process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000";
    const livekit =
      process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "wss://*.livekit.cloud";
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com" +
        (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://i.ytimg.com https://lh3.googleusercontent.com https://images.unsplash.com https://i.pravatar.cc",
      "font-src 'self' data:",
      `connect-src 'self' ${realtime} ${realtime.replace(/^http/, "ws")} ${livekit} ${livekit.replace(/^ws/, "http")} https://*.livekit.cloud wss://*.livekit.cloud https://www.youtube.com https://*.googlevideo.com`,
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "form-action 'self' https://accounts.google.com",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(self), display-capture=(self), geolocation=()",
          },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};
export default config;
