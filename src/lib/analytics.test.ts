import { expect, it } from 'vitest';
import {
  buildDailyChanges,
  calculateTopTenConcentration,
  compareLatestHoldings,
  getAddedRemoved,
  getLatestSnapshot,
  getPreviousSnapshot,
  sortSnapshots,
} from './analytics';
import type { Snapshot } from '../types';

const snapshots: Snapshot[] = [
  {
    date: '2026-05-05',
    fileName: '00981A_2026-05-05.xlsx',
    a1Text: '資料日期：115/05/05',
    fundAssets: { netAssetValue: 2, unitCount: 2, navPerUnit: 2 },
    assetAllocation: [],
    cashItems: [],
    holdings: [
      { stockCode: '2330', stockName: '台積電', shares: 100, weight: 10 },
      { stockCode: '2317', stockName: '鴻海', shares: 50, weight: 4 },
      { stockCode: '2454', stockName: '聯發科', shares: 20, weight: 3 },
    ],
  },
  {
    date: '2026-05-04',
    fileName: '00981A_2026-05-04.xlsx',
    a1Text: '資料日期：115/05/04',
    fundAssets: { netAssetValue: 1, unitCount: 1, navPerUnit: 1 },
    assetAllocation: [],
    cashItems: [],
    holdings: [
      { stockCode: '2330', stockName: '台積電', shares: 90, weight: 8 },
      { stockCode: '2308', stockName: '台達電', shares: 40, weight: 5 },
    ],
  },
];

it('sortSnapshots orders by date ascending', () => {
  expect(sortSnapshots(snapshots).map((snapshot) => snapshot.date)).toEqual(['2026-05-04', '2026-05-05']);
});

it('gets latest and previous snapshots', () => {
  expect(getLatestSnapshot(snapshots)?.date).toBe('2026-05-05');
  expect(getPreviousSnapshot(snapshots)?.date).toBe('2026-05-04');
});

it('calculates top ten concentration', () => {
  expect(calculateTopTenConcentration(snapshots[0])).toBe(17);
});

it('compares latest holdings to previous snapshot', () => {
  const rows = compareLatestHoldings(snapshots[0], snapshots[1]);
  expect(rows.find((row) => row.stockCode === '2330')?.weightChange).toBe(2);
  expect(rows.find((row) => row.stockCode === '2317')?.previousWeight).toBeNull();
});

it('includes rank movement when comparing holdings', () => {
  const rows = compareLatestHoldings(snapshots[0], snapshots[1]);
  const tsmc = rows.find((row) => row.stockCode === '2330');

  expect(tsmc?.rank).toBe(1);
  expect(tsmc?.previousRank).toBe(1);
  expect(tsmc?.rankChange).toBe(0);
});

it('detects added and removed stocks', () => {
  const changes = getAddedRemoved(snapshots[0], snapshots[1]);
  expect(changes.added.map((holding) => holding.stockCode)).toEqual(['2317', '2454']);
  expect(changes.removed.map((holding) => holding.stockCode)).toEqual(['2308']);
});

it('buildDailyChanges keeps added stocks separate from increased movers', () => {
  const [changes] = buildDailyChanges(snapshots);

  expect(changes.added.map((holding) => holding.stockCode)).toEqual(['2317', '2454']);
  expect(changes.increased.map((holding) => holding.stockCode)).toEqual(['2330']);
});

it('buildDailyChanges includes existing positive and negative weight changes as movers', () => {
  const [changes] = buildDailyChanges([
    {
      ...snapshots[1],
      holdings: [
        { stockCode: '2330', stockName: '台積電', shares: 90, weight: 8 },
        { stockCode: '2308', stockName: '台達電', shares: 40, weight: 5 },
      ],
    },
    {
      ...snapshots[0],
      holdings: [
        { stockCode: '2330', stockName: '台積電', shares: 100, weight: 10 },
        { stockCode: '2308', stockName: '台達電', shares: 35, weight: 3 },
        { stockCode: '2317', stockName: '鴻海', shares: 50, weight: 4 },
      ],
    },
  ]);

  expect(changes.increased.map((holding) => holding.stockCode)).toEqual(['2330']);
  expect(changes.decreased.map((holding) => holding.stockCode)).toEqual(['2308']);
});
