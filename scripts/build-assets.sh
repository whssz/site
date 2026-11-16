#!/usr/bin/env bash
# Monta a pasta assets/ final a partir de media-raw/.
# Roda no runner do GitHub Actions (rede livre, ffmpeg + imagemagick).
set -u
cd "$(dirname "$0")/.."

echo "::group::dependências"
python3 -m pip install -q playwright 2>/dev/null || true
python3 -m playwright install --with-deps chromium >/dev/null 2>&1 || \
  python3 -m playwright install chromium >/dev/null 2>&1 || echo "sem playwright"
which ffmpeg || (sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg)
sudo apt-get install -y -qq imagemagick webp >/dev/null 2>&1 || true
echo "::endgroup::"

echo "::group::fotos do Google Maps"
python3 scripts/maps-photos.py || echo "maps: sem fotos"
echo "::endgroup::"

mkdir -p assets/prod assets/amb assets/reel assets/font

echo "::group::marca"
cp media-raw/brand/logo-principal-fundo-branco.png assets/brand-logo-white.png
cp media-raw/brand/submarca-fundo-marrom.png       assets/brand-submarca-brown.png
cp media-raw/brand/perfil-beacons.png              assets/brand-avatar.png
# versão com fundo transparente para uso sobre o marrom do rodapé
convert assets/brand-logo-white.png -alpha set -fuzz 5% -transparent white \
        -trim +repage -bordercolor none -border 8 assets/brand-logo-transparent.png 2>/dev/null || \
  cp assets/brand-logo-white.png assets/brand-logo-transparent.png
convert assets/brand-logo-transparent.png -resize x120 assets/brand-logo-120.png
convert assets/brand-avatar.png -resize 320x320\! -quality 86 assets/brand-avatar.jpg
ls -la assets/*.png assets/*.jpg 2>/dev/null
echo "::endgroup::"

echo "::group::clipes dos reels oficiais"
WEB=media-raw/ig/web
mk() { # $1=code $2=dest $3=largura $4=inicio $5=duracao $6=crf
  local src="$WEB/$1_web.mp4" dest="$2"
  [ -f "$src" ] || { echo "sem fonte $src"; return 1; }
  ffmpeg -v error -y -ss "$4" -t "$5" -i "$src" -an \
    -vf "scale=$3:-2,fps=30" -c:v libx264 -crf "$6" -preset slow \
    -profile:v main -pix_fmt yuv420p -movflags +faststart "$dest"
  echo "$dest  $(stat -c%s "$dest") bytes"
}
# herói: bolo de massa branca, brigadeiro de ninho e Nutella
mk Dfr5lWWu2Li assets/hero.mp4 560 0.5 6 33
# salgados: pãozinho de batata
mk DfvH3QERdpt assets/clip-salgados.mp4 480 0.5 5 34
# cozinha/fornada: quarta do padeiro
mk DfnWTr1umYP assets/clip-fornada.mp4 480 0.5 5 34

poster() { # $1=code $2=dest $3=largura
  ffmpeg -v error -y -ss 1.2 -i "$WEB/$1_web.mp4" -frames:v 1 \
    -vf "scale=$3:-2" -q:v 5 "$2"
  echo "$2  $(stat -c%s "$2") bytes"
}
poster Dfr5lWWu2Li assets/reel/hero-poster.jpg  560
poster DfvH3QERdpt assets/reel/paozinho.jpg     460
poster DfxKvD2O4kk assets/reel/panqueca.jpg     460
poster Dfk0mV0ROCg assets/reel/assado.jpg       460
poster Dfp7nXyuxKM assets/reel/baguete.jpg      460
poster DfiP0Htxt1h assets/reel/banoffee.jpg     460
poster DfsjES6O5Am assets/reel/collab.jpg       460
poster DffWdyoOqdF assets/reel/equipe.jpg       460
poster DZNBQ8XR3cb assets/reel/localizacao.jpg  460
ls -la assets/*.mp4 assets/reel/
echo "::endgroup::"

echo "::group::fotos de produto (cardápio oficial)"
i=0
while IFS= read -r f; do
  b=$(basename "$f" .jpg)
  convert "$f" -auto-orient -strip -resize '400x400^' -gravity center -extent 400x400 \
          -quality 78 "assets/prod/$b.jpg" 2>/dev/null
  i=$((i+1))
done < <(find media-raw/menu -maxdepth 1 -type f -name '*.jpg' | sort)
echo "produtos: $i"
du -sh assets/prod
echo "::endgroup::"

echo "::group::ambiente (Google Maps)"
j=0
while IFS= read -r f; do
  sz=$(stat -c%s "$f")
  [ "$sz" -lt 12000 ] && continue          # descarta miniatura/minúscula
  j=$((j+1))
  convert "$f" -auto-orient -strip -resize '760x560^' -gravity center -extent 760x560 \
          -quality 74 "assets/amb/amb-$(printf '%02d' $j).jpg" 2>/dev/null
done < <(find media-raw/maps -maxdepth 1 -type f -name '*.jpg' | sort)
echo "ambiente: $j"
du -sh assets/amb
echo "::endgroup::"

echo "::group::fontes (OFL, Google Fonts)"
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
CSS_URL='https://fonts.googleapis.com/css2?family=Parisienne&family=Manrope:wght@400;600;800&display=swap'
curl -sS -A "$UA" "$CSS_URL" -o /tmp/gf.css
echo "--- css ---"; head -c 400 /tmp/gf.css; echo
# pega apenas os blocos latin (unicode-range U+0000-00FF...) e baixa o woff2
python3 - <<'PY'
import re, subprocess, os
css = open('/tmp/gf.css', encoding='utf-8').read()
blocks = re.findall(r'/\*\s*([a-z0-9\-\[\]]+)\s*\*/\s*@font-face\s*\{(.*?)\}', css, re.S)
want = {'parisienne': 'parisienne-400'}
names = {}
for label, body in blocks:
    fam = re.search(r"font-family:\s*'([^']+)'", body)
    wt  = re.search(r'font-weight:\s*(\d+)', body)
    url = re.search(r'url\((https://[^)]+\.woff2)\)', body)
    if not (fam and url): continue
    key = fam.group(1).lower().replace(' ', '-') + '-' + (wt.group(1) if wt else '400')
    if label != 'latin': continue
    if key in names: continue
    names[key] = url.group(1)
for key, url in names.items():
    dest = f'assets/font/{key}.woff2'
    subprocess.run(['curl', '-sS', '-A', 'Mozilla/5.0', url, '-o', dest], check=False)
    print(dest, os.path.getsize(dest) if os.path.exists(dest) else 'FALHOU', 'bytes')
PY
ls -la assets/font/
echo "::endgroup::"

echo "::group::resumo"
du -sh assets; find assets -type f | wc -l
find assets -type f -printf '%s\t%p\n' | sort -rn | head -20
echo "::endgroup::"
