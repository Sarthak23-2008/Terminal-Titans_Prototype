import {
  AssetClass,
  ConsolidatedHolding,
  Holding,
  PortfolioSummary,
  AssetAllocationItem,
  SourceAllocationContribution,
  DataSource,
} from '../types/investment';

export const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  Equity: '#2563eb', // Blue
  Bond: '#d97706',   // Amber
  REIT: '#0d9488',   // Teal
  InvIT: '#7c3aed',  // Violet
  Cash: '#059669',   // Emerald
};

/**
 * Safely round a number to specific decimal places
 */
export function roundTo(val: number, decimals: number = 2): number {
  if (!Number.isFinite(val) || Number.isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * Calculate market value deterministically
 */
export function calculateMarketValue(quantity: number, currentPrice: number): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(currentPrice) || quantity < 0 || currentPrice < 0) {
    return 0;
  }
  return roundTo(quantity * currentPrice, 2);
}

/**
 * Calculate invested value (cost basis)
 */
export function calculateInvestedValue(quantity: number, averageCost: number): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(averageCost) || quantity < 0 || averageCost < 0) {
    return 0;
  }
  return roundTo(quantity * averageCost, 2);
}

/**
 * Calculate unrealized profit or loss in absolute terms
 */
export function calculateUnrealizedPL(marketVal: number, investedVal: number): number {
  if (!Number.isFinite(marketVal) || !Number.isFinite(investedVal)) {
    return 0;
  }
  return roundTo(marketVal - investedVal, 2);
}

/**
 * Calculate unrealized profit or loss percentage safely protecting against zero denominator
 */
export function calculateUnrealizedPLPercent(pl: number, investedVal: number): number {
  if (!Number.isFinite(pl) || !Number.isFinite(investedVal) || investedVal <= 0) {
    return 0;
  }
  return roundTo((pl / investedVal) * 100, 2);
}

/**
 * Groups multiple holdings by verified identifier (ISIN or Symbol+AssetClass)
 * and produces consolidated aggregate records with weighted average cost basis,
 * source contribution breakdown, and price conflict flagging.
 *
 * SAFE CONSOLIDATION RULES:
 * 1. Match on exact ISIN if available.
 * 2. Fall back to exact Symbol + Asset Class (and Exchange if specified).
 * 3. NEVER merge securities solely because their names look similar.
 * 4. Flag price discrepancies > 3% across sources for manual review.
 */
export function consolidateHoldings(
  holdings: Holding[],
  sourcesMap: Record<string, DataSource> = {}
): ConsolidatedHolding[] {
  const groups = new Map<string, Holding[]>();

  for (const h of holdings) {
    let key: string;
    const cleanIsin = (h.isin || '').trim().toUpperCase();
    const cleanSymbol = (h.symbol || '').trim().toUpperCase();

    if (cleanIsin.length === 12) {
      key = `ISIN:${cleanIsin}`;
    } else if (cleanSymbol) {
      const exchPart = h.exchange ? `:${h.exchange.trim().toUpperCase()}` : '';
      key = `SYM:${cleanSymbol}:${h.assetClass}${exchPart}`;
    } else {
      // Unidentified unique entry - do not merge with anything else!
      key = `ID:${h.id}`;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(h);
  }

  const consolidated: ConsolidatedHolding[] = [];

  for (const [, items] of groups) {
    if (items.length === 0) continue;

    const base = items[0];
    let totalQty = 0;
    let totalInvested = 0;
    let totalMarket = 0;

    const prices: number[] = [];
    const sourceContribs: SourceAllocationContribution[] = [];
    const sourceIds: string[] = [];

    for (const item of items) {
      const q = Math.max(0, item.quantity);
      const mVal = calculateMarketValue(q, item.currentPrice);
      const iVal = calculateInvestedValue(q, item.averageCost);

      totalQty += q;
      totalInvested += iVal;
      totalMarket += mVal;

      if (item.currentPrice > 0) {
        prices.push(item.currentPrice);
      }

      if (!sourceIds.includes(item.sourceId)) {
        sourceIds.push(item.sourceId);
      }

      sourceContribs.push({
        sourceId: item.sourceId,
        sourceName: sourcesMap[item.sourceId]?.name || item.sourceId,
        quantity: q,
        averageCost: item.averageCost,
        currentPrice: item.currentPrice,
        investedValue: iVal,
        marketValue: mVal,
      });
    }

    // Price conflict check across sources
    let hasPriceConflict = false;
    let priceConflictNote: string | undefined;

    if (prices.length > 1) {
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      if (minP > 0 && (maxP - minP) / minP > 0.03) {
        hasPriceConflict = true;
        const diffPercent = (((maxP - minP) / minP) * 100).toFixed(1);
        priceConflictNote = `Source price discrepancy of ${diffPercent}% detected across feeds (Low: $${minP.toFixed(2)}, High: $${maxP.toFixed(2)}). Reconciled via latest quote.`;
      }
    }

    // Latest price preference (most recent valid item price)
    const latestPrice = prices.length > 0 ? prices[prices.length - 1] : base.currentPrice;
    const weightedAvgCost = totalQty > 0 ? roundTo(totalInvested / totalQty, 2) : 0;
    const pl = calculateUnrealizedPL(totalMarket, totalInvested);
    const plPercent = calculateUnrealizedPLPercent(pl, totalInvested);

    consolidated.push({
      symbol: base.symbol,
      isin: base.isin,
      securityName: base.securityName,
      assetClass: base.assetClass,
      sector: base.sector,
      exchange: base.exchange,
      totalQuantity: totalQty,
      weightedAvgCost,
      currentPrice: latestPrice,
      totalInvestedValue: roundTo(totalInvested, 2),
      totalMarketValue: roundTo(totalMarket, 2),
      unrealizedPL: pl,
      unrealizedPLPercentage: plPercent,
      annualDividendYield: base.annualDividendYield,
      sourceContributions: sourceContribs,
      sourceIds,
      isMultiSource: sourceIds.length > 1,
      hasPriceConflict,
      priceConflictNote,
      dataQuality: base.dataQuality,
    });
  }

  // Sort descending by market value
  return consolidated.sort((a, b) => b.totalMarketValue - a.totalMarketValue);
}

/**
 * Calculates complete deterministic summary for a portfolio
 */
export function calculatePortfolioSummary(
  holdings: Holding[],
  sourcesMap: Record<string, DataSource> = {}
): PortfolioSummary {
  const consolidated = consolidateHoldings(holdings, sourcesMap);

  let totalMarketValue = 0;
  let totalInvestedValue = 0;

  const assetClassMap: Record<AssetClass, { market: number; invested: number; count: number }> = {
    Equity: { market: 0, invested: 0, count: 0 },
    Bond: { market: 0, invested: 0, count: 0 },
    REIT: { market: 0, invested: 0, count: 0 },
    InvIT: { market: 0, invested: 0, count: 0 },
    Cash: { market: 0, invested: 0, count: 0 },
  };

  const sectorMap: Record<string, number> = {};

  for (const ch of consolidated) {
    totalMarketValue += ch.totalMarketValue;
    totalInvestedValue += ch.totalInvestedValue;

    if (assetClassMap[ch.assetClass]) {
      assetClassMap[ch.assetClass].market += ch.totalMarketValue;
      assetClassMap[ch.assetClass].invested += ch.totalInvestedValue;
      assetClassMap[ch.assetClass].count += 1;
    }

    const sec = ch.sector || 'Other';
    sectorMap[sec] = (sectorMap[sec] || 0) + ch.totalMarketValue;
  }

  totalMarketValue = roundTo(totalMarketValue, 2);
  totalInvestedValue = roundTo(totalInvestedValue, 2);
  const totalUnrealizedPL = calculateUnrealizedPL(totalMarketValue, totalInvestedValue);
  const totalUnrealizedPLPercent = calculateUnrealizedPLPercent(totalUnrealizedPL, totalInvestedValue);

  // Asset allocation array
  const assetAllocation: AssetAllocationItem[] = (Object.keys(assetClassMap) as AssetClass[])
    .map((ac) => {
      const data = assetClassMap[ac];
      const percentage = totalMarketValue > 0 ? roundTo((data.market / totalMarketValue) * 100, 1) : 0;
      return {
        assetClass: ac,
        marketValue: roundTo(data.market, 2),
        investedValue: roundTo(data.invested, 2),
        percentage,
        count: data.count,
        color: ASSET_CLASS_COLORS[ac],
      };
    })
    .filter((item) => item.marketValue > 0 || item.count > 0);

  // Top 3 holdings concentration
  const topThreeList = consolidated.slice(0, 3);
  const topThreeMarketSum = topThreeList.reduce((acc, h) => acc + h.totalMarketValue, 0);
  const topThreeConcentration = totalMarketValue > 0 ? roundTo((topThreeMarketSum / totalMarketValue) * 100, 1) : 0;

  const topThreeHoldings = topThreeList.map((h) => ({
    symbol: h.symbol,
    securityName: h.securityName,
    marketValue: h.totalMarketValue,
    percentage: totalMarketValue > 0 ? roundTo((h.totalMarketValue / totalMarketValue) * 100, 1) : 0,
  }));

  // Sector allocation
  const sectorAllocation = Object.entries(sectorMap)
    .map(([sector, mVal]) => ({
      sector,
      marketValue: roundTo(mVal, 2),
      percentage: totalMarketValue > 0 ? roundTo((mVal / totalMarketValue) * 100, 1) : 0,
    }))
    .sort((a, b) => b.marketValue - a.marketValue);

  // Unique sources
  const uniqueSources = new Set(holdings.map((h) => h.sourceId));

  // Best & worst performers among holdings with invested value > 0
  const validPerformers = [...consolidated].filter((h) => h.totalInvestedValue > 0);
  validPerformers.sort((a, b) => b.unrealizedPLPercentage - a.unrealizedPLPercentage);

  const bestPerformer = validPerformers.length > 0
    ? {
        symbol: validPerformers[0].symbol,
        securityName: validPerformers[0].securityName,
        plPercent: validPerformers[0].unrealizedPLPercentage,
      }
    : undefined;

  const worstPerformer = validPerformers.length > 0
    ? {
        symbol: validPerformers[validPerformers.length - 1].symbol,
        securityName: validPerformers[validPerformers.length - 1].securityName,
        plPercent: validPerformers[validPerformers.length - 1].unrealizedPLPercentage,
      }
    : undefined;

  // Data quality and conflict counts
  const priceConflictCount = consolidated.filter((h) => h.hasPriceConflict).length;
  const missingIsinCount = consolidated.filter((h) => !h.isin && h.assetClass !== 'Cash').length;
  const dataQualityIssuesCount = priceConflictCount + missingIsinCount;

  return {
    totalMarketValue,
    totalInvestedValue,
    totalUnrealizedPL,
    totalUnrealizedPLPercent,
    holdingsCount: holdings.length,
    consolidatedHoldingsCount: consolidated.length,
    sourceCount: uniqueSources.size,
    topThreeConcentration,
    topThreeHoldings,
    assetAllocation,
    sectorAllocation,
    bestPerformer,
    worstPerformer,
    dataQualityIssuesCount,
    priceConflictCount,
  };
}

/**
 * AI-READY ANALYTICS:
 * Produces structured portfolio-summary object containing application-calculated metrics,
 * allocation, largest holdings, cross-source consolidations, and data quality warnings.
 * Ready to supply deterministic context payload to the Gemini AI assistant in Phase 3.
 */
export function buildStructuredAIContext(
  summary: PortfolioSummary,
  consolidated: ConsolidatedHolding[],
  holdings: Holding[],
  currency: string = 'USD'
) {
  const multiSourceList = consolidated
    .filter((h) => h.isMultiSource)
    .map((h) => ({
      symbol: h.symbol,
      sourcesCount: h.sourceIds.length,
      sources: h.sourceIds,
      weightedAverageCost: h.weightedAvgCost,
      currentPrice: h.currentPrice,
      hasPriceConflict: !!h.hasPriceConflict,
    }));

  const topHoldings = consolidated.slice(0, 5).map((h) => ({
    symbol: h.symbol,
    securityName: h.securityName,
    assetClass: h.assetClass,
    marketValue: h.totalMarketValue,
    portfolioWeightPercent: summary.totalMarketValue > 0 ? roundTo((h.totalMarketValue / summary.totalMarketValue) * 100, 2) : 0,
    unrealizedPLPercent: h.unrealizedPLPercentage,
    heldAcrossSources: h.sourceIds,
  }));

  const missingIsinCount = consolidated.filter((h) => !h.isin && h.assetClass !== 'Cash').length;
  const priceConflictsCount = consolidated.filter((h) => h.hasPriceConflict).length;

  return {
    timestamp: new Date().toISOString(),
    baseCurrency: currency,
    portfolioMetrics: {
      totalMarketValue: summary.totalMarketValue,
      totalInvestedValue: summary.totalInvestedValue,
      totalUnrealizedPL: summary.totalUnrealizedPL,
      totalUnrealizedPLPercent: summary.totalUnrealizedPLPercent,
      topThreeConcentrationPercent: summary.topThreeConcentration,
      distinctSecuritiesCount: summary.consolidatedHoldingsCount,
      totalBrokerLineItems: summary.holdingsCount,
      connectedSourcesCount: summary.sourceCount,
    },
    assetAllocation: summary.assetAllocation.map((a) => ({
      assetClass: a.assetClass,
      marketValue: a.marketValue,
      percentage: a.percentage,
      count: a.count,
    })),
    topHoldings,
    multiSourceConsolidations: multiSourceList,
    dataQualityReport: {
      missingIsinCount,
      priceConflictsCount,
      staleFeedsCount: 0,
      unverifiedCount: 0,
    },
  };
}

/**
 * Format currency with internationalization
 */
export function formatCurrency(
  val: number,
  currencyCode: 'USD' | 'INR' | 'EUR' | 'GBP' = 'USD',
  compact: boolean = false
): string {
  if (!Number.isFinite(val)) return '$0.00';

  const symbolMap: Record<string, string> = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbolMap[currencyCode] || '$';

  if (compact && Math.abs(val) >= 1_000_000) {
    return `${symbol}${(val / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(val) >= 1_000) {
    return `${symbol}${(val / 1_000).toFixed(1)}k`;
  }

  // Locale formatting
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
  return `${symbol}${Math.abs(val).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format percentage with explicit sign
 */
export function formatPercentage(val: number, includeSign: boolean = true): string {
  if (!Number.isFinite(val)) return '0.00%';
  const prefix = includeSign && val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
}
