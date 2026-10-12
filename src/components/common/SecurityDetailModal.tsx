import React from 'react';
import { X, Layers, CheckCircle2, ShieldCheck, PieChart, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, formatPercentage, ASSET_CLASS_COLORS } from '../../utils/calculations';

export const SecurityDetailModal: React.FC = () => {
  const { inspectedHolding, setInspectedHolding, currency, summary } = usePortfolio();

  if (!inspectedHolding) return null;

  const h = inspectedHolding;
  const isPositive = h.unrealizedPL >= 0;
  const portfolioWeight = summary.totalMarketValue > 0 ? (h.totalMarketValue / summary.totalMarketValue) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-inner font-mono text-base shrink-0"
              style={{ backgroundColor: ASSET_CLASS_COLORS[h.assetClass] || '#2563eb' }}
            >
              {h.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl tracking-tight text-white">{h.securityName}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white/10 text-teal-300">
                  {h.symbol}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
                <span>{h.assetClass}</span>
                {h.sector && <span>• {h.sector}</span>}
                {h.isin && <span className="font-mono text-slate-400">• ISIN: {h.isin}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => setInspectedHolding(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Total Quantity
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
                {h.totalQuantity.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400">Aggregated Units</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Weighted Cost
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
                {formatCurrency(h.weightedAvgCost, currency)}
              </span>
              <span className="text-[11px] text-slate-400">Blended Basis</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Current Price
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
                {formatCurrency(h.currentPrice, currency)}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Live Feed
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Portfolio Weight
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
                {portfolioWeight.toFixed(2)}%
              </span>
              <span className="text-[11px] text-slate-400">Of Total Net Worth</span>
            </div>
          </div>

          {/* Value & Return Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 text-white flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-300 font-medium">Consolidated Market Value</p>
              <p className="text-2xl font-bold font-mono tracking-tight text-white mt-0.5">
                {formatCurrency(h.totalMarketValue, currency)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Invested Cost Basis: {formatCurrency(h.totalInvestedValue, currency)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-slate-300 font-medium">Unrealized Net P/L</p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5">
                {isPositive ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-rose-400" />
                )}
                <span
                  className={`text-2xl font-bold font-mono ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {formatCurrency(h.unrealizedPL, currency)}
                </span>
              </div>
              <span
                className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md mt-1 ${
                  isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {formatPercentage(h.unrealizedPLPercentage)}
              </span>
            </div>
          </div>

          {/* Price Conflict Flag Banner */}
          {h.hasPriceConflict && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <span className="font-bold text-amber-800 shrink-0">⚠️ Flagged Divergence:</span>
              <span>{h.priceConflictNote}</span>
            </div>
          )}

          {/* Multi-source Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                Source Allocation Breakdown
                {h.isMultiSource && (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                    Unified Across {h.sourceContributions.length} Data Sources
                  </span>
                )}
              </h4>
              <span className="text-xs text-slate-400">
                Reconciled by symbol & ISIN
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {h.sourceContributions.map((sc) => {
                const sourceShare =
                  h.totalMarketValue > 0 ? (sc.marketValue / h.totalMarketValue) * 100 : 0;
                return (
                  <div key={sc.sourceId} className="p-3.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800">{sc.sourceName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded">
                          {sc.sourceId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 font-mono">
                        <span>Units: {sc.quantity.toLocaleString()}</span>
                        <span>•</span>
                        <span>Cost: {formatCurrency(sc.averageCost, currency)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-semibold text-sm text-slate-900">
                        {formatCurrency(sc.marketValue, currency)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {sourceShare.toFixed(1)}% of position
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Quality and Compliance */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 space-y-1">
              <p className="font-semibold">Deterministic Accounting Verification</p>
              <p className="text-blue-700 leading-relaxed">
                Cost basis is calculated using weighted volume averaging across independent broker clearing statements.
                Asset prices are matched to reference exchange closing quotes. All figures are verified.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-700 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            {h.assetClass} • {h.annualDividendYield ? `Yield: ${h.annualDividendYield}%` : 'Standard Exposure'}
          </span>
          <button
            onClick={() => setInspectedHolding(null)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
