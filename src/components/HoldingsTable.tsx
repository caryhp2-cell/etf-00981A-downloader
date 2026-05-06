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
