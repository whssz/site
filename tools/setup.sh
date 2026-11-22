#!/usr/bin/env bash
# Instala o navegador do QA. Necessário uma vez por sessão:
# node_modules não é persistido entre sessões.
set -e
cd "$(dirname "$0")/.."
echo "→ instalando playwright"
npm i --no-audit --no-fund playwright@1.49.1
echo "→ baixando chromium"
npx playwright install chromium
echo "→ dependências de sistema (pode pedir sudo)"
sudo -n npx playwright install-deps chromium 2>/dev/null || \
  sudo -n apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libatspi2.0-0 \
    libxdamage1 libxkbcommon0 libasound2 libxcomposite1 libxfixes3 libxrandr2 libgbm1 libcups2 \
    libpango-1.0-0 libcairo2 2>/dev/null || \
  echo "⚠ sem sudo: o QA seguirá em modo estático"
echo "✓ pronto — teste com: node tools/qa.mjs base/skeleton.html"
