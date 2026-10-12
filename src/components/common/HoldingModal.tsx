import React, { useState, useEffect } from 'react';
import { X, Check, DollarSign, Layers } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { AssetClass, Holding } from '../../types/investment';
import { calculateMarketValue, calculateInvestedValue } from '../../utils/calculations';

export const HoldingModal: React.FC = () => {
  const {
    isAddModalOpen,
    setIsAddModalOpen,
    editingHolding,
    setEditingHolding,
    addHolding,
    updateHolding,
    dataSources,
    currency,
  } = usePortfolio();

  const isOpen = isAddModalOpen || editingHolding !== null;

  const [formData, setFormData] = useState({
    securityName: '',
    symbol: '',
    isin: '',
    assetClass: 'Equity' as AssetClass,
    quantity: '',
    averageCost: '',
    currentPrice: '',
    sourceId: 'broker-a',
    sector: '',
    annualDividendYield: '',
    couponRate: '',
    maturityDate: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingHolding) {
      setFormData({
        securityName: editingHolding.securityName || '',
        symbol: editingHolding.symbol || '',
        isin: editingHolding.isin || '',
        assetClass: editingHolding.assetClass || 'Equity',
        quantity: editingHolding.quantity.toString(),
        averageCost: editingHolding.averageCost.toString(),
        currentPrice: editingHolding.currentPrice.toString(),
        sourceId: editingHolding.sourceId || 'broker-a',
        sector: editingHolding.sector || '',
        annualDividendYield: editingHolding.annualDividendYield ? editingHolding.annualDividendYield.toString() : '',
        couponRate: editingHolding.couponRate ? editingHolding.couponRate.toString() : '',
        maturityDate: editingHolding.maturityDate || '',
      });
      setError(null);
    } else {
      setFormData({
        securityName: '',
        symbol: '',
        isin: '',
        assetClass: 'Equity',
        quantity: '',
        averageCost: '',
        currentPrice: '',
        sourceId: dataSources[0]?.id || 'broker-a',
        sector: '',
        annualDividendYield: '',
        couponRate: '',
        maturityDate: '',
      });
      setError(null);
    }
  }, [editingHolding, isAddModalOpen, dataSources]);

  if (!isOpen) return null;

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingHolding(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.symbol.trim()) {
      setError('Ticker / Symbol is required.');
      return;
    }
    if (!formData.securityName.trim()) {
      setError('Security Name is required.');
      return;
    }

    const qty = parseFloat(formData.quantity);
    const avgCost = parseFloat(formData.averageCost);
    const currPrice = parseFloat(formData.currentPrice);

    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number greater than 0.');
      return;
    }
    if (isNaN(avgCost) || avgCost < 0) {
      setError('Average Cost basis must be 0 or greater.');
      return;
    }
    if (isNaN(currPrice) || currPrice < 0) {
      setError('Current Price must be 0 or greater.');
      return;
    }

    const payload: Omit<Holding, 'id' | 'createdAt'> = {
      symbol: formData.symbol.trim().toUpperCase(),
      securityName: formData.securityName.trim(),
      isin: formData.isin.trim() || undefined,
      assetClass: formData.assetClass,
      quantity: qty,
      averageCost: avgCost,
      currentPrice: currPrice,
      sourceId: formData.sourceId,
      sector: formData.sector.trim() || undefined,
      annualDividendYield: formData.annualDividendYield ? parseFloat(formData.annualDividendYield) : undefined,
      couponRate: formData.couponRate ? parseFloat(formData.couponRate) : undefined,
      maturityDate: formData.maturityDate.trim() || undefined,
      currency,
    };

    if (editingHolding) {
      updateHolding(editingHolding.id, payload);
    } else {
      addHolding(payload);
    }

    closeModal();
  };

  const previewQty = parseFloat(formData.quantity) || 0;
  const previewCost = parseFloat(formData.averageCost) || 0;
  const previewPrice = parseFloat(formData.currentPrice) || 0;
  const previewInvested = calculateInvestedValue(previewQty, previewCost);
  const previewMarket = calculateMarketValue(previewQty, previewPrice);
  const previewPL = previewMarket - previewInvested;
  const previewPLPct = previewInvested > 0 ? (previewPL / previewInvested) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg tracking-tight">
                {editingHolding ? 'Edit Holding Record' : 'Add New Investment Holding'}
              </h3>
              <p className="text-xs text-slate-300">
                Deterministic cost basis & asset classification
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Symbol / Ticker *
              </label>
              <input
                type="text"
                placeholder="e.g. MSFT, AAPL, UST-10Y"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                ISIN Identifier (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. US5949181045"
                value={formData.isin}
                onChange={(e) => setFormData({ ...formData, isin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Security Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Microsoft Corporation"
              value={formData.securityName}
              onChange={(e) => setFormData({ ...formData, securityName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Asset Class *
              </label>
              <select
                value={formData.assetClass}
                onChange={(e) => setFormData({ ...formData, assetClass: e.target.value as AssetClass })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
              >
                <option value="Equity">Equity (Stock / ETF)</option>
                <option value="Bond">Bond / Fixed Income</option>
                <option value="REIT">REIT (Real Estate Trust)</option>
                <option value="InvIT">InvIT (Infrastructure Trust)</option>
                <option value="Cash">Cash / Liquid Fund</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Depository / Broker Source *
              </label>
              <select
                value={formData.sourceId}
                onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
              >
                {dataSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                step="any"
                min="0.0001"
                placeholder="10"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Avg Cost ({currency}) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="100.00"
                value={formData.averageCost}
                onChange={(e) => setFormData({ ...formData, averageCost: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Current Price ({currency}) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="110.00"
                value={formData.currentPrice}
                onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Sector / Category
              </label>
              <input
                type="text"
                placeholder="e.g. Technology, Sovereign Debt"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Annual Yield / Coupon (%)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 4.5"
                value={formData.annualDividendYield}
                onChange={(e) => setFormData({ ...formData, annualDividendYield: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Real-time Math Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600">
            <div className="flex items-center justify-between font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                <DollarSign className="w-4 h-4 text-teal-600" /> Real-time Calculation Verification
              </span>
              <span className="text-[11px] text-slate-400">Strict deterministic math</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <span className="block text-[10px] text-slate-700 font-semibold uppercase">Cost Basis</span>
                <span className="font-mono font-semibold text-slate-900">${previewInvested.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-700 font-semibold uppercase">Market Value</span>
                <span className="font-mono font-semibold text-slate-900">${previewMarket.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-700 font-semibold uppercase">Unrealized P/L</span>
                <span className={`font-mono font-semibold ${previewPL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {previewPL >= 0 ? '+' : ''}${previewPL.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-700 font-semibold uppercase">Return %</span>
                <span className={`font-mono font-semibold ${previewPLPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {previewPLPct >= 0 ? '+' : ''}{previewPLPct.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4 text-teal-400" />
              {editingHolding ? 'Update Holding' : 'Save Holding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
