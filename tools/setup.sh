#!/usr/bin/env bash
# Linux QA uses the Chromium and shared libraries packaged on the npm registry.
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci --no-audit --no-fund
if [[ "$(uname -s)" != Linux ]]; then npx playwright install chromium; fi
