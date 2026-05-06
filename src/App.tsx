import { useEffect, useMemo, useState } from 'react';
import { ChangeSummary } from './components/ChangeSummary';
import { DashboardHeader } from './components/DashboardHeader';
import { HoldingsTable } from './components/HoldingsTable';
import {
  buildDailyChanges,
  compareLatestHoldings,
  getLatestSnapshot,
  getPreviousSnapshot,
  sortSnapshots,
} from './lib/analytics';
import type { HoldingsDataset } from './types';

export default function App() {
  const [dataset, setDataset] = useState<HoldingsDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/holdings.json`)
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

    return {
      snapshots,
      latest,
      previous,
      latestRows,
      latestChange,
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
        downloadsZipHref={`${import.meta.env.BASE_URL}downloads/00981A-downloads.zip`}
      />
      <ChangeSummary latestChange={viewModel.latestChange} />
      <HoldingsTable rows={viewModel.latestRows} />
    </main>
  );
}
