# WebBridge.AI

Minimálna jednostránková prezentácia WebBridgeAI s.r.o. Pôvodný plný web je na vetve `Master`.

## Spustenie

Statický web bez build kroku:

```bash
python3 -m http.server 8000
```

## Nasadenie

Coolify na https://coolify.webbridge.ai zostaví `Dockerfile` z vetvy `minimal-site` (nginx, port 80). Do obrazu ide len web, nie `hero-animation/` ani dokumentácia. Nový priečinok alebo súbor webu treba pridať aj do `Dockerfile`. Po pushnutí treba v Coolify kliknúť Redeploy, samo sa to nenasadí.

`nginx.conf` dáva adresy bez `.html`: `/sk` servíruje `sk.html` a staré `/sk.html` presmeruje na `/sk`. Neexistujúce adresy dostanú `404.html` alebo `404-sk.html` podľa jazyka. Jednoduchý lokálny server (PhpStorm, `python3 -m http.server`) toto nevie, takže odkaz na slovenčinu tam vráti 404. Celý web ako na serveri spustíš cez Docker:

```bash
docker build -t webbridge . && docker run --rm -p 8080:80 webbridge
```

## Štruktúra

- `index.html` (angličtina, predvolená), `sk.html` (slovenčina, na webe `/sk`), `css/style.css`, `js/main.js` – web
- `404.html`, `404-sk.html` – stránky pre neexistujúce adresy. Slovenskú dostanú adresy `/sk/…` a prehliadače nastavené na slovenčinu alebo češtinu, ostatní anglickú. Všetky cesty v nich začínajú `/`, lebo sa zobrazujú na ľubovoľnej adrese.
- `Dockerfile`, `nginx.conf` – nasadenie
- `assets/hero/<jazyk>/` – vyrenderované videá a statické obrázky pre hero sekciu
- `assets/flags/` – vlajky prepínača jazyka (flag-icons, MIT)
- `assets/og/`, `assets/icons/` – náhľady pre sociálne siete a ikony (`npm run render:social`)
- `robots.txt`, `sitemap.xml` – pre vyhľadávače; pri zmene obsahu aktualizuj `lastmod`
- `assets/fonts/` – Bricolage Grotesque (SIL OFL), hostovaný lokálne
- `hero-animation/` – zdroj animácie v Remotion, na beh webu nie je potrebný

## Úprava animácie

```bash
cd hero-animation
npm install
npm run dev          # náhľad v Remotion Studiu
npm run render:site  # nové videá a obrázky do ../assets/hero/<jazyk>
```

Scéna je v `hero-animation/src/WebAiScene.tsx`. Prvé 2 sekundy sa skladá, potom sa v bezšvej slučke striedajú tri ukážky po 12 sekúnd. Texty pre oba jazyky sú v objekte `COPY`. Každá musí začínať aj končiť rovnakým prázdnym stavom.

Remotion je pre firmy do 3 zamestnancov zadarmo, pri väčšej firme treba [firemnú licenciu](https://www.remotion.pro/license).
