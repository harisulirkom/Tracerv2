#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="${OUT_DIR:-$ROOT_DIR/results/$(date +%Y%m%d-%H%M%S)}"

mkdir -p "$OUT_DIR"

if [[ -f "$ROOT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
fi

run_case() {
  local name="$1"
  local script="$2"
  echo "==> Running ${name}"
  k6 run "$script" \
    --summary-export "${OUT_DIR}/${name}-summary.json" \
    --out "json=${OUT_DIR}/${name}-raw.json"
}

run_case "smoke" "$ROOT_DIR/smoke.js"
run_case "baseline" "$ROOT_DIR/baseline.js"
run_case "stress" "$ROOT_DIR/stress.js"
run_case "soak" "$ROOT_DIR/soak.js"

echo "Selesai. Hasil ada di: $OUT_DIR"
