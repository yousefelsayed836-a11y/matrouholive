import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "assets.wuiltstore.com" },
      { protocol: "https", hostname: "matrouholive.onrender.com", pathname: "/uploads/**" },
      { protocol: "https", hostname: "api.matrouholive.com", pathname: "/uploads/**" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/favicon:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },
};

export default nextConfig;
