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
