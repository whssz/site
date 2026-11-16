#!/usr/bin/env python3
"""Confere que o HTML publicado é realmente autossuficiente.

Um arquivo único só é válido se toda mídia e toda fonte estiverem embutidas
em data: URIs e se nenhum recurso externo for requisitado.
"""
import re
import sys

path = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
html = open(path, encoding='utf-8', errors='replace').read()

embutidos = re.findall(r'data:(?:image|video|font)/', html)
urls = re.findall(r'(?:src|href)="(https?://[^"]+)"', html)
# links de navegação legítimos ( WhatsApp, Maps, Instagram e âncoras internas )
permitidos = ('wa.me', 'google.com/maps', 'instagram.com', 'maps.app.goo.gl')
externos = [u for u in urls if not any(p in u for p in permitidos)]

print('mídia/fonte embutida em data: URI :', len(embutidos))
print('requisições externas de recurso :', externos if externos else 'nenhuma')
print('tamanho                         : %.2f MB' % (len(html.encode()) / 1048576))

falhas = []
if not embutidos:
    falhas.append('nenhuma mídia embutida')
if externos:
    falhas.append('%d recurso(s) externo(s)' % len(externos))

if falhas:
    print('REPROVADO: ' + '; '.join(falhas))
    sys.exit(1)
print('APROVADO: arquivo único e autossuficiente')
