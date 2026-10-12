import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  AssetClass,
  ConsolidatedHolding,
  DataSource,
  Holding,
  ImportBatch,
  PortfolioSummary,
  ScreenId,
  StructuredAIContext,
} from '../types/investment';
import { SAMPLE_HOLDINGS, INITIAL_DATA_SOURCES } from '../data/samplePortfolio';
import {
  calculatePortfolioSummary,
  consolidateHoldings,
  buildStructuredAIContext,
} from '../utils/calculations';

interface PortfolioContextType {
  holdings: Holding[];
  dataSources: DataSource[];
  importBatches: ImportBatch[];
  consolidatedHoldings: ConsolidatedHolding[];
  summary: PortfolioSummary;
  structuredAIContext: StructuredAIContext;
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  setCurrency: (currency: 'USD' | 'INR' | 'EUR' | 'GBP') => void;
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId) => void;

  // Filtering & Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedAssetFilter: AssetClass | 'All';
  setSelectedAssetFilter: (filter: AssetClass | 'All') => void;
  selectedSourceFilter: string | 'All';
  setSelectedSourceFilter: (source: string | 'All') => void;
  viewMode: 'consolidated' | 'sources';
  setViewMode: (mode: 'consolidated' | 'sources') => void;

  // CRUD
  addHolding: (holding: Omit<Holding, 'id' | 'createdAt'>) => void;
  updateHolding: (id: string, updates: Partial<Holding>) => void;
  deleteHolding: (id: string) => void;
  resetToSample: () => void;
  clearAllHoldings: () => void;
  importHoldings: (newHoldings: Holding[]) => { added: number };

  // Pipeline Import & Removal
  importFromPipeline: (
    batchMeta: {
      fileName: string;
      sourceId: string;
      sourceName: string;
      totalRows: number;
      acceptedRows: number;
      rejectedRows: number;
      duplicateRows: number;
      warnings: string[];
    },
    validHoldings: Omit<Holding, 'id' | 'createdAt'>[]
  ) => ImportBatch;
  removeImportBatch: (batchId: string) => void;

  // Source Management
  syncSource: (sourceId: string) => void;
  unlinkSource: (sourceId: string) => void;

  // Modal states
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  editingHolding: Holding | null;
  setEditingHolding: (holding: Holding | null) => void;
  inspectedHolding: ConsolidatedHolding | null;
  setInspectedHolding: (holding: ConsolidatedHolding | null) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const STORAGE_KEY_HOLDINGS = 'invest360_holdings_v2';
const STORAGE_KEY_SOURCES = 'invest360_sources_v2';
const STORAGE_KEY_BATCHES = 'invest360_batches_v2';
const STORAGE_KEY_CURRENCY = 'invest360_currency_v2';

const INITIAL_IMPORT_BATCHES: ImportBatch[] = [
  {
    id: 'batch-init-alpha',
    fileName: 'alpha_prime_holdings_2025.csv',
    sourceId: 'broker-a',
    sourceName: 'Alpha Securities',
    timestamp: '2025-01-15 09:30 AM',
    totalRows: 6,
    acceptedRows: 6,
    rejectedRows: 0,
    duplicateRows: 0,
    status: 'completed',
    warnings: ['Verified broker clearing feed'],
  },
  {
    id: 'batch-init-apex',
    fileName: 'apex_trade_statements_q1.csv',
    sourceId: 'broker-b',
    sourceName: 'Apex Trade',
    timestamp: '2025-02-18 08:45 AM',
    totalRows: 4,
    acceptedRows: 4,
    rejectedRows: 0,
    duplicateRows: 0,
    status: 'completed',
    warnings: ['Corporate debt lot consolidated'],
  },
  {
    id: 'batch-init-cas',
    fileName: 'cdsl_depository_cas_stmt.csv',
    sourceId: 'depository-cas',
    sourceName: 'National Depository (CAS)',
    timestamp: '2025-01-08 06:15 PM',
    totalRows: 5,
    acceptedRows: 5,
    rejectedRows: 0,
    duplicateRows: 0,
    status: 'completed',
    warnings: ['Matched 5 securities by exact ISIN'],
  },
];

// Tag sample holdings with initial batch IDs for safe deletion tracking
const TAGGED_SAMPLE_HOLDINGS: Holding[] = SAMPLE_HOLDINGS.map((h) => {
  let batchId = 'batch-init-alpha';
  if (h.sourceId === 'broker-b') batchId = 'batch-init-apex';
  if (h.sourceId === 'depository-cas') batchId = 'batch-init-cas';
  return { ...h, importBatchId: batchId };
});

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<'USD' | 'INR' | 'EUR' | 'GBP'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
      return (saved as 'USD' | 'INR' | 'EUR' | 'GBP') || 'USD';
    } catch {
      return 'USD';
    }
  });

  const [dataSources, setDataSources] = useState<DataSource[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SOURCES);
      return saved ? JSON.parse(saved) : INITIAL_DATA_SOURCES;
    } catch {
      return INITIAL_DATA_SOURCES;
    }
  });

  const [importBatches, setImportBatches] = useState<ImportBatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BATCHES);
      return saved ? JSON.parse(saved) : INITIAL_IMPORT_BATCHES;
    } catch {
      return INITIAL_IMPORT_BATCHES;
    }
  });

  const [holdings, setHoldings] = useState<Holding[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HOLDINGS);
      return saved ? JSON.parse(saved) : TAGGED_SAMPLE_HOLDINGS;
    } catch {
      return TAGGED_SAMPLE_HOLDINGS;
    }
  });

  const [activeScreen, setActiveScreen] = useState<ScreenId>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<AssetClass | 'All'>('All');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string | 'All'>('All');
  const [viewMode, setViewMode] = useState<'consolidated' | 'sources'>('consolidated');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
  const [inspectedHolding, setInspectedHolding] = useState<ConsolidatedHolding | null>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HOLDINGS, JSON.stringify(holdings));
    } catch (e) {
      console.error('Failed to save holdings to localStorage', e);
    }
  }, [holdings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SOURCES, JSON.stringify(dataSources));
    } catch (e) {
      console.error('Failed to save sources to localStorage', e);
    }
  }, [dataSources]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(importBatches));
    } catch (e) {
      console.error('Failed to save batches to localStorage', e);
    }
  }, [importBatches]);

  const setCurrency = (c: 'USD' | 'INR' | 'EUR' | 'GBP') => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY, c);
    } catch (e) {
      console.error('Failed to save currency to localStorage', e);
    }
  };

  // Map sources for fast lookups
  const sourcesMap = useMemo(() => {
    const map: Record<string, DataSource> = {};
    for (const src of dataSources) {
      map[src.id] = src;
    }
    return map;
  }, [dataSources]);

  // Keep source holdings counts accurate
  useEffect(() => {
    setDataSources((prevSources) =>
      prevSources.map((src) => {
        const count = holdings.filter((h) => h.sourceId === src.id).length;
        return { ...src, holdingsCount: count };
      })
    );
  }, [holdings]);

  // Consolidated holdings
  const consolidatedHoldings = useMemo(() => {
    return consolidateHoldings(holdings, sourcesMap);
  }, [holdings, sourcesMap]);

  // Summary calculations
  const summary = useMemo(() => {
    return calculatePortfolioSummary(holdings, sourcesMap);
  }, [holdings, sourcesMap]);

  // AI-ready structured context payload
  const structuredAIContext = useMemo(() => {
    return buildStructuredAIContext(summary, consolidatedHoldings, holdings, currency);
  }, [summary, consolidatedHoldings, holdings, currency]);

  const addHolding = (newH: Omit<Holding, 'id' | 'createdAt'>) => {
    const id = `user-hold-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullHolding: Holding = {
      ...newH,
      id,
      createdAt: new Date().toISOString(),
      symbol: newH.symbol.trim().toUpperCase(),
      dataQuality: {
        isStale: false,
        hasVerifiedPrice: true,
        priceSource: 'Manual User Input',
        lastUpdated: new Date().toLocaleTimeString(),
      },
    };
    setHoldings((prev) => [fullHolding, ...prev]);
  };

  const updateHolding = (id: string, updates: Partial<Holding>) => {
    setHoldings((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              ...updates,
              symbol: updates.symbol ? updates.symbol.trim().toUpperCase() : h.symbol,
              updatedAt: new Date().toISOString(),
            }
          : h
      )
    );
  };

  const deleteHolding = (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  const resetToSample = () => {
    setHoldings(TAGGED_SAMPLE_HOLDINGS);
    setDataSources(INITIAL_DATA_SOURCES);
    setImportBatches(INITIAL_IMPORT_BATCHES);
  };

  const clearAllHoldings = () => {
    setHoldings([]);
    setImportBatches([]);
  };

  const importHoldings = (newHoldings: Holding[]) => {
    setHoldings((prev) => [...newHoldings, ...prev]);
    return { added: newHoldings.length };
  };

  const importFromPipeline = (
    batchMeta: {
      fileName: string;
      sourceId: string;
      sourceName: string;
      totalRows: number;
      acceptedRows: number;
      rejectedRows: number;
      duplicateRows: number;
      warnings: string[];
    },
    validHoldings: Omit<Holding, 'id' | 'createdAt'>[]
  ): ImportBatch => {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newBatch: ImportBatch = {
      id: batchId,
      fileName: batchMeta.fileName,
      sourceId: batchMeta.sourceId,
      sourceName: batchMeta.sourceName,
      timestamp: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      totalRows: batchMeta.totalRows,
      acceptedRows: batchMeta.acceptedRows,
      rejectedRows: batchMeta.rejectedRows,
      duplicateRows: batchMeta.duplicateRows,
      status: batchMeta.rejectedRows > 0 ? 'partial' : 'completed',
      warnings: batchMeta.warnings,
    };

    const createdHoldings: Holding[] = validHoldings.map((vh, idx) => ({
      ...vh,
      id: `hold-${batchId}-${idx}`,
      importBatchId: batchId,
      createdAt: new Date().toISOString(),
    }));

    setImportBatches((prev) => [newBatch, ...prev]);
    setHoldings((prev) => [...createdHoldings, ...prev]);

    return newBatch;
  };

  const removeImportBatch = (batchId: string) => {
    // Safely remove all holdings belonging to this import batch
    setHoldings((prev) => prev.filter((h) => h.importBatchId !== batchId));
    // Remove the batch record
    setImportBatches((prev) => prev.filter((b) => b.id !== batchId));
  };

  const syncSource = (sourceId: string) => {
    setDataSources((prev) =>
      prev.map((s) =>
        s.id === sourceId
          ? {
              ...s,
              status: 'syncing',
            }
          : s
      )
    );

    setTimeout(() => {
      setDataSources((prev) =>
        prev.map((s) =>
          s.id === sourceId
            ? {
                ...s,
                status: 'connected',
                lastSynced: `Just now (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
              }
            : s
        )
      );
    }, 800);
  };

  const unlinkSource = (sourceId: string) => {
    setDataSources((prev) =>
      prev.map((s) =>
        s.id === sourceId
          ? {
              ...s,
              status: 'disconnected',
            }
          : s
      )
    );
    // Remove holdings associated with this source
    setHoldings((prev) => prev.filter((h) => h.sourceId !== sourceId));
    // Remove batches associated with this source
    setImportBatches((prev) => prev.filter((b) => b.sourceId !== sourceId));
  };

  return (
    <PortfolioContext.Provider
      value={{
        holdings,
        dataSources,
        importBatches,
        consolidatedHoldings,
        summary,
        structuredAIContext,
        currency,
        setCurrency,
        activeScreen,
        setActiveScreen,
        searchQuery,
        setSearchQuery,
        selectedAssetFilter,
        setSelectedAssetFilter,
        selectedSourceFilter,
        setSelectedSourceFilter,
        viewMode,
        setViewMode,
        addHolding,
        updateHolding,
        deleteHolding,
        resetToSample,
        clearAllHoldings,
        importHoldings,
        importFromPipeline,
        removeImportBatch,
        syncSource,
        unlinkSource,
        isAddModalOpen,
        setIsAddModalOpen,
        editingHolding,
        setEditingHolding,
        inspectedHolding,
        setInspectedHolding,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return ctx;
};
