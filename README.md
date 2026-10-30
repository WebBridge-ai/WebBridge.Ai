# WebBridge.AI

Minimálna jednostránková prezentácia WebBridgeAI s.r.o. Pôvodný plný web je na vetve `Master`.

## Spustenie

Statický web bez build kroku:

```bash
python3 -m http.server 8000
```

## Štruktúra

- `index.html` (angličtina, predvolená), `sk.html` (slovenčina), `css/style.css`, `js/main.js` – web
- `assets/hero/<jazyk>/` – vyrenderované videá a statické obrázky pre hero sekciu
- `assets/flags/` – vlajky prepínača jazyka (flag-icons, MIT)
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
