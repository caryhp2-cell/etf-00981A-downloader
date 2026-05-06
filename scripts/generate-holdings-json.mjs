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

export function normalizeWorkbookRows(parsedWorkbook) {
  return Array.isArray(parsedWorkbook?.[0]?.data) ? parsedWorkbook[0].data : parsedWorkbook;
}

export async function parseWorkbook(filePath) {
  return normalizeWorkbookRows(await readXlsxFile(filePath));
}

export function readCell(rows, rowIndex, colIndex) {
  return rows[rowIndex]?.[colIndex] ?? null;
}

export function parseFundAssets(rows) {
  return {
    netAssetValue: parseNumber(readCell(rows, 3, 1)),
    unitCount: parseNumber(readCell(rows, 4, 1)),
    navPerUnit: parseNumber(readCell(rows, 5, 1)),
  };
}

export function parseThreeColumnSection(rows, startIndex, stopIndex) {
  const items = [];
  for (let index = startIndex; index < stopIndex; index += 1) {
    const row = rows[index] ?? [];
    const label = row[0] == null ? '' : String(row[0]).trim();
    const amount = parseNumber(row[1]);
    const weight = parseNumber(row[2]);
    if (label && amount != null && weight != null) {
      items.push({ label, amount, weight });
    }
  }
  return items;
}

export function parseHoldings(rows) {
  const headerIndex = findHoldingsHeader(rows);
  if (headerIndex === -1) {
    return { holdings: [], error: 'holdings header row not found' };
  }

  const holdings = [];
  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const parsed = parseHoldingRow(rows[index] ?? []);
    if (parsed) holdings.push(parsed);
  }

  return { holdings, error: null };
}

export function parseSnapshot(fileName, rows) {
  const a1Text = readCell(rows, 0, 0);
  const fileDate = parseFileDate(fileName);
  const a1Date = parseA1Date(a1Text);

  if (!fileDate) {
    return {
      excluded: { fileName, fileDate: null, a1Text, a1Date, reason: 'filename does not match 00981A_YYYY-MM-DD.xlsx' },
      snapshot: null,
      validFile: null,
    };
  }

  if (!a1Date) {
    return {
      excluded: { fileName, fileDate, a1Text, a1Date: null, reason: 'A1 does not contain a parseable ROC date' },
      snapshot: null,
      validFile: null,
    };
  }

  if (fileDate !== a1Date) {
    return {
      excluded: { fileName, fileDate, a1Text, a1Date, reason: `filename date ${fileDate} != A1 date ${a1Date}` },
      snapshot: null,
      validFile: null,
    };
  }

  const { holdings, error } = parseHoldings(rows);
  if (error) {
    return {
      excluded: { fileName, fileDate, a1Text, a1Date, reason: error },
      snapshot: null,
      validFile: null,
    };
  }

  const validFile = { fileName, fileDate, a1Text, a1Date };
  const snapshot = {
    date: fileDate,
    fileName,
    a1Text,
    fundAssets: parseFundAssets(rows),
    assetAllocation: parseThreeColumnSection(rows, 8, 10),
    cashItems: parseThreeColumnSection(rows, 12, 16),
    holdings,
  };

  return { excluded: null, snapshot, validFile };
}

export async function buildDataset(downloadsDir = path.join(repoRoot, 'downloads')) {
  const dataset = {
    generatedAt: new Date().toISOString(),
    sourceRepo: 'https://github.com/caryhp2-cell/etf-00981A-downloader',
    validFiles: [],
    excludedFiles: [],
    snapshots: [],
  };

  const fileNames = fs.existsSync(downloadsDir)
    ? fs.readdirSync(downloadsDir).filter((name) => name.toLowerCase().endsWith('.xlsx')).sort()
    : [];

  for (const fileName of fileNames) {
    const filePath = path.join(downloadsDir, fileName);
    const rows = await parseWorkbook(filePath);
    const result = parseSnapshot(fileName, rows);
    if (result.excluded) dataset.excludedFiles.push(result.excluded);
    if (result.validFile) dataset.validFiles.push(result.validFile);
    if (result.snapshot) dataset.snapshots.push(result.snapshot);
  }

  dataset.snapshots.sort((a, b) => a.date.localeCompare(b.date));
  dataset.validFiles.sort((a, b) => a.fileDate.localeCompare(b.fileDate));
  dataset.excludedFiles.sort((a, b) => a.fileName.localeCompare(b.fileName));

  return dataset;
}

export function writeDataset(dataset, outputPath = path.join(repoRoot, 'public', 'data', 'holdings.json')) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
}

if (process.argv[1] === __filename) {
  const dataset = await buildDataset();
  writeDataset(dataset);
}
