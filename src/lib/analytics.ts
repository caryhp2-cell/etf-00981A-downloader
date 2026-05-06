import type { DailyChange, Holding, HoldingComparison, Snapshot } from '../types';

export function sortSnapshots(snapshots: Snapshot[]): Snapshot[] {
  return [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
}

export function getLatestSnapshot(snapshots: Snapshot[]): Snapshot | null {
  return sortSnapshots(snapshots).at(-1) ?? null;
}

export function getPreviousSnapshot(snapshots: Snapshot[]): Snapshot | null {
  return sortSnapshots(snapshots).at(-2) ?? null;
}

export function calculateTopTenConcentration(snapshot: Snapshot | null): number {
  if (!snapshot) return 0;
  return snapshot.holdings
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10)
    .reduce((total, holding) => total + holding.weight, 0);
}

export function rankHoldings(holdings: Holding[]): Map<string, number> {
  const ranked = [...holdings].sort((a, b) => b.weight - a.weight);
  return new Map(ranked.map((holding, index) => [holding.stockCode, index + 1]));
}

export function compareLatestHoldings(latest: Snapshot | null, previous: Snapshot | null): HoldingComparison[] {
  if (!latest) return [];
  const previousByCode = new Map((previous?.holdings ?? []).map((holding) => [holding.stockCode, holding]));
  const latestRanks = rankHoldings(latest.holdings);
  const previousRanks = rankHoldings(previous?.holdings ?? []);

  return [...latest.holdings]
    .sort((a, b) => b.weight - a.weight)
    .map((holding) => {
      const previousHolding = previousByCode.get(holding.stockCode);
      const previousWeight = previousHolding?.weight ?? null;
      const rank = latestRanks.get(holding.stockCode) ?? 0;
      const previousRank = previousRanks.get(holding.stockCode) ?? null;
      return {
        ...holding,
        rank,
        previousWeight,
        weightChange: holding.weight - (previousWeight ?? 0),
        previousRank,
        rankChange: previousRank == null ? null : previousRank - rank,
      };
    });
}

export function getAddedRemoved(latest: Snapshot | null, previous: Snapshot | null): Pick<DailyChange, 'added' | 'removed'> {
  if (!latest || !previous) return { added: [], removed: [] };
  const latestCodes = new Set(latest.holdings.map((holding) => holding.stockCode));
  const previousCodes = new Set(previous.holdings.map((holding) => holding.stockCode));

  return {
    added: latest.holdings.filter((holding) => !previousCodes.has(holding.stockCode)),
    removed: previous.holdings.filter((holding) => !latestCodes.has(holding.stockCode)),
  };
}

export function buildDailyChanges(snapshots: Snapshot[]): DailyChange[] {
  const ordered = sortSnapshots(snapshots);
  return ordered.slice(1).map((snapshot, index) => {
    const previous = ordered[index];
    const compared = compareLatestHoldings(snapshot, previous);
    const { added, removed } = getAddedRemoved(snapshot, previous);
    return {
      date: snapshot.date,
      added,
      removed,
      increased: compared.filter((row) => row.weightChange > 0).sort((a, b) => b.weightChange - a.weightChange),
      decreased: compared.filter((row) => row.weightChange < 0).sort((a, b) => a.weightChange - b.weightChange),
    };
  });
}
