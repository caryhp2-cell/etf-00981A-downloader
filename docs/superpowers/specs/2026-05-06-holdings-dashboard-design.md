# 00981A Holdings Dashboard Design

## Purpose

Build a React dashboard for analyzing 00981A historical holdings after the project is pushed to GitHub. The dashboard will not read a local Windows path at runtime. Instead, a generator script will parse the repository's `downloads/*.xlsx` files, validate each file's date, and emit a static JSON dataset that the React app can load from `public/data/holdings.json`.

## Context

The current repository is a Python downloader. It stores Excel files in `downloads/` using names like `00981A_2026-05-05.xlsx`. Each workbook's `A1` cell contains the source data date in Taiwan ROC format, for example `資料日期：115/05/05`, which maps to Gregorian date `2026-05-05`.

Some files may be named with the download date rather than the source data date. For example, `00981A_2026-05-02.xlsx` can contain `A1 = 資料日期：115/04/30`; this maps to `2026-04-30`, so it must be excluded from the analytical dataset.

## Selected Approach

Use generated JSON as the deployed app's data source.

The first version will:

- Scan `downloads/*.xlsx`.
- Parse the filename date from `00981A_YYYY-MM-DD.xlsx`.
- Parse the workbook date from `A1`.
- Convert ROC years to Gregorian years by adding 1911.
- Include only files where filename date equals workbook `A1` date.
- Parse valid workbook snapshots into structured holdings data.
- Write `public/data/holdings.json`.
- Render a React dashboard from the generated JSON.

This avoids relying on the GitHub tree page as a data API, avoids browser filesystem access limits, keeps the deployed UI fast, and makes validation results explicit.

## Data Validation

The generator must produce both accepted and rejected file records.

Valid files require all of the following:

- Filename matches `00981A_YYYY-MM-DD.xlsx`.
- `A1` contains a ROC date in the expected pattern.
- Converted `A1` date equals the filename date.
- The workbook contains the holdings header row with `股票代號`, `股票名稱`, `股數`, and `持股權重`.

Rejected files remain visible in the validation report with a specific reason, such as:

- `filename date 2026-05-02 != A1 date 2026-04-30`
- `filename does not match 00981A_YYYY-MM-DD.xlsx`
- `A1 does not contain a parseable ROC date`
- `holdings header row not found`

## JSON Contract

`public/data/holdings.json` will contain:

```json
{
  "generatedAt": "2026-05-06T00:00:00.000Z",
  "sourceRepo": "https://github.com/caryhp2-cell/etf-00981A-downloader",
  "validFiles": [],
  "excludedFiles": [],
  "snapshots": []
}
```

Each valid file record will include:

```json
{
  "fileName": "00981A_2026-05-05.xlsx",
  "fileDate": "2026-05-05",
  "a1Text": "資料日期：115/05/05",
  "a1Date": "2026-05-05"
}
```

Each excluded file record will include:

```json
{
  "fileName": "00981A_2026-05-02.xlsx",
  "fileDate": "2026-05-02",
  "a1Text": "資料日期：115/04/30",
  "a1Date": "2026-04-30",
  "reason": "filename date 2026-05-02 != A1 date 2026-04-30"
}
```

Each snapshot will include:

```json
{
  "date": "2026-05-05",
  "fileName": "00981A_2026-05-05.xlsx",
  "a1Text": "資料日期：115/05/05",
  "fundAssets": {
    "netAssetValue": 260747573102,
    "unitCount": 8878209000,
    "navPerUnit": 29.37
  },
  "assetAllocation": [],
  "cashItems": [],
  "holdings": []
}
```

Each holding will include:

```json
{
  "stockCode": "2330",
  "stockName": "台積電",
  "shares": 1000000,
  "weight": 12.34
}
```

Percent weights are stored as numbers, so `12.34%` becomes `12.34`.

## Dashboard Design

Use an overview-first dashboard layout.

The top bar shows the ETF name, latest valid data date, date-range controls, and CSV export actions.

The KPI area shows:

- Valid file count.
- Excluded file count.
- Latest total stock weight.
- Latest top ten concentration.
- Latest holding count.

The main analytical area shows:

- Weight trend chart.
- Latest top ten holdings chart.
- Concentration trend chart.
- Rank change chart.

The change summary shows:

- Daily added stocks.
- Daily removed stocks.
- Stocks with the largest weight increases.
- Stocks with the largest weight decreases.

The holdings table shows the latest valid snapshot by default. It supports stock code/name search and sorting by weight, shares, weight change, and rank change.

The validation panel shows valid files and excluded files with their reasons. This makes skipped Excel files visible rather than silently disappearing.

## Analysis Rules

Snapshots are ordered by date ascending for time-series calculations.

Top ten concentration is the sum of the ten largest holding weights in a snapshot.

Weight change is the latest holding weight minus the previous valid snapshot's holding weight for the same stock. Missing previous weight counts as `0` for newly added stocks.

Rank is determined by descending weight within a snapshot. Rank change compares latest rank with previous valid snapshot rank. Newly added stocks have no previous rank.

Added stocks are present in a snapshot but absent from the previous valid snapshot.

Removed stocks are absent from a snapshot but present in the previous valid snapshot.

## CSV Exports

The dashboard will support three exports:

- Latest holdings CSV.
- Historical holdings CSV with one row per date and stock.
- Validation report CSV.

CSV content is generated in the browser from `holdings.json`.

## Technology

Use:

- React.
- Vite.
- TypeScript.
- `read-excel-file` for the Node generator.
- `recharts` for charts.
- `lucide-react` for icons.
- Static JSON served from `public/data/holdings.json`.

## Testing Strategy

The implementation should include focused tests for:

- ROC date conversion.
- Filename date parsing.
- `A1` date parsing.
- Date mismatch exclusion.
- Holdings table row parsing.
- Added and removed stock calculations.
- Weight change calculations.
- Rank change calculations.
- CSV formatting.

The final implementation should also run a production build and a browser smoke check of the dashboard.

## Out Of Scope For First Version

The first version will not call the GitHub API directly from the browser.

The first version will not provide authentication, server-side persistence, user-uploaded files, or automatic live refresh from GitHub.

The first version will not modify the existing downloader logic unless the generated-data workflow reveals a blocker that requires a narrow change.
