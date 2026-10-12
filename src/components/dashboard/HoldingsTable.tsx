import React, { useState } from 'react';
import {
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Building2,
  Download,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { AssetClass, ConsolidatedHolding, Holding } from '../../types/investment';
import {
  formatCurrency,
  formatPercentage,
  ASSET_CLASS_COLORS,
} from '../../utils/calculations';

interface HoldingsTableProps {
  showFullControls?: boolean;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({ showFullControls = true }) => {
  const {
    holdings,
    consolidatedHoldings,
    currency,
    searchQuery,
    setSearchQuery,
    selectedAssetFilter,
    setSelectedAssetFilter,
    selectedSourceFilter,
    setSelectedSourceFilter,
    dataSources,
    viewMode,
    setViewMode,
    setIsAddModalOpen,
    setEditingHolding,
    setInspectedHolding,
    deleteHolding,
  } = usePortfolio();

  const [sortField, setSortField] = useState<'marketValue' | 'unrealizedPL' | 'plPercent' | 'symbol'>('marketValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Handle sorting toggle
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtered & sorted consolidated list
  const filteredConsolidated = consolidatedHoldings.filter((h) => {
    const matchesSearch =
      h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.securityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.isin && h.isin.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAsset = selectedAssetFilter === 'All' || h.assetClass === selectedAssetFilter;
    const matchesSource =
      selectedSourceFilter === 'All' || h.sourceIds.includes(selectedSourceFilter);

    return matchesSearch && matchesAsset && matchesSource;
  });

  filteredConsolidated.sort((a, b) => {
    let factor = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'marketValue') return (a.totalMarketValue - b.totalMarketValue) * factor;
    if (sortField === 'unrealizedPL') return (a.unrealizedPL - b.unrealizedPL) * factor;
    if (sortField === 'plPercent') return (a.unrealizedPLPercentage - b.unrealizedPLPercentage) * factor;
    if (sortField === 'symbol') return a.symbol.localeCompare(b.symbol) * factor;
    return 0;
  });

  // Filtered & sorted raw source list
  const filteredRawHoldings = holdings.filter((h) => {
    const matchesSearch =
      h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.securityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.isin && h.isin.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAsset = selectedAssetFilter === 'All' || h.assetClass === selectedAssetFilter;
    const matchesSource = selectedSourceFilter === 'All' || h.sourceId === selectedSourceFilter;

    return matchesSearch && matchesAsset && matchesSource;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Symbol', 'Security Name', 'Asset Class', 'Quantity', 'Avg Cost', 'Current Price', 'Market Value', 'Unrealized PL'];
    const rows = filteredConsolidated.map((h) => [
      h.symbol,
      `"${h.securityName}"`,
      h.assetClass,
      h.totalQuantity,
      h.weightedAvgCost,
      h.currentPrice,
      h.totalMarketValue,
      h.unrealizedPL,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Invest360_Holdings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sourcesMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of dataSources) map[s.id] = s.name;
    return map;
  }, [dataSources]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base text-slate-900">
                {viewMode === 'consolidated' ? 'Consolidated Portfolio Holdings' : 'Source-Level Account Records'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {viewMode === 'consolidated' ? filteredConsolidated.length : filteredRawHoldings.length} assets
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {viewMode === 'consolidated'
                ? 'Securities merged across multiple brokers with weighted cost basis'
                : 'Individual line-items categorized by broker and depository accounts'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
              <button
                onClick={() => setViewMode('consolidated')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'consolidated'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Consolidated
              </button>
              <button
                onClick={() => setViewMode('sources')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  viewMode === 'sources'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                By Source
              </button>
            </div>

            {showFullControls && (
              <>
                <button
                  onClick={handleExportCSV}
                  title="Export to CSV"
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4 text-teal-400" />
                  Add Holding
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2">
          {/* Search bar */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ticker, company name, or ISIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Asset Class Filter */}
          <div className="sm:col-span-4 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            <select
              value={selectedAssetFilter}
              onChange={(e) => setSelectedAssetFilter(e.target.value as AssetClass | 'All')}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="All">All Asset Classes</option>
              <option value="Equity">Equities</option>
              <option value="Bond">Bonds</option>
              <option value="REIT">REITs</option>
              <option value="InvIT">InvITs</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Source Account Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedSourceFilter}
              onChange={(e) => setSelectedSourceFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="All">All Sources</option>
              {dataSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        {viewMode === 'consolidated' ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold text-[11px]">
                <th
                  onClick={() => toggleSort('symbol')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                >
                  Asset & Symbol
                </th>
                <th className="py-3 px-3">Asset Class</th>
                <th className="py-3 px-3 text-right">Aggregated Qty</th>
                <th className="py-3 px-3 text-right">Weighted Cost</th>
                <th className="py-3 px-3 text-right">Live Price</th>
                <th
                  onClick={() => toggleSort('marketValue')}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
                >
                  Market Value
                </th>
                <th
                  onClick={() => toggleSort('unrealizedPL')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                >
                  Unrealized P/L
                </th>
                <th className="py-3 px-3 text-center">Data Sources</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsolidated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No holdings match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredConsolidated.map((item) => {
                  const isPositive = item.unrealizedPL >= 0;
                  return (
                    <tr
                      key={item.symbol}
                      onClick={() => setInspectedHolding(item)}
                      className="hover:bg-teal-50/30 transition-colors group cursor-pointer"
                    >
                      {/* Security */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2 h-8 rounded-full shrink-0"
                            style={{
                              backgroundColor: ASSET_CLASS_COLORS[item.assetClass] || '#64748b',
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 font-mono text-sm">
                                {item.symbol}
                              </span>
                              {item.isMultiSource && (
                                <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 text-[10px] font-semibold rounded border border-teal-200">
                                  Merged
                                </span>
                              )}
                              {item.hasPriceConflict && (
                                <span
                                  className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded border border-amber-200"
                                  title="Price divergence between broker feeds"
                                >
                                  ⚠️ Price Divergence
                                </span>
                              )}
                            </div>
                            <div className="text-slate-500 truncate max-w-[180px] sm:max-w-xs font-normal">
                              {item.securityName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Asset Class */}
                      <td className="py-3.5 px-3">
                        <span
                          className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${ASSET_CLASS_COLORS[item.assetClass]}15`,
                            color: ASSET_CLASS_COLORS[item.assetClass],
                          }}
                        >
                          {item.assetClass}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-800">
                        {item.totalQuantity.toLocaleString()}
                      </td>

                      {/* Weighted Cost */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(item.weightedAvgCost, currency)}
                      </td>

                      {/* Live Price */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(item.currentPrice, currency)}
                      </td>

                      {/* Market Value */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.totalMarketValue, currency)}
                      </td>

                      {/* Unrealized P/L */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`font-mono font-semibold inline-flex items-center gap-0.5 ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {isPositive ? '+' : ''}
                            {formatCurrency(item.unrealizedPL, currency)}
                          </span>
                        </div>
                        <div
                          className={`text-[10px] font-mono font-medium ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatPercentage(item.unrealizedPLPercentage)}
                        </div>
                      </td>

                      {/* Source Badges */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center -space-x-1">
                          {item.sourceIds.map((sId) => {
                            const srcName = sourcesMap[sId] || sId;
                            return (
                              <span
                                key={sId}
                                title={`Held in: ${srcName}`}
                                className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded border border-slate-200 shadow-2xs"
                              >
                                {srcName.split(' ')[0]}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setInspectedHolding(item)}
                          title="Inspect security breakdown"
                          className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* Raw / Source-Level Table */
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Symbol & Security</th>
                <th className="py-3 px-3">Source Account</th>
                <th className="py-3 px-3">Asset Class</th>
                <th className="py-3 px-3 text-right">Units</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Current Price</th>
                <th className="py-3 px-3 text-right">Market Value</th>
                <th className="py-3 px-4 text-right">P/L ($ / %)</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRawHoldings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No individual records found matching filter.
                  </td>
                </tr>
              ) : (
                filteredRawHoldings.map((h) => {
                  const mVal = h.quantity * h.currentPrice;
                  const iVal = h.quantity * h.averageCost;
                  const pl = mVal - iVal;
                  const plPct = iVal > 0 ? (pl / iVal) * 100 : 0;
                  const isPositive = pl >= 0;
                  const sourceName = sourcesMap[h.sourceId] || h.sourceId;

                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {h.symbol}
                        </div>
                        <div className="text-slate-500 truncate max-w-xs">{h.securityName}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-800 font-medium rounded text-[11px] border border-blue-100">
                          {sourceName}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700">{h.assetClass}</span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono">{h.quantity.toLocaleString()}</td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(h.averageCost, currency)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                        {formatCurrency(h.currentPrice, currency)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(mVal, currency)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono font-semibold ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {formatCurrency(pl, currency)}
                        </span>
                        <div
                          className={`text-[10px] font-mono ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatPercentage(plPct)}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingHolding(h)}
                            title="Edit this holding record"
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${h.symbol} holding from ${sourceName}?`)) {
                                deleteHolding(h.id);
                              }
                            }}
                            title="Delete this holding"
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Deterministic pricing engine active. Illustrative prices for hackathon demo.</span>
        </div>
        <div className="font-mono text-slate-600 text-[11px]">
          Invest360 Phase 1 Core Engine
        </div>
      </div>
    </div>
  );
};
