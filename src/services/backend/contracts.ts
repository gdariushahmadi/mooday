import type { AuthErrorCode } from "@/data/users";
import type { Address } from "@/data/addresses";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export type AuthResult<T> =
  | { ok: true; value: T; needsVerification?: boolean }
  | { ok: false; error: AuthErrorCode };

export type OtpPurpose = "signup" | "recovery";

export interface AuthService {
  getCurrentUser(): Promise<AuthenticatedUser | null>;
  subscribe(
    listener: (user: AuthenticatedUser | null) => void,
  ): () => void;
  signUp(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<AuthResult<AuthenticatedUser>>;
  signIn(input: {
    email: string;
    password: string;
  }): Promise<AuthResult<AuthenticatedUser>>;
  signOut(): Promise<AuthResult<null>>;
  sendOtp(email: string, purpose: OtpPurpose): Promise<AuthResult<null>>;
  verifyOtp(
    email: string,
    token: string,
    purpose: OtpPurpose,
  ): Promise<AuthResult<AuthenticatedUser>>;
  resetPassword(newPassword: string): Promise<AuthResult<null>>;
  signInWithOAuth(provider: "google" | "apple"): Promise<AuthResult<null>>;
  completeOAuth(code: string): Promise<AuthResult<AuthenticatedUser>>;
  updateName(name: string): Promise<AuthResult<null>>;
}

export interface ProfileRecord {
  fullNameEn: string;
  fullNameAr: string;
  handle: string;
  avatar: string;
  bioEn: string;
  bioAr: string;
  locationEn: string;
  locationAr: string;
  styleTagsEn: string[];
  styleTagsAr: string[];
}

export interface ProfileService {
  getMine(): Promise<ProfileRecord | null>;
  updateMine(patch: Partial<ProfileRecord>): Promise<void>;
}

export interface AddressService {
  listMine(): Promise<Address[]>;
  create(address: Omit<Address, "id">): Promise<Address>;
  update(id: string, patch: Partial<Omit<Address, "id">>): Promise<void>;
  remove(id: string): Promise<void>;
  setDefault(id: string): Promise<void>;
}

export interface Phase2Backend {
  auth: AuthService;
  profiles: ProfileService;
  addresses: AddressService;
}
