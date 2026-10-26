import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  async redirects() {
    // Palm Beach International's IATA code changed from PBI to DJT on Aug 18, 2026; people still search the old code.
    return [{ source: "/airports/pbi", destination: "/airports/djt", permanent: true }];
  },
};

export default nextConfig;
