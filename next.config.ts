import type { NextConfig } from "next";

/**
 * Compliance Server Actions accept ATR + optional supporting documents (up to 10 MB each).
 * Default Next.js Server Action body limit is 1 MB — raise to fit multipart uploads.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingExcludes: {
    "*": [
      "releases/**",
      "db backup/**",
      "security audit/**",
      "**/*.pdf",
      "**/*.zip",
    ],
  },
  poweredByHeader: false,
  serverExternalPackages: ["postgres"],
  allowedDevOrigins: [
    "10.70.233.176",
    "10.70.233.176:443",
    "10.70.233.176:3050",
    "10.70.230.176",
    "10.70.230.176:3050",
    "10.70.12.73",
    "10.70.12.73:3050",
    "localhost",
    "localhost:443",
    "localhost:3050",
    "localhost:3051",
    "127.0.0.1",
    "127.0.0.1:443",
    "127.0.0.1:3050",
    "127.0.0.1:3051",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";
      const csp = [
        "default-src 'self'",
        `script-src ${scriptSrc}`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
      ].join("; ");

      return [
        {
          source: "/:path*",
          headers: [
            {
              key: "X-DNS-Prefetch-Control",
              value: "on",
            },
            {
              key: "X-Frame-Options",
              value: "DENY",
            },
            {
              key: "X-Content-Type-Options",
              value: "nosniff",
            },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
            {
              key: "X-Permitted-Cross-Domain-Policies",
              value: "none",
            },
            {
              key: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
            },
            {
              key: "Content-Security-Policy",
              value: csp,
            },
          ],
        },
      {
        source: "/dashboard/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      {
        source: "/login",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
