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
