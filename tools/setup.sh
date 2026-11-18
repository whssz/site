#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci
case "$(uname -s)" in
  Linux) echo "Chromium já disponível pelo pacote de QA." ;;
  *) npx playwright install chromium ;;
esac
