/**
 * Mock users dataset (Group A — Sign Up / Sign In).
 *
 * Phase 1 ships a tiny in-memory + localStorage-backed user list for
 * the buyer-side auth flow. Phase 2 will swap this for a real
 * registration API; passwords here are stored **plaintext** in
 * localStorage (Phase 1 only — this is the single largest Phase-3
 * security item to fix).
 *
 * Pre-seeded login (for fast QA):
 *   email:    layla@mooday.app
 *   password: mooday123
 */

export interface User {
  id: string;
  nameEn: string;
  nameAr: string;
  email: string;
  phone: string;
  /** Stored plaintext in Phase 1. Phase 2 swaps for a real hash. */
  password: string;
  createdAt: string;
}

/** Default seed for QA. */
export const DEFAULT_USERS: User[] = [
  {
    id: "user-seed-1",
    nameEn: "Layla Mansour",
    nameAr: "ليلى منصور",
    email: "layla@mooday.app",
    phone: "+971 50 123 4567",
    password: "mooday123",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Mock OTP. Phase 1 accepts the universal code "000000" for any
 * email/in-memory user. Phase 3 will swap to a real SMS / email
 * challenge.
 */
export const MOCK_OTP_CODE = "000000";

/**
 * Generate a 32-char session token from a user id + timestamp.
 * Cryptographically meaningless in Phase 1 — Phase 2 will swap for
 * a real JWT signed by the auth server.
 */
export function generateSessionToken(userId: string): string {
  return `${userId}.${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export interface Session {
  userId: string;
  email: string;
  token: string;
  createdAt: string;
}

/** Error codes returned by signIn/signUp for the form layer to branch on. */
export type AuthErrorCode =
  | "user_exists"
  | "user_not_found"
  | "wrong_password"
  | "invalid_credentials"
  | "weak_password"
  | "invalid_email"
  | "invalid_otp"
  | "rate_limited"
  | "network_error"
  | "passwords_dont_match";

export const AUTH_ERROR_MESSAGE_EN: Record<AuthErrorCode, string> = {
  user_exists: "An account with that email already exists.",
  user_not_found: "We couldn't find an account with that email.",
  wrong_password: "Wrong password. Please try again.",
  invalid_credentials: "Email or password is incorrect.",
  weak_password: "Password must be at least 8 characters.",
  invalid_email: "That doesn't look like a valid email.",
  invalid_otp: "That code is invalid or has expired.",
  rate_limited: "Too many attempts. Please wait and try again.",
  network_error: "We couldn't reach the server. Please try again.",
  passwords_dont_match: "Passwords don't match.",
};

export const AUTH_ERROR_MESSAGE_AR: Record<AuthErrorCode, string> = {
  user_exists: "يوجد حساب بهذا البريد بالفعل.",
  user_not_found: "لم نتمكن من العثور على حساب بهذا البريد.",
  wrong_password: "كلمة المرور خاطئة. حاول مرة أخرى.",
  invalid_credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  weak_password: "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
  invalid_email: "هذا البريد غير صالح.",
  invalid_otp: "الرمز غير صالح أو انتهت صلاحيته.",
  rate_limited: "محاولات كثيرة. يرجى الانتظار ثم المحاولة مجدداً.",
  network_error: "تعذر الاتصال بالخادم. يرجى المحاولة مجدداً.",
  passwords_dont_match: "كلمتا المرور غير متطابقتين.",
};

/** Quick email regex — good enough for Phase 1. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
