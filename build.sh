#!/usr/bin/env bash
# Build do site da Pizzeria Santa Chiara para a Vercel (output estático).
#
# O script é location-aware: gera a saída em `<diretório do script>/dist`.
# - Na raiz do repositório: gera `dist/` com o site completo e a raiz
#   auto-contida (o próprio `build.sh` e o próprio `vercel.json`), para que a
#   pasta possa ser a `rootDirectory` do projeto Vercel.
# - Dentro de `dist/` (quando a raiz do projeto Vercel é `dist`): gera
#   `dist/dist/`, que é o `outputDirectory` relativo a essa raiz.
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

# Raiz auto-contida: com `rootDirectory: dist`, a Vercel executa o build a
# partir de `dist/` e precisa de encontrar o `build.sh` e o `vercel.json`
# dentro dela. Sem estes dois ficheiros o build falha com
# NOW_SANDBOX_WORKER_ROOTDIR_NOT_EXIST / "build.sh not found".
cp "$DIR/build.sh" "$OUT/build.sh"
cp "$DIR/vercel.json" "$OUT/vercel.json"

echo "build ok: $(du -sh "$OUT" | cut -f1)"
