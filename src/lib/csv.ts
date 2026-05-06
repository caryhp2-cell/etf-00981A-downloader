import type { HoldingComparison } from '../types';

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

export function downloadCsv(fileName: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
