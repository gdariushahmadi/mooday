#!/usr/bin/env bash
# Build the DANEG Next.js standalone bundle locally and upload it to the VPS.
#
# Usage:
#   bash scripts/build-vps.sh                  # build + stage only
#   bash scripts/build-vps.sh --upload        # build + stage + upload
#
# Required environment for --upload:
#   DANEG_VPS_SSH_KEY     path to the private SSH key (default: ~/.ssh/mooday_vps_ed25519)
#   DANEG_VPS_SSH_HOST    user@host            (default: root@162.0.231.49)
#   DANEG_VPS_SSH_PORT    SSH port             (default: 22)
#   DANEG_VPS_REMOTE_DIR  application root on the server (default: /opt/mooday/app)
#   DANEG_VPS_USER        service user         (default: mooday)
#   DANEG_VPS_SERVICE     systemd service      (default: mooday)
#
# Behaviour:
#   1. Runs `next build` so `.next/standalone/` is populated. Production env vars
#      are loaded from `.env.production` so the bundle talks to the VPS
#      Supabase stack.
#   2. Stages the standalone bundle (server.js, .next/standalone/.next,
#      public/, .next/static) into `.deploy/`.
#   3. Tars the bundle and ships it to the VPS.
#   4. On the VPS, extracts into `REMOTE_DIR` and restarts the DANEG service.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

BUNDLE_DIR="${REPO_ROOT}/.deploy"
TARBALL="${REPO_ROOT}/daneg-vps-deploy.tar.gz"
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

if [[ ! -f .env.production ]]; then
    echo "error: .env.production is missing" >&2
    exit 1
fi

# Pull production env into the build shell so Next.js inlines the public
# values into the client bundle.
set -a
. ./.env.production
set +a
NODE_ENV=production

echo "==> next build (production)"
npx next build

rm -rf "${BUNDLE_DIR}"
mkdir -p "${BUNDLE_DIR}"

# Standalone output keeps `server.js` at the standalone root and the build
# artifacts under `.next/standalone/.next/`. Mirror that layout.
mkdir -p "${BUNDLE_DIR}/.next/standalone"
cp .next/standalone/server.js "${BUNDLE_DIR}/.next/standalone/server.js"
cp .next/standalone/package.json "${BUNDLE_DIR}/.next/standalone/package.json"
# Bundle includes its own node_modules; copy it across.
cp -R .next/standalone/node_modules "${BUNDLE_DIR}/.next/standalone/node_modules"
mkdir -p "${BUNDLE_DIR}/.next/standalone/.next"
cp -R .next/standalone/.next/. "${BUNDLE_DIR}/.next/standalone/.next/"

# Public assets and the standalone server-side build artifacts.
cp -R public/. "${BUNDLE_DIR}/public/"
cp -R .next/standalone/.next/. "${BUNDLE_DIR}/.next/standalone/.next/"
# Next.js standalone also needs public/ inside the standalone dir
# (the server reads from CWD/public at runtime).
mkdir -p "${BUNDLE_DIR}/.next/standalone/public"
cp -R public/. "${BUNDLE_DIR}/.next/standalone/public/"

# Static assets live at two paths so the standalone server finds them
# regardless of where systemd starts the process:
#   - <root>/.next/static          (used when CWD is the standalone dir)
#   - <root>/public                (used when something else proxies static)
mkdir -p "${BUNDLE_DIR}/.next/standalone/.next/static"
mkdir -p "${BUNDLE_DIR}/.next/static"
cp -R .next/static/. "${BUNDLE_DIR}/.next/standalone/.next/static/"
cp -R .next/static/. "${BUNDLE_DIR}/.next/static/"

# Runtime env for the standalone process. Mode 600 — only the deploy user
# should be able to read the service-role key.
cp .env.production "${BUNDLE_DIR}/.env.production"
chmod 600 "${BUNDLE_DIR}/.env.production"

echo "==> bundle staged at ${BUNDLE_DIR}"
find "${BUNDLE_DIR}" -maxdepth 2 -type f | sort

if [[ "${UPLOAD}" != "true" ]]; then
    echo "==> done (no upload; rerun with --upload to ship it via rsync)"
    exit 0
fi

DANEG_VPS_USER="${DANEG_VPS_USER:-mooday}"
DANEG_VPS_SERVICE="${DANEG_VPS_SERVICE:-mooday}"
SSH_KEY="${DANEG_VPS_SSH_KEY:-${HOME}/.ssh/mooday_vps_ed25519}"
SSH_HOST="${DANEG_VPS_SSH_HOST:-root@162.0.231.49}"
SSH_PORT="${DANEG_VPS_SSH_PORT:-22}"
REMOTE_DIR="${DANEG_VPS_REMOTE_DIR:-/opt/mooday/app}"

echo "==> uploading to ${SSH_HOST}:${REMOTE_DIR}"
# Use rsync — scp truncates large tarballs over residential connections.
# --delete removes anything on the server missing from the fresh build, but
# the Next.js image-optimization cache (.next/standalone/.next/cache/) is a
# runtime-only artifact this bundle never contains — exclude it so --delete
# doesn't wipe it and force every visitor to re-pay the sharp-resize cost
# right after each deploy.
rsync -av --delete --exclude='.next/standalone/.next/cache/' -e "ssh -i ${SSH_KEY} -p ${SSH_PORT} -o ServerAliveInterval=15 -o TCPKeepAlive=yes" "${BUNDLE_DIR}/" "${SSH_HOST}:${REMOTE_DIR}/"


ssh -i "${SSH_KEY}" -p "${SSH_PORT}" "${SSH_HOST}" \
  "set -e; cd '${REMOTE_DIR}'; \
   chown -R '${DANEG_VPS_USER}:${DANEG_VPS_USER}' .; \
   chmod 600 .env.production; \
   systemctl restart '${DANEG_VPS_SERVICE}'; \
   sleep 2; \
   echo '==> DANEG service restarted'"

echo "==> done. 'systemctl status ${DANEG_VPS_SERVICE}' on the server to confirm."
