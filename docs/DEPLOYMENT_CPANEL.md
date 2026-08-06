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

Last verified: 2026-08-03.

- `https://app.daneg.ae/`: HTTP `200`
- `https://app.daneg.ae/app`: HTTP `200`
- `https://app.daneg.ae/admin`: HTTP `200`
- `https://app.daneg.ae/manifest.json`: HTTP `200`
- Production Supabase configuration: still required
