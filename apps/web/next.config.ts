import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vektor/ui", "@vektor/types", "@vektor/db", "@vektor/services", "@vektor/auth"],
};

export default nextConfig;
