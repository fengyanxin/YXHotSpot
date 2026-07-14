import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  eslint: { ignoreDuringBuilds: true },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

export default nextConfig;
