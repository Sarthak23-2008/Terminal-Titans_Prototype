/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { HoldingModal } from './components/common/HoldingModal';
import { SecurityDetailModal } from './components/common/SecurityDetailModal';

// Screens
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { MyInvestmentsScreen } from './components/investments/MyInvestmentsScreen';
import { ImportScreen } from './components/import/ImportScreen';
import { ExplorerScreen } from './components/explorer/ExplorerScreen';
import { AiInsightsScreen } from './components/insights/AiInsightsScreen';
import { DataSourcesScreen } from './components/sources/DataSourcesScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';

const MainContent: React.FC = () => {
  const { activeScreen } = usePortfolio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'investments':
        return <MyInvestmentsScreen />;
      case 'import':
        return <ImportScreen />;
      case 'explorer':
        return <ExplorerScreen />;
      case 'insights':
        return <AiInsightsScreen />;
      case 'sources':
        return <DataSourcesScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-xs bg-slate-950 h-full z-10 shadow-2xl">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Global Modals */}
      <HoldingModal />
      <SecurityDetailModal />
    </div>
  );
};

export default function App() {
  return (
    <PortfolioProvider>
      <MainContent />
    </PortfolioProvider>
  );
}
