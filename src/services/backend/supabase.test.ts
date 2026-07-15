import { describe, expect, it } from "vitest";
import { mapSupabaseAuthError } from "./supabase";

describe("Supabase auth error mapping", () => {
  it("does not reveal whether an account exists for login failures", () => {
    expect(mapSupabaseAuthError("Invalid login credentials")).toBe(
      "invalid_credentials",
    );
  });

  it("maps OTP, throttle and network failures to stable UI codes", () => {
    expect(mapSupabaseAuthError("Token has expired")).toBe("invalid_otp");
    expect(mapSupabaseAuthError("Too many requests")).toBe("rate_limited");
    expect(mapSupabaseAuthError("Failed to fetch")).toBe("network_error");
  });
});
