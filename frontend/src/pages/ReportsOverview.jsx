import React from 'react';
import { Link } from 'react-router-dom';
import { PieChart, FileText, Calculator, ArrowRight } from 'lucide-react';
import { HelpTooltip } from '../components/ContextualHelp';

const ReportsOverview = () => {
  const reports = [
    {
      title: 'Profit & Loss',
      path: '/reports/pnl',
      icon: PieChart,
      description: 'View your revenue, expenses, and net profit for any period.',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Balance Sheet',
      path: '/reports/balance',
      icon: FileText,
      description: 'See your assets, liabilities, and equity at a glance.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Tax Report',
      path: '/reports/tax',
      icon: Calculator,
      description: 'Generate VAT and tax reports for Swiss compliance.',
      color: 'bg-indigo-50 text-indigo-600',
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600">Financial reports and analysis</p>
        </div>
        <HelpTooltip 
          id="reports-overview" 
          content="Generate comprehensive financial reports for internal analysis, tax filing, and regulatory compliance."
        >
          <span className="text-slate-400 hover:text-indigo-600 cursor-help">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </HelpTooltip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.path}
              to={report.path}
              className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-200 hover:shadow-lg transition-all"
            >
              <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                {report.title}
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                {report.description}
              </p>
              <span className="inline-flex items-center text-sm font-medium text-indigo-600">
                View Report
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsOverview;
