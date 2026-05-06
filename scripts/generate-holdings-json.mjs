import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import readXlsxFile from 'read-excel-file/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const ZIP_FILE_NAME = '00981A-downloads.zip';

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { dosDate, dosTime };
}

function writeZipEntryHeader(signature, fields) {
  const {
    version = 20,
    flags = 0x0800,
    compression = 0,
    dosTime,
    dosDate,
    checksum,
    compressedSize,
    uncompressedSize,
    fileName,
    offset = 0,
  } = fields;
  const fileNameBuffer = Buffer.from(fileName, 'utf8');
  const isCentralDirectory = signature === 0x02014b50;
  const header = Buffer.alloc(isCentralDirectory ? 46 : 30);
  let cursor = 0;

  header.writeUInt32LE(signature, cursor);
  cursor += 4;
  if (isCentralDirectory) {
    header.writeUInt16LE(version, cursor);
    cursor += 2;
  }
  header.writeUInt16LE(version, cursor);
  cursor += 2;
  header.writeUInt16LE(flags, cursor);
  cursor += 2;
  header.writeUInt16LE(compression, cursor);
  cursor += 2;
  header.writeUInt16LE(dosTime, cursor);
  cursor += 2;
  header.writeUInt16LE(dosDate, cursor);
  cursor += 2;
  header.writeUInt32LE(checksum, cursor);
  cursor += 4;
  header.writeUInt32LE(compressedSize, cursor);
  cursor += 4;
  header.writeUInt32LE(uncompressedSize, cursor);
  cursor += 4;
  header.writeUInt16LE(fileNameBuffer.length, cursor);
  cursor += 2;
  header.writeUInt16LE(0, cursor);
  cursor += 2;

  if (isCentralDirectory) {
    header.writeUInt16LE(0, cursor);
    cursor += 2;
    header.writeUInt16LE(0, cursor);
    cursor += 2;
    header.writeUInt16LE(0, cursor);
    cursor += 2;
    header.writeUInt32LE(0, cursor);
    cursor += 4;
    header.writeUInt32LE(offset, cursor);
  }

  return Buffer.concat([header, fileNameBuffer]);
}

export function parseFileDate(fileName) {
  const match = /^00981A_(\d{4}-\d{2}-\d{2})\.xlsx$/.exec(fileName);
  return match ? match[1] : null;
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

function excludedSnapshot(fileName, fileDate, reason) {
  return {
    excluded: { fileName, fileDate, reason },
    snapshot: null,
  };
}

export function parseSnapshot(fileName, rows) {
  const fileDate = parseFileDate(fileName);

  if (!fileDate) {
    return excludedSnapshot(fileName, null, 'filename does not match 00981A_YYYY-MM-DD.xlsx');
  }

  const { holdings, error } = parseHoldings(rows);
  if (error) {
    return excludedSnapshot(fileName, fileDate, error);
  }

  const fundAssets = parseFundAssets(rows);
  if (
    fundAssets.netAssetValue == null ||
    fundAssets.unitCount == null ||
    fundAssets.navPerUnit == null
  ) {
    return excludedSnapshot(fileName, fileDate, 'fund asset fields not found');
  }

  const assetAllocation = parseThreeColumnSection(rows, 8, 10);
  if (!assetAllocation.some((item) => item.label === '股票')) {
    return excludedSnapshot(fileName, fileDate, 'stock allocation row not found');
  }

  const cashItems = parseThreeColumnSection(rows, 12, 16);
  if (cashItems.length === 0) {
    return excludedSnapshot(fileName, fileDate, 'cash items not found');
  }

  if (holdings.length === 0) {
    return excludedSnapshot(fileName, fileDate, 'holdings rows not found');
  }

  const snapshot = {
    date: fileDate,
    fileName,
    fundAssets,
    assetAllocation,
    cashItems,
    holdings,
  };

  return { excluded: null, snapshot };
}

export async function buildDataset(downloadsDir = path.join(repoRoot, 'downloads')) {
  const dataset = {
    generatedAt: new Date().toISOString(),
    sourceRepo: 'https://github.com/caryhp2-cell/etf-00981A-downloader',
    snapshots: [],
  };

  const fileNames = fs.existsSync(downloadsDir)
    ? fs.readdirSync(downloadsDir).filter((name) => name.toLowerCase().endsWith('.xlsx')).sort()
    : [];

  for (const fileName of fileNames) {
    const filePath = path.join(downloadsDir, fileName);
    try {
      const rows = await parseWorkbook(filePath);
      const result = parseSnapshot(fileName, rows);
      if (result.snapshot) dataset.snapshots.push(result.snapshot);
      if (result.excluded) {
        console.warn(`Skipping ${fileName}: ${result.excluded.reason}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Skipping ${fileName}: failed to read workbook: ${message}`);
    }
  }

  dataset.snapshots.sort((a, b) => a.date.localeCompare(b.date));

  return dataset;
}

export function writeDataset(dataset, outputPath = path.join(repoRoot, 'public', 'data', 'holdings.json')) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
}

export function writeDownloadsZip(
  downloadsDir = path.join(repoRoot, 'downloads'),
  outputPath = path.join(repoRoot, 'public', 'downloads', ZIP_FILE_NAME),
) {
  const fileNames = fs.existsSync(downloadsDir)
    ? fs.readdirSync(downloadsDir).filter((name) => name.toLowerCase().endsWith('.xlsx')).sort()
    : [];

  const chunks = [];
  const centralDirectory = [];
  let offset = 0;

  for (const fileName of fileNames) {
    const filePath = path.join(downloadsDir, fileName);
    const data = fs.readFileSync(filePath);
    const { dosDate, dosTime } = dosDateTime(fs.statSync(filePath).mtime);
    const entry = {
      fileName,
      dosDate,
      dosTime,
      checksum: crc32(data),
      compressedSize: data.length,
      uncompressedSize: data.length,
      offset,
    };
    const localHeader = writeZipEntryHeader(0x04034b50, entry);
    chunks.push(localHeader, data);
    centralDirectory.push(writeZipEntryHeader(0x02014b50, entry));
    offset += localHeader.length + data.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectoryBuffer = Buffer.concat(centralDirectory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(fileNames.length, 8);
  end.writeUInt16LE(fileNames.length, 10);
  end.writeUInt32LE(centralDirectoryBuffer.length, 12);
  end.writeUInt32LE(centralDirectoryOffset, 16);
  end.writeUInt16LE(0, 20);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.concat([...chunks, centralDirectoryBuffer, end]));
  return { outputPath, fileCount: fileNames.length };
}

if (process.argv[1] === __filename) {
  const dataset = await buildDataset();
  writeDataset(dataset);
  const zip = writeDownloadsZip();
  console.log(`Wrote ${zip.fileCount} Excel files to ${path.relative(repoRoot, zip.outputPath)}`);
}
