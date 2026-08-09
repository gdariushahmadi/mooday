# Mooday cPanel Deployment

This document records the deployment procedure for the Mooday Next.js app on
Namecheap cPanel shared hosting. It is intentionally free of passwords,
private keys, Supabase secrets, and other credentials.

## Current Server

- Public URL: `https://app.daneg.ae`
- cPanel account: `danesoyk`
- Application root: `/home/danesoyk/mooday`
- Node.js: `22.23.0`
- Passenger startup file: `server.js`
- SSH host: `app.daneg.ae`
- SSH port: `21098`
- SSH user: `danesoyk`
- Passenger configuration: `/home/danesoyk/app.daneg.ae/.htaccess`

The app is served by CloudLinux Passenger through LiteSpeed. The domain's
document root is not the Node application root; Passenger forwards `/` to the
application configured above.

## cPanel Node.js App Settings

In cPanel > Setup Node.js App, use:

- Node.js version: `22.23.0`
- Application root: `mooday`
- Application URL: `https://app.daneg.ae/`
- Application startup file: `server.js`
- Application mode: `Production`
- Environment variable: `NODE_ENV=production`

Do not replace the Passenger startup file with the default cPanel test server.
The default server returns `It works! NodeJS ...` and is not the Mooday app.

## SSH Access

The SSH key must be imported in cPanel > SSH Access > Manage SSH Keys and then
authorized under `Manage`. SSH Shell access must also be enabled by the host;
an authorized key alone is not enough.

Connection format:

```bash
ssh -i /path/to/mooday_namecheap_ed25519 \
  -p 21098 danesoyk@app.daneg.ae
```

Keep the private key only on the deployment workstation. Only the public key
belongs in cPanel.

## Build and Restart

The Node virtual environment is not on the default SSH `PATH`. Always activate
it before running npm commands:

```bash
source /home/danesoyk/nodevenv/mooday/22/bin/activate
cd /home/danesoyk/mooday
```

Install development dependencies when building on cPanel. The PostCSS/Tailwind
build plugin is a development dependency:

```bash
npm install --include=dev
```

Build with Webpack and one worker. This is required on the current shared host:

```bash
CIRCLE_NODE_TOTAL=1 npx next build --webpack
touch tmp/restart.txt
```

Why these flags are required:

- Turbopack treats cPanel's `node_modules` symlink as outside the project root
  and fails with `Symlink [project]/node_modules is invalid`.
- The shared-host memory limit can abort Next's page-generation workers with
  `SIGABRT` when the default worker count is used.
- `touch tmp/restart.txt` asks Passenger to reload the application.

The repository's `next.config.ts` uses `output: "standalone"` for production
deployment. The generated server must still have `public/` and
`.next/static/` available beside the runtime output.

## Environment Variables

Set production values in cPanel's Node.js environment-variable section or in
the Passenger environment configuration. Never commit their values here.

On the current Namecheap/LiteSpeed setup, keep the same values in
`/home/danesoyk/mooday/.env.production` as a runtime fallback. Next.js loads
this file when Passenger starts, including server-only values used by admin
actions. Restrict it to the cPanel account owner:

```bash
chmod 600 /home/danesoyk/mooday/.env.production
```

Required site settings:

```text
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://app.daneg.ae
NEXT_PUBLIC_DATA_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<public-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
```

The service-role key is server-only and must never be prefixed with
`NEXT_PUBLIC_`. The current local development values may point to
`127.0.0.1:54321`; those values do not work as production Supabase settings.

After changing environment variables, rebuild and restart Passenger.

## Supabase Auth Configuration

The application uses a six-digit email OTP. The hosted Supabase project must
use the production site URL and the repository's confirmation template; the
default Supabase template sends a confirmation link instead of the code that
the Mooday UI asks for.

In Supabase Dashboard > Authentication > URL Configuration, set:

```text
Site URL: https://app.daneg.ae
Redirect URL: https://app.daneg.ae/auth/callback
```

Keep `http://localhost:3000/auth/callback` as an additional redirect only for
local development. In Authentication > Email Templates > Confirm signup, use
`supabase/templates/confirmation.html`. It must contain `{{ .Token }}`. The
recovery template in the same directory also uses a one-time code.

The same settings can be pushed from the repository after a Supabase personal
access token has been configured for the CLI. Never commit the token:

```bash
export SUPABASE_ACCESS_TOKEN='<token from Supabase dashboard>'
npx supabase@2.109.1 config push --project-ref duchuarevedwqbmxctfx
# DB migrations (use --linked for an already-linked project)
npx supabase@2.109.1 link --project-ref duchuarevedwqbmxctfx
npx supabase@2.109.1 db push --linked
unset SUPABASE_ACCESS_TOKEN
```

`config push` was last run for this project and applied:

```text
site_url = "https://app.daneg.ae"
additional_redirect_urls = ["https://app.daneg.ae/auth/callback", "http://localhost:3000/auth/callback"]
otp_length = 6
max_frequency = "1s"
mfa.totp enroll_enabled = false
mfa.totp verify_enabled = false
[auth.email.template.confirmation] subject = "{{ .Token }} — Confirm your Mooday account"
[auth.email.template.recovery]   subject = "{{ .Token }} — Reset your Mooday password"
```

The HTML `content` of the templates was rejected with HTTP 400 because the
free tier only allows editing the `subject` while using the default email
provider. To send the six-digit code template (and any custom branding) via
Supabase Auth, configure a custom SMTP provider:

1. In the Supabase Dashboard go to **Authentication > Sign In/Up > SMTP
   Settings** and choose **Custom SMTP**.
2. Enter credentials for a transactional provider such as Resend, Postmark,
   SendGrid, or AWS SES. The connection must support TLS and be reachable
   from Supabase's outbound mailers.
3. After saving, rerun `npx supabase@2.109.1 config push --project-ref
   duchuarevedwqbmxctfx` so the template HTML in
   `supabase/templates/confirmation.html` and `recovery.html` is uploaded.
4. Verify by signing up a new test user; the email should contain a
   six-digit code and a link back to `https://app.daneg.ae/auth/callback`.

Until custom SMTP is enabled, sign-up emails still go out under the
provider's default template (a confirmation link, not the six-digit code).
The application-side redirect handling in
`src/services/backend/supabase.ts` is already wired so the link, if
clicked, still lands on the production site.

## Verification

Run these checks after every deployment:

```bash
curl -I https://app.daneg.ae/
curl -I https://app.daneg.ae/app
curl -I https://app.daneg.ae/admin
curl -I https://app.daneg.ae/manifest.json
```

Expected result: HTTP `200` and a Next.js response. The homepage HTML should
contain `Mooday`, and its canonical/OG URLs should use `https://app.daneg.ae`,
not `http://localhost:3000`.

## Troubleshooting

### `Shell access is not enabled on your account!`

Ask Namecheap support to enable SSH Shell/Jailed Shell for cPanel user
`danesoyk`. The key can be authorized before or after this is enabled.

### HTTP 503 after restart

Check the application log:

```bash
cd /home/danesoyk/mooday
tail -n 120 stderr.log
```

Confirm all of the following:

- `.next/BUILD_ID` exists.
- `server.js` is the Mooday/Next startup file, not the cPanel test server.
- `node_modules` is available through the Node virtual environment.
- `tmp/restart.txt` was touched after the build.

### `Cannot find module '@tailwindcss/postcss'`

Install development dependencies and rebuild:

```bash
npm install --include=dev
CIRCLE_NODE_TOTAL=1 npx next build --webpack
touch tmp/restart.txt
```

### `SIGABRT` during page generation

Run the build with `CIRCLE_NODE_TOTAL=1`. Do not increase Next's worker count on
the shared hosting plan.

### Homepage still contains `localhost:3000`

Set `NEXT_PUBLIC_SITE_URL=https://app.daneg.ae` in the Passenger environment,
then rebuild and restart. `.env.local` alone may not be loaded by the
standalone Passenger process at runtime.

## Security Checklist

- Rotate every FTP password that was shared during setup.
- Keep the SSH private key out of Git and out of project uploads.
- Keep Supabase service-role, database, SMTP, OAuth, and payment secrets out
  of this document and out of all `NEXT_PUBLIC_*` variables.
- Remove temporary deployment accounts when they are no longer needed.
- Review `.htaccess` after cPanel changes; cPanel may regenerate its managed
  Passenger blocks.

## Deployment Status

Last verified: 2026-08-07.

- `https://app.daneg.ae/`: HTTP `200`
- `https://app.daneg.ae/app`: HTTP `200`
- `https://app.daneg.ae/admin`: HTTP `200`
- `https://app.daneg.ae/manifest.json`: HTTP `200`
- Production Supabase configuration: active
- Supabase Auth, public REST access, and server-side service-role access:
  runtime verified; Auth URL/OTP push applied; email template needs custom SMTP
- Rollback copy: `/home/danesoyk/mooday-backups/mooday-kUeSB4679SxelAWDmvnAa-20260806-210848`
