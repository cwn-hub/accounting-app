import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Building2, Calculator, Users, ChevronRight, Percent, Wallet } from 'lucide-react';
import { HelpTooltip } from '../components/ContextualHelp';

const SettingsOverview = () => {
  const settingsCategories = [
    {
      title: 'Business Info',
      path: '/settings/business',
      icon: Building2,
      description: 'Company details, address, tax ID, and fiscal year settings.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Chart of Accounts',
      path: '/settings/categories',
      icon: Calculator,
      description: 'Manage your 26 accounting categories (income, COGS, expenses).',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Tax Rates',
      path: '/settings/tax-rates',
      icon: Percent,
      description: 'Configure VAT and sales tax rates.',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Accounts',
      path: '/settings/accounts',
      icon: Wallet,
      description: 'Manage bank accounts, credit cards, and assets.',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Users & Access',
      path: '/settings/users',
      icon: Users,
      description: 'Add team members and manage permissions.',
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600">Configure your account and preferences</p>
        </div>
        <HelpTooltip 
          id="settings-overview" 
          content="Customize your accounting setup, manage business information, and control user access to the system."
        >
          <span className="text-slate-400 hover:text-indigo-600 cursor-help">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </HelpTooltip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.path}
              to={category.path}
              className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-200 hover:shadow-lg transition-all"
            >
              <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                {category.title}
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                {category.description}
              </p>
              <span className="inline-flex items-center text-sm font-medium text-indigo-600">
                Configure
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Quick Settings */}
      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Quick Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/settings/business" className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div>
              <p className="font-medium text-slate-900">Fiscal Year Start</p>
              <p className="text-sm text-slate-500">Configure your fiscal year</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
          <Link to="/settings/business" className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div>
              <p className="font-medium text-slate-900">Base Currency</p>
              <p className="text-sm text-slate-500">CHF, EUR, USD, etc.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
          <Link to="/settings/business" className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div>
              <p className="font-medium text-slate-900">VAT Number</p>
              <p className="text-sm text-slate-500">Tax registration details</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
          <Link to="/settings/tax-rates" className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div>
              <p className="font-medium text-slate-900">Default Tax Rate</p>
              <p className="text-sm text-slate-500">Set your primary VAT rate</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Data Management */}
      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Data Management</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/import-export"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import / Export
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SettingsOverview;
