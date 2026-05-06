import { Download } from 'lucide-react';

type DashboardHeaderProps = {
  latestDate: string | null;
  generatedAt: string;
  downloadsZipHref: string;
};

export function DashboardHeader({
  latestDate,
  generatedAt,
  downloadsZipHref,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="eyebrow">00981A</p>
        <h1>Holdings Analyzer</h1>
        <p>Latest valid data: {latestDate ?? '-'} · Generated: {new Date(generatedAt).toLocaleString('zh-TW')}</p>
      </div>
      <div className="header-actions">
        <a className="download-button" href={downloadsZipHref} download>
          <Download size={16} />
          Download Excel ZIP
        </a>
      </div>
    </header>
  );
}
