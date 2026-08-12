// create-admin.js
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { readFileSync } from "fs";

// Simple env loader since we are running as a basic node script
function loadEnv() {
  try {
    const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    envFile.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    });
  } catch (e) {
    // Ignore if file not found
  }
}

loadEnv();

async function main() {
  const email = process.argv[2] || "admin@mooday.test";
  const password = process.argv[3] || "Admin-1234!";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"; // Default dev key

  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Creating user ${email}...`);

  const { data: user, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message.includes("already registered")) {
      console.log("User already exists. Fetching user...");
    } else {
      console.error("Failed to create user:", createError.message);
      // Wait a moment for docker to start if it is just starting up, and maybe try again?
      // For now, just exit since we will only run this if needed
      process.exit(1);
    }
  }

  const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to fetch users:", listError.message);
    process.exit(1);
  }

  const targetUser = usersData.users.find(u => u.email === email);

  if (!targetUser) {
     console.error("User not found after creation attempt.");
     process.exit(1);
  }

  console.log(`Promoting ${email} to admin...`);

  const { error: promoteErr } = await admin
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", targetUser.id);

  if (promoteErr) {
    console.error("Failed to promote user to admin:", promoteErr.message);
    process.exit(1);
  }

  console.log(`Successfully created and promoted admin user!`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main().catch(console.error);
