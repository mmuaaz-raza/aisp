import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    PYTHON_BACKEND_URL: process.env.PYTHON_BACKEND_URL || "http://localhost:8000",
  },
  async rewrites() {
    return [
      {
        // Proxy all backend API calls through Next.js so the browser stays
        // same-origin — no CORS issues and cookies are forwarded automatically.
        source: "/api/v1/:path*",
        destination: `${process.env.PYTHON_BACKEND_URL || "http://localhost:8000"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
