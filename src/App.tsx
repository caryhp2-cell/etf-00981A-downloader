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
