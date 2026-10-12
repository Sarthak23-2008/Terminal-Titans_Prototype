export type AssetClass = 'Equity' | 'Bond' | 'REIT' | 'InvIT' | 'Cash';

export type DataSourceId = 'broker-a' | 'broker-b' | 'depository-cas' | 'manual' | string;

export interface DataSource {
  id: DataSourceId;
  name: string;
  type: 'Broker' | 'Depository' | 'Manual';
  provider: string;
  accountNumberMasked: string;
  lastSynced: string;
  status: 'connected' | 'syncing' | 'error' | 'disconnected';
  holdingsCount: number;
  badgeColor: string;
  notes?: string;
}

export interface HoldingDataQuality {
  isStale?: boolean;
  hasVerifiedPrice?: boolean;
  priceSource?: string;
  lastUpdated?: string;
  notes?: string;
}

export interface Holding {
  id: string;
  securityName: string;
  symbol: string;
  isin?: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  assetClass: AssetClass;
  sourceId: DataSourceId;
  sector?: string;
  currency?: string;
  annualDividendYield?: number; // e.g. 3.2%
  maturityDate?: string; // For bonds
  couponRate?: number; // For bonds %
  dataQuality?: HoldingDataQuality;
  importBatchId?: string;
  exchange?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  sourceId: DataSourceId;
  sourceName: string;
  timestamp: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  duplicateRows: number;
  status: 'completed' | 'partial' | 'failed';
  warnings: string[];
}

export interface SourceAllocationContribution {
  sourceId: DataSourceId;
  sourceName: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  investedValue: number;
  marketValue: number;
}

export interface ConsolidatedHolding {
  symbol: string;
  isin?: string;
  securityName: string;
  assetClass: AssetClass;
  sector?: string;
  exchange?: string;
  totalQuantity: number;
  weightedAvgCost: number;
  currentPrice: number;
  totalInvestedValue: number;
  totalMarketValue: number;
  unrealizedPL: number;
  unrealizedPLPercentage: number;
  annualDividendYield?: number;
  sourceContributions: SourceAllocationContribution[];
  sourceIds: DataSourceId[];
  isMultiSource: boolean;
  hasPriceConflict?: boolean;
  priceConflictNote?: string;
  hasQuantityConflict?: boolean;
  dataQuality?: HoldingDataQuality;
}

export interface AssetAllocationItem {
  assetClass: AssetClass;
  marketValue: number;
  investedValue: number;
  percentage: number;
  count: number;
  color: string;
}

export interface PortfolioSummary {
  totalMarketValue: number;
  totalInvestedValue: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  holdingsCount: number;
  consolidatedHoldingsCount: number;
  sourceCount: number;
  topThreeConcentration: number;
  topThreeHoldings: { symbol: string; securityName: string; marketValue: number; percentage: number }[];
  assetAllocation: AssetAllocationItem[];
  sectorAllocation: { sector: string; marketValue: number; percentage: number }[];
  bestPerformer?: { symbol: string; securityName: string; plPercent: number };
  worstPerformer?: { symbol: string; securityName: string; plPercent: number };
  dataQualityIssuesCount: number;
  priceConflictCount: number;
}

export type StandardFieldKey =
  | 'symbol'
  | 'securityName'
  | 'quantity'
  | 'averageCost'
  | 'currentPrice'
  | 'assetClass'
  | 'isin'
  | 'sector'
  | 'exchange'
  | 'annualDividendYield';

export interface ColumnDefinition {
  key: StandardFieldKey;
  label: string;
  required: boolean;
  aliases: string[];
  description: string;
}

export type RowValidationStatus = 'valid' | 'warning' | 'error';

export interface ParsedRowResult {
  rowIndex: number;
  rawData: Record<string, string>;
  status: RowValidationStatus;
  errors: string[];
  warnings: string[];
  normalizedHolding?: Omit<Holding, 'id' | 'createdAt'>;
  isDuplicateInFile?: boolean;
  isDuplicateOfExisting?: boolean;
}

export interface PipelineSummary {
  totalRows: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  duplicateCount: number;
  rows: ParsedRowResult[];
  rawHeaders: string[];
  mapping: Record<StandardFieldKey, string>;
}

export interface StructuredAIContext {
  timestamp: string;
  baseCurrency: string;
  portfolioMetrics: {
    totalMarketValue: number;
    totalInvestedValue: number;
    totalUnrealizedPL: number;
    totalUnrealizedPLPercent: number;
    topThreeConcentrationPercent: number;
    distinctSecuritiesCount: number;
    totalBrokerLineItems: number;
    connectedSourcesCount: number;
  };
  assetAllocation: {
    assetClass: string;
    marketValue: number;
    percentage: number;
    count: number;
  }[];
  topHoldings: {
    symbol: string;
    securityName: string;
    assetClass: string;
    marketValue: number;
    portfolioWeightPercent: number;
    unrealizedPLPercent: number;
    heldAcrossSources: string[];
  }[];
  multiSourceConsolidations: {
    symbol: string;
    sourcesCount: number;
    sources: string[];
    weightedAverageCost: number;
    currentPrice: number;
    hasPriceConflict: boolean;
  }[];
  dataQualityReport: {
    missingIsinCount: number;
    priceConflictsCount: number;
    staleFeedsCount: number;
    unverifiedCount: number;
  };
}

export type ScreenId =
  | 'dashboard'
  | 'investments'
  | 'import'
  | 'explorer'
  | 'insights'
  | 'sources'
  | 'settings';

export interface InsightRule {
  id: string;
  category: 'concentration' | 'allocation' | 'duplicate' | 'yield' | 'quality';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info' | 'positive';
  impactMetric?: string;
  actionableStep?: string;
}
