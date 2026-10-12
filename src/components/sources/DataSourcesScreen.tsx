import React, { useState } from 'react';
import {
  Database,
  Building2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Unlink,
  Plus,
  ExternalLink,
  ShieldCheck,
  Clock,
  Layers,
  FileSpreadsheet,
  Trash2,
  AlertCircle,
  FileText,
  Info,
  ArrowRight,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';

export const DataSourcesScreen: React.FC = () => {
  const {
    dataSources,
    importBatches,
    syncSource,
    unlinkSource,
    removeImportBatch,
    setActiveScreen,
    setSelectedSourceFilter,
    resetToSample,
  } = usePortfolio();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedNewBroker, setSelectedNewBroker] = useState('Interactive Brokers');
  const [removedNotice, setRemovedNotice] = useState<string | null>(null);

  const handleSync = (id: string) => {
    syncSource(id);
  };

  const handleViewHoldings = (id: string) => {
    setSelectedSourceFilter(id);
    setActiveScreen('investments');
  };

  const handleRemoveBatch = (batchId: string, fileName: string) => {
    if (
      confirm(
        `Are you sure you want to remove import batch "${fileName}"? This will safely remove all holdings ingested from this file and recalculate your entire portfolio metrics.`
      )
    ) {
      removeImportBatch(batchId);
      setRemovedNotice(`Successfully removed import "${fileName}". Portfolio metrics recalculated.`);
      setTimeout(() => setRemovedNotice(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Data Sources & Import History
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Multi-Source Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage connected broker accounts, depository statements, file import batches, and recalculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetToSample}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Initial Batches
          </button>
          <button
            onClick={() => setActiveScreen('import')}
            className="px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            Import New File
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {removedNotice && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{removedNotice}</span>
        </div>
      )}

      {/* Section 1: Connected Accounts / Brokers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">Connected Accounts & Depository Feeds</h3>
          <span className="text-xs text-slate-500">
            {dataSources.filter((s) => s.status === 'connected').length} Active Feeds
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataSources.map((source) => {
            const isConnected = source.status === 'connected';
            const isSyncing = source.status === 'syncing';

            return (
              <div
                key={source.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                          source.type === 'Broker'
                            ? 'bg-blue-900 text-white'
                            : source.type === 'Depository'
                            ? 'bg-purple-900 text-white'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        {source.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-slate-900">{source.name}</h3>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {source.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {source.provider} • {source.accountNumberMasked}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isSyncing
                          ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isConnected
                            ? 'bg-emerald-500'
                            : isSyncing
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      {isSyncing ? 'Syncing...' : isConnected ? 'Active' : 'Disconnected'}
                    </span>
                  </div>

                  {source.notes && (
                    <p className="text-xs text-slate-600 mt-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {source.notes}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Last Sync: {source.lastSynced}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {source.holdingsCount} Line Items
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      onClick={() => handleViewHoldings(source.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      View Holdings
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSync(source.id)}
                        disabled={isSyncing}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-600' : ''}`} />
                        Sync Feed
                      </button>

                      {source.id !== 'manual' && (
                        <button
                          onClick={() => {
                            if (confirm(`Unlink ${source.name}? This will remove its imported holdings.`)) {
                              unlinkSource(source.id);
                            }
                          }}
                          title="Unlink Source"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Imported Statement & Batch History */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              Imported File Batches & Ingestion History
            </h3>
            <p className="text-xs text-slate-500">
              Every import preserves filename, source ID, record counts, and allows safe revocation with metric recalculation.
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
            {importBatches.length} Total Import Batches
          </span>
        </div>

        {importBatches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active file batches. Use the CSV Ingestion tab to upload statements.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Imported File Name</th>
                  <th className="py-2.5 px-3">Target Source Account</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Accepted Rows</th>
                  <th className="py-2.5 px-3 text-right">Rejected Rows</th>
                  <th className="py-2.5 px-3">Import Status</th>
                  <th className="py-2.5 px-3">Validation & Warnings</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="font-mono font-bold text-slate-900">{batch.fileName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{batch.sourceName}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ID: {batch.sourceId}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                      {batch.timestamp}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {batch.acceptedRows}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-rose-600">
                      {batch.rejectedRows}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          batch.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {batch.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5 max-w-xs">
                        {batch.warnings.map((w, idx) => (
                          <span
                            key={idx}
                            className="inline-block text-[10px] text-slate-600 bg-slate-100 rounded px-1.5 py-0.2 mr-1"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleRemoveBatch(batch.id, batch.fileName)}
                        className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-md font-semibold transition-colors flex items-center gap-1 ml-auto"
                        title="Safely remove this import and recalculate portfolio"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Import
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safe Recalculation Explainer Card */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex items-start gap-3">
        <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1 text-xs text-slate-300">
          <h4 className="font-semibold text-sm text-white">Safe Revocation & State Recalculation</h4>
          <p className="leading-relaxed text-slate-300">
            When an import is removed, all individual lots tagged with that file’s batch ID are purged. Invest360 immediately re-aggregates volume-weighted average costs, updates asset allocations, recalculates top-three concentration, and updates unrealized profit/loss deterministically.
          </p>
        </div>
      </div>
    </div>
  );
};
