#!/usr/bin/env python3
"""
Coleta as fotos públicas da ficha do Google Maps da Quatro em 1 com um navegador
real (o HTML cru não expõe as URLs). Roda no runner do GitHub Actions.
Não tenta burlar login: usa apenas a ficha pública, como qualquer visitante.
"""
import os, re, time, json, urllib.request, sys

OUT = "media-raw/maps"
os.makedirs(OUT, exist_ok=True)

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

# sementes já vistas na ficha pública (uma foto grande + a miniatura da capa)
SEEDS = [
    "https://lh3.googleusercontent.com/grass-cs/AABkmLd6qxn1G7qPRxJVoQLiu74EWyqK2kBGYqEr1PAnsNxi3ZQsdEsAzcTLS9RmTP9ROrCptI1yq2oPHwOBvYuFyMny_UsqpJHolUqVP25y1Hm_ND5E_glcBYwQdbMZMwUgpwwORS_HvLDaoXUS",
    "https://lh3.googleusercontent.com/grass-cs/AABkmLfpZlXt5tXA_GR675ECz193261fqB2KOl669mIyb-TlQmsJb-K5x3_rUKA5nuyMOrE2_KN4A86XvHLouMcj2amDxy9ucSZ8fJ1nav2wmLMFcOwA0t9OvDuzr_Rc7Cjve_EQl-T9",
]

PLACE = ("https://www.google.com/maps/place/Quatro+em+1/"
         "@-22.9076336,-43.5754456,17z/"
         "data=!3m1!4b1!4m6!3m5!1s0x9be534751efb47:0x7c74f524fa4bd01f!"
         "8m2!3d-22.9076336!4d-43.5754456!16s%2Fg%2F11rjw65v1z?hl=pt-BR")

PAT = re.compile(r"https://lh[3-6]\.googleusercontent\.com/(?:p|grass-cs|gps-cs-s|places|gps-proxy)/[A-Za-z0-9_\-]{20,}")

found = set(SEEDS)
html_dump = ""

try:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--disable-blink-features=AutomationControlled",
                                    "--no-sandbox", "--disable-dev-shm-usage"])
        ctx = b.new_context(locale="pt-BR", user_agent=UA,
                            viewport={"width": 1440, "height": 950},
                            timezone_id="America/Sao_Paulo")
        ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
        pg = ctx.new_page()

        # 1) ficha normal
        for url in [PLACE, PLACE.replace("!3m1!4b1!", "!3m1!1e3!")]:
            try:
                pg.goto(url, wait_until="domcontentloaded", timeout=90000)
                pg.wait_for_timeout(6000)
            except Exception as e:
                print("goto:", str(e)[:120])

        # 2) abrir a aba/galeria de fotos, se houver botão
        for sel in [
            "button[aria-label*='oto' i]",
            "button[jsaction*='pane.heroHeader']",
            "div[aria-label*='Fotos']",
            "button:has-text('Fotos')",
        ]:
            try:
                el = pg.query_selector(sel)
                if el:
                    el.click()
                    pg.wait_for_timeout(3500)
                    print("clicou:", sel)
                    break
            except Exception:
                pass

        # 3) rolar a coluna de fotos
        for _ in range(45):
            pg.mouse.wheel(0, 3000)
            pg.wait_for_timeout(320)
        try:
            html_dump = pg.content()
        except Exception as e:
            print("content:", str(e)[:120])
        b.close()
except Exception as e:
    print("playwright indisponível/falhou:", str(e)[:200])

for m in PAT.finditer(html_dump):
    found.add(m.group(0))

print("URLs de foto encontradas:", len(found))

HDR = {"user-agent": UA, "accept-language": "pt-BR,pt;q=0.9"}
ok, n = [], 0
for u in list(found)[:60]:
    n += 1
    dest = f"{OUT}/maps-{n:02d}.jpg"
    for suffix in ["=w1600-h1600-k-no", "=s1600", "=w1200-h1200-k-no"]:
        try:
            req = urllib.request.Request(u + suffix, headers=HDR)
            with urllib.request.urlopen(req, timeout=45) as r:
                data = r.read()
            if len(data) < 6000:
                continue
            open(dest, "wb").write(data)
            ok.append({"file": os.path.basename(dest), "url": u, "bytes": len(data)})
            print("OK ", dest, len(data))
            break
        except Exception as e:
            print("fail", suffix, str(e)[:80])

open(f"{OUT}/_manifest.json", "w", encoding="utf-8").write(
    json.dumps({"total": len(found), "baixadas": ok}, ensure_ascii=False, indent=2))
print("baixadas:", len(ok))
