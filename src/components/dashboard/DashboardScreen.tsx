import React from 'react';
import {
  Wallet,
  TrendingUp,
  PieChart,
  Layers,
  Database,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { StatCard } from '../common/StatCard';
import { AllocationChart } from './AllocationChart';
import { HoldingsTable } from './HoldingsTable';
import { formatCurrency, formatPercentage } from '../../utils/calculations';

export const DashboardScreen: React.FC = () => {
  const { summary, currency, setActiveScreen, resetToSample, dataSources } = usePortfolio();

  const isPlPositive = summary.totalUnrealizedPL >= 0;

  return (
    <div className="space-y-6">
      {/* Illustrative Notice Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 text-white rounded-2xl p-5 shadow-sm border border-teal-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-teal-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30">
                FinTech Hackathon Phase 1
              </span>
              <span className="text-xs text-slate-400 font-mono">Unified Intelligence</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              All Your Investments. One Clear View.
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Consolidating active holdings across Broker A, Broker B, and National Depository into a
              unified, deterministic view with automated multi-account reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={resetToSample}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs transition-colors border border-white/10"
              title="Reset data to default multi-broker hackathon sample"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Sample
            </button>
            <button
              onClick={() => setActiveScreen('insights')}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              Scan Insights
            </button>
          </div>
        </div>
      </div>

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Portfolio Value */}
        <StatCard
          title="Total Portfolio Value"
          value={formatCurrency(summary.totalMarketValue, currency)}
          subtitle={`Invested: ${formatCurrency(summary.totalInvestedValue, currency)}`}
          badge="Unified"
          badgeType="accent"
          icon={Wallet}
          iconBg="bg-blue-900 text-white"
          tooltip="Aggregated current market value across all connected accounts"
        />

        {/* Unrealized P/L */}
        <StatCard
          title="Unrealized Net P/L"
          value={`${isPlPositive ? '+' : ''}${formatCurrency(summary.totalUnrealizedPL, currency)}`}
          subtitle={`Return: ${formatPercentage(summary.totalUnrealizedPLPercent)}`}
          badge={formatPercentage(summary.totalUnrealizedPLPercent)}
          badgeType={isPlPositive ? 'positive' : 'negative'}
          icon={TrendingUp}
          iconBg={isPlPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}
          tooltip="Total unrealized profit/loss across all positions"
        />

        {/* Top-3 Holdings Concentration */}
        <StatCard
          title="Top 3 Concentration"
          value={`${summary.topThreeConcentration}%`}
          subtitle={
            summary.topThreeHoldings.length > 0
              ? `${summary.topThreeHoldings.map((h) => h.symbol).join(', ')}`
              : 'No assets'
          }
          badge={summary.topThreeConcentration > 45 ? 'Elevated' : 'Optimal'}
          badgeType={summary.topThreeConcentration > 45 ? 'negative' : 'positive'}
          icon={ShieldAlert}
          iconBg={summary.topThreeConcentration > 45 ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}
          tooltip="Combined percentage weight of your top 3 largest holdings"
          onClick={() => setActiveScreen('insights')}
        />

        {/* Accounts & Holdings Count */}
        <StatCard
          title="Coverage & Assets"
          value={`${summary.consolidatedHoldingsCount} Assets`}
          subtitle={`${summary.holdingsCount} line items across ${summary.sourceCount} sources`}
          badge={`${summary.sourceCount} Connected`}
          badgeType="neutral"
          icon={Database}
          iconBg="bg-purple-50 text-purple-600"
          tooltip="Click to view connected data sources"
          onClick={() => setActiveScreen('sources')}
        />
      </div>

      {/* Middle Row: Asset Allocation Chart + Portfolio Concentration & Top Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Asset Allocation Donut Chart */}
        <div className="lg:col-span-7">
          <AllocationChart />
        </div>

        {/* Concentration & Performance Card */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Portfolio Concentration</h3>
                  <p className="text-xs text-slate-600">Top 3 securities exposure</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-slate-900">
                {summary.topThreeConcentration}% of net worth
              </span>
            </div>

            {/* Top 3 List */}
            <div className="my-4 space-y-3">
              {summary.topThreeHoldings.map((h, idx) => (
                <div key={h.symbol} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-bold font-mono text-slate-900">{h.symbol}</span>
                      <span className="text-slate-600 truncate max-w-[120px]">{h.securityName}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-800">{formatCurrency(h.marketValue, currency)}</span>
                      <span className="font-bold text-teal-600">{h.percentage}%</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-500 h-full rounded-full"
                      style={{ width: `${Math.min(h.percentage * 2, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Performance Winners & Laggards */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            {summary.bestPerformer && (
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] uppercase font-semibold text-emerald-800 block">
                  Top Outperformer
                </span>
                <span className="font-bold font-mono text-slate-900 text-xs">
                  {summary.bestPerformer.symbol}
                </span>
                <span className="text-emerald-700 font-mono font-bold text-xs ml-1.5">
                  {formatPercentage(summary.bestPerformer.plPercent)}
                </span>
              </div>
            )}

            {summary.worstPerformer && (
              <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100">
                <span className="text-[10px] uppercase font-semibold text-rose-800 block">
                  Laggard Asset
                </span>
                <span className="font-bold font-mono text-slate-900 text-xs">
                  {summary.worstPerformer.symbol}
                </span>
                <span className="text-rose-700 font-mono font-bold text-xs ml-1.5">
                  {formatPercentage(summary.worstPerformer.plPercent)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Holdings Table */}
      <HoldingsTable showFullControls={true} />

      {/* Connected Source Strip */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <Database className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">
              Active Data Feeds ({dataSources.filter((s) => s.status === 'connected').length} of{' '}
              {dataSources.length} synchronized)
            </p>
            <p className="text-[11px] text-slate-600">
              Broker A (Alpha Securities), Broker B (Apex Trade), and National Depository CAS
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveScreen('sources')}
          className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors"
        >
          Manage Data Sources <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
