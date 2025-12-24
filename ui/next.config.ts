import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000", "http://localhost:3001", "http://192.168.1.90:3001"],
};

export default nextConfig;
