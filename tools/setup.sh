#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci --no-audit --no-fund
node --input-type=module -e "const { launchBrowser } = await import('./tools/browser.mjs'); const browser = await launchBrowser(); console.log('Chromium de QA:', browser.version()); await browser.close();"
