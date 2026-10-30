# WebBridge.AI

Minimálna jednostránková prezentácia WebBridge.AI s.r.o. Pôvodný plný web je na vetve `Master`.

## Spustenie

Statický web bez build kroku:

```bash
python3 -m http.server 8000
```

## Štruktúra

- `index.html`, `css/style.css`, `js/main.js` – web
- `assets/hero/` – vyrenderované videá a statické obrázky pre hero sekciu
- `assets/fonts/` – Bricolage Grotesque (SIL OFL), hostovaný lokálne
- `hero-animation/` – zdroj animácie v Remotion, na beh webu nie je potrebný

## Úprava animácie

```bash
cd hero-animation
npm install
npm run dev          # náhľad v Remotion Studiu
npm run render:site  # nové videá a obrázky do ../assets/hero
```

Scéna je v `hero-animation/src/BridgeScene.tsx`. Prvé 4 sekundy most vzniká, ďalších 12 sekúnd je bezšvá slučka. Všetko, čo sa v slučke hýbe, musí mať celý počet cyklov za slučku.

Remotion je pre firmy do 3 zamestnancov zadarmo, pri väčšej firme treba [firemnú licenciu](https://www.remotion.pro/license).
