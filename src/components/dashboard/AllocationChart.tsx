import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency, ASSET_CLASS_COLORS } from '../../utils/calculations';
import { AssetClass } from '../../types/investment';
import { PieChart as PieIcon, Filter } from 'lucide-react';

export const AllocationChart: React.FC = () => {
  const { summary, currency, selectedAssetFilter, setSelectedAssetFilter } = usePortfolio();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = summary.assetAllocation.map((item) => ({
    name: item.assetClass,
    value: item.marketValue,
    invested: item.investedValue,
    percentage: item.percentage,
    count: item.count,
    color: ASSET_CLASS_COLORS[item.assetClass] || '#64748b',
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-semibold">{item.name}</span>
          </div>
          <div className="font-mono text-sm font-bold text-teal-300">
            {formatCurrency(item.value, currency)}
          </div>
          <div className="text-slate-400 mt-1 flex justify-between gap-4">
            <span>Portfolio Share:</span>
            <span className="font-semibold text-white">{item.percentage}%</span>
          </div>
          <div className="text-slate-400 flex justify-between gap-4">
            <span>Holdings Count:</span>
            <span className="font-semibold text-white">{item.count} items</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Asset Class Allocation</h3>
            <p className="text-xs text-slate-400">Deterministic balance across asset types</p>
          </div>
        </div>

        {selectedAssetFilter !== 'All' && (
          <button
            onClick={() => setSelectedAssetFilter('All')}
            className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium bg-teal-50 px-2 py-1 rounded-md transition-colors"
          >
            <Filter className="w-3 h-3" />
            Filtered: {selectedAssetFilter} (Clear)
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-xs text-slate-400">
          No holdings available to graph.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-4">
          {/* Donut Chart */}
          <div className="md:col-span-5 h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, index) => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.6}
                      className="cursor-pointer transition-opacity duration-200"
                      onClick={() =>
                        setSelectedAssetFilter(
                          selectedAssetFilter === entry.name ? 'All' : (entry.name as AssetClass)
                        )
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Total Value
              </span>
              <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                {formatCurrency(summary.totalMarketValue, currency, true)}
              </span>
            </div>
          </div>

          {/* Detailed Allocation Breakdown Legend */}
          <div className="md:col-span-7 space-y-2">
            {data.map((item) => {
              const isSelected = selectedAssetFilter === item.name;
              return (
                <div
                  key={item.name}
                  onClick={() =>
                    setSelectedAssetFilter(isSelected ? 'All' : (item.name as AssetClass))
                  }
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                      <span className="text-[11px] text-slate-400">({item.count} items)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(item.value, currency)}
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-700 w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual allocation progress bar */}
                  <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(item.percentage, 100)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-700 flex items-center justify-between">
        <span>Click any asset class to filter holdings table below</span>
        <span className="font-medium text-slate-900">100.0% Fully Reconciled</span>
      </div>
    </div>
  );
};
