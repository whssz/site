#!/usr/bin/env bash
# Build do site da Pizzeria Santa Chiara para a Vercel (output estático).
#
# O script é location-aware: ele gera a saída em `<diretório do script>/dist`.
# - Na raiz do repositório: gera `dist/` (index.html, assets/, README.md).
# - Dentro de `dist/` (quando a raiz do projeto Vercel é `dist`): gera `dist/dist/`.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$DIR/dist"

if [ ! -f "$DIR/index.html" ]; then
  echo "build erro: index.html não encontrado em $DIR" >&2
  exit 1
fi

mkdir -p "$OUT"
rm -rf "$OUT/assets"
cp "$DIR/index.html" "$OUT/index.html"
cp -r "$DIR/assets" "$OUT/assets"
cp "$DIR/README.md" "$OUT/README.md" 2>/dev/null || true

echo "build ok: $(du -sh "$OUT" | cut -f1)"
