#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monta o index.html final: HTML único e autossuficiente.
- injeta as fontes (base64) e toda a mídia real (base64)
- gera os cards do cardápio a partir de src/dados.json (fonte: cardápio oficial)
Uso: python3 src/build.py
"""
import base64, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

MIME = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2'}


def b64(path):
    with open(path, 'rb') as f:
        data = f.read()
    ext = os.path.splitext(path)[1].lower()
    return 'data:%s;base64,%s' % (MIME.get(ext, 'application/octet-stream'),
                                  base64.b64encode(data).decode('ascii'))


def brl(v):
    return ('R$ %.2f' % v).replace('.', ',')


dados = json.load(open('src/dados.json', encoding='utf-8'))
emp = dados['empresa']
template = open('src/template.html', encoding='utf-8').read()

# ---------- 1. fontes ----------
fonts = ''
for key, css in (('manrope', ('Manrope', '200 800')),
                 ('parisienne', ('Parisienne', '400'))):
    fam, wght = css
    p = 'assets/font/%s-400.woff2' % key
    if not os.path.exists(p):
        cands = [f for f in os.listdir('assets/font') if f.startswith(key)]
        if not cands:
            sys.exit('fonte ausente: ' + key)
        p = 'assets/font/' + sorted(cands)[0]
    fonts += ("@font-face{font-family:'%s';font-style:normal;font-weight:%s;"
              "font-display:swap;src:url(%s) format('woff2')}\n"
              % (fam, wght, b64(p)))
template = template.replace('/*__FONTS__*/', fonts)

# ---------- 2. mídia avulsa (substitui tokens __M:caminho__) ----------
tokens = set(re.findall(r'__M:([^_]+?)__', template))


def esc(s):
    return (s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
             .replace('"', '&quot;'))


# ---------- 3. cards do cardápio ----------
cards = []
for p in dados['produtos']:
    slug, cat = p['slug'], p['cat']
    preco = brl(p['preco'])
    if p.get('sem_foto'):
        art = ('<div class="p-shot p-shot--txt" aria-hidden="true">'
               '<span class="p-glyph">%s</span></div>') % esc(p['nome'][:1].upper())
        tag = '<span class="p-tag">Bebida</span>'
    else:
        img = 'assets/prod/%s.jpg' % slug
        if not os.path.exists(img):
            sys.exit('foto ausente: ' + img)
        tokens.add(img)
        art = ('<img class="p-shot" src="__M:%s__" alt="%s" width="400" height="400" '
               'loading="lazy" decoding="async">' % (img, esc(p['nome'])))
        tag = ''
    cards.append(
        '<article class="p-card" data-cat="%s" data-slug="%s" '
        'data-nome="%s" data-preco="%.2f">'
        '<div class="p-media">%s%s</div>'
        '<div class="p-body"><h3 class="p-name">%s</h3>'
        '<p class="p-desc">%s</p>'
        '<div class="p-foot"><span class="p-price">%s</span>'
        '<button class="p-add" type="button" data-add="%s">'
        '<span class="p-add-i">+</span>Adicionar</button></div></div></article>'
        % (cat, slug, esc(p['nome']), p['preco'], art, tag,
           esc(p['nome']), esc(p['desc']), preco, slug))
template = template.replace('<!--__CARDS__-->', '\n'.join(cards))

# ---------- 4. galeria de ambiente (fotos reais do Google Maps) ----------
amb = []
for i in range(1, 9):
    f = 'assets/amb/amb-%02d.jpg' % i
    if not os.path.exists(f):
        continue
    tokens.add(f)
    amb.append('<figure class="g-item rev rv-scale g-%d">'
               '<img src="__M:%s__" alt="Quatro em 1 — ambiente e vitrine da loja em Campo Grande" '
               'width="760" height="560" loading="lazy" decoding="async"></figure>'
               % (i, f))
template = template.replace('<!--__AMB__-->', '\n'.join(amb))

# ---------- 5. reels (quadros reais dos vídeos oficiais) ----------
reels = [('paozinho.jpg', 'Pãozinho de batata', 'recheado com frango e catupiry'),
         ('panqueca.jpg', 'Panqueca de frango', 'com requeijão e molho vermelho'),
         ('baguete.jpg', 'Baguete', 'a preferida da casa'),
         ('banoffee.jpg', 'Banoffee', 'Ninho, doce de leite e banana'),
         ('localizacao.jpg', 'Onde estamos', 'em frente ao BRT Pina Rangel')]
rhtml = []
for f, t, s in reels:
    p = 'assets/reel/' + f
    if not os.path.exists(p):
        continue
    tokens.add(p)
    rhtml.append('<figure class="r-item rev rv-scale">'
                 '<img src="__M:%s__" alt="Quadro do vídeo publicado pela Quatro em 1: %s" '
                 'width="460" height="818" loading="lazy" decoding="async">'
                 '<figcaption><b>%s</b><span>%s</span></figcaption></figure>'
                 % (p, esc(t), esc(t), esc(s)))
template = template.replace('<!--__REELS__-->', '\n'.join(rhtml))

# ---------- 6. termos mais citados nas avaliações do Google ----------
terms = []
for t in dados['prova']['resumo_google']:
    terms.append('<li class="t-item"><span class="t-word">%s</span>'
                 '<span class="t-num">%d</span></li>'
                 % (esc(t['termo']), t['mencoes']))
template = template.replace('<!--__TERMS__-->', '\n'.join(terms))

# ---------- 7. depoimentos reais ----------
quotes = []
for d in dados['prova']['depoimentos']:
    quotes.append(
        '<figure class="quote rev rv-scale">'
        '<span class="q-mark" aria-hidden="true">&ldquo;</span>'
        '<div class="q-stars" role="img" aria-label="5 de 5 estrelas">'
        '<i></i><i></i><i></i><i></i><i></i></div>'
        '<blockquote><p>%s</p></blockquote>'
        '<figcaption><span class="q-av" aria-hidden="true">%s</span>'
        '<span class="q-who"><b>%s</b><em>%s · %s</em></span></figcaption></figure>'
        % (esc(d['texto']), esc(d['nome'][:1].upper()), esc(d['nome']),
           esc(d['origem']), esc(d['quando'])))
template = template.replace('<!--__QUOTES__-->', '\n'.join(quotes))

# ---------- 8. dados do cardápio para o JS ----------
template = template.replace('/*__DATA__*/',
                            'const EMPRESA=' + json.dumps(emp, ensure_ascii=False) + ';')

# ---------- 9. resolve todos os tokens __M:...__ ----------
missing = []
for t in sorted(tokens):
    if not os.path.exists(t):
        missing.append(t)
        continue
    template = template.replace('__M:%s__' % t, b64(t))
if missing:
    sys.exit('mídia ausente: ' + ', '.join(missing))

left = re.findall(r'__M:[^_]+?__', template)
if left:
    sys.exit('token não resolvido: ' + ', '.join(left))

open('index.html', 'w', encoding='utf-8').write(template)
size = os.path.getsize('index.html')
print('index.html: %s bytes (%.2f MB)' % (f'{size:,}'.replace(',', '.'), size / 1048576))
print('produtos: %d · ambiente: %d · reels: %d'
      % (len(dados['produtos']), len(amb), len(rhtml)))
