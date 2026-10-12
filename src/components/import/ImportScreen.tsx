import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database,
  Download,
  Building2,
  RefreshCw,
  FileText,
  Trash2,
  Layers,
  ArrowRight,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  HelpCircle,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  autoDetectColumnMapping,
  parseCSVLines,
  runNormalizationPipeline,
  STANDARD_COLUMN_DEFINITIONS,
} from '../../utils/normalizationEngine';
import {
  DataSourceId,
  PipelineSummary,
  StandardFieldKey,
} from '../../types/investment';
import { formatCurrency } from '../../utils/calculations';

// Pre-packaged test datasets for judges and users
const SAMPLE_TEST_CSVS = {
  standard: `Symbol,Security Name,Asset Class,Quantity,Average Cost,Current Price,Sector,ISIN
TSLA,Tesla Inc.,Equity,25,210.50,228.00,Clean Tech,US88160R1014
GOOGL,Alphabet Inc.,Equity,18,162.00,175.50,Technology,US02079K3059
BND,Vanguard Total Bond ETF,Bond,100,72.50,74.20,Fixed Income,US9219378356
EQIX,Equinix Digital REIT,REIT,12,785.00,812.00,Data Centers,US29444U7000
IIFL-INVIT,India Infrastructure InvIT,InvIT,200,94.00,105.00,Renewable Energy,INE123A45012`,

  aliases: `Ticker,Company Name,Type,Units,Buy Price,CMP,Market,Yield
NFLX,Netflix Inc,Common Stock,15,640.00,685.20,NASDAQ,0.0
COST,Costco Wholesale Corp,Shares,20,820.00,855.00,NASDAQ,0.55
UST-20Y,US Treasury 20-Year Bond,Govt Debt,75,96.50,99.20,US Govt,4.5
WELL,Welltower Healthcare REIT,Real Estate Trust,80,95.00,104.50,NYSE,2.8`,

  withErrors: `Symbol,Security Name,Asset Class,Quantity,Average Cost,Current Price,Notes
NVDA,NVIDIA Corporation,Equity,30,115.00,135.00,Valid regular lot
,Missing Ticker Corporation,Equity,50,45.00,48.00,Error: missing symbol
AMD,Advanced Micro Devices,Equity,-10,140.00,152.00,Error: negative quantity
INTC,Intel Corporation,Equity,40,INVALID_NUM,23.50,Error: non-numeric cost
NVDA,NVIDIA Corporation,Equity,15,120.00,135.00,Duplicate symbol in file
ORCL,Oracle Corporation,Equity,35,160.00,,Warning: missing current price`,
};

export const ImportScreen: React.FC = () => {
  const {
    dataSources,
    holdings,
    importFromPipeline,
    resetToSample,
    clearAllHoldings,
    setActiveScreen,
    currency,
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState<'csv' | 'brokers' | 'cas'>('csv');
  const [csvContent, setCsvContent] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [selectedSourceId, setSelectedSourceId] = useState<DataSourceId>('manual');

  // Step 2 & 3 State
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRawRows, setParsedRawRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<StandardFieldKey, string>>({
    symbol: '',
    securityName: '',
    quantity: '',
    averageCost: '',
    currentPrice: '',
    assetClass: '',
    isin: '',
    sector: '',
    exchange: '',
    annualDividendYield: '',
  });

  const [filterPreviewStatus, setFilterPreviewStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all');
  const [importSuccessBatchId, setImportSuccessBatchId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse raw text whenever file changes
  const handleLoadCsvContent = (content: string, fileName: string) => {
    setCsvContent(content);
    setUploadedFileName(fileName);
    setImportSuccessBatchId(null);

    const { headers, rows } = parseCSVLines(content);
    setParsedHeaders(headers);
    setParsedRawRows(rows);

    // Auto-detect column mapping
    const detected = autoDetectColumnMapping(headers);
    setColumnMapping(detected);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleLoadCsvContent(text, file.name);
    };
    reader.readAsText(file);
  };

  // Re-run pipeline whenever rows or mapping change
  const pipelineResult: PipelineSummary | null = useMemo(() => {
    if (parsedRawRows.length === 0) return null;
    return runNormalizationPipeline(
      parsedHeaders,
      parsedRawRows,
      columnMapping,
      selectedSourceId,
      holdings
    );
  }, [parsedHeaders, parsedRawRows, columnMapping, selectedSourceId, holdings]);

  // Handle confirming the import
  const handleConfirmImport = () => {
    if (!pipelineResult) return;

    const validRows = pipelineResult.rows
      .filter((r) => r.status !== 'error' && r.normalizedHolding)
      .map((r) => r.normalizedHolding!);

    if (validRows.length === 0) {
      alert('No valid records to import. Please resolve row errors or check your column mappings.');
      return;
    }

    const sourceObj = dataSources.find((s) => s.id === selectedSourceId);
    const sourceName = sourceObj ? sourceObj.name : selectedSourceId;

    const warningsList: string[] = [];
    if (pipelineResult.warningCount > 0) {
      warningsList.push(`${pipelineResult.warningCount} rows had minor normalization adjustments`);
    }
    if (pipelineResult.duplicateCount > 0) {
      warningsList.push(`${pipelineResult.duplicateCount} duplicate securities flagged`);
    }
    if (pipelineResult.errorCount > 0) {
      warningsList.push(`${pipelineResult.errorCount} invalid rows were safely excluded`);
    }

    const createdBatch = importFromPipeline(
      {
        fileName: uploadedFileName || 'imported_portfolio.csv',
        sourceId: selectedSourceId,
        sourceName,
        totalRows: pipelineResult.totalRows,
        acceptedRows: validRows.length,
        rejectedRows: pipelineResult.errorCount,
        duplicateRows: pipelineResult.duplicateCount,
        warnings: warningsList,
      },
      validRows
    );

    setImportSuccessBatchId(createdBatch.id);
  };

  // Filter preview table rows
  const filteredPreviewRows = useMemo(() => {
    if (!pipelineResult) return [];
    if (filterPreviewStatus === 'all') return pipelineResult.rows;
    if (filterPreviewStatus === 'valid') return pipelineResult.rows.filter((r) => r.status === 'valid');
    if (filterPreviewStatus === 'warning') return pipelineResult.rows.filter((r) => r.status === 'warning');
    if (filterPreviewStatus === 'error') return pipelineResult.rows.filter((r) => r.status === 'error');
    return pipelineResult.rows;
  }, [pipelineResult, filterPreviewStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                CSV Ingestion & Normalization Pipeline
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                INPUT → VALIDATE → NORMALIZE → DEDUPLICATE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Upload external holdings with automated column alias mapping, row-level validation, and duplicate detection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetToSample}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Benchmark
            </button>
            <button
              onClick={() => {
                if (confirm('Clear all holdings?')) clearAllHoldings();
              }}
              className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('csv')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'csv'
              ? 'border-teal-500 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          CSV Import & Column Mapping
        </button>

        <button
          onClick={() => setActiveTab('brokers')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'brokers'
              ? 'border-teal-500 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Direct Broker Feeds
        </button>

        <button
          onClick={() => setActiveTab('cas')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'cas'
              ? 'border-teal-500 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          Depository CAS Statements
        </button>
      </div>

      {/* TAB 1: CSV WORKFLOW */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          {/* Success Banner if Import Confirmed */}
          {importSuccessBatchId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Portfolio Ingestion Completed Successfully!</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {pipelineResult?.validCount} verified holdings were ingested into Invest360 and consolidated with your net worth.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveScreen('dashboard')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  View Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveScreen('sources')}
                  className="px-3 py-2 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                >
                  View Batch in Data Sources
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Upload or Choose Sample File */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">1. Select or Upload CSV Statement</h3>
                  <p className="text-xs text-slate-500">Supports standard headers and common broker aliases</p>
                </div>

                {uploadedFileName && (
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                    File: {uploadedFileName}
                  </span>
                )}
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 hover:bg-teal-50/20 rounded-xl p-6 text-center cursor-pointer transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <UploadCloud className="w-8 h-8 text-teal-600 mx-auto mb-1.5" />
                <p className="text-sm font-semibold text-slate-800">
                  Click to select CSV from your computer
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aliases supported: Qty, Units, Shares, CMP, LTP, Buy Price, Cost Basis, Scrip, Type
                </p>
              </div>

              {/* Pre-packaged Test Scenarios for Demonstration */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Quick Hackathon Test Scenarios:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() =>
                      handleLoadCsvContent(
                        SAMPLE_TEST_CSVS.standard,
                        'benchmark_multiclass_portfolio.csv'
                      )
                    }
                    className="p-2.5 text-left border border-slate-200 hover:border-teal-500 rounded-lg text-xs bg-slate-50/60 hover:bg-white transition-all"
                  >
                    <span className="font-bold text-slate-900 block">Standard Multi-Asset</span>
                    <span className="text-[10px] text-slate-500">Equities, Bonds, REIT, InvIT</span>
                  </button>

                  <button
                    onClick={() =>
                      handleLoadCsvContent(
                        SAMPLE_TEST_CSVS.aliases,
                        'broker_alternative_aliases.csv'
                      )
                    }
                    className="p-2.5 text-left border border-slate-200 hover:border-teal-500 rounded-lg text-xs bg-slate-50/60 hover:bg-white transition-all"
                  >
                    <span className="font-bold text-slate-900 block">Alternative Column Aliases</span>
                    <span className="text-[10px] text-slate-500">Units, CMP, Buy Price, Scrip</span>
                  </button>

                  <button
                    onClick={() =>
                      handleLoadCsvContent(
                        SAMPLE_TEST_CSVS.withErrors,
                        'edge_cases_and_bad_rows.csv'
                      )
                    }
                    className="p-2.5 text-left border border-slate-200 hover:border-rose-400 rounded-lg text-xs bg-rose-50/30 hover:bg-white transition-all"
                  >
                    <span className="font-bold text-rose-800 block">Validation & Error Stress</span>
                    <span className="text-[10px] text-rose-600">Bad numbers, duplicates, missing</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Target Account Selector */}
            <div className="md:col-span-4 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Target Broker / Depository</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign imported lots to an active account:
                </p>

                <div className="mt-3 space-y-2">
                  {dataSources.map((ds) => (
                    <label
                      key={ds.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        selectedSourceId === ds.id
                          ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="targetSource"
                          value={ds.id}
                          checked={selectedSourceId === ds.id}
                          onChange={() => setSelectedSourceId(ds.id)}
                          className="accent-teal-600"
                        />
                        <span className="text-xs font-semibold text-slate-800">{ds.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {ds.type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-blue-900">
                <span className="font-semibold block">Client-Side Non-Silent Guarantee</span>
                <p className="text-blue-700 mt-0.5 leading-relaxed">
                  Every row is evaluated by the normalization pipeline. Invalid data is explicitly flagged with row error chips and never silently discarded.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Interactive Column Mapping */}
          {parsedHeaders.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">
                      2. Column Alias Mapping & Schema Matching
                    </h3>
                    <p className="text-xs text-slate-500">
                      Auto-detected from file headers; adjust dropdowns if custom headers are used
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setColumnMapping(autoDetectColumnMapping(parsedHeaders))}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Re-detect Aliases
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {STANDARD_COLUMN_DEFINITIONS.map((def) => {
                  const currentMappedHeader = columnMapping[def.key];
                  const isMapped = !!currentMappedHeader;

                  return (
                    <div
                      key={def.key}
                      className={`p-3 rounded-xl border transition-all ${
                        isMapped
                          ? 'border-slate-200 bg-slate-50/50'
                          : def.required
                          ? 'border-rose-300 bg-rose-50/20'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-800">
                          {def.label} {def.required && <span className="text-rose-500">*</span>}
                        </span>
                        {isMapped ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Mapped" />
                        ) : def.required ? (
                          <span className="w-2 h-2 rounded-full bg-rose-500" title="Required" />
                        ) : null}
                      </div>

                      <select
                        value={currentMappedHeader}
                        onChange={(e) =>
                          setColumnMapping({
                            ...columnMapping,
                            [def.key]: e.target.value,
                          })
                        }
                        className="w-full p-1.5 text-xs bg-white border border-slate-300 rounded-md font-medium focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      >
                        <option value="">-- Ignore / Not in CSV --</option>
                        {parsedHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>

                      <span className="block text-[10px] text-slate-400 mt-1 truncate" title={def.description}>
                        {def.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Pipeline Results & Row-Level Validation Inspector */}
          {pipelineResult && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">
                    3. Validation & Ingestion Preview
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inspecting {pipelineResult.totalRows} records before committal to unified ledger
                  </p>
                </div>

                <button
                  onClick={handleConfirmImport}
                  disabled={pipelineResult.validCount === 0}
                  className="px-5 py-2 bg-slate-900 hover:bg-teal-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                >
                  <Check className="w-4 h-4 text-teal-400" />
                  Confirm Import ({pipelineResult.validCount} Accepted Rows)
                </button>
              </div>

              {/* Metrics Pill Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div
                  onClick={() => setFilterPreviewStatus('all')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    filterPreviewStatus === 'all'
                      ? 'border-slate-800 bg-slate-900 text-white'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase block">Total Rows</span>
                  <span className="text-lg font-bold font-mono">{pipelineResult.totalRows}</span>
                </div>

                <div
                  onClick={() => setFilterPreviewStatus('valid')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    filterPreviewStatus === 'valid'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase block text-emerald-800 group-hover:text-white">
                    Valid & Clean
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-900">
                    {pipelineResult.validCount}
                  </span>
                </div>

                <div
                  onClick={() => setFilterPreviewStatus('warning')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    filterPreviewStatus === 'warning'
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase block text-amber-800">
                    Warnings / Normalised
                  </span>
                  <span className="text-lg font-bold font-mono text-amber-900">
                    {pipelineResult.warningCount}
                  </span>
                </div>

                <div
                  onClick={() => setFilterPreviewStatus('error')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    filterPreviewStatus === 'error'
                      ? 'border-rose-600 bg-rose-600 text-white'
                      : 'border-rose-200 bg-rose-50 hover:bg-rose-100'
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase block text-rose-800">
                    Rejected / Errors
                  </span>
                  <span className="text-lg font-bold font-mono text-rose-900">
                    {pipelineResult.errorCount}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-purple-200 bg-purple-50">
                  <span className="text-[10px] font-semibold uppercase block text-purple-800">
                    Duplicates Flagged
                  </span>
                  <span className="text-lg font-bold font-mono text-purple-900">
                    {pipelineResult.duplicateCount}
                  </span>
                </div>
              </div>

              {/* Row Table with Row-Level Errors */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3 w-12">Row</th>
                      <th className="py-2.5 px-3 w-28">Status</th>
                      <th className="py-2.5 px-3">Symbol & Name</th>
                      <th className="py-2.5 px-3 text-right">Units</th>
                      <th className="py-2.5 px-3 text-right">Cost Price</th>
                      <th className="py-2.5 px-3 text-right">Market Price</th>
                      <th className="py-2.5 px-3">Asset Class</th>
                      <th className="py-2.5 px-3">Diagnostics & Validation Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPreviewRows.map((r) => {
                      const isValid = r.status === 'valid';
                      const isWarning = r.status === 'warning';
                      const isError = r.status === 'error';

                      return (
                        <tr
                          key={r.rowIndex}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isError ? 'bg-rose-50/30' : isWarning ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-mono text-slate-400 font-medium">
                            #{r.rowIndex}
                          </td>

                          <td className="py-3 px-3">
                            {isValid && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            )}
                            {isWarning && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                <AlertTriangle className="w-3 h-3" /> Warning
                              </span>
                            )}
                            {isError && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" /> Rejected
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold font-mono text-slate-900 block">
                              {r.normalizedHolding?.symbol || r.rawData[columnMapping.symbol] || '—'}
                            </span>
                            <span className="text-slate-500 text-[11px] truncate block max-w-xs">
                              {r.normalizedHolding?.securityName || r.rawData[columnMapping.securityName] || '—'}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                            {r.normalizedHolding
                              ? r.normalizedHolding.quantity.toLocaleString()
                              : r.rawData[columnMapping.quantity] || '—'}
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {r.normalizedHolding
                              ? formatCurrency(r.normalizedHolding.averageCost, currency)
                              : r.rawData[columnMapping.averageCost] || '—'}
                          </td>

                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                            {r.normalizedHolding
                              ? formatCurrency(r.normalizedHolding.currentPrice, currency)
                              : r.rawData[columnMapping.currentPrice] || '—'}
                          </td>

                          <td className="py-3 px-3">
                            <span className="text-[11px] font-medium text-slate-700">
                              {r.normalizedHolding?.assetClass || '—'}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              {r.errors.map((err, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-800 rounded border border-rose-200 mr-1"
                                >
                                  {err}
                                </span>
                              ))}

                              {r.warnings.map((warn, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-900 rounded border border-amber-200 mr-1"
                                >
                                  {warn}
                                </span>
                              ))}

                              {r.errors.length === 0 && r.warnings.length === 0 && (
                                <span className="text-[11px] text-emerald-700 font-medium">
                                  Clean row • Ready for import
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Broker Feeds */}
      {activeTab === 'brokers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  AS
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">Alpha Securities Prime</h4>
                  <p className="text-xs text-slate-500">Broker A • API Sync Active</p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Account #••••-8492 holds active equity positions including MSFT, AAPL, NVDA, and O REIT.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  AT
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">Apex Trade Partners</h4>
                  <p className="text-xs text-slate-500">Broker B • API Sync Active</p>
                </div>
              </div>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Account #••••-3310 holds equity positions and AAA corporate debt instruments.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: Depository CAS */}
      {activeTab === 'cas' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 max-w-2xl">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Consolidated Account Statement (CAS) Ingestion
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Matches sovereign bonds, government debt, Demat equities, and infrastructure trusts (InvITs) using exact 12-digit ISIN identifiers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
