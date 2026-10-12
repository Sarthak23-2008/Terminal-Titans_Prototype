import React from 'react';
import {
  Layers,
  Plus,
  ArrowUpDown,
  Download,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { HoldingsTable } from '../dashboard/HoldingsTable';
import { formatCurrency, formatPercentage } from '../../utils/calculations';

export const MyInvestmentsScreen: React.FC = () => {
  const {
    summary,
    currency,
    setIsAddModalOpen,
    viewMode,
    setViewMode,
  } = usePortfolio();

  const isPlPositive = summary.totalUnrealizedPL >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Summary */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">My Investments</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Deterministic Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated investment holdings with weighted volume-average pricing and cross-account reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            Add Manual Holding
          </button>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Current Portfolio Value
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">
            {formatCurrency(summary.totalMarketValue, currency)}
          </span>
          <span className="text-[11px] text-slate-400">Total liquid & fixed assets</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Cost Basis (Invested)
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">
            {formatCurrency(summary.totalInvestedValue, currency)}
          </span>
          <span className="text-[11px] text-slate-400">Net capital deployed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Total Unrealized P/L
          </span>
          <span
            className={`text-xl font-bold font-mono mt-0.5 block ${
              isPlPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {isPlPositive ? '+' : ''}
            {formatCurrency(summary.totalUnrealizedPL, currency)}
          </span>
          <span
            className={`text-[11px] font-mono font-medium ${
              isPlPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatPercentage(summary.totalUnrealizedPLPercent)} All-time Gain
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Distinct Securities
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">
            {summary.consolidatedHoldingsCount} Securities
          </span>
          <span className="text-[11px] text-teal-600 font-medium">
            Unified across {summary.sourceCount} sources
          </span>
        </div>
      </div>

      {/* Multi-account Consolidation Explainer Callout */}
      <div className="bg-teal-50/70 border border-teal-200/70 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-950 space-y-1">
          <p className="font-semibold text-teal-900">
            How Invest360 Solves Multi-Broker Fragmentation:
          </p>
          <p className="text-teal-800 leading-relaxed">
            When you hold the same security in multiple accounts (e.g. <strong>MSFT</strong> in Broker A and Broker B, or <strong>NVDA</strong> in Broker A and Depository CAS), Invest360 automatically consolidates them into a single line item with volume-weighted average cost calculation:
            <code className="bg-teal-100/80 text-teal-900 px-1.5 py-0.5 rounded ml-1 font-mono text-[11px]">
              Weighted Cost = ∑(Qty × Cost) / ∑(Qty)
            </code>
            . You can toggle between <strong>Consolidated</strong> and <strong>By Source</strong> at any time.
          </p>
        </div>
      </div>

      {/* Complete Interactive Holdings Table */}
      <HoldingsTable showFullControls={true} />
    </div>
  );
};
