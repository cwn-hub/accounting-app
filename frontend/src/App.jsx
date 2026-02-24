import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Journal = lazy(() => import('./pages/Journal'));
const ReportsOverview = lazy(() => import('./pages/ReportsOverview'));
const ProfitLossReport = lazy(() => import('./pages/ProfitLossReport'));
const BalanceSheetReport = lazy(() => import('./pages/BalanceSheetReport'));
const TaxReportPage = lazy(() => import('./pages/TaxReportPage'));
const SettingsOverview = lazy(() => import('./pages/SettingsOverview'));
const BusinessSettings = lazy(() => import('./pages/BusinessSettings'));
const ChartOfAccounts = lazy(() => import('./pages/ChartOfAccounts'));
const TaxRates = lazy(() => import('./pages/TaxRates'));
const Accounts = lazy(() => import('./pages/Accounts'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const ImportExport = lazy(() => import('./pages/ImportExport'));
const Help = lazy(() => import('./pages/Help'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" role="status" aria-label="Loading">
        <span className="sr-only">Loading...</span>
      </div>
      <p className="text-slate-500">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing Page - No sidebar */}
          <Route path="/" element={<LandingPage />} />
          
          {/* App Routes - With sidebar layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/journal" element={<Journal />} />
            
            {/* Reports */}
            <Route path="/reports" element={<ReportsOverview />} />
            <Route path="/reports/pnl" element={<ProfitLossReport />} />
            <Route path="/reports/balance" element={<BalanceSheetReport />} />
            <Route path="/reports/tax" element={<TaxReportPage />} />
            
            {/* Settings */}
            <Route path="/settings" element={<SettingsOverview />} />
            <Route path="/settings/business" element={<BusinessSettings />} />
            <Route path="/settings/categories" element={<ChartOfAccounts />} />
            <Route path="/settings/tax-rates" element={<TaxRates />} />
            <Route path="/settings/accounts" element={<Accounts />} />
            <Route path="/settings/users" element={<UserManagement />} />
            
            <Route path="/import-export" element={<ImportExport />} />
            <Route path="/help" element={<Help />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
