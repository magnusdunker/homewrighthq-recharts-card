// Turns HomewrightHQ history into rows Recharts can draw: one row per point in
// time, one key per entity. Pure functions, so they can be tested without
// HomewrightHQ or a browser.

/**
 * @typedef {{ t: number, s: string, v: number | null }} Point
 * @typedef {{ entity: string, name?: string, color?: string }} Series
 */

/** `entities` may hold ids or `{ entity, name, color }` objects. */
export function normalizeSeries(entities) {
  if (!Array.isArray(entities)) return [];
  return entities
    .map((e) => (typeof e === 'string' ? { entity: e } : e && typeof e.entity === 'string' ? { ...e } : null))
    .filter((e) => e && e.entity);
}

/** How many points to draw. Bars get about one per hour, at most 48. */
export function bucketCount(hours, chartType) {
  if (chartType === 'bar') return Math.max(1, Math.min(48, Math.round(hours)));
  return 120;
}

/** End times of `count` equal buckets between `start` and `end`. */
export function bucketTimes(start, end, count) {
  const step = (end - start) / count;
  return Array.from({ length: count }, (_, i) => start + step * (i + 1));
}

/**
 * Values at each bucket end. `last` holds the newest value at that time
 * (sensors are step functions); `mean` averages the values inside the
 * bucket and falls back to the held value when there are none.
 * @param {Point[]} points sorted by time
 */
export function resample(points, times, mode = 'last') {
  const out = [];
  let i = 0;
  let held = null;
  let prevEnd = -Infinity;
  for (const end of times) {
    let sum = 0;
    let n = 0;
    while (i < points.length && points[i].t <= end) {
      const p = points[i];
      if (p.v !== null && Number.isFinite(p.v)) {
        held = p.v;
        if (p.t > prevEnd) {
          sum += p.v;
          n += 1;
        }
      } else {
        held = null;
      }
      i += 1;
    }
    out.push(mode === 'mean' && n > 0 ? sum / n : held);
    prevEnd = end;
  }
  return out;
}

/**
 * Rows for Recharts: `[{ t, [entity]: value }]`.
 * @param {Record<string, Point[]>} history
 * @param {Series[]} series
 */
export function buildRows(history, series, start, end, chartType) {
  const times = bucketTimes(start, end, bucketCount((end - start) / 3_600_000, chartType));
  const mode = chartType === 'bar' ? 'mean' : 'last';
  const columns = series.map((s) => {
    const pts = [...(history[s.entity] ?? [])].sort((a, b) => a.t - b.t);
    return resample(pts, times, mode);
  });
  return times.map((t, i) => {
    const row = { t };
    series.forEach((s, j) => {
      row[s.entity] = columns[j][i];
    });
    return row;
  });
}

/** Rounds for display without trailing zeros. */
export function roundValue(v, decimals = 2) {
  if (v === null || v === undefined || !Number.isFinite(v)) return null;
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}
