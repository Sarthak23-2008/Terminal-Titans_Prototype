import { ConsolidatedHolding, PortfolioSummary, InsightRule } from '../types/investment';
import { formatPercentage, formatCurrency } from './calculations';

export function generatePortfolioInsights(
  summary: PortfolioSummary,
  consolidated: ConsolidatedHolding[],
  currency: 'USD' | 'INR' | 'EUR' | 'GBP' = 'USD'
): InsightRule[] {
  const insights: InsightRule[] = [];

  if (consolidated.length === 0) {
    return [
      {
        id: 'empty-portfolio',
        category: 'quality',
        title: 'No Active Holdings Detected',
        description: 'Import broker statements or load the FinTech hackathon sample dataset to generate automated portfolio intelligence.',
        severity: 'info',
        actionableStep: 'Click "Load Benchmark Portfolio" to preview real-time intelligence.',
      },
    ];
  }

  // 1. Single Security Concentration Risk
  const highestHolding = consolidated[0];
  if (highestHolding && summary.totalMarketValue > 0) {
    const singleWeight = (highestHolding.totalMarketValue / summary.totalMarketValue) * 100;
    if (singleWeight > 22) {
      insights.push({
        id: 'high-single-concentration',
        category: 'concentration',
        title: `Single Stock Overweight Alert: ${highestHolding.symbol}`,
        description: `${highestHolding.securityName} represents ${singleWeight.toFixed(1)}% (${formatCurrency(highestHolding.totalMarketValue, currency)}) of your total assets. Standard risk-parity benchmarks suggest keeping single equity exposure below 15-20%.`,
        severity: 'critical',
        impactMetric: `${singleWeight.toFixed(1)}% Weight`,
        actionableStep: `Consider trimming ${highestHolding.symbol} or reallocating dividend returns into fixed income / defensive assets.`,
      });
    }
  }

  // 2. Top-Three Concentration Risk
  if (summary.topThreeConcentration > 45) {
    insights.push({
      id: 'high-top3-concentration',
      category: 'concentration',
      title: 'Top-3 Holdings Heavy Concentration',
      description: `Your top three holdings (${summary.topThreeHoldings.map((h) => h.symbol).join(', ')}) account for ${summary.topThreeConcentration.toFixed(1)}% of your portfolio value. A sharp drawdown in these assets will disproportionately impact your net worth.`,
      severity: 'warning',
      impactMetric: `${summary.topThreeConcentration.toFixed(1)}% of Net Worth`,
      actionableStep: 'Evaluate diversifying into non-correlated asset classes like infrastructure InvITs or government debt.',
    });
  } else if (summary.topThreeConcentration <= 35 && consolidated.length >= 6) {
    insights.push({
      id: 'healthy-top3-distribution',
      category: 'concentration',
      title: 'Balanced Core Asset Distribution',
      description: `Your top 3 assets represent a prudent ${summary.topThreeConcentration.toFixed(1)}% of total capital, exhibiting institutional-grade risk dispersion.`,
      severity: 'positive',
      impactMetric: `${summary.topThreeConcentration.toFixed(1)}% Top-3`,
      actionableStep: 'Maintain this target concentration band across future capital deployments.',
    });
  }

  // 3. Multi-Broker Fragmentation & Duplication
  const multiSourceHoldings = consolidated.filter((h) => h.isMultiSource);
  if (multiSourceHoldings.length > 0) {
    const duplicateSymbols = multiSourceHoldings.map((h) => h.symbol).join(', ');
    const totalDuplicateVal = multiSourceHoldings.reduce((sum, h) => sum + h.totalMarketValue, 0);

    insights.push({
      id: 'broker-fragmentation-detected',
      category: 'duplicate',
      title: `Consolidation Opportunity: ${multiSourceHoldings.length} Duplicate Positions`,
      description: `You are holding identical securities (${duplicateSymbols}) fragmented across multiple brokers/depositories totaling ${formatCurrency(totalDuplicateVal, currency)}. This splits your margin collateral and complicates tax lot accounting.`,
      severity: 'info',
      impactMetric: `${multiSourceHoldings.length} Cross-Account Assets`,
      actionableStep: 'Use Invest360 Consolidated View to monitor blended cost bases, or consider executing an ACATS / Demat depository transfer.',
    });
  }

  // 4. Asset Class Allocation & Yield Buffer
  const equityAlloc = summary.assetAllocation.find((a) => a.assetClass === 'Equity');
  const bondAlloc = summary.assetAllocation.find((a) => a.assetClass === 'Bond');
  const reitAlloc = summary.assetAllocation.find((a) => a.assetClass === 'REIT');
  const invitAlloc = summary.assetAllocation.find((a) => a.assetClass === 'InvIT');

  const realAssetsPct = (reitAlloc?.percentage || 0) + (invitAlloc?.percentage || 0);

  if (realAssetsPct >= 10) {
    insights.push({
      id: 'defensive-cash-flow',
      category: 'yield',
      title: 'Strong Real-Asset Cash Flow Cushion',
      description: `Your allocation to REITs and Infrastructure InvITs stands at ${realAssetsPct.toFixed(1)}%. These institutional vehicles offer predictable contractual cash flows and high yields (6.5% - 9.2%) that hedge against equity drawdown.`,
      severity: 'positive',
      impactMetric: `${realAssetsPct.toFixed(1)}% Yield Assets`,
      actionableStep: 'Reinvest regular distribution payouts to compound your portfolio cost basis.',
    });
  }

  if (equityAlloc && equityAlloc.percentage > 70) {
    insights.push({
      id: 'high-equity-beta',
      category: 'allocation',
      title: 'High Equity Beta Exposure',
      description: `Equities comprise ${equityAlloc.percentage.toFixed(1)}% of your unified wealth. While advantageous in strong bull runs, current fixed income yields offer attractive risk-adjusted entry points.`,
      severity: 'warning',
      impactMetric: `${equityAlloc.percentage.toFixed(1)}% Equities`,
      actionableStep: 'Consider allocating upcoming cash additions into high-grade bonds or treasury notes.',
    });
  }

  // 5. Data Quality Check
  const missingIsin = consolidated.filter((h) => !h.isin && h.assetClass !== 'Cash');
  if (missingIsin.length > 0) {
    insights.push({
      id: 'missing-isin-meta',
      category: 'quality',
      title: `${missingIsin.length} Securities Missing Standard ISIN Identifiers`,
      description: `Securities like ${missingIsin.slice(0, 2).map((h) => h.symbol).join(', ')} lack verified 12-digit International Securities Identification Numbers.`,
      severity: 'warning',
      impactMetric: 'Metadata Gap',
      actionableStep: 'Update security details in My Investments to unlock automated global corporate action tracking.',
    });
  }

  return insights;
}
