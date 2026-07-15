import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mailpitUrl = process.env.SUPABASE_LOCAL_MAILPIT_URL || "http://127.0.0.1:54324";

if (!url || !key) throw new Error("Supabase browser configuration is missing.");
if (
  !process.env.PHASE2_SMOKE_ALLOW_REMOTE &&
  !new URL(url).hostname.match(/^(127\.0\.0\.1|localhost)$/)
) {
  throw new Error("Auth smoke test is local-only unless PHASE2_SMOKE_ALLOW_REMOTE=1.");
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `phase2-smoke-${suffix}@example.test`;
const initialPassword = "Mooday-smoke-42!";
const recoveredPassword = "Mooday-recovered-43!";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function latestOtp(subjectFragment) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(`${mailpitUrl}/api/v1/messages`);
    assert(response.ok, "Mailpit message list is unavailable.");
    const inbox = await response.json();
    const message = inbox.messages?.find(
      (item) =>
        item.To?.some((recipient) => recipient.Address === email) &&
        item.Subject?.includes(subjectFragment),
    );
    if (message) {
      const detailResponse = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`);
      assert(detailResponse.ok, "Mailpit message detail is unavailable.");
      const detail = await detailResponse.json();
      const token = `${detail.Subject}\n${detail.Text}`.match(/\b\d{6}\b/)?.[0];
      assert(token, `No six-digit OTP found in ${subjectFragment} email.`);
      return token;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${subjectFragment} email.`);
}

const signup = await supabase.auth.signUp({
  email,
  password: initialPassword,
  options: { data: { full_name: "Phase 2 Smoke", phone: "+971500000000" } },
});
assert(!signup.error && signup.data.user, `Sign-up failed: ${signup.error?.message}`);
assert(!signup.data.session, "Email confirmation should be required locally.");

const signupOtp = await latestOtp("Confirm your Mooday account");
const verified = await supabase.auth.verifyOtp({ email, token: signupOtp, type: "signup" });
assert(!verified.error && verified.data.session, `OTP verification failed: ${verified.error?.message}`);
const userId = verified.data.user?.id;
assert(userId, "Verified user id is missing.");

const profile = await supabase.from("profiles").select("*").single();
assert(!profile.error, `Profile read failed: ${profile.error?.message}`);
assert(profile.data.full_name_en === "Phase 2 Smoke", "Sign-up profile trigger lost the display name.");

const address = await supabase
  .from("addresses")
  .insert({
    user_id: userId,
    label_en: "Home",
    label_ar: "المنزل",
    full_name_en: "Phase 2 Smoke",
    full_name_ar: "اختبار المرحلة الثانية",
    phone: "+971500000000",
    city_en: "Dubai",
    city_ar: "دبي",
    street_en: "Smoke Test Street",
    street_ar: "شارع الاختبار",
    is_default: false,
  })
  .select("*")
  .single();
assert(!address.error, `Address insert failed: ${address.error?.message}`);
assert(address.data.is_default, "The first address was not promoted to default.");

const signout = await supabase.auth.signOut();
assert(!signout.error, `Sign-out failed: ${signout.error?.message}`);
const signin = await supabase.auth.signInWithPassword({ email, password: initialPassword });
assert(!signin.error && signin.data.session, `Password sign-in failed: ${signin.error?.message}`);

const recovery = await supabase.auth.resetPasswordForEmail(email);
assert(!recovery.error, `Recovery request failed: ${recovery.error?.message}`);
const recoveryOtp = await latestOtp("Reset your Mooday password");
const recovered = await supabase.auth.verifyOtp({
  email,
  token: recoveryOtp,
  type: "recovery",
});
assert(!recovered.error && recovered.data.session, `Recovery OTP failed: ${recovered.error?.message}`);
const passwordUpdate = await supabase.auth.updateUser({ password: recoveredPassword });
assert(!passwordUpdate.error, `Password update failed: ${passwordUpdate.error?.message}`);

await supabase.auth.signOut();
const recoveredSignin = await supabase.auth.signInWithPassword({
  email,
  password: recoveredPassword,
});
assert(
  !recoveredSignin.error && recoveredSignin.data.session,
  `Recovered-password sign-in failed: ${recoveredSignin.error?.message}`,
);

const cleanup = await supabase.from("addresses").delete().eq("id", address.data.id);
assert(!cleanup.error, `Smoke address cleanup failed: ${cleanup.error?.message}`);
await supabase.auth.signOut();

console.log("Phase 2 auth smoke test passed: signup, OTP, profile, address, sign-in, recovery, sign-out.");
