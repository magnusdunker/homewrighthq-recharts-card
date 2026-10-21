// Recharts-diagram: et dashboardkort til HomewrightHQ.
//
// Bygges som et klassisk script (IIFE). React kommer fra HomewrightHQ via
// window.thehome, så det ikke er med i filen; se vite.config.js.

import { useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buildRows, normalizeSeries, roundValue } from './data.js';

const TYPE = 'custom:recharts-chart';
const thehome = window.thehome;

if (!thehome || thehome.apiVersion !== 1) {
  console.error('Recharts-diagram: HomewrightHQ mangler eller har en anden plugin-version');
} else {
  register();
}

/** CSS variables do not work in SVG attributes, so read their value. */
function css(value, fallback) {
  if (typeof value !== 'string' || !value.startsWith('var(')) return value ?? fallback;
  const name = value.slice(4, -1).trim();
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function timeFormat(hours, lang) {
  const opts = hours <= 36 ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' };
  const f = new Intl.DateTimeFormat(lang, opts);
  return (t) => f.format(new Date(t));
}

function RechartsCard({ config }) {
  const { useHistory, useEntityList, CardShell, friendlyName, openMoreInfo, colors, language } = thehome;
  const series = useMemo(() => normalizeSeries(config.entities), [config.entities]);
  const ids = useMemo(() => series.map((s) => s.entity), [series]);
  const hours = Number(config.hours_to_show) > 0 ? Number(config.hours_to_show) : 24;
  const chartType = ['line', 'area', 'bar'].includes(config.chart_type) ? config.chart_type : 'line';
  const { data, loading, error } = useHistory(ids, hours);
  const states = useEntityList(ids);

  const end = Date.now();
  const start = end - hours * 3_600_000;
  // new rows when the history changes, not on every render
  const rows = useMemo(() => buildRows(data, series, start, end, chartType), [data, series, chartType, hours]); // eslint-disable-line react-hooks/exhaustive-deps

  if (ids.length === 0) {
    return (
      <CardShell title={config.title}>
        <p style={{ color: css('var(--muted)'), fontSize: 14 }}>Vælg en eller flere entities i kortets indstillinger.</p>
      </CardShell>
    );
  }

  const unit = (i) => states[i]?.attributes?.unit_of_measurement ?? '';
  const nameOf = (s, i) => s.name ?? friendlyName(states[i], s.entity);
  const colorOf = (s, i) => css(s.color ?? colors[i % colors.length], '#4f8cff');
  const fmt = timeFormat(hours, language());
  const muted = css('var(--muted)', '#888');
  const grid = css('var(--border)', '#ddd');
  const height = Number(config.height) >= 120 ? Number(config.height) : 220;
  const stacked = !!config.stacked;
  const curve = ['monotone', 'linear', 'step'].includes(config.curve) ? config.curve : 'monotone';
  const units = [...new Set(ids.map((_, i) => unit(i)).filter(Boolean))];

  const common = { data: rows, margin: { top: 14, right: 12, bottom: 0, left: 0 } };
  const axes = [
    config.show_grid !== false ? <CartesianGrid key="grid" stroke={grid} strokeDasharray="3 3" vertical={false} /> : null,
    <XAxis key="x" dataKey="t" type="number" domain={[start, end]} scale="time" tickFormatter={fmt} stroke={muted} fontSize={12} tickLine={false} minTickGap={24} />,
    <YAxis
      key="y"
      stroke={muted}
      fontSize={12}
      tickLine={false}
      axisLine={false}
      width={48}
      domain={[config.y_min ?? 'auto', config.y_max ?? 'auto']}
      tickFormatter={(v) => String(roundValue(v))}
      allowDataOverflow={config.y_min !== undefined || config.y_max !== undefined}
    />,
    <Tooltip
      key="tip"
      labelFormatter={(t) => new Date(t).toLocaleString(language(), { dateStyle: 'short', timeStyle: 'short' })}
      formatter={(v, key) => {
        const i = ids.indexOf(key);
        return [`${roundValue(v) ?? '-'} ${unit(i)}`.trim(), nameOf(series[i], i)];
      }}
      contentStyle={{ background: css('var(--surface)', '#fff'), border: `1px solid ${grid}`, borderRadius: 12, color: css('var(--fg)', '#000') }}
    />,
    config.show_legend !== false && ids.length > 1 ? (
      <Legend
        key="legend"
        formatter={(key) => {
          const i = ids.indexOf(key);
          return nameOf(series[i], i);
        }}
        onClick={(e) => e?.dataKey && openMoreInfo(String(e.dataKey))}
        wrapperStyle={{ fontSize: 12, cursor: 'pointer' }}
      />
    ) : null,
  ];

  const drawn = series.map((s, i) => {
    const color = colorOf(s, i);
    const props = { key: s.entity, dataKey: s.entity, name: s.entity, isAnimationActive: false, connectNulls: false };
    if (chartType === 'bar') return <Bar {...props} fill={color} radius={[4, 4, 0, 0]} stackId={stacked ? 'a' : undefined} />;
    if (chartType === 'area') {
      return <Area {...props} type={curve === 'step' ? 'stepAfter' : curve} stroke={color} fill={color} fillOpacity={0.18} strokeWidth={2} dot={false} stackId={stacked ? 'a' : undefined} />;
    }
    return <Line {...props} type={curve === 'step' ? 'stepAfter' : curve} stroke={color} strokeWidth={2} dot={false} />;
  });

  const Chart = chartType === 'bar' ? BarChart : chartType === 'area' ? AreaChart : LineChart;
  return (
    <CardShell
      title={config.title}
      actions={units.length ? <span style={{ color: muted, fontSize: 12 }}>{units.join(' · ')}</span> : null}
    >
      {error ? <p style={{ color: css('var(--danger)', 'red'), fontSize: 14 }}>Kunne ikke hente historik.</p> : null}
      <div style={{ height, opacity: loading ? 0.5 : 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Chart {...common}>
            {axes}
            {drawn}
          </Chart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}

function schema() {
  return {
    type: 'object',
    properties: {
      title: { type: 'string', title: 'Titel' },
      entities: { type: 'array', title: 'Entities', items: { type: 'string' }, 'x-selector': { entity: { multiple: true } } },
      chart_type: {
        type: 'string',
        title: 'Diagramtype',
        default: 'line',
        oneOf: [
          { const: 'line', title: 'Linje' },
          { const: 'area', title: 'Område' },
          { const: 'bar', title: 'Søjler (gennemsnit pr. time)' },
        ],
      },
      hours_to_show: { type: 'number', title: 'Timer', minimum: 1, maximum: 720, default: 24 },
      curve: {
        type: 'string',
        title: 'Kurve',
        default: 'monotone',
        oneOf: [
          { const: 'monotone', title: 'Blød' },
          { const: 'linear', title: 'Lige linjer' },
          { const: 'step', title: 'Trin' },
        ],
      },
      stacked: { type: 'boolean', title: 'Stablet (område og søjler)', default: false },
      show_legend: { type: 'boolean', title: 'Vis signaturforklaring', default: true },
      show_grid: { type: 'boolean', title: 'Vis gitter', default: true },
      y_min: { type: 'number', title: 'Y-akse min' },
      y_max: { type: 'number', title: 'Y-akse max' },
      height: { type: 'integer', title: 'Højde (px)', minimum: 120, maximum: 800, default: 220 },
    },
  };
}

function register() {
  thehome.registerCard({
    type: TYPE,
    name: 'Recharts-diagram',
    description: 'Linje-, område- og søjlediagram over historik',
    // mdi chart-areaspline
    icon: 'M17.45,15.18L22,7.31V19L22,21H2V3H4V15.54L9.5,6L16,9.78L20.24,2.45L21.97,3.45L16.74,12.5L10.23,8.75L4.31,19H6.57L10.96,11.44L17.45,15.18Z',
    component: RechartsCard,
    schema,
    size: () => 2,
    defaultConfig: (entities) => ({
      type: TYPE,
      title: '',
      chart_type: 'line',
      hours_to_show: 24,
      entities: entities.filter((e) => e.startsWith('sensor.')).slice(0, 2),
    }),
  });
}
