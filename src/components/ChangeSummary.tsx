import { formatPercent, formatSignedPercent } from '../lib/format';
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
