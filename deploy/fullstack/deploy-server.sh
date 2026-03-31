#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   STACK_ROOT=/var/www/cdc \
#   FRONTEND_REPO=https://github.com/harisulirkom/Tracerv2.git \
#   BACKEND_REPO=https://github.com/harisulirkom/CDC.git \
#   ./deploy/fullstack/deploy-server.sh

STACK_ROOT="${STACK_ROOT:-/var/www/cdc}"
FRONTEND_DIR="${FRONTEND_DIR:-$STACK_ROOT/frontend}"
BACKEND_DIR="${BACKEND_DIR:-$STACK_ROOT/backend}"

FRONTEND_REPO="${FRONTEND_REPO:-https://github.com/harisulirkom/Tracerv2.git}"
BACKEND_REPO="${BACKEND_REPO:-https://github.com/harisulirkom/CDC.git}"

FRONTEND_BRANCH="${FRONTEND_BRANCH:-main}"
BACKEND_BRANCH="${BACKEND_BRANCH:-main}"

COMPOSER_BIN="${COMPOSER_BIN:-composer}"
PHP_BIN="${PHP_BIN:-php}"
NPM_BIN="${NPM_BIN:-npm}"

clone_or_pull() {
  local repo="$1"
  local target="$2"
  local branch="$3"

  if [[ -d "$target/.git" ]]; then
    git -C "$target" fetch origin "$branch"
    git -C "$target" checkout "$branch"
    git -C "$target" pull --ff-only origin "$branch"
  else
    mkdir -p "$(dirname "$target")"
    git clone --branch "$branch" "$repo" "$target"
  fi
}

echo "[1/5] Sync repositories..."
clone_or_pull "$FRONTEND_REPO" "$FRONTEND_DIR" "$FRONTEND_BRANCH"
clone_or_pull "$BACKEND_REPO" "$BACKEND_DIR" "$BACKEND_BRANCH"

if [[ ! -f "$FRONTEND_DIR/.env.production" ]]; then
  echo "ERROR: $FRONTEND_DIR/.env.production belum ada."
  echo "Gunakan template deploy/fullstack/frontend.env.production.example"
  exit 1
fi

if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  echo "ERROR: $BACKEND_DIR/.env belum ada."
  echo "Gunakan template deploy/fullstack/backend.env.production.example"
  exit 1
fi

echo "[2/5] Build frontend..."
pushd "$FRONTEND_DIR" >/dev/null
"$NPM_BIN" ci
"$NPM_BIN" run build
popd >/dev/null

echo "[3/5] Install backend dependencies..."
pushd "$BACKEND_DIR" >/dev/null
"$COMPOSER_BIN" install --no-dev --optimize-autoloader --no-interaction

echo "[4/5] Run Laravel production tasks..."
"$PHP_BIN" artisan migrate --force
"$PHP_BIN" artisan storage:link || true
"$PHP_BIN" artisan config:cache
"$PHP_BIN" artisan route:cache
"$PHP_BIN" artisan view:cache
"$PHP_BIN" artisan queue:restart || true
popd >/dev/null

echo "[5/5] Deployment completed."
echo "Frontend build: $FRONTEND_DIR/dist"
echo "Backend root  : $BACKEND_DIR/public"
echo "Lanjutkan dengan aktivasi Nginx config dan SSL certbot."
