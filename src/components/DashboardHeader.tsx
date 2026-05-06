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
        <h1>
          <span className="fund-code">00981A</span>
          <span>Holdings Analyzer</span>
        </h1>
        <p>Latest valid data: {latestDate ?? '-'} · Generated: {new Date(generatedAt).toLocaleString('zh-TW')}</p>
      </div>
      <div className="header-actions">
        <a className="download-button historical-download" href={downloadsZipHref} download>
          <Download size={16} />
          Historical Data ZIP
        </a>
      </div>
    </header>
  );
}
