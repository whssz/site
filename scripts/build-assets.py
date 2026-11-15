#!/usr/bin/env python3
"""Curadoria e otimização da mídia REAL da Amunì a Caparica.

Entradas: media-raw/ (coletadas pelo GitHub Actions a partir de fontes oficiais)
Saídas:   assets/  (WebP + MP4 leves, prontos para incorporar no HTML único)
          assets/embedded.json (data URIs para o builder do index.html)

Nenhuma imagem é gerada por IA e nenhuma foto de banco é usada.
"""
import base64, json, mimetypes, subprocess, sys
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'media-raw'
OUT = ROOT / 'assets'
OUT.mkdir(exist_ok=True)
sys.path.insert(0, str(ROOT / '.venv/lib/python3.11/site-packages'))
import imageio_ffmpeg
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

manifest = {}

def webp(src, name, width=720, quality=76, crop=None, keep_alpha=False):
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)
    if not keep_alpha:
        im = im.convert('RGB')
    elif im.mode != 'RGBA':
        im = im.convert('RGBA')
    if crop:
        im = im.crop(crop)
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    p = OUT / name
    im.save(p, 'WEBP', quality=quality, method=6)
    manifest[name] = 'data:image/webp;base64,' + base64.b64encode(p.read_bytes()).decode()
    return p

def frame(video, at, name, width=720, quality=76):
    tmp = OUT / ('_' + name + '.jpg')
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-ss', str(at), '-i', str(video),
                    '-frames:v', '1', '-vf', f'scale={width}:-2', str(tmp)], check=False)
    if tmp.exists():
        webp(tmp, name, width, quality)
        tmp.unlink()

def clip(video, start, dur, name, crf=34):
    p = OUT / name
    cmd = [FFMPEG, '-v', 'error', '-y', '-ss', str(start), '-i', str(video), '-t', str(dur),
           '-an', '-vf', 'scale=480:-2,fps=15', '-c:v', 'libx264', '-crf', str(crf),
           '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(p)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if not p.exists() or p.stat().st_size < 10000:
        print('FALHA VÍDEO', name, r.stderr[:300]); return
    manifest[name] = 'data:video/mp4;base64,' + base64.b64encode(p.read_bytes()).decode()
    print(f'{name}: {p.stat().st_size//1024} KB')

# ---------- marca (Linktree oficial) ----------
webp(RAW / 'brand/amuni-logo.png', 'logo.webp', 520, 96, keep_alpha=True)

# ---------- Google Maps (ficha pública) ----------
webp(RAW / 'maps/maps-02.jpg', 'mesa.webp', 1280, 80)

# ---------- cardápio oficial (Uber Eats linkado no Maps) ----------
webp(RAW / 'menu/loja-hero.jpg', 'hero-pizzas.webp', 1280, 82)
MENU = [
    'pizza-margherita', 'pizza-margherita-dop', 'pizza-parmigiana', 'pizza-capricciosa',
    'pizza-salsiccia-friarielli', 'pizza-bufalaccia', 'pizza-spacchiosa', 'pizza-ca-mortazza',
    'pizza-amuni', 'pizza-vegan-spacchiosa', 'pizza-pepperoni', 'pizza-cotto-funghi',
    'pizza-al-funghi', 'pizza-super-diavola-vegan', 'pizza-stracciata', 'pizza-napoli',
]
for n in MENU:
    webp(RAW / f'menu/{n}.jpg', n + '.webp', 560, 74)

# ---------- Instagram oficial: posters dos reels ----------
POSTERS = {
    'pizza-azeite.webp': ('DfcSPFtsJ4U_poster.jpg', 760, 78),
    'pizzaiolo-forno.webp': ('DfM2maPsfKg_poster.jpg', 760, 78),
    'massa-sol.webp': ('DfAaX1cMbQP_poster.jpg', 760, 78),
    'bastidores.webp': ('DeMgLfJMksS_poster.jpg', 760, 78),
    'cannoli.webp': ('DfDHGc8Mbnh_poster.jpg', 760, 78),
    'novidade-fimdesemana.webp': ('De2e8vKMtGQ_poster.jpg', 760, 78),
}
for out, (src, w, q) in POSTERS.items():
    webp(RAW / 'ig/web' / src, out, w, q)

# frames de dois reels de novidades (quadros reais dos vídeos oficiais)
frame(RAW / 'ig/web/DexMsW4MP0s_web.mp4', 4.5, 'novidade-happyhour.webp')
frame(RAW / 'ig/web/De4CQ-zsL7B_web.mp4', 6.2, 'novidade-allyoucaneat.webp')
frame(RAW / 'ig/web/DfM2maPsfKg_web.mp4', 16.5, 'loop-forno-poster.webp', 480, 76)

# ---------- Instagram oficial: vídeos curtos, mudos, em loop ----------
clip(RAW / 'ig/web/DeMgLfJMksS_web.mp4', 6, 6, 'loop-preparo.mp4')
clip(RAW / 'ig/web/DfM2maPsfKg_web.mp4', 16, 4, 'loop-forno.mp4')
clip(RAW / 'ig/web/DfcSPFtsJ4U_web.mp4', 0, 4.5, 'loop-azeite.mp4', 32)

# ---------- fontes locais (OFL) em base64 ----------
FONT_DIR = ROOT / '.fonts/package/files'
for name, key in [('baloo-2-latin-700-normal.woff2', 'font-baloo-700'), ('baloo-2-latin-800-normal.woff2', 'font-baloo-800'),
                  ('dm-sans-latin-400-normal.woff2', 'font-dm-400'), ('dm-sans-latin-500-normal.woff2', 'font-dm-500'),
                  ('dm-sans-latin-700-normal.woff2', 'font-dm-700')]:
    fp = FONT_DIR / name
    manifest[key] = 'data:font/woff2;base64,' + base64.b64encode(fp.read_bytes()).decode()

(OUT / 'embedded.json').write_text(json.dumps(manifest), encoding='utf-8')
total = sum(len(v) for v in manifest.values())
print(f'\n{len(manifest)} mídias · {total/1024/1024:.2f} MB em base64')
print('maiores:', sorted(((len(v)//1024, k) for k, v in manifest.items()), reverse=True)[:8])
