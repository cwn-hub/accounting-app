import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const breadcrumbMap = {
  '/': [{ label: 'Home', path: '/' }],
  '/dashboard': [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
  ],
  '/journal': [
    { label: 'Home', path: '/' },
    { label: 'Journal', path: '/journal' },
  ],
  '/reports': [
    { label: 'Home', path: '/' },
    { label: 'Reports', path: '/reports' },
  ],
  '/reports/pnl': [
    { label: 'Home', path: '/' },
    { label: 'Reports', path: '/reports' },
    { label: 'Profit & Loss', path: '/reports/pnl' },
  ],
  '/reports/balance': [
    { label: 'Home', path: '/' },
    { label: 'Reports', path: '/reports' },
    { label: 'Balance Sheet', path: '/reports/balance' },
  ],
  '/reports/tax': [
    { label: 'Home', path: '/' },
    { label: 'Reports', path: '/reports' },
    { label: 'Tax Report', path: '/reports/tax' },
  ],
  '/settings': [
    { label: 'Home', path: '/' },
    { label: 'Settings', path: '/settings' },
  ],
  '/settings/business': [
    { label: 'Home', path: '/' },
    { label: 'Settings', path: '/settings' },
    { label: 'Business Info', path: '/settings/business' },
  ],
  '/settings/accounts': [
    { label: 'Home', path: '/' },
    { label: 'Settings', path: '/settings' },
    { label: 'Chart of Accounts', path: '/settings/accounts' },
  ],
  '/settings/users': [
    { label: 'Home', path: '/' },
    { label: 'Settings', path: '/settings' },
    { label: 'Users', path: '/settings/users' },
  ],
  '/import-export': [
    { label: 'Home', path: '/' },
    { label: 'Import / Export', path: '/import-export' },
  ],
  '/help': [
    { label: 'Home', path: '/' },
    { label: 'Help', path: '/help' },
  ],
};

const Breadcrumbs = () => {
  const location = useLocation();
  const paths = breadcrumbMap[location.pathname] || [{ label: 'Home', path: '/' }];

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-slate-500">
        {paths.map((crumb, index) => {
          const isLast = index === paths.length - 1;
          return (
            <li key={crumb.path} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-2 text-slate-400" />
              )}
              {isLast ? (
                <span className="font-medium text-slate-900" aria-current="page">
                  {index === 0 && <Home className="w-4 h-4 inline mr-1" />}
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="hover:text-indigo-600 transition-colors flex items-center"
                >
                  {index === 0 && <Home className="w-4 h-4 mr-1" />}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
