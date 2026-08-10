import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific ignores: build scripts and the PWA service worker
    // are not part of the application source.
    "scripts/**",
    "public/sw.js",
    // Vitest config is not application source.
    "vitest.config.mjs",
    "vitest.config.mts",
    "vitest.setup.ts",
  ]),
]);

export default eslintConfig;
