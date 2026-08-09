import { createClient } from '@supabase/supabase-js';
const url = 'https://duchuarevedwqbmxctfx.supabase.co';
const key = process.env.PUBKEY || 'invalid';
const client = createClient(url, key, { auth: { flowType: 'pkce' } });
console.log('Supabase client created. URL:', url);
// Build the same URL the browser would navigate to
const siteUrl = 'http://localhost:3000';
const redirectTo = `${siteUrl}/auth/callback`;
console.log('Would redirect to Google via:');
console.log(`  ${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`);

// Test if the Supabase project is reachable
try {
  const r = await fetch(`${url}/auth/v1/health`);
  console.log('Supabase health:', r.status);
} catch (e) {
  console.log('Supabase health error:', e.message);
}

// Test if Google provider is enabled
try {
  const r = await fetch(`${url}/auth/v1/settings`);
  const j = await r.json();
  console.log('Google enabled:', !!j.external?.google);
  console.log('Site URL:', j.site_url);
} catch (e) {
  console.log('Settings error:', e.message);
}
