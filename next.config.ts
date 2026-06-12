import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  swcMinify: true,
  reactStrictMode: true,
  experimental: {
    esmExternals: true,
  },
};

export default nextConfig;
