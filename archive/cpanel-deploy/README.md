# Archived: cPanel deployment (2026-08-29)

The previous Mooday deployment ran on Namecheap cPanel shared hosting with
hosted Supabase Cloud. This setup was decommissioned on 2026-08-29 when the
project moved to a self-hosted Supabase stack on a dedicated Ubuntu VPS.

The files in this directory are kept for historical reference only. **Do not
use them for new deploys.**

| File | Original purpose |
|---|---|
| `build-standalone.sh` | Local Next.js build + SCP upload to `danesoyk@app.daneg.ae:21098` via Passenger's `tmp/restart.txt` |
| `apply-migrations.mjs` | Apply migrations to hosted Supabase via the management `pg/query` endpoint with service-role auth |
| `DEPLOYMENT_CPANEL.md` | Full operational guide for the cPanel + Passenger + Cloud Supabase setup |
| `progress-u19-u20-backup-deploy.md` | Progress notes for the backup + cPanel deploy units (U19, U20) |

## Active deployment

For current deploy procedures, see:
- `docs/DEPLOY.md` — VPS deployment guide
- `docs/VPS_OPS.md` — Operational runbook
- `scripts/build-vps.sh` — Current deploy script (rsync + systemd)

## Why we moved away from cPanel

1. **Single-tenant control**: Self-hosting Supabase puts the data plane on
   the same network as the app, removing cross-service auth and latency.
2. **Realtime → polling**: The VPS swap dropped Realtime to fit 2 GB RAM.
   Chat still works via periodic `listMessages` polling.
3. **Cost**: VPS hosting is cheaper than cPanel shared hosting with hosted
   Supabase Pro for this traffic profile.
4. **Operational clarity**: One system, one backup script, one restart
   procedure — instead of three separate surfaces to keep in sync.
