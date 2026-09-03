import type { NextConfig } from "next";

/**
 * Compliance Server Actions accept ATR + optional supporting documents (up to 10 MB each).
 * Default Next.js Server Action body limit is 1 MB — raise to fit multipart uploads.
 */
const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "10.70.12.73",
    "10.70.12.73:3050",
    "localhost",
    "localhost:3050",
    "127.0.0.1",
    "127.0.0.1:3050",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
