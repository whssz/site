#!/usr/bin/env bash
# Build do site da Pizzeria Santa Chiara para a Vercel (output estático).
set -euo pipefail

rm -rf dist
mkdir -p dist

cp index.html dist/index.html
cp -r assets dist/assets
cp README.md dist/README.md 2>/dev/null || true

echo "build ok: $(du -sh dist | cut -f1)"
