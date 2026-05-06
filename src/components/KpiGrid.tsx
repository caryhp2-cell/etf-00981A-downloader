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
