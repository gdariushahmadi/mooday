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
    ".deploy/**",
    "next-env.d.ts",
    // Repository material outside the product source is not part of the
    // application lint boundary. Deployment scripts remain in scope.
    ".agents/**",
    ".claude/**",
    ".qoder/**",
    ".github/**",
    ".codex/**",
    "archive/**",
    "docs/**",
    "public/**",
    "test-oauth.mjs",
    // Vitest config is not application source.
    "vitest.config.mjs",
    "vitest.config.mts",
    "vitest.setup.ts",
  ]),
]);

export default eslintConfig;
