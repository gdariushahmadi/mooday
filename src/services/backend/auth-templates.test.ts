import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const config = readFileSync(resolve("supabase/config.toml"), "utf8");
const confirmation = readFileSync(
  resolve("supabase/templates/confirmation.html"),
  "utf8",
);
const recovery = readFileSync(
  resolve("supabase/templates/recovery.html"),
  "utf8",
);

describe("Phase 2 auth email templates", () => {
  it("wires both local templates into Supabase Auth", () => {
    expect(config).toContain('content_path = "./supabase/templates/confirmation.html"');
    expect(config).toContain('content_path = "./supabase/templates/recovery.html"');
  });

  it.each([
    ["confirmation", confirmation],
    ["recovery", recovery],
  ])("uses a six-digit OTP-compatible token in %s email", (_name, template) => {
    expect(template).toContain("{{ .Token }}");
    expect(template).not.toContain("{{ .ConfirmationURL }}");
  });
});
