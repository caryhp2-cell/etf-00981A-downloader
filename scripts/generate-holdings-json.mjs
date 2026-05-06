import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import readXlsxFile from 'read-excel-file/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

export function parseFileDate(fileName) {
  const match = /^00981A_(\d{4}-\d{2}-\d{2})\.xlsx$/.exec(fileName);
  return match ? match[1] : null;
}

export function parseA1Date(a1Text) {
  if (typeof a1Text !== 'string') return null;
  const match = /(\d{2,3})\/(\d{2})\/(\d{2})/.exec(a1Text);
  if (!match) return null;
  const year = Number(match[1]) + 1911;
  return `${year}-${match[2]}-${match[3]}`;
}

export function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/NTD/g, '').replace(/,/g, '').replace(/%/g, '').trim();
  if (cleaned === '') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function findHoldingsHeader(rows) {
  return rows.findIndex((row) =>
    row[0] === '股票代號' &&
    row[1] === '股票名稱' &&
    row[2] === '股數' &&
    row[3] === '持股權重',
  );
}

export function parseHoldingRow(row) {
  const stockCode = row[0] == null ? '' : String(row[0]).trim();
  const stockName = row[1] == null ? '' : String(row[1]).trim();
  const shares = parseNumber(row[2]);
  const weight = parseNumber(row[3]);
  if (!stockCode || !stockName || shares == null || weight == null) return null;
  return { stockCode, stockName, shares, weight };
}

export async function parseWorkbook(filePath) {
  return readXlsxFile(filePath);
}

export async function buildDataset(downloadsDir = path.join(repoRoot, 'downloads')) {
  return {
    generatedAt: new Date().toISOString(),
    sourceRepo: 'https://github.com/caryhp2-cell/etf-00981A-downloader',
    validFiles: [],
    excludedFiles: [],
    snapshots: [],
  };
}

export function writeDataset(dataset, outputPath = path.join(repoRoot, 'public', 'data', 'holdings.json')) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
}

if (process.argv[1] === __filename) {
  const dataset = await buildDataset();
  writeDataset(dataset);
}
