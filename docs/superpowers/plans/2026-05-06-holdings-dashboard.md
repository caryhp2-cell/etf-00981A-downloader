# 00981A Holdings Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React/Vite/TypeScript dashboard that analyzes 00981A holdings from a generated `public/data/holdings.json` file created from validated `downloads/*.xlsx` workbooks.

**Architecture:** A Node generator parses local Excel workbooks during development/build time, validates filename dates against Excel `A1` ROC dates, and emits static JSON. The React app loads that JSON, computes dashboard analytics in pure TypeScript helpers, renders an overview-first dashboard, and exports CSV files client-side.

**Tech Stack:** React, Vite, TypeScript, Vitest, `read-excel-file`, `recharts`, `lucide-react`, static JSON.

---

## File Structure

- Create `package.json`: npm scripts and dependencies for Vite, tests, generator, and build.
- Create `index.html`: Vite app entry document.
- Create `vite.config.ts`: Vite + Vitest configuration.
- Create `tsconfig.json`: TypeScript project config.
- Create `tsconfig.node.json`: TypeScript config for Vite config and Node-side files.
- Create `src/main.tsx`: React root bootstrap.
- Create `src/App.tsx`: Dashboard composition and data fetch orchestration.
- Create `src/styles.css`: Dashboard layout, responsive behavior, and table/chart styling.
- Create `src/types.ts`: Shared JSON, holdings, analytics, and validation types.
- Create `src/lib/format.ts`: Number, percent, date, and parser-safe formatting helpers.
- Create `src/lib/analytics.ts`: Snapshot sorting, latest/previous selection, rankings, changes, concentration, trends, and summary calculations.
- Create `src/lib/csv.ts`: CSV escaping and export row generation.
- Create `src/components/DashboardHeader.tsx`: ETF title, latest date, date range, and export actions.
- Create `src/components/KpiGrid.tsx`: Overview metrics.
- Create `src/components/TrendCharts.tsx`: Recharts visualizations.
- Create `src/components/ChangeSummary.tsx`: Added/removed stocks and largest movers.
- Create `src/components/HoldingsTable.tsx`: Searchable/sortable latest holdings table.
- Create `src/components/ValidationPanel.tsx`: Valid and excluded file report.
- Create `scripts/generate-holdings-json.mjs`: Excel parsing, validation, and JSON generation.
- Create `scripts/generate-holdings-json.test.mjs`: Node test coverage for generator parsing/validation.
- Create `src/lib/analytics.test.ts`: Vitest coverage for analytics helpers.
- Create `src/lib/csv.test.ts`: Vitest coverage for CSV helpers.
- Create `public/data/holdings.json`: Generated data committed for static deployment.
- Modify `.gitignore`: Add local Vite/cache/build outputs if needed.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create npm project files**

Write `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run generate:data && tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "generate:data": "node scripts/generate-holdings-json.mjs"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "lucide-react": "^0.468.0",
    "recharts": "^2.13.3",
    "vite": "^6.0.0",
    "read-excel-file": "^9.0.9",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "jsdom": "^25.0.1",
    "typescript": "~5.7.2",
    "vitest": "^2.1.8"
  }
}
```

Write `index.html`:

```html
<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>00981A Holdings Analyzer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create TypeScript and Vite configs**

Write `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

Write `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Write `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Create minimal React entry**

Write `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Write a temporary `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>00981A Holdings Analyzer</h1>
      <p>Loading generated holdings data...</p>
    </main>
  );
}
```

Write initial `src/styles.css`:

```css
:root {
  color: #1f2937;
  background: #f7f8fb;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  width: min(1440px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 48px;
}
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and dependencies install successfully.

- [ ] **Step 5: Verify scaffold**

Run:

```bash
npm run build
```

Expected: The build fails only because `scripts/generate-holdings-json.mjs` does not exist yet. If it fails for TypeScript or Vite scaffold errors, fix those before continuing.

- [ ] **Step 6: Commit scaffold**

Run:

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src/main.tsx src/App.tsx src/styles.css
git commit -m "feat: scaffold holdings dashboard app"
```

---

### Task 2: Generator Parsing Tests

**Files:**
- Create: `scripts/generate-holdings-json.mjs`
- Create: `scripts/generate-holdings-json.test.mjs`

- [ ] **Step 1: Write generator module skeleton**

Write `scripts/generate-holdings-json.mjs` with exported helpers and a guarded CLI entry:

```js
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
```

- [ ] **Step 2: Write Node test file**

Write `scripts/generate-holdings-json.test.mjs`:

```js
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
```

- [ ] **Step 3: Run tests and verify skeleton helpers**

Run:

```bash
node --test scripts/generate-holdings-json.test.mjs
```

Expected: all tests pass.

- [ ] **Step 4: Commit parser test skeleton**

Run:

```bash
git add scripts/generate-holdings-json.mjs scripts/generate-holdings-json.test.mjs
git commit -m "test: add holdings generator parser coverage"
```

---

### Task 3: Full JSON Generator

**Files:**
- Modify: `scripts/generate-holdings-json.mjs`
- Modify: `scripts/generate-holdings-json.test.mjs`
- Create: `public/data/holdings.json`

- [ ] **Step 1: Add workbook extraction helpers**

Update `scripts/generate-holdings-json.mjs` by adding these functions before `buildDataset`:

```js
export function readCell(rows, rowIndex, colIndex) {
  return rows[rowIndex]?.[colIndex] ?? null;
}

export function parseFundAssets(rows) {
  return {
    netAssetValue: parseNumber(readCell(rows, 2, 1)),
    unitCount: parseNumber(readCell(rows, 3, 1)),
    navPerUnit: parseNumber(readCell(rows, 4, 1)),
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
```

- [ ] **Step 2: Replace buildDataset implementation**

Replace `buildDataset` in `scripts/generate-holdings-json.mjs` with:

```js
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
```

- [ ] **Step 3: Add generator tests for validation**

Append to `scripts/generate-holdings-json.test.mjs`:

```js
import { parseSnapshot } from './generate-holdings-json.mjs';

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

test('parseSnapshot accepts matching filename and A1 dates', () => {
  const result = parseSnapshot('00981A_2026-05-05.xlsx', validRows);
  assert.equal(result.excluded, null);
  assert.equal(result.validFile.fileDate, '2026-05-05');
  assert.equal(result.snapshot.holdings[0].stockCode, '2330');
  assert.equal(result.snapshot.fundAssets.navPerUnit, 29.37);
});

test('parseSnapshot excludes mismatched filename and A1 dates', () => {
  const result = parseSnapshot('00981A_2026-05-02.xlsx', validRows);
  assert.equal(result.snapshot, null);
  assert.equal(result.excluded.reason, 'filename date 2026-05-02 != A1 date 2026-05-05');
});
```

- [ ] **Step 4: Run generator tests**

Run:

```bash
node --test scripts/generate-holdings-json.test.mjs
```

Expected: all tests pass.

- [ ] **Step 5: Generate JSON from current downloads**

Run:

```bash
npm run generate:data
```

Expected: `public/data/holdings.json` is created. It should include `00981A_2026-05-01.xlsx` and `00981A_2026-05-02.xlsx` in `excludedFiles` because their A1 dates are `2026-04-30`.

- [ ] **Step 6: Commit generator**

Run:

```bash
git add scripts/generate-holdings-json.mjs scripts/generate-holdings-json.test.mjs public/data/holdings.json
git commit -m "feat: generate validated holdings dataset"
```

---

### Task 4: Shared Types And Analytics Tests

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/analytics.ts`
- Create: `src/lib/analytics.test.ts`

- [ ] **Step 1: Define shared types**

Write `src/types.ts`:

```ts
export type Holding = {
  stockCode: string;
  stockName: string;
  shares: number;
  weight: number;
};

export type FileValidationRecord = {
  fileName: string;
  fileDate: string | null;
  a1Text: string | null;
  a1Date: string | null;
  reason?: string;
};

export type FundAssets = {
  netAssetValue: number | null;
  unitCount: number | null;
  navPerUnit: number | null;
};

export type WeightedItem = {
  label: string;
  amount: number;
  weight: number;
};

export type Snapshot = {
  date: string;
  fileName: string;
  a1Text: string | null;
  fundAssets: FundAssets;
  assetAllocation: WeightedItem[];
  cashItems: WeightedItem[];
  holdings: Holding[];
};

export type HoldingsDataset = {
  generatedAt: string;
  sourceRepo: string;
  validFiles: FileValidationRecord[];
  excludedFiles: FileValidationRecord[];
  snapshots: Snapshot[];
};

export type HoldingComparison = Holding & {
  rank: number;
  previousWeight: number | null;
  weightChange: number;
  previousRank: number | null;
  rankChange: number | null;
};

export type DailyChange = {
  date: string;
  added: Holding[];
  removed: Holding[];
  increased: HoldingComparison[];
  decreased: HoldingComparison[];
};
```

- [ ] **Step 2: Write analytics tests first**

Write `src/lib/analytics.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
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

it('detects added and removed stocks', () => {
  const changes = getAddedRemoved(snapshots[0], snapshots[1]);
  expect(changes.added.map((holding) => holding.stockCode)).toEqual(['2317', '2454']);
  expect(changes.removed.map((holding) => holding.stockCode)).toEqual(['2308']);
});
```

- [ ] **Step 3: Run analytics tests and confirm failure**

Run:

```bash
npm test -- src/lib/analytics.test.ts
```

Expected: tests fail because `src/lib/analytics.ts` does not exist.

- [ ] **Step 4: Implement analytics helpers**

Write `src/lib/analytics.ts`:

```ts
import type { DailyChange, Holding, HoldingComparison, Snapshot } from '../types';

export function sortSnapshots(snapshots: Snapshot[]): Snapshot[] {
  return [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
}

export function getLatestSnapshot(snapshots: Snapshot[]): Snapshot | null {
  return sortSnapshots(snapshots).at(-1) ?? null;
}

export function getPreviousSnapshot(snapshots: Snapshot[]): Snapshot | null {
  return sortSnapshots(snapshots).at(-2) ?? null;
}

export function calculateTopTenConcentration(snapshot: Snapshot | null): number {
  if (!snapshot) return 0;
  return snapshot.holdings
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10)
    .reduce((total, holding) => total + holding.weight, 0);
}

export function rankHoldings(holdings: Holding[]): Map<string, number> {
  const ranked = [...holdings].sort((a, b) => b.weight - a.weight);
  return new Map(ranked.map((holding, index) => [holding.stockCode, index + 1]));
}

export function compareLatestHoldings(latest: Snapshot | null, previous: Snapshot | null): HoldingComparison[] {
  if (!latest) return [];
  const previousByCode = new Map((previous?.holdings ?? []).map((holding) => [holding.stockCode, holding]));
  const latestRanks = rankHoldings(latest.holdings);
  const previousRanks = rankHoldings(previous?.holdings ?? []);

  return [...latest.holdings]
    .sort((a, b) => b.weight - a.weight)
    .map((holding) => {
      const previousHolding = previousByCode.get(holding.stockCode);
      const previousWeight = previousHolding?.weight ?? null;
      const rank = latestRanks.get(holding.stockCode) ?? 0;
      const previousRank = previousRanks.get(holding.stockCode) ?? null;
      return {
        ...holding,
        rank,
        previousWeight,
        weightChange: holding.weight - (previousWeight ?? 0),
        previousRank,
        rankChange: previousRank == null ? null : previousRank - rank,
      };
    });
}

export function getAddedRemoved(latest: Snapshot | null, previous: Snapshot | null): Pick<DailyChange, 'added' | 'removed'> {
  if (!latest || !previous) return { added: [], removed: [] };
  const latestCodes = new Set(latest.holdings.map((holding) => holding.stockCode));
  const previousCodes = new Set(previous.holdings.map((holding) => holding.stockCode));

  return {
    added: latest.holdings.filter((holding) => !previousCodes.has(holding.stockCode)),
    removed: previous.holdings.filter((holding) => !latestCodes.has(holding.stockCode)),
  };
}

export function buildDailyChanges(snapshots: Snapshot[]): DailyChange[] {
  const ordered = sortSnapshots(snapshots);
  return ordered.slice(1).map((snapshot, index) => {
    const previous = ordered[index];
    const compared = compareLatestHoldings(snapshot, previous);
    const { added, removed } = getAddedRemoved(snapshot, previous);
    return {
      date: snapshot.date,
      added,
      removed,
      increased: compared.filter((row) => row.weightChange > 0).sort((a, b) => b.weightChange - a.weightChange),
      decreased: compared.filter((row) => row.weightChange < 0).sort((a, b) => a.weightChange - b.weightChange),
    };
  });
}
```

- [ ] **Step 5: Run analytics tests and verify pass**

Run:

```bash
npm test -- src/lib/analytics.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit analytics foundation**

Run:

```bash
git add src/types.ts src/lib/analytics.ts src/lib/analytics.test.ts
git commit -m "feat: add holdings analytics helpers"
```

---

### Task 5: Formatting And CSV Helpers

**Files:**
- Create: `src/lib/format.ts`
- Create: `src/lib/csv.ts`
- Create: `src/lib/csv.test.ts`

- [ ] **Step 1: Implement formatting helpers**

Write `src/lib/format.ts`:

```ts
export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '-';
  return new Intl.NumberFormat('zh-TW').format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `${value.toFixed(2)}%`;
}

export function formatSignedPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  return value;
}
```

- [ ] **Step 2: Write CSV tests**

Write `src/lib/csv.test.ts`:

```ts
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
```

- [ ] **Step 3: Run CSV tests and confirm failure**

Run:

```bash
npm test -- src/lib/csv.test.ts
```

Expected: tests fail because `src/lib/csv.ts` does not exist.

- [ ] **Step 4: Implement CSV helpers**

Write `src/lib/csv.ts`:

```ts
import type { FileValidationRecord, HoldingComparison, Snapshot } from '../types';

export function escapeCsvValue(value: string | number | null | undefined): string {
  if (value == null) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  return [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\n');
}

export function buildLatestHoldingsCsv(rows: HoldingComparison[]): string {
  return toCsv(
    ['rank', 'stockCode', 'stockName', 'shares', 'weight', 'previousWeight', 'weightChange', 'previousRank', 'rankChange'],
    rows.map((row) => [
      row.rank,
      row.stockCode,
      row.stockName,
      row.shares,
      row.weight,
      row.previousWeight,
      row.weightChange,
      row.previousRank,
      row.rankChange,
    ]),
  );
}

export function buildHistoricalHoldingsCsv(snapshots: Snapshot[]): string {
  return toCsv(
    ['date', 'stockCode', 'stockName', 'shares', 'weight'],
    snapshots.flatMap((snapshot) =>
      snapshot.holdings.map((holding) => [
        snapshot.date,
        holding.stockCode,
        holding.stockName,
        holding.shares,
        holding.weight,
      ]),
    ),
  );
}

export function buildValidationCsv(validFiles: FileValidationRecord[], excludedFiles: FileValidationRecord[]): string {
  return toCsv(
    ['status', 'fileName', 'fileDate', 'a1Text', 'a1Date', 'reason'],
    [
      ...validFiles.map((file) => ['valid', file.fileName, file.fileDate, file.a1Text, file.a1Date, '']),
      ...excludedFiles.map((file) => ['excluded', file.fileName, file.fileDate, file.a1Text, file.a1Date, file.reason ?? '']),
    ],
  );
}

export function downloadCsv(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 5: Run CSV tests and verify pass**

Run:

```bash
npm test -- src/lib/csv.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit formatting and CSV helpers**

Run:

```bash
git add src/lib/format.ts src/lib/csv.ts src/lib/csv.test.ts
git commit -m "feat: add holdings CSV exports"
```

---

### Task 6: Dashboard Components

**Files:**
- Create: `src/components/DashboardHeader.tsx`
- Create: `src/components/KpiGrid.tsx`
- Create: `src/components/TrendCharts.tsx`
- Create: `src/components/ChangeSummary.tsx`
- Create: `src/components/HoldingsTable.tsx`
- Create: `src/components/ValidationPanel.tsx`

- [ ] **Step 1: Create DashboardHeader**

Write `src/components/DashboardHeader.tsx`:

```tsx
import { Download } from 'lucide-react';

type DashboardHeaderProps = {
  latestDate: string | null;
  generatedAt: string;
  onExportLatest: () => void;
  onExportHistorical: () => void;
  onExportValidation: () => void;
};

export function DashboardHeader({
  latestDate,
  generatedAt,
  onExportLatest,
  onExportHistorical,
  onExportValidation,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="eyebrow">00981A</p>
        <h1>Holdings Analyzer</h1>
        <p>Latest valid data: {latestDate ?? '-'} · Generated: {new Date(generatedAt).toLocaleString('zh-TW')}</p>
      </div>
      <div className="header-actions">
        <button type="button" onClick={onExportLatest} title="Export latest holdings CSV">
          <Download size={16} />
          Latest CSV
        </button>
        <button type="button" onClick={onExportHistorical} title="Export historical holdings CSV">
          <Download size={16} />
          Historical CSV
        </button>
        <button type="button" onClick={onExportValidation} title="Export validation report CSV">
          <Download size={16} />
          Validation CSV
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create KpiGrid**

Write `src/components/KpiGrid.tsx`:

```tsx
import { formatNumber, formatPercent } from '../lib/format';

type KpiGridProps = {
  validFileCount: number;
  excludedFileCount: number;
  stockWeight: number;
  topTenConcentration: number;
  holdingCount: number;
};

export function KpiGrid({
  validFileCount,
  excludedFileCount,
  stockWeight,
  topTenConcentration,
  holdingCount,
}: KpiGridProps) {
  const items = [
    ['Valid files', formatNumber(validFileCount)],
    ['Excluded files', formatNumber(excludedFileCount)],
    ['Latest stock weight', formatPercent(stockWeight)],
    ['Top 10 concentration', formatPercent(topTenConcentration)],
    ['Latest holdings', formatNumber(holdingCount)],
  ];

  return (
    <section className="kpi-grid">
      {items.map(([label, value]) => (
        <div className="kpi-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 3: Create TrendCharts**

Write `src/components/TrendCharts.tsx`:

```tsx
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { calculateTopTenConcentration } from '../lib/analytics';
import type { HoldingComparison, Snapshot } from '../types';

type TrendChartsProps = {
  snapshots: Snapshot[];
  latestRows: HoldingComparison[];
};

export function TrendCharts({ snapshots, latestRows }: TrendChartsProps) {
  const trendData = snapshots.map((snapshot) => ({
    date: snapshot.date,
    holdings: snapshot.holdings.length,
    concentration: calculateTopTenConcentration(snapshot),
    stockWeight: snapshot.assetAllocation.find((item) => item.label === '股票')?.weight ?? 0,
  }));

  const topTen = latestRows.slice(0, 10).map((row) => ({
    name: `${row.stockCode} ${row.stockName}`,
    weight: row.weight,
  }));

  const movers = latestRows
    .filter((row) => row.rankChange != null)
    .slice()
    .sort((a, b) => Math.abs(b.rankChange ?? 0) - Math.abs(a.rankChange ?? 0))
    .slice(0, 10)
    .map((row) => ({
      name: `${row.stockCode} ${row.stockName}`,
      rankChange: row.rankChange ?? 0,
    }));

  return (
    <section className="chart-grid">
      <div className="panel chart-panel">
        <h2>Stock weight and concentration</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="stockWeight" stroke="#2563eb" />
            <Line type="monotone" dataKey="concentration" stroke="#16a34a" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="panel chart-panel">
        <h2>Latest top 10 holdings</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topTen} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={110} />
            <Tooltip />
            <Bar dataKey="weight" fill="#0f766e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="panel chart-panel">
        <h2>Holding count</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="holdings" stroke="#9333ea" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="panel chart-panel">
        <h2>Largest rank changes</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={movers}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rankChange" fill="#ea580c" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create ChangeSummary**

Write `src/components/ChangeSummary.tsx`:

```tsx
import { formatSignedPercent, formatPercent } from '../lib/format';
import type { DailyChange } from '../types';

type ChangeSummaryProps = {
  latestChange: DailyChange | null;
};

export function ChangeSummary({ latestChange }: ChangeSummaryProps) {
  if (!latestChange) {
    return (
      <section className="panel">
        <h2>Latest changes</h2>
        <p>No previous valid snapshot is available for comparison.</p>
      </section>
    );
  }

  return (
    <section className="change-grid">
      <div className="panel">
        <h2>Added stocks</h2>
        <ul className="compact-list">
          {latestChange.added.slice(0, 8).map((holding) => (
            <li key={holding.stockCode}>{holding.stockCode} {holding.stockName} {formatPercent(holding.weight)}</li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h2>Removed stocks</h2>
        <ul className="compact-list">
          {latestChange.removed.slice(0, 8).map((holding) => (
            <li key={holding.stockCode}>{holding.stockCode} {holding.stockName}</li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h2>Largest increases</h2>
        <ul className="compact-list">
          {latestChange.increased.slice(0, 8).map((row) => (
            <li key={row.stockCode}>{row.stockCode} {row.stockName} {formatSignedPercent(row.weightChange)}</li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h2>Largest decreases</h2>
        <ul className="compact-list">
          {latestChange.decreased.slice(0, 8).map((row) => (
            <li key={row.stockCode}>{row.stockCode} {row.stockName} {formatSignedPercent(row.weightChange)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create HoldingsTable**

Write `src/components/HoldingsTable.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { formatNumber, formatPercent, formatSignedPercent } from '../lib/format';
import type { HoldingComparison } from '../types';

type SortKey = 'rank' | 'stockCode' | 'shares' | 'weight' | 'weightChange' | 'rankChange';

type HoldingsTableProps = {
  rows: HoldingComparison[];
};

export function HoldingsTable({ rows }: HoldingsTableProps) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('weight');

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows
      .filter((row) =>
        !normalizedQuery ||
        row.stockCode.toLowerCase().includes(normalizedQuery) ||
        row.stockName.toLowerCase().includes(normalizedQuery),
      )
      .sort((a, b) => {
        if (sortKey === 'stockCode') return a.stockCode.localeCompare(b.stockCode);
        return (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0);
      });
  }, [query, rows, sortKey]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Latest holdings</h2>
        <div className="table-controls">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search code or name" />
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="weight">Weight</option>
            <option value="shares">Shares</option>
            <option value="weightChange">Weight change</option>
            <option value="rankChange">Rank change</option>
            <option value="stockCode">Stock code</option>
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Code</th>
              <th>Name</th>
              <th>Shares</th>
              <th>Weight</th>
              <th>Prev Weight</th>
              <th>Weight Δ</th>
              <th>Rank Δ</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.stockCode}>
                <td>{row.rank}</td>
                <td>{row.stockCode}</td>
                <td>{row.stockName}</td>
                <td>{formatNumber(row.shares)}</td>
                <td>{formatPercent(row.weight)}</td>
                <td>{formatPercent(row.previousWeight)}</td>
                <td>{formatSignedPercent(row.weightChange)}</td>
                <td>{row.rankChange == null ? '-' : row.rankChange}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create ValidationPanel**

Write `src/components/ValidationPanel.tsx`:

```tsx
import type { FileValidationRecord } from '../types';

type ValidationPanelProps = {
  validFiles: FileValidationRecord[];
  excludedFiles: FileValidationRecord[];
};

export function ValidationPanel({ validFiles, excludedFiles }: ValidationPanelProps) {
  return (
    <section className="validation-grid">
      <div className="panel">
        <h2>Valid files</h2>
        <ul className="compact-list">
          {validFiles.map((file) => (
            <li key={file.fileName}>{file.fileName} · A1 {file.a1Date}</li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h2>Excluded files</h2>
        <ul className="compact-list">
          {excludedFiles.map((file) => (
            <li key={file.fileName}>{file.fileName} · {file.reason}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Run TypeScript check**

Run:

```bash
npm run build
```

Expected: build may still fail if `App.tsx` has not yet integrated generated data and helpers, but component TypeScript errors should be fixed now.

- [ ] **Step 8: Commit components**

Run:

```bash
git add src/components
git commit -m "feat: add holdings dashboard components"
```

---

### Task 7: App Integration And Styling

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Integrate data loading and dashboard composition**

Replace `src/App.tsx` with:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { ChangeSummary } from './components/ChangeSummary';
import { DashboardHeader } from './components/DashboardHeader';
import { HoldingsTable } from './components/HoldingsTable';
import { KpiGrid } from './components/KpiGrid';
import { TrendCharts } from './components/TrendCharts';
import { ValidationPanel } from './components/ValidationPanel';
import {
  buildDailyChanges,
  calculateTopTenConcentration,
  compareLatestHoldings,
  getLatestSnapshot,
  getPreviousSnapshot,
  sortSnapshots,
} from './lib/analytics';
import {
  buildHistoricalHoldingsCsv,
  buildLatestHoldingsCsv,
  buildValidationCsv,
  downloadCsv,
} from './lib/csv';
import type { HoldingsDataset } from './types';

export default function App() {
  const [dataset, setDataset] = useState<HoldingsDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/holdings.json')
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load holdings.json: ${response.status}`);
        return response.json() as Promise<HoldingsDataset>;
      })
      .then(setDataset)
      .catch((unknownError) => setError(unknownError instanceof Error ? unknownError.message : 'Unknown data loading error'));
  }, []);

  const viewModel = useMemo(() => {
    if (!dataset) return null;
    const snapshots = sortSnapshots(dataset.snapshots);
    const latest = getLatestSnapshot(snapshots);
    const previous = getPreviousSnapshot(snapshots);
    const latestRows = compareLatestHoldings(latest, previous);
    const dailyChanges = buildDailyChanges(snapshots);
    const latestChange = dailyChanges.at(-1) ?? null;
    const latestStockWeight = latest?.assetAllocation.find((item) => item.label === '股票')?.weight ?? 0;

    return {
      snapshots,
      latest,
      previous,
      latestRows,
      latestChange,
      latestStockWeight,
      topTenConcentration: calculateTopTenConcentration(latest),
    };
  }, [dataset]);

  if (error) {
    return (
      <main className="app-shell">
        <section className="panel error-panel">
          <h1>Unable to load holdings data</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!dataset || !viewModel) {
    return (
      <main className="app-shell">
        <section className="panel">
          <h1>00981A Holdings Analyzer</h1>
          <p>Loading generated holdings data...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <DashboardHeader
        latestDate={viewModel.latest?.date ?? null}
        generatedAt={dataset.generatedAt}
        onExportLatest={() => downloadCsv('00981A-latest-holdings.csv', buildLatestHoldingsCsv(viewModel.latestRows))}
        onExportHistorical={() => downloadCsv('00981A-historical-holdings.csv', buildHistoricalHoldingsCsv(viewModel.snapshots))}
        onExportValidation={() => downloadCsv('00981A-validation-report.csv', buildValidationCsv(dataset.validFiles, dataset.excludedFiles))}
      />
      <KpiGrid
        validFileCount={dataset.validFiles.length}
        excludedFileCount={dataset.excludedFiles.length}
        stockWeight={viewModel.latestStockWeight}
        topTenConcentration={viewModel.topTenConcentration}
        holdingCount={viewModel.latest?.holdings.length ?? 0}
      />
      <TrendCharts snapshots={viewModel.snapshots} latestRows={viewModel.latestRows} />
      <ChangeSummary latestChange={viewModel.latestChange} />
      <HoldingsTable rows={viewModel.latestRows} />
      <ValidationPanel validFiles={dataset.validFiles} excludedFiles={dataset.excludedFiles} />
    </main>
  );
}
```

- [ ] **Step 2: Replace stylesheet with dashboard CSS**

Replace `src/styles.css` with:

```css
:root {
  color: #1f2937;
  background: #f7f8fb;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

button,
input,
select {
  font: inherit;
}

button {
  align-items: center;
  background: #111827;
  border: 0;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: inline-flex;
  gap: 8px;
  min-height: 38px;
  padding: 8px 12px;
}

input,
select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  min-height: 38px;
  padding: 8px 10px;
}

.app-shell {
  display: grid;
  gap: 18px;
  margin: 0 auto;
  padding: 24px 0 48px;
  width: min(1440px, calc(100vw - 32px));
}

.dashboard-header {
  align-items: flex-end;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.dashboard-header h1 {
  font-size: 32px;
  line-height: 1.1;
  margin: 2px 0 8px;
}

.dashboard-header p {
  color: #667085;
  margin: 0;
}

.eyebrow {
  color: #0f766e;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.kpi-grid,
.chart-grid,
.change-grid,
.validation-grid {
  display: grid;
  gap: 14px;
}

.kpi-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.chart-grid,
.change-grid,
.validation-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.kpi-card,
.panel {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.kpi-card {
  display: grid;
  gap: 10px;
  padding: 16px;
}

.kpi-card span,
.panel p {
  color: #667085;
}

.kpi-card strong {
  font-size: 24px;
}

.panel {
  min-width: 0;
  padding: 16px;
}

.panel h2 {
  font-size: 18px;
  margin: 0 0 14px;
}

.panel-header {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.table-controls {
  display: flex;
  gap: 8px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  border-collapse: collapse;
  min-width: 880px;
  width: 100%;
}

th,
td {
  border-bottom: 1px solid #eef0f4;
  padding: 10px 8px;
  text-align: left;
  white-space: nowrap;
}

th {
  color: #667085;
  font-size: 13px;
}

.compact-list {
  display: grid;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.compact-list li {
  border-bottom: 1px solid #eef0f4;
  padding-bottom: 8px;
}

.error-panel {
  border-color: #fecaca;
}

@media (max-width: 960px) {
  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .kpi-grid,
  .chart-grid,
  .change-grid,
  .validation-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Run tests and build**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and Vite production build succeeds.

- [ ] **Step 4: Commit app integration**

Run:

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: integrate holdings dashboard"
```

---

### Task 8: Browser Verification And Polish

**Files:**
- Modify as needed: `src/App.tsx`
- Modify as needed: `src/styles.css`
- Modify as needed: component files under `src/components/`

- [ ] **Step 1: Start dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 2: Open browser smoke check**

Use the in-app browser or Playwright against the Vite URL.

Expected checks:

- Page loads without runtime console errors.
- KPI values render from `public/data/holdings.json`.
- Excluded files include the known mismatched `00981A_2026-05-01.xlsx` and `00981A_2026-05-02.xlsx`.
- Charts are visible and nonblank.
- Latest holdings table has searchable rows.
- CSV buttons trigger downloads or create blob URLs without throwing.
- Mobile-width viewport does not overlap text or controls.

- [ ] **Step 3: Fix visual issues found in smoke check**

If charts overflow, add a stable minimum height to `.chart-panel`.

If long Chinese stock names overflow table cells, allow wrapping on the name column:

```css
td:nth-child(3) {
  white-space: normal;
  min-width: 120px;
}
```

If header buttons overflow on mobile, make them full width:

```css
@media (max-width: 560px) {
  .header-actions,
  .header-actions button {
    width: 100%;
  }
}
```

- [ ] **Step 4: Re-run verification**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and production build succeeds after polish.

- [ ] **Step 5: Commit verification polish**

Run:

```bash
git add src
git commit -m "fix: polish holdings dashboard layout"
```

If no visual fixes were needed, skip this commit.

---

### Task 9: Documentation And GitHub Readiness

**Files:**
- Modify: `README.md`
- Modify if needed: `.github/workflows/download.yml`

- [ ] **Step 1: Update README with dashboard usage**

Add a section to `README.md`:

```markdown
## Holdings Dashboard

The React dashboard analyzes validated holdings from the Excel files in `downloads/`.

Generate the static dataset:

```bash
npm run generate:data
```

Run locally:

```bash
npm run dev
```

Build for deployment:

```bash
npm run build
```

The generator writes `public/data/holdings.json`. Files are included only when the filename date, such as `00981A_2026-05-05.xlsx`, matches the Excel `A1` ROC date converted to Gregorian format. Mismatched files are listed in the dashboard validation panel instead of being used for analysis.
```

- [ ] **Step 2: Decide whether to update GitHub Actions**

Inspect `.github/workflows/download.yml`.

If the workflow currently commits downloaded Excel files only, add `npm install` and `npm run generate:data` before its commit step so `public/data/holdings.json` updates automatically after new downloads.

Use this workflow step shape:

```yaml
- name: Generate holdings dashboard data
  run: |
    npm install
    npm run generate:data
```

If the workflow does not have Node available, add:

```yaml
- name: Set up Node
  uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
```

- [ ] **Step 3: Run final verification**

Run:

```bash
npm test
npm run generate:data
npm run build
git status --short
```

Expected:

- Tests pass.
- Dataset generation succeeds.
- Production build succeeds.
- `git status --short` only shows intentional changes.

- [ ] **Step 4: Commit docs and workflow readiness**

Run:

```bash
git add README.md .github/workflows/download.yml public/data/holdings.json
git commit -m "docs: document holdings dashboard workflow"
```

If `.github/workflows/download.yml` was not changed, omit it from `git add`.

---

## Plan Self-Review

Spec coverage:

- Generated JSON data source is covered by Tasks 2 and 3.
- Filename vs Excel `A1` validation is covered by Tasks 2 and 3.
- Overview-first React dashboard is covered by Tasks 6 and 7.
- Advanced analysis scope is covered by Tasks 4, 5, 6, and 7.
- CSV export is covered by Tasks 5 and 7.
- Testing and build verification are covered throughout and finalized in Tasks 8 and 9.
- GitHub readiness is covered by Task 9.

Placeholder scan:

- No implementation steps contain placeholder-only instructions.
- Each code-writing task includes concrete file content or a concrete patch target.
- Conditional visual polish steps include exact CSS snippets and are scoped to findings from smoke testing.

Type consistency:

- `Holding`, `Snapshot`, `HoldingsDataset`, `FileValidationRecord`, and `HoldingComparison` are defined before component use.
- `analytics.ts`, `csv.ts`, and component props all use the same type names.
- `App.tsx` imports helpers using the names introduced in earlier tasks.
