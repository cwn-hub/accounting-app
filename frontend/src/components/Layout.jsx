import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import Breadcrumbs from './Breadcrumbs';
import { HelpProvider } from './ContextualHelp';

const Layout = () => {
  return (
    <HelpProvider>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <main className="lg:ml-64 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20 lg:pt-6">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
      </div>
    </HelpProvider>
  );
};

export default Layout;
