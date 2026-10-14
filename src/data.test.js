import { describe, expect, it } from 'vitest';
import { bucketCount, bucketTimes, buildRows, normalizeSeries, resample, roundValue } from './data.js';

const p = (t, v) => ({ t, s: v === null ? 'unavailable' : String(v), v });

describe('normalizeSeries', () => {
  it('accepts ids and objects and drops the rest', () => {
    expect(normalizeSeries(['sensor.a', { entity: 'sensor.b', color: 'red' }, { name: 'x' }, null, 3])).toEqual([
      { entity: 'sensor.a' },
      { entity: 'sensor.b', color: 'red' },
    ]);
    expect(normalizeSeries(undefined)).toEqual([]);
  });
});

describe('buckets', () => {
  it('uses one bar per hour up to 48', () => {
    expect(bucketCount(24, 'bar')).toBe(24);
    expect(bucketCount(168, 'bar')).toBe(48);
    expect(bucketCount(24, 'line')).toBe(120);
  });

  it('ends the last bucket at the end', () => {
    expect(bucketTimes(0, 100, 4)).toEqual([25, 50, 75, 100]);
  });
});

describe('resample', () => {
  const pts = [p(5, 1), p(10, 3), p(30, null), p(60, 10)];
  const times = [20, 40, 80];

  it('holds the last value', () => {
    expect(resample(pts, times, 'last')).toEqual([3, null, 10]);
  });

  it('averages inside a bucket and holds when it is empty', () => {
    expect(resample([p(5, 1), p(10, 3), p(60, 10)], [20, 40, 80], 'mean')).toEqual([2, 3, 10]);
  });

  it('is null before the first point', () => {
    expect(resample([p(50, 2)], [10, 60], 'last')).toEqual([null, 2]);
  });
});

describe('buildRows', () => {
  it('gives one key per entity', () => {
    const rows = buildRows({ 'sensor.a': [p(1_800_000, 4)], 'sensor.b': [] }, [{ entity: 'sensor.a' }, { entity: 'sensor.b' }], 0, 3_600_000, 'bar');
    expect(rows).toEqual([{ t: 3_600_000, 'sensor.a': 4, 'sensor.b': null }]);
  });
});

it('rounds for display', () => {
  expect(roundValue(1.23456)).toBe(1.23);
  expect(roundValue(null)).toBeNull();
});
