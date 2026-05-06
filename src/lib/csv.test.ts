import { describe, expect, it } from 'vitest';
import { buildHistoricalHoldingsCsv, buildLatestHoldingsCsv, escapeCsvValue } from './csv';
import type { HoldingComparison, Snapshot } from '../types';

it('escapes CSV values with quotes and commas', () => {
  expect(escapeCsvValue('a,b')).toBe('"a,b"');
  expect(escapeCsvValue('a"b')).toBe('"a""b"');
  expect(escapeCsvValue(12.3)).toBe('12.3');
});

it('builds latest holdings CSV', () => {
  const rows: HoldingComparison[] = [
    {
      stockCode: '2330',
      stockName: '台積電',
      shares: 1000,
      weight: 12.34,
      rank: 1,
      previousWeight: 10,
      weightChange: 2.34,
      previousRank: 2,
      rankChange: 1,
    },
  ];
  expect(buildLatestHoldingsCsv(rows)).toContain('rank,stockCode,stockName,shares,weight,previousWeight,weightChange,previousRank,rankChange');
  expect(buildLatestHoldingsCsv(rows)).toContain('1,2330,台積電,1000,12.34,10,2.34,2,1');
});

it('builds historical holdings CSV', () => {
  const snapshots: Snapshot[] = [
    {
      date: '2026-05-05',
      fileName: '00981A_2026-05-05.xlsx',
      a1Text: '資料日期：115/05/05',
      fundAssets: { netAssetValue: null, unitCount: null, navPerUnit: null },
      assetAllocation: [],
      cashItems: [],
      holdings: [{ stockCode: '2330', stockName: '台積電', shares: 1000, weight: 12.34 }],
    },
  ];
  expect(buildHistoricalHoldingsCsv(snapshots)).toContain('2026-05-05,2330,台積電,1000,12.34');
});
