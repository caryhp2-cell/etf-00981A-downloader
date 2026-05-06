type DashboardHeaderProps = {
  latestDate: string | null;
  generatedAt: string;
};

export function DashboardHeader({
  latestDate,
  generatedAt,
}: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="eyebrow">00981A</p>
        <h1>Holdings Analyzer</h1>
        <p>Latest valid data: {latestDate ?? '-'} · Generated: {new Date(generatedAt).toLocaleString('zh-TW')}</p>
      </div>
    </header>
  );
}
