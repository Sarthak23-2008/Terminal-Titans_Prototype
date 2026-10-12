import React, { useState } from 'react';
import {
  Compass,
  PieChart as PieIcon,
  Percent,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Building,
  DollarSign,
  Eye,
  BookOpen,
  TrendingUp,
  Landmark,
  ShieldAlert,
  Droplet,
  CheckCircle2,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  formatCurrency,
  formatPercentage,
  ASSET_CLASS_COLORS,
} from '../../utils/calculations';
import { AssetClass } from '../../types/investment';

interface EducationalAssetClass {
  assetClass: AssetClass;
  title: string;
  subtitle: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  whatItIs: string;
  howItWorks: string;
  potentialBenefits: string[];
  keyRisks: string[];
  liquidityConsiderations: string;
}

const EDUCATIONAL_CONTENT: EducationalAssetClass[] = [
  {
    assetClass: 'Equity',
    title: 'Equities (Stocks & Shares)',
    subtitle: 'Ownership shares in public corporations',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: TrendingUp,
    whatItIs:
      'Equities represent fractional ownership in a publicly traded corporation. Holding a share entitles the investor to a proportionate claim on corporate earnings and voting governance.',
    howItWorks:
      'Investors profit through two channels: capital appreciation (when the share price rises reflecting corporate revenue growth) and discretionary dividends paid from net profits.',
    potentialBenefits: [
      'High long-term real returns that outpace consumer inflation',
      'Compounding wealth creation via reinvested corporate earnings',
      'Shareholder voting rights and strategic governance participation',
      'Ownership in global market innovators and technological advances',
    ],
    keyRisks: [
      'Market volatility and broad economic downturn drawdowns',
      'Company-specific operational or managerial failure',
      'Sequence of returns risk when capital is needed on short notice',
    ],
    liquidityConsiderations:
      'Publicly traded equities on major global exchanges (NYSE, NASDAQ, LSE, NSE) are highly liquid, typically settling on a T+1 business day cycle with tight bid-ask spreads during market hours.',
  },
  {
    assetClass: 'Bond',
    title: 'Bonds (Fixed Income & Debt)',
    subtitle: 'Contractual loans to sovereign governments or corporations',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Landmark,
    whatItIs:
      'A bond is a formal loan agreement where an investor lends principal capital to an issuer (a national treasury, municipal body, or corporate entity) for a defined period.',
    howItWorks:
      'The borrower pledges to pay a fixed or floating interest rate (coupon) at scheduled intervals and return the principal face value (par) when the security reaches its maturity date.',
    potentialBenefits: [
      'Predictable, contractual income streams for financial planning',
      'Capital preservation and seniority over common equity in liquidation',
      'Low correlation with equities, dampening portfolio drawdown volatility',
      'Sovereign bonds carry explicit state-backed credit guarantees',
    ],
    keyRisks: [
      'Interest rate risk: Bond prices move inversely to benchmark interest rates',
      'Credit/default risk: Possibility of corporate issuer financial insolvency',
      'Inflation risk: Fixed coupon payments lose real purchasing power over time',
    ],
    liquidityConsiderations:
      'Benchmark sovereign debt (e.g. US Treasuries) is the deepest and most liquid asset class globally. Conversely, corporate debt and municipal notes trade over-the-counter (OTC) and may require wider concession pricing for large trade exits.',
  },
  {
    assetClass: 'REIT',
    title: 'REITs (Real Estate Investment Trusts)',
    subtitle: 'Income-generating commercial real estate portfolios',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: Building,
    whatItIs:
      'Real Estate Investment Trusts are pooled corporate structures that own, operate, or finance income-generating commercial property like logistics warehouses, medical centers, office parks, and residential complexes.',
    howItWorks:
      'Under statutory regulations in most jurisdictions, REITs are required to distribute at least 90% of their taxable rental net income directly to unitholders as dividends to maintain tax-exempt pass-through status.',
    potentialBenefits: [
      'Predictable contractual cash flows derived from multi-year commercial leases',
      'Access to prime institutional real estate without individual property management hassles',
      'Built-in inflation escalation clauses in many commercial lease contracts',
      'Significantly higher dividend yields compared to broad equity market indices',
    ],
    keyRisks: [
      'Tenant vacancy and lease non-renewal risk in softening sectors',
      'Rising debt refinancing costs when interest rates elevate borrowing burdens',
      'Geographic or sectoral concentration in commercial real estate categories',
    ],
    liquidityConsiderations:
      'Publicly listed REITs trade like common equities on centralized exchanges, offering instantaneous daily liquidity, unlike physical bricks-and-mortar real estate which can take months to liquidate.',
  },
  {
    assetClass: 'InvIT',
    title: 'InvITs (Infrastructure Investment Trusts)',
    subtitle: 'Long-term concessions in highways, power transmission, and energy grids',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Layers,
    whatItIs:
      'Infrastructure Investment Trusts are pooled investment vehicles modeled like mutual funds that hold long-concession infrastructure assets such as highway tollways, power transmission grids, optical fiber networks, and renewable power farms.',
    howItWorks:
      'Revenues from contractual toll collections, long-term power purchase agreements, and transmission tariffs are pooled and distributed directly to unitholders (typically 85% to 90%+ of net distributable cash flow) on quarterly or semi-annual schedules.',
    potentialBenefits: [
      'Attractive distribution yields (often 7.5% - 9.5%+ per annum)',
      'Monopoly-like essential public service concessions spanning 15 to 30 years',
      'Stable volume-driven cash receipts with low economic cycle sensitivity',
      'Direct contribution to national infrastructure modernization',
    ],
    keyRisks: [
      'Regulatory and political tariff revisions or concession agreement disputes',
      'Traffic volume or throughput shortfalls on tollway projects',
      'Eventual concession expiry requiring reinvestment into new asset pipelines',
    ],
    liquidityConsiderations:
      'InvIT trading volumes on public exchanges are typically lower than large-cap blue-chip stocks. While daily market-maker quotes exist, they are optimized for long-term income compounding rather than high-frequency intraday turnover.',
  },
];

export const ExplorerScreen: React.FC = () => {
  const { summary, consolidatedHoldings, currency, setInspectedHolding } = usePortfolio();

  const [activeTab, setActiveTab] = useState<'education' | 'sectors' | 'yields' | 'overlap'>('education');
  const [selectedAssetClass, setSelectedAssetClass] = useState<AssetClass | 'All'>('All');

  // Filtered list by asset class
  const filteredList = consolidatedHoldings.filter(
    (h) => selectedAssetClass === 'All' || h.assetClass === selectedAssetClass
  );

  // Income yielding assets (Bonds, REITs, InvITs)
  const yieldAssets = consolidatedHoldings.filter(
    (h) =>
      ['Bond', 'REIT', 'InvIT'].includes(h.assetClass) ||
      (h.annualDividendYield && h.annualDividendYield > 0)
  );

  // Overlapping multi-source holdings
  const multiSourceHoldings = consolidatedHoldings.filter((h) => h.isMultiSource);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Investment Explorer & Asset Knowledge Base
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Institutional Framework
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Explore portfolio exposures and understand the underlying mechanics of Equities, Bonds, REITs, and InvITs.
            </p>
          </div>

          {/* Quick tab switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('education')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'education'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              Asset Class Guide
            </button>
            <button
              onClick={() => setActiveTab('sectors')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'sectors'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sector Exposure
            </button>
            <button
              onClick={() => setActiveTab('yields')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'yields'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yield Matrix
            </button>
            <button
              onClick={() => setActiveTab('overlap')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'overlap'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Multi-Source Overlap
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: EDUCATIONAL GUIDE */}
      {activeTab === 'education' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-xl p-5 border border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Core Financial Literacy
              </span>
              <span className="text-xs text-slate-400 font-mono">Invest360 Educational Foundation</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Understanding Your Asset Building Blocks
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Institutional wealth construction balances growth-oriented instruments (Equities), capital preservation vehicles (Bonds), and cash-flow distributing real assets (REITs and InvITs). Below is a plain-language guide to each vehicle’s mechanics, benefits, hazards, and liquidity profiles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {EDUCATIONAL_CONTENT.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.assetClass}
                  className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
                          style={{ backgroundColor: ASSET_CLASS_COLORS[item.assetClass] }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                          <p className="text-xs text-slate-500">{item.subtitle}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                      >
                        {item.assetClass}
                      </span>
                    </div>

                    {/* What it is */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase text-slate-700 block">
                        What It Is
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {item.whatItIs}
                      </p>
                    </div>

                    {/* How it works */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase text-slate-700 block">
                        How It Works
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.howItWorks}
                      </p>
                    </div>

                    {/* Benefits vs Risks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg space-y-1">
                        <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Potential Benefits
                        </span>
                        <ul className="text-[11px] text-emerald-950 space-y-1 list-disc list-inside">
                          {item.potentialBenefits.slice(0, 3).map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg space-y-1">
                        <span className="text-[10px] font-bold uppercase text-rose-800 flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Key Investment Risks
                        </span>
                        <ul className="text-[11px] text-rose-950 space-y-1 list-disc list-inside">
                          {item.keyRisks.slice(0, 3).map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Liquidity Considerations */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <Droplet className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">Liquidity Profile: </span>
                        <span>{item.liquidityConsiderations}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SECTOR EXPOSURE */}
      {activeTab === 'sectors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="font-semibold text-sm text-slate-900 mb-1">
              Sector Concentration Breakdown
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Aggregate portfolio weight per commercial industry & asset category.
            </p>

            <div className="space-y-3">
              {summary.sectorAllocation.map((s) => (
                <div key={s.sector} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{s.sector}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-slate-500">{formatCurrency(s.marketValue, currency)}</span>
                      <span className="font-bold text-teal-700 w-12 text-right">{s.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(s.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Holdings Grid */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-slate-900">
                Asset Allocation Filter & Card Matrix
              </h3>
              <div className="flex items-center gap-1">
                {(['All', 'Equity', 'Bond', 'REIT', 'InvIT'] as const).map((ac) => (
                  <button
                    key={ac}
                    onClick={() => setSelectedAssetClass(ac)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      selectedAssetClass === ac
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {ac}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredList.map((h) => (
                <div
                  key={h.symbol}
                  onClick={() => setInspectedHolding(h)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-xs transition-all cursor-pointer bg-slate-50/40 hover:bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold font-mono text-sm text-slate-900">{h.symbol}</span>
                        <span
                          className="px-1.5 py-0.2 text-[10px] rounded font-semibold"
                          style={{
                            backgroundColor: `${ASSET_CLASS_COLORS[h.assetClass]}20`,
                            color: ASSET_CLASS_COLORS[h.assetClass],
                          }}
                        >
                          {h.assetClass}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{h.securityName}</p>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-800">
                      {formatCurrency(h.totalMarketValue, currency)}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{h.sector || 'Unassigned'}</span>
                    <span className={h.unrealizedPL >= 0 ? 'text-emerald-600 font-semibold font-mono' : 'text-rose-600 font-semibold font-mono'}>
                      {h.unrealizedPL >= 0 ? '+' : ''}{h.unrealizedPLPercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: YIELD & DEBT MATRIX */}
      {activeTab === 'yields' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                High-Yield & Contractual Income Assets
              </h3>
              <p className="text-xs text-slate-500">
                Bonds, Sovereign Debt, Real Estate Trusts (REITs), and Infrastructure Trusts (InvITs)
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
              {yieldAssets.length} Cash-Flow Generating Positions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Vehicle Type</th>
                  <th className="py-2.5 px-3 text-right">Market Value</th>
                  <th className="py-2.5 px-3 text-right">Yield / Coupon</th>
                  <th className="py-2.5 px-3 text-right">Est. Annual Cashflow</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {yieldAssets.map((h) => {
                  const effectiveYield = h.annualDividendYield || 0;
                  const estimatedIncome = (h.totalMarketValue * effectiveYield) / 100;
                  return (
                    <tr key={h.symbol} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3">
                        <span className="font-bold font-mono text-slate-900">{h.symbol}</span>
                        <div className="text-slate-500 truncate max-w-xs">{h.securityName}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${ASSET_CLASS_COLORS[h.assetClass]}15`,
                            color: ASSET_CLASS_COLORS[h.assetClass],
                          }}
                        >
                          {h.assetClass}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(h.totalMarketValue, currency)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-teal-700">
                        {effectiveYield > 0 ? `${effectiveYield.toFixed(2)}%` : 'Capital Return'}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(estimatedIncome, currency)}/yr
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setInspectedHolding(h)}
                          className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MULTI-SOURCE OVERLAP */}
      {activeTab === 'overlap' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Cross-Account Holdings Reconciliation
            </h3>
            <p className="text-xs text-slate-500">
              Securities held across 2 or more distinct brokers or clearing depositories.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {multiSourceHoldings.map((h) => (
              <div
                key={h.symbol}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold font-mono text-base text-slate-900">{h.symbol}</span>
                    <p className="text-xs text-slate-600">{h.securityName}</p>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-teal-100 text-teal-800 rounded-md border border-teal-200">
                    Split Across {h.sourceContributions.length} Sources
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  {h.sourceContributions.map((sc) => (
                    <div
                      key={sc.sourceId}
                      className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200/80"
                    >
                      <span className="font-semibold text-slate-800">{sc.sourceName}</span>
                      <div className="font-mono text-slate-700 flex items-center gap-2">
                        <span>{sc.quantity} units</span>
                        <span>•</span>
                        <span className="font-bold">{formatCurrency(sc.marketValue, currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Blended Weighted Avg Cost:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(h.weightedAvgCost, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
