import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Stone Ledger is a fully dynamic authenticated app — no static caching */
  cacheComponents: false,
};

export default nextConfig;
