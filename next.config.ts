import type { NextConfig } from "next";

// Ensure Turbopack uses this project directory as the root
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
