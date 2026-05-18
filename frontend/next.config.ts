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
};

export default nextConfig;
