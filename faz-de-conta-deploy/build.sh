#!/bin/sh
# The repository is shared with other clients. Never build their branch here.
set -eu

if [ "${VERCEL_PROJECT_ID:-}" != "prj_dIzw8KxetIlZbV8R6hs7M6O91LDV" ] || \
   [ "${VERCEL_GIT_COMMIT_REF:-}" != "arena/39713bc9-site" ]; then
  echo 'Build blocked: this project only accepts the Faz de Conta branch.' >&2
  exit 1
fi

# Fail closed if this branch no longer contains the expected standalone site.
if ! grep -Fq '<title>Faz de Conta Doces | Coma bolo. Gostoso demais!</title>' ../index.html; then
  echo 'Build blocked: expected Faz de Conta HTML was not found.' >&2
  exit 1
fi

mkdir -p public
cp ../index.html public/index.html
