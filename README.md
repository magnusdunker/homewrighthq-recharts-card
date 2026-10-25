# Recharts chart for HomewrightHQ

A dashboard card for [HomewrightHQ](https://github.com/magnusdunker/homewrighthq) that draws history as a line, area or bar chart with [Recharts](https://recharts.org). It is also an example of how to make your own cards.

## Installation

In HomewrightHQ: **Settings → Integrations → From GitHub**. Paste

```
https://github.com/magnusdunker/homewrighthq-recharts-card
```

and press **Install**. The card is called **Recharts-diagram** (Recharts chart) under **Add card** in the dashboard's edit mode.

It is a pure card plugin: it adds no integration and runs no program on the server.

## Settings

```yaml
type: custom:recharts-chart
title: Stue
entities:
  - sensor.stue_temperatur
  - entity: sensor.stue_luftfugtighed
    name: Fugt
    color: "#3b82f6"
chart_type: line        # line, area or bar
hours_to_show: 24
curve: monotone         # monotone, linear or step
stacked: false          # area and bars
show_legend: true
show_grid: true
y_min: 0
y_max: 100
height: 220
```

- Bars show the hourly average, at most 48 bars.
- Lines and areas hold the latest value, as a sensor does, so steps show as steps with `curve: step`.
- The unit is in the card's top corner. Press a name in the legend to open the entity.
- All fields can be set in the card's visual editor, except name and color per entity, which are set in YAML.

## How it works

HomewrightHQ fetches `recharts-card.js` from the release and loads it in the web interface. The file is a classic script that does not contain React. It gets React and the rest from `window.thehome`, which HomewrightHQ provides, and adds the card with `thehome.registerCard`. The API is described in HomewrightHQ's `docs/custom-integrations.md` under "Custom cards".

- `src/index.jsx`: the card and its editor schema
- `src/data.js`: conversion of history to rows for Recharts, with tests in `src/data.test.js`
- `vite.config.js`: builds a single IIFE file, where `react`, `react-dom` and `react/jsx-runtime` point to `thehome.React`, `thehome.ReactDOM` and `thehome.jsxRuntime`
- `.github/workflows/release.yml`: builds the file and puts it on the release together with `thehome.json`

## Development

```
npm install
npm test
npm run build
```

A new version is released with a tag, e.g. `git tag v0.2.0 && git push origin v0.2.0`, or by publishing a release with a `v` tag on github.com.

## License

MIT
