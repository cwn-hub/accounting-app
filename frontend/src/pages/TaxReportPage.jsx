import React, { useState } from 'react';
import { Calculator, Download, Calendar, FileCheck } from 'lucide-react';
import { FieldTooltip } from '../components/ContextualHelp';

const TaxReport = () => {
  const [period, setPeriod] = useState('Q1 2026');

  // Mock VAT data
  const vatData = {
    sales: {
      domestic: { amount: 45000, vat: 3375 },
      exempt: { amount: 15000, vat: 0 },
      export: { amount: 8000, vat: 0 },
    },
    purchases: {
      domestic: { amount: 28000, vat: 2100 },
      import: { amount: 5000, vat: 375 },
      exempt: { amount: 8000, vat: 0 },
    },
  };

  const totalVatOwed = vatData.sales.domestic.vat;
  const totalVatDeductible = vatData.purchases.domestic.vat + vatData.purchases.import.vat;
  const netVat = totalVatOwed - totalVatDeductible;

  const periods = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', '2026 Annual'];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tax Report</h1>
        <p className="text-slate-600">VAT and tax compliance reports</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            <label className="text-sm font-medium text-slate-700">Reporting Period:</label>
            <FieldTooltip content="Select the VAT reporting period. Swiss businesses typically report quarterly or annually depending on turnover." />
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {periods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4" />
            Export VAT Form
          </button>
        </div>
      </div>

      {/* VAT Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-slate-900">VAT Summary</h3>
          <FieldTooltip content="Value Added Tax (VAT) summary showing output tax (owed on sales) and input tax (deductible on purchases)." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">VAT on Sales (Output)</p>
            <p className="text-2xl font-bold text-slate-900">CHF {totalVatOwed.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">VAT on Purchases (Input)</p>
            <p className="text-2xl font-bold text-slate-900">CHF {totalVatDeductible.toLocaleString()}</p>
          </div>
          <div className={`${netVat >= 0 ? 'bg-emerald-50' : 'bg-rose-50'} rounded-lg p-4`}>
            <p className={`text-sm mb-1 ${netVat >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              Net VAT {netVat >= 0 ? 'Payable' : 'Receivable'}
            </p>
            <p className={`text-2xl font-bold ${netVat >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
              CHF {Math.abs(netVat).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h4 className="font-medium text-slate-900 mb-4">Detailed Breakdown</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales */}
            <div>
              <h5 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">Sales (Output Tax)</h5>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <div>
                    <span className="text-slate-700">Domestic Sales (7.5%)</span>
                    <p className="text-xs text-slate-500">CHF {vatData.sales.domestic.amount.toLocaleString()}</p>
                  </div>
                  <span className="font-medium text-slate-900">CHF {vatData.sales.domestic.vat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <div>
                    <span className="text-slate-700">Exempt Sales</span>
                    <p className="text-xs text-slate-500">CHF {vatData.sales.exempt.amount.toLocaleString()}</p>
                  </div>
                  <span className="font-medium text-slate-900">CHF {vatData.sales.exempt.vat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <div>
                    <span className="text-slate-700">Export Sales (0%)</span>
                    <p className="text-xs text-slate-500">CHF {vatData.sales.export.amount.toLocaleString()}</p>
                  </div>
                  <span className="font-medium text-slate-900">CHF {vatData.sales.export.vat.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Purchases */}
            <div>
              <h5 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wide">Purchases (Input Tax)</h5>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <div>
                    <span className="text-slate-700">Domestic Purchases</span>
                    <p className="text-xs text-slate-500">CHF {vatData.purchases.domestic.amount.toLocaleString()}</p>
                  </div>
                  <span className="font-medium text-emerald-600">- CHF {vatData.purchases.domestic.vat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <div>
                    <span className="text-slate-700">Import VAT</span>
                    <p className="text-xs text-slate-500">CHF {vatData.purchases.import.amount.toLocaleString()}</p>
                  </div>
                  <span className="font-medium text-emerald-600">- CHF {vatData.purchases.import.vat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <div>
                    <span className="text-slate-700">Exempt Purchases</span>
                    <p className="text-xs text-slate-500">CHF {vatData.purchases.exempt.amount.toLocaleString()}</p>
                  </div>
                  <span className="font-medium text-slate-900">CHF {vatData.purchases.exempt.vat.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Calculator className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900">VAT Filing Deadline</h4>
            <p className="text-sm text-amber-800 mt-1">
              The VAT return for {period} is due by <strong>May 31, 2026</strong>. 
              Please review all figures before submission to the FTA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxReport;
