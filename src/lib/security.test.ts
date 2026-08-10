import { describe, it, expect } from "vitest";
import { hashPin, verifyPin, LOCK_TIMEOUT_PRESETS_MS, getLockTimeout, DEFAULT_LOCK_TIMEOUT_MS, LOCK_STORAGE_KEYS } from "@/lib/security";
import { vi, afterEach } from "vitest";

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

describe("getLockTimeout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns default timeout when storage throws", () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error("SecurityError: The operation is insecure.");
    });
    expect(getLockTimeout()).toBe(DEFAULT_LOCK_TIMEOUT_MS);
  });

  it("returns parsed preset when valid value is in storage", () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === LOCK_STORAGE_KEYS.timeoutMs) return "900000";
      return null;
    });
    expect(getLockTimeout()).toBe(15 * 60_000); // 900000
  });

  it("returns default timeout when invalid value is in storage", () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === LOCK_STORAGE_KEYS.timeoutMs) return "999";
      return null;
    });
    expect(getLockTimeout()).toBe(DEFAULT_LOCK_TIMEOUT_MS);
  });

  it("returns default timeout when NaN is in storage", () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === LOCK_STORAGE_KEYS.timeoutMs) return "invalid_string";
      return null;
    });
    expect(getLockTimeout()).toBe(DEFAULT_LOCK_TIMEOUT_MS);
  });
});
