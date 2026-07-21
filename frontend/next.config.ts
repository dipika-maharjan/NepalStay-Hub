import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all domains, or replace with specific domains if needed
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5051";
    return process.env.NODE_ENV === "development"
      ? [
          {
            source: "/api/:path*",
            destination: `${backendUrl}/api/:path*`,
          },
          {
            source: "/uploads/:path*",
            destination: `${backendUrl}/uploads/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
