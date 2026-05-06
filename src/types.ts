export type Holding = {
  stockCode: string;
  stockName: string;
  shares: number;
  weight: number;
};

export type FundAssets = {
  netAssetValue: number | null;
  unitCount: number | null;
  navPerUnit: number | null;
};

export type WeightedItem = {
  label: string;
  amount: number;
  weight: number;
};

export type Snapshot = {
  date: string;
  fileName: string;
  fundAssets: FundAssets;
  assetAllocation: WeightedItem[];
  cashItems: WeightedItem[];
  holdings: Holding[];
};

export type HoldingsDataset = {
  generatedAt: string;
  sourceRepo: string;
  snapshots: Snapshot[];
};

export type HoldingComparison = Holding & {
  rank: number;
  previousWeight: number | null;
  weightChange: number;
  previousRank: number | null;
  rankChange: number | null;
};

export type DailyChange = {
  date: string;
  added: Holding[];
  removed: Holding[];
  increased: HoldingComparison[];
  decreased: HoldingComparison[];
};
