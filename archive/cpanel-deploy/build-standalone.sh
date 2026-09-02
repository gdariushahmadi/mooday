#!/usr/bin/env bash
# Build a Next.js standalone deployment bundle locally and (optionally)
# upload it to the cPanel host described in docs/DEPLOYMENT_CPANEL.md.
#
# Usage:
#   bash scripts/build-standalone.sh              # build + stage only
#   bash scripts/build-standalone.sh --upload     # build + stage + upload
#
# The script:
#   1. Runs `next build` so `.next/standalone/` is populated.
#   2. Stages `server.js`, `package.json`, `public/`, and the parts of `.next/`
#      the Next.js standalone server needs (manifests + `server/` + `static/`).
#   3. (Optional) tars the bundle and ships it to the cPanel SSH target.
#
# Required environment for --upload:
#   MOODAY_SSH_KEY   path to the private SSH key (default: ~/.ssh/mooday_namecheap_ed25519)
#   MOODAY_SSH_HOST  user@host (default: danesoyk@app.daneg.ae)
#   MOODAY_SSH_PORT  SSH port (default: 21098)
#   MOODAY_REMOTE_DIR application root on the server (default: /home/danesoyk/mooday)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

BUNDLE_DIR="${REPO_ROOT}/.deploy"
TARBALL="${REPO_ROOT}/mooday-deploy.tar.gz"
UPLOAD="false"
for arg in "$@"; do
  case "${arg}" in
    --upload) UPLOAD="true" ;;
    -h|--help)
      sed -n '2,18p' "${BASH_SOURCE[0]}"
      exit 0
      ;;
  esac
done

echo "==> next build"
# `.env.local` has higher priority than `.env.production` in Next.js's
# env-file loader, so passing the production values via the shell here
# overrides anything in the repo's `.env.local`. The values below must
# match the Supabase project the production server is wired to.
NEXT_PUBLIC_SITE_URL="https://app.daneg.ae" \
  NEXT_PUBLIC_SUPABASE_URL="https://duchuarevedwqbmxctfx.supabase.co" \
  NEXT_PUBLIC_DATA_SOURCE="supabase" \
  NEXT_PUBLIC_MARKETPLACE_DATA_SOURCE="supabase" \
  npx next build

rm -rf "${BUNDLE_DIR}"
mkdir -p "${BUNDLE_DIR}"

# Standalone startup file and minimal package.json
cp .next/standalone/server.js "${BUNDLE_DIR}/server.js"
cp .next/standalone/package.json "${BUNDLE_DIR}/package.json"

# Public assets and the standalone server-side build artifacts.
# Public MUST sit beside server.js; the standalone server refuses to start
# without it.
cp -R public/. "${BUNDLE_DIR}/public/"
mkdir -p "${BUNDLE_DIR}/.next"
cp -R .next/standalone/.next/. "${BUNDLE_DIR}/.next/"

# Static assets live at the top-level of .next/, not inside .next/standalone.
# Without them the page hydration will 404 on every chunk.
mkdir -p "${BUNDLE_DIR}/.next/static"
cp -R .next/static/. "${BUNDLE_DIR}/.next/static/"

echo "==> bundle staged at ${BUNDLE_DIR}"
find "${BUNDLE_DIR}" -maxdepth 2 -type f | sort

echo "==> packing ${TARBALL}"
tar -czf "${TARBALL}" -C "${REPO_ROOT}" .deploy
echo "bundle size: $(du -h "${TARBALL}" | cut -f1)"

if [[ "${UPLOAD}" != "true" ]]; then
  echo "==> done (no upload; rerun with --upload to ship it)"
  exit 0
fi

SSH_KEY="${MOODAY_SSH_KEY:-$HOME/.ssh/mooday_namecheap_ed25519}"
SSH_HOST="${MOODAY_SSH_HOST:-danesoyk@app.daneg.ae}"
SSH_PORT="${MOODAY_SSH_PORT:-21098}"
REMOTE_DIR="${MOODAY_REMOTE_DIR:-/home/danesoyk/mooday}"

echo "==> uploading to ${SSH_HOST}:${REMOTE_DIR}"
ssh -i "${SSH_KEY}" -p "${SSH_PORT}" "${SSH_HOST}" \
  "mkdir -p '${REMOTE_DIR}/tmp'"

scp -i "${SSH_KEY}" -P "${SSH_PORT}" "${TARBALL}" "${SSH_HOST}:${REMOTE_DIR}/mooday-deploy.tar.gz"

ssh -i "${SSH_KEY}" -p "${SSH_PORT}" "${SSH_HOST}" \
  "set -e; cd '${REMOTE_DIR}' && \
    tar -xzf mooday-deploy.tar.gz --strip-components=1 && \
    touch tmp/restart.txt && \
    rm -f mooday-deploy.tar.gz"

echo "==> done. Touch tmp/restart.txt on the server to restart Passenger."
