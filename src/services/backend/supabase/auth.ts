import type { AuthErrorCode } from "@/data/users";
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import type { AuthenticatedUser, AuthResult, AuthService, OtpPurpose } from "../contracts";

export class SupabaseAuthService implements AuthService {
    constructor(private readonly client: SupabaseClient, private readonly siteUrl: string) {
    }

    private authCallbackUrl(): string {
        const liveOrigin = typeof window !== "undefined" && window.location.origin
                    ? window.location.origin
                    : null;
        const isLocal = liveOrigin !== null &&
                  (liveOrigin.includes("localhost") || liveOrigin.includes("127.0.0.1"));
        const baseUrl = liveOrigin && !isLocal ? liveOrigin : this.siteUrl;
        const url = `${baseUrl.replace(/\/+$/, "")}/auth/callback`;
        if (typeof console !== "undefined" && typeof window !== "undefined") {
          const isLocal = url.includes("localhost") || url.includes("127.0.0.1");
          const isHttps = url.startsWith("https://");
          if (isLocal || !isHttps) {
            console.warn(
              `[auth] OAuth callback URL is ${url}. If this is a production ` +
                "deployment, register it under Authentication -> URL Configuration " +
                "in the Supabase dashboard, and as an authorized redirect URI in " +
                "the Google Cloud OAuth client.",
            );
          }
}

return url;
}

async getCurrentUser(): Promise<AuthenticatedUser | null> {
const { data, error } = await this.client.auth.getUser();
if (error || !data.user) return null;
return toUser(data.user);
}

subscribe(listener: (user: AuthenticatedUser | null) => void): () => void {
const { data } = this.client.auth.onAuthStateChange((_event, session) => {
      listener(session?.user ? toUser(session.user) : null);
    });
return () => data.subscription.unsubscribe();
}

async signUp(input: {
name: string;
email: string;
phone: string;
password: string;
}): Promise<AuthResult<AuthenticatedUser>> {
const redirectTo = this.authCallbackUrl();
const { data, error } = await this.client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.name, phone: input.phone },
        emailRedirectTo: redirectTo,
      },
    });
if (error) return failure(error.message);
if (!data.user) return failure("Invalid credentials");
return {
  ok: true,
  value: toUser(data.user),
  needsVerification: !data.session,
};
}

async signIn(input: {
email: string;
password: string;
}): Promise<AuthResult<AuthenticatedUser>> {
const { data, error } = await this.client.auth.signInWithPassword(input);
if (error) return failure(error.message);
return { ok: true, value: toUser(data.user) };
}

async signOut(): Promise<AuthResult<null>> {
const { error } = await this.client.auth.signOut({ scope: "local" });
return error ? failure(error.message) : { ok: true, value: null };
}

async sendOtp(email: string, purpose: OtpPurpose): Promise<AuthResult<null>> {
const redirectTo = this.authCallbackUrl();
const result = purpose === "recovery"
        ? await this.client.auth.resetPasswordForEmail(email, {
            redirectTo,
          })
        : await this.client.auth.resend({
            type: "signup",
            email,
            options: {
              emailRedirectTo: redirectTo,
            },
          });
return result.error
? failure(result.error.message)
: { ok: true, value: null };
}

async verifyOtp(email: string, token: string, purpose: OtpPurpose): Promise<AuthResult<AuthenticatedUser>> {
const { data, error } = await this.client.auth.verifyOtp({
      email,
      token,
      type: purpose === "recovery" ? "recovery" : "signup",
    });
if (error) return failure(error.message);
if (!data.user) return failure("Invalid OTP");
return { ok: true, value: toUser(data.user) };
}

async resetPassword(newPassword: string): Promise<AuthResult<null>> {
const { error } = await this.client.auth.updateUser({
      password: newPassword,
    });
return error ? failure(error.message) : { ok: true, value: null };
}

async signInWithOAuth(provider: "google"): Promise<AuthResult<null>> {
const redirectTo = this.authCallbackUrl();
const { error } = await this.client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: { access_type: "offline" },
      },
    });
return error ? failure(error.message) : { ok: true, value: null };
}

async completeOAuth(code: string): Promise<AuthResult<AuthenticatedUser>> {
const { data, error } = await this.client.auth.exchangeCodeForSession(code);
if (error) return failure(error.message);
return { ok: true, value: toUser(data.user) };
}

async updateName(name: string): Promise<AuthResult<null>> {
const { error } = await this.client.auth.updateUser({
      data: { full_name: name },
    });
return error ? failure(error.message) : { ok: true, value: null };
}
}

export function toUser(user: User): AuthenticatedUser {
    return {
    id: user.id,
    email: user.email ?? "",
    name:
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name) ||
      user.email?.split("@")[0] ||
      "DANEG user",
    };
}

export function mapSupabaseAuthError(message: string): AuthErrorCode {
    const value = message.toLowerCase();
    if (value.includes("already") || value.includes("registered")) {
    return "user_exists";
    }

    if (
    value.includes("password") &&
    (value.includes("short") || value.includes("weak"))
    ) {
    return "weak_password";
    }

    if (value.includes("email") && value.includes("invalid")) {
    return "invalid_email";
    }

    if (value.includes("rate") || value.includes("too many")) {
    return "rate_limited";
    }

    if (
    value.includes("token") ||
    value.includes("otp") ||
    value.includes("expired")
    ) {
    return "invalid_otp";
    }

    if (value.includes("network") || value.includes("fetch")) {
    return "network_error";
    }

    return "invalid_credentials";
}

export function failure(message: string): AuthResult<never> {
    return { ok: false, error: mapSupabaseAuthError(message) };
}
