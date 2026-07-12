import type { NextConfig } from "next";

/**
 * Compliance Server Actions accept ATR + optional supporting documents (up to 10 MB each).
 * Default Next.js Server Action body limit is 1 MB — raise to fit multipart uploads.
 */
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
