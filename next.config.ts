import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const supabaseImageHostname = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // `standalone` produces a self-contained server bundle in `.next/standalone`
  // with only the runtime files needed on the server. This is required for
  // cPanel / Passenger deployments where the host has a small inode and
  // memory budget. We still keep `public/` and `.next/static/` next to the
  // standalone output so the Next.js server can serve them.
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co", pathname: "/**" },
      { protocol: "https", hostname: "**.supabase.in", pathname: "/**" },
      ...(supabaseImageHostname
        ? [{ protocol: "https" as const, hostname: supabaseImageHostname, pathname: "/**" }]
        : []),
    ],
  },
  // Pin the workspace root so Turbopack doesn't pick up lockfiles from
  // parent directories in a monorepo checkout.
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // The service worker must always be interpreted as JS and never cached
        // aggressively by intermediaries so updates reach clients quickly.
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // The web app manifest is read on every install/update.
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        // Icons and the offline fallback should be cacheable for performance
        // but the icon set rarely changes, so we use a short max-age.
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  webpack: {
    treeshake: { removeDebugLogging: true },
  },
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
});
