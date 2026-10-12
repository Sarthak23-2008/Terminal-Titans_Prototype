import React from 'react';
import {
  LayoutDashboard,
  Layers,
  UploadCloud,
  Compass,
  Sparkles,
  Database,
  Settings,
  Plus,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import { ScreenId } from '../../types/investment';
import { formatCurrency } from '../../utils/calculations';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const {
    activeScreen,
    setActiveScreen,
    summary,
    currency,
    dataSources,
    setIsAddModalOpen,
  } = usePortfolio();

  const navItems: {
    id: ScreenId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'investments',
      label: 'My Investments',
      icon: Layers,
      badge: `${summary.consolidatedHoldingsCount}`,
      badgeColor: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'import',
      label: 'Import Investments',
      icon: UploadCloud,
    },
    {
      id: 'explorer',
      label: 'Investment Explorer',
      icon: Compass,
    },
    {
      id: 'insights',
      label: 'AI Insights',
      icon: Sparkles,
      badge: 'Live',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    },
    {
      id: 'sources',
      label: 'Data Sources',
      icon: Database,
      badge: `${dataSources.filter((s) => s.status === 'connected').length}`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleNavClick = (id: ScreenId) => {
    setActiveScreen(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between h-full border-r border-slate-800 select-none">
      {/* Brand & Value Proposition */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-teal-500/10">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white font-mono">
                INVEST<span className="text-teal-400">360</span>
              </span>
              <span className="px-1.5 py-0.2 text-[9px] uppercase font-bold bg-teal-500/20 text-teal-300 rounded border border-teal-500/30">
                P1
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              All Your Investments. One Clear View.
            </p>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => {
            setIsAddModalOpen(true);
            if (onCloseMobile) onCloseMobile();
          }}
          className="mt-5 w-full py-2 px-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Investment
        </button>

        {/* Navigation items */}
        <nav className="mt-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      item.badgeColor || 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User & Summary Widget */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/80 space-y-3">
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Unified Net Worth</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-base font-bold font-mono text-white mt-0.5 tracking-tight">
            {formatCurrency(summary.totalMarketValue, currency)}
          </div>
          <div className="text-[10px] text-teal-400 font-mono mt-0.5 flex items-center gap-1">
            <span>{summary.consolidatedHoldingsCount} Securities</span>
            <span>•</span>
            <span>{dataSources.length} Accounts</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-500 px-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          <span>FinTech Hackathon Phase 1 Engine</span>
        </div>
      </div>
    </aside>
  );
};
