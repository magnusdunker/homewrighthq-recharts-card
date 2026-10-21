# Recharts-diagram til HomewrightHQ

Et dashboardkort til [HomewrightHQ](https://github.com/magnusdunker/homewrighthq), der tegner historik som linje-, område- eller søjlediagram med [Recharts](https://recharts.org). Det er også et eksempel på, hvordan man laver sine egne kort.

## Installation

I HomewrightHQ: **Indstillinger → Integrationer → Fra GitHub**. Indsæt

```
https://github.com/magnusdunker/homewrighthq-recharts-card
```

og tryk **Installér**. Kortet hedder **Recharts-diagram** under **Tilføj kort** i dashboardets redigeringstilstand.

Det er et rent kort-plugin: det tilføjer ingen integration og kører intet program på serveren.

## Indstillinger

```yaml
type: custom:recharts-chart
title: Stue
entities:
  - sensor.stue_temperatur
  - entity: sensor.stue_luftfugtighed
    name: Fugt
    color: "#3b82f6"
chart_type: line        # line, area eller bar
hours_to_show: 24
curve: monotone         # monotone, linear eller step
stacked: false          # område og søjler
show_legend: true
show_grid: true
y_min: 0
y_max: 100
height: 220
```

- Søjler viser gennemsnittet pr. time, højst 48 søjler.
- Linjer og områder holder den seneste værdi, ligesom en sensor gør, så trin vises som trin med `curve: step`.
- Enheden står i kortets øverste hjørne. Tryk på et navn i signaturforklaringen for at åbne entityen.
- Alle felter kan sættes i kortets visuelle editor, undtagen navn og farve pr. entity, som sættes i YAML.

## Sådan virker det

HomewrightHQ henter `recharts-card.js` fra releasen og indlæser den i webfladen. Filen er et klassisk script, der ikke indeholder React. Det får React og resten fra `window.thehome`, som HomewrightHQ stiller til rådighed, og tilføjer kortet med `thehome.registerCard`. API'et er beskrevet i HomewrightHQ's `docs/custom-integrations.md` under "Custom cards".

- `src/index.jsx`: kortet og dets editor-skema
- `src/data.js`: omregning af historik til rækker for Recharts, med tests i `src/data.test.js`
- `vite.config.js`: bygger én IIFE-fil, hvor `react`, `react-dom` og `react/jsx-runtime` peger på `thehome.React`, `thehome.ReactDOM` og `thehome.jsxRuntime`
- `.github/workflows/release.yml`: bygger filen og lægger den på releasen sammen med `thehome.json`

## Udvikling

```
npm install
npm test
npm run build
```

En ny version udgives med et tag, f.eks. `git tag v0.2.0 && git push origin v0.2.0`, eller ved at udgive en release med et `v`-tag på github.com.

## Licens

MIT
