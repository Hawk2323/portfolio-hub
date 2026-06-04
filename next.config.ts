import type { NextConfig } from "next";

const isStaticSnapshot = process.env.NEXT_PUBLIC_STATIC_SNAPSHOT === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: isStaticSnapshot ? "export" : undefined
};

export default nextConfig;
