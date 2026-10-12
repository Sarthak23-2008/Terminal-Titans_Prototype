import React, { useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  DollarSign,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Shield,
  Layers,
  CheckCircle2,
  FileCode,
  Database,
  Lock,
  AlertTriangle,
  Info,
  Server,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { getStorageStatus, SUPABASE_MIGRATION_SQL } from '../../utils/supabaseClient';

export const SettingsScreen: React.FC = () => {
  const {
    currency,
    setCurrency,
    resetToSample,
    clearAllHoldings,
    holdings,
    dataSources,
    importBatches,
    importHoldings,
  } = usePortfolio();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMigrationSql, setShowMigrationSql] = useState(false);
  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false);

  const storageStatus = getStorageStatus();

  const handleExportJSON = () => {
    const backup = {
      app: 'Invest360',
      version: '2.0.0-phase2',
      exportedAt: new Date().toISOString(),
      currency,
      holdings,
      dataSources,
      importBatches,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Invest360_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit for secure browser parsing.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.holdings)) {
          importHoldings(parsed.holdings);
          alert(`Successfully restored ${parsed.holdings.length} holdings from backup!`);
        } else {
          alert('Invalid backup structure. Expected holdings array.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadMigrationSQL = () => {
    const blob = new Blob([SUPABASE_MIGRATION_SQL], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '20261011_invest360_supabase_migration.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Platform Settings, Storage & Data Controls
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure financial display parameters, regional currencies, database migrations, and confirmed session resets.
        </p>
      </div>

      {/* Supabase Storage & Persistence Architecture */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Storage & Database Architecture
              </h3>
              <p className="text-xs text-slate-500">
                PostgreSQL persistence status and tenant Row-Level Security (RLS)
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${storageStatus.badgeColor}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                storageStatus.isCloudActive ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {storageStatus.badgeLabel}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {storageStatus.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-600" /> Tenant Row-Level Security (RLS)
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              When Supabase PostgreSQL credentials are provided, every table applies strict <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">auth.uid() = user_id</code> policies preventing any cross-user data visibility.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-600" /> Verified Demo Mode
            </span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              In demo mode without cloud secrets, state seamlessly persists to local storage across browser refreshes and sessions. No fake cloud connections are reported.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
          <button
            onClick={() => setShowMigrationSql(!showMigrationSql)}
            className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
          >
            <FileCode className="w-3.5 h-3.5" />
            {showMigrationSql ? 'Hide Migration SQL' : 'View PostgreSQL Migration Script'}
          </button>

          <button
            onClick={handleDownloadMigrationSQL}
            className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Download Migration .sql
          </button>
        </div>

        {showMigrationSql && (
          <div className="mt-2">
            <pre className="p-4 bg-slate-950 text-slate-300 rounded-xl text-xs font-mono overflow-x-auto max-h-64 border border-slate-800 leading-relaxed select-all">
              {SUPABASE_MIGRATION_SQL}
            </pre>
          </div>
        )}
      </div>

      {/* Regional & Currency Preferences */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Currency & Display Locale</h3>
            <p className="text-xs text-slate-500">Choose your base currency for portfolio calculations</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
              { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR)' },
              { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
              { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
            ] as const
          ).map((c) => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                currency === c.code
                  ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="text-xl font-bold font-mono text-slate-900">{c.symbol}</div>
              <div className="text-xs font-semibold text-slate-800 mt-1">{c.code}</div>
              <div className="text-[11px] text-slate-500">{c.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Backup and Data Management */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Backup & Session Snapshot</h3>
            <p className="text-xs text-slate-500">Export and import local backup snapshots</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportJSON}
            className="p-3.5 border border-slate-200 hover:border-teal-500 rounded-xl text-left bg-slate-50/50 hover:bg-white transition-all space-y-1"
          >
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
              <Download className="w-4 h-4 text-teal-600" />
              Export Portfolio JSON Snapshot
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Download your complete unified portfolio records, weighted costs, import batches, and data sources.
            </p>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 border border-slate-200 hover:border-teal-500 rounded-xl text-left bg-slate-50/50 hover:bg-white transition-all space-y-1"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJSON}
            />
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
              <Upload className="w-4 h-4 text-blue-600" />
              Restore from JSON Backup
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Upload a previously exported Invest360 state file to restore holdings and accounts. (Restricted to 10MB).
            </p>
          </button>
        </div>

        {/* Confirmed Demo Reset Section */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <button
            onClick={() => setShowConfirmResetModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
            Reset Platform to Benchmark Demo State
          </button>

          <button
            onClick={() => {
              if (confirm('Clear all portfolio data? This will empty all holding records and import batches.')) {
                clearAllHoldings();
              }
            }}
            className="w-full sm:w-auto px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            Clear All Data
          </button>
        </div>
      </div>

      {/* Security & Data Governance Guarantees */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-400" />
          <h3 className="font-semibold text-sm">FinTech Security & Non-Custodial Architecture</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Invest360 operates on strict read-only principles. The platform never requests, stores, or handles broker passwords, trading credentials, or withdrawal keys. File uploads are validated with 10MB limits, and all financial metrics are computed deterministically before reaching any explanation models.
        </p>
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap gap-4">
          <span>• Server-side API key containment</span>
          <span>• Zero hallucinatory figures</span>
          <span>• Client-side tenant isolation</span>
          <span>• Confirmed state resets</span>
        </div>
      </div>

      {/* Confirmed Demo Reset Modal */}
      {showConfirmResetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">Confirm Demo Reset</h3>
                <p className="text-xs text-slate-500">Restore clean hackathon benchmark</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will reset all active holdings, data sources, and import batches back to the verified FinTech Hackathon benchmark portfolio (15 holdings spanning Broker A, Broker B, and National Depository CAS across Equities, Bonds, REITs, and InvITs).
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmResetModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetToSample();
                  setShowConfirmResetModal(false);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Confirm & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
