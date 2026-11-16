"""Bicho Pão — monta o index.html único (CSS/JS inline, mídia em base64)."""
import base64, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # /home/user/site
A = os.path.join(ROOT, 'public', 'assets')

def b64(p, mime):
    return f"data:{mime};base64," + base64.b64encode(open(p, 'rb').read()).decode()

html = open(os.path.join(ROOT, 'bicho-pao', 'template.html'), encoding='utf-8').read()

TOK = {
    '{{LOGO_LIGHT}}': ('logo-light.png', 'image/png'),
    '{{IMG_1}}': ('image-1.webp', 'image/webp'),
    '{{IMG_2}}': ('image-2.webp', 'image/webp'),
    '{{IMG_3}}': ('image-3.webp', 'image/webp'),
    '{{IMG_4}}': ('image-4.webp', 'image/webp'),
    '{{IMG_5}}': ('image-5.webp', 'image/webp'),
    '{{IMG_6}}': ('image-6.webp', 'image/webp'),
    '{{IMG_7}}': ('image-7.webp', 'image/webp'),
    '{{IMG_8}}': ('image-8.webp', 'image/webp'),
    '{{IMG_PAO}}': ('pao-dourado.webp', 'image/webp'),
    '{{STORY_05}}': ('20.00.05.webp', 'image/webp'),
    '{{STORY_07}}': ('20.00.07.webp', 'image/webp'),
    '{{STORY_08}}': ('20.00.08.webp', 'image/webp'),
    '{{F_DANCING_400}}': ('dancing-script-latin-400-normal.woff2', 'font/woff2'),
    '{{F_DANCING_700}}': ('dancing-script-latin-700-normal.woff2', 'font/woff2'),
}
for k, (f, mime) in TOK.items():
    html = html.replace(k, b64(os.path.join(A, f), mime))

left = re.findall(r'\{\{[A-Z0-9_]+\}\}', html)
assert not left, f"tokens não substituídos: {left}"

out = os.path.join(ROOT, 'public', 'index.html')
open(out, 'w', encoding='utf-8').write(html)
print('index.html', round(os.path.getsize(out) / 1024 / 1024, 2), 'MB')
