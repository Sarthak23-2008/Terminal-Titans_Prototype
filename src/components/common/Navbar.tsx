import React from 'react';
import {
  Menu,
  Search,
  DollarSign,
  Layers,
  Database,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { ScreenId } from '../../types/investment';
import { formatCurrency } from '../../utils/calculations';

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const {
    activeScreen,
    setActiveScreen,
    currency,
    setCurrency,
    summary,
    searchQuery,
    setSearchQuery,
    dataSources,
  } = usePortfolio();

  const getScreenTitle = (id: ScreenId) => {
    switch (id) {
      case 'dashboard':
        return 'Executive Dashboard';
      case 'investments':
        return 'My Investments Ledger';
      case 'import':
        return 'Import & Connect Broker Statements';
      case 'explorer':
        return 'Investment Explorer & Exposure';
      case 'insights':
        return 'AI Diagnostic Insights';
      case 'sources':
        return 'Data Sources & Accounts';
      case 'settings':
        return 'Platform Settings';
      default:
        return 'Portfolio Overview';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {getScreenTitle(activeScreen)}
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
            <span>Invest360 Unified System</span>
            <span>/</span>
            <span className="text-teal-600 font-medium capitalize">{activeScreen}</span>
          </div>
        </div>
      </div>

      {/* Right Controls: Quick Search, Currency, Accounts Pill */}
      <div className="flex items-center gap-3">
        {/* Global Quick Search (Compact) */}
        <div className="hidden md:flex items-center relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
          <input
            type="text"
            placeholder="Search holdings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 font-medium w-44"
          />
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          {(['USD', 'INR', 'EUR', 'GBP'] as const).map((curr) => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              className={`px-2 py-1 rounded-md font-mono text-[11px] font-semibold transition-all ${
                currency === curr
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>

        {/* Net Worth Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono">
          <span className="text-teal-400 font-semibold">Total:</span>
          <span className="font-bold">{formatCurrency(summary.totalMarketValue, currency, true)}</span>
        </div>

        {/* Source Status Dot */}
        <button
          onClick={() => setActiveScreen('sources')}
          title="Data Sources Status"
          className="p-2 text-slate-500 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition-colors relative"
        >
          <Database className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5 border border-white" />
        </button>
      </div>
    </header>
  );
};
