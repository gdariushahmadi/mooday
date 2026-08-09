import { describe, it, expect } from "vitest";
import { hashPin, verifyPin, LOCK_TIMEOUT_PRESETS_MS } from "@/lib/security";

describe("security helpers", () => {
 it("hashes and verifies a PIN", async () => {
 const result = await hashPin("1234");
 expect(result).not.toBeNull();
 expect(await verifyPin("1234", result!.salt, result!.hash)).toBe(true);
 expect(await verifyPin("9999", result!.salt, result!.hash)).toBe(false);
 });

 it("produces different hashes for the same PIN with new salts", async () => {
 const a = await hashPin("1234");
 const b = await hashPin("1234");
 expect(a!.salt).not.toBe(b!.salt);
 expect(a!.hash).not.toBe(b!.hash);
 });

 it("exposes the documented lock-timeout presets", () => {
 expect(LOCK_TIMEOUT_PRESETS_MS).toEqual([
 60_000,
 5 * 60_000,
 15 * 60_000,
 30 * 60_000,
 60 * 60_000,
 ]);
 });
});
