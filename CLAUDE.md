# CLAUDE.md

Vägledning för Claude Code (och andra AI-verktyg) i detta repo.

## Vad repot är

Fristående pedagogiska simuleringar på svenska för grundskole-/gymnasieelever,
publicerade via GitHub Pages. Varje simulering är en egen HTML-sida i repots rot.

## Namnkonvention för sidor (krav)

```
Ämne-Område-Namn.html        (i repots rot)
```

Exempel: `Fysik-Astronomi-Raketbyggaren.html`

- Startsidan `index.html` genereras automatiskt av
  `.github/workflows/generate-index.yml` utifrån detta mönster vid push till `main`.
- Bindestreck är avgränsare: **Ämne** och **Område** får inte innehålla bindestreck
  (Namn-delen får det).
- Redigera aldrig `index.html` eller `om-mig.html` manuellt – de skrivs över av workflowet.
- Mappar i roten ignoreras av indexgeneratorn, så resursmappar stör inte indexet.

## Filstruktur: en fil eller mappar?

**Standard:** hela simuleringen (HTML + CSS + JS) i EN fil i roten.
Det gör sidorna lätta att kopiera, dela och köra lokalt.

**Större sidor** (riktmärke: mer än ~800 rader totalt, eller flera tydligt
åtskilda moduler som spelmotor/rendering/UI) delas i stället upp så här:

```
Ämne-Område-Namn.html            ← tunt HTML-skal i roten (laddar css/js)
css/<slug>.css                   ← all CSS för sidan
js/<slug>/<modul>.js             ← en fil per modul
```

där `<slug>` = HTML-filnamnet i gemener, utan `.html`, med å/ä → `a`, ö → `o`
och mellanslag → `-`. Exempel:

```
Fysik-Astronomi-Raketbyggaren.html
css/fysik-astronomi-raketbyggaren.css
js/fysik-astronomi-raketbyggaren/delar.js     (speldata)
js/fysik-astronomi-raketbyggaren/fysik.js     (beräkningar)
js/fysik-astronomi-raketbyggaren/bygg.js      (byggscen)
js/fysik-astronomi-raketbyggaren/flyg.js      (flygscen)
js/fysik-astronomi-raketbyggaren/rita.js      (canvasritning)
js/fysik-astronomi-raketbyggaren/main.js      (init, sparning, spelloop)
```

Modulnamnen är svenska och beskriver innehållet. `main.js` laddas sist och
äger init/spelloop.

## Tekniska regler

- **Inga byggsteg, inga ES-moduler.** Använd vanliga `<script src>`-taggar och ett
  globalt namnutrymme per sida (t.ex. `window.RB`). Sidorna ska fungera både via
  GitHub Pages och öppnade direkt från disk (`file://`).
- **Inga externa beroenden/CDN** (inga ramverk, fonter eller bibliotek utifrån).
  Sidorna ska fungera utan internet när de laddats ner.
- **Svenska överallt** i UI, med minimalt med text – hellre ikoner, siffror och
  visualisering än brödtext.
- **Mobil-/touchstöd**: knappar för allt som har tangentbordskommandon,
  `pointerdown`/`pointerup` för håll-knappar, responsiv layout.
- **localStorage** för elevens progression (en nyckel per simulering, svenskt namn).
- Canvas-rendering med `devicePixelRatio`-skalning för skarp grafik.
- Fysik/matematik ska vara pedagogiskt ärlig: riktiga formler (gärna synliga i UI),
  men gärna nedskalade världar så att förlopp tar sekunder–minuter, inte timmar.
