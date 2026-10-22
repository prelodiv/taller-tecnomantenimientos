import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = (process.env.API_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5142").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default nextConfig;
