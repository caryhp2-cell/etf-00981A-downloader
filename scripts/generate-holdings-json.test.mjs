import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findHoldingsHeader,
  parseA1Date,
  parseFileDate,
  parseHoldingRow,
  parseNumber,
} from './generate-holdings-json.mjs';

test('parseFileDate extracts valid 00981A filename date', () => {
  assert.equal(parseFileDate('00981A_2026-05-05.xlsx'), '2026-05-05');
  assert.equal(parseFileDate('foo_2026-05-05.xlsx'), null);
});

test('parseA1Date converts ROC date text to Gregorian date', () => {
  assert.equal(parseA1Date('資料日期：115/05/05'), '2026-05-05');
  assert.equal(parseA1Date('資料日期：115/04/30'), '2026-04-30');
  assert.equal(parseA1Date('bad value'), null);
});

test('parseNumber handles NTD, commas, percents, and numbers', () => {
  assert.equal(parseNumber('NTD 260,747,573,102'), 260747573102);
  assert.equal(parseNumber('12.34%'), 12.34);
  assert.equal(parseNumber(29.37), 29.37);
  assert.equal(parseNumber(''), null);
});

test('findHoldingsHeader locates expected holdings columns', () => {
  const rows = [
    ['資料日期：115/05/05'],
    ['股票', null, null],
    ['股票代號', '股票名稱', '股數', '持股權重'],
  ];
  assert.equal(findHoldingsHeader(rows), 2);
});

test('parseHoldingRow returns normalized holding values', () => {
  assert.deepEqual(parseHoldingRow(['2330', '台積電', '1,234,000', '12.34%']), {
    stockCode: '2330',
    stockName: '台積電',
    shares: 1234000,
    weight: 12.34,
  });
});
