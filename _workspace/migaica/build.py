import base64, os, re
A='assets/'
def b64(p):
    ext=p.rsplit('.',1)[1].lower()
    mime={'jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png','webp':'image/webp','mp4':'video/mp4'}[ext]
    return f"data:{mime};base64,"+base64.b64encode(open(p,'rb').read()).decode()
html=open('template.html',encoding='utf-8').read()
TOK = {
 '{{LOGO_INK}}':'logo-ink.png','{{LOGO_WHITE}}':'logo-white.png',
 '{{IMG_BRIG}}':'brigadeiros.webp','{{IMG_MORANGO}}':'morango.webp','{{IMG_POTE}}':'pote.webp',
 '{{IMG_FATIA}}':'fatia.webp','{{IMG_CAIXA}}':'caixa.webp','{{IMG_COPO}}':'copo.webp',
 '{{IMG_BASTIDOR}}':'bastidor.webp','{{IMG_AMBIENTE}}':'ambiente.webp','{{IMG_POTE2}}':'pote2.webp',
 '{{POSTER_MORANGO}}':'poster-morango.jpg','{{POSTER_PRODUCAO}}':'poster-producao.jpg',
 '{{VID_MORANGO}}':'morango.mp4','{{VID_PRODUCAO}}':'producao.mp4',
}
for k,f in TOK.items():
    html=html.replace(k, b64(A+f))
left=re.findall(r'\{\{[A-Z_]+\}\}', html); assert not left, left
open('index.html','w',encoding='utf-8').write(html)
print('index.html', round(os.path.getsize('index.html')/1024/1024,2),'MB')
