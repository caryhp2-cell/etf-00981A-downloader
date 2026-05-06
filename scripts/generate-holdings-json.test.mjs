import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildDataset,
  findHoldingsHeader,
  normalizeWorkbookRows,
  parseFileDate,
  parseHoldingRow,
  parseNumber,
  parseSnapshot,
} from './generate-holdings-json.mjs';

test('parseFileDate extracts valid 00981A filename date', () => {
  assert.equal(parseFileDate('00981A_2026-05-05.xlsx'), '2026-05-05');
  assert.equal(parseFileDate('foo_2026-05-05.xlsx'), null);
});

test('parseNumber handles NTD, commas, percents, and numbers', () => {
  assert.equal(parseNumber('NTD 260,747,573,102'), 260747573102);
  assert.equal(parseNumber('12.34%'), 12.34);
  assert.equal(parseNumber(29.37), 29.37);
  assert.equal(parseNumber(''), null);
});

test('normalizeWorkbookRows unwraps read-excel-file sheet data', () => {
  const rows = [['資料日期：115/05/05']];
  assert.equal(normalizeWorkbookRows([{ sheet: '基金投資組合', data: rows }]), rows);
  assert.equal(normalizeWorkbookRows(rows), rows);
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

const validRows = [
  ['資料日期：115/05/05'],
  [],
  ['基金資產'],
  ['淨資產', 'NTD 260,747,573,102'],
  ['流通在外單位數', '8,878,209,000'],
  ['每單位淨值', 'NTD 29.37'],
  [],
  ['項目', '金額', '權重'],
  ['期貨(名目本金)', 'NTD 0', '0%'],
  ['股票', 'NTD 243,727,535,400', '93.47%'],
  [],
  ['項目', '金額', '權重'],
  ['現金', 'NTD 8,864,127,271', '3.40%'],
  ['期貨保證金', 'NTD 500,128,241', '0.19%'],
  ['申贖應付款', 'NTD -604,269,282', '-0.23%'],
  ['應收付證券款', 'NTD -4,961,221,969', '-1.90%'],
  [],
  [],
  ['股票'],
  ['股票代號', '股票名稱', '股數', '持股權重'],
  ['2330', '台積電', '1,000,000', '12.34%'],
];

test('parseSnapshot accepts a workbook using the filename date', () => {
  const result = parseSnapshot('00981A_2026-05-05.xlsx', validRows);
  assert.equal(result.excluded, null);
  assert.equal(result.snapshot.date, '2026-05-05');
  assert.equal(result.snapshot.holdings[0].stockCode, '2330');
  assert.equal(result.snapshot.fundAssets.navPerUnit, 29.37);
});

test('parseSnapshot uses the filename date only', () => {
  const result = parseSnapshot('00981A_2026-05-02.xlsx', validRows);
  assert.equal(result.excluded, null);
  assert.equal(result.snapshot.date, '2026-05-02');
});

test('parseSnapshot excludes missing fund asset values', () => {
  const rows = validRows.map((row) => [...row]);
  rows[3][1] = null;
  const result = parseSnapshot('00981A_2026-05-05.xlsx', rows);
  assert.equal(result.snapshot, null);
  assert.equal(result.excluded.reason, 'fund asset fields not found');
});

test('parseSnapshot excludes missing allocation and cash sections', () => {
  const missingStockAllocationRows = validRows.map((row) => [...row]);
  missingStockAllocationRows[9][0] = 'å‚µåˆ¸';
  const missingStockAllocation = parseSnapshot('00981A_2026-05-05.xlsx', missingStockAllocationRows);
  assert.equal(missingStockAllocation.snapshot, null);
  assert.equal(missingStockAllocation.excluded.reason, 'stock allocation row not found');

  const missingCashRows = validRows.map((row) => [...row]);
  for (let index = 12; index < 16; index += 1) {
    missingCashRows[index] = [];
  }
  const missingCash = parseSnapshot('00981A_2026-05-05.xlsx', missingCashRows);
  assert.equal(missingCash.snapshot, null);
  assert.equal(missingCash.excluded.reason, 'cash items not found');
});

test('buildDataset excludes unreadable workbook and continues', async () => {
  const downloadsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'holdings-downloads-'));
  try {
    fs.writeFileSync(path.join(downloadsDir, '00981A_2026-05-05.xlsx'), 'not an xlsx file', 'utf8');
    const dataset = await buildDataset(downloadsDir);
    assert.equal(dataset.snapshots.length, 0);
    assert.deepEqual(Object.keys(dataset).sort(), ['generatedAt', 'snapshots', 'sourceRepo']);
  } finally {
    fs.rmSync(downloadsDir, { recursive: true, force: true });
  }
});
