import { useState, useEffect } from 'react';
import { fetchTaxReport } from '../services/sprint5Api';

/**
 * TaxReport Component
 * Displays sales tax report with collected, paid, and net amounts
 */
function TaxReport({ businessId = 1, year = 2026, isCompact = false }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    async function loadReport() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTaxReport(businessId, year);
        setReport(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadReport();
  }, [businessId, year, isOpen]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(parseFloat(amount));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'payable': return 'text-danger-600 bg-danger-50 border-danger-200';
      case 'refundable': return 'text-success-600 bg-success-50 border-success-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'payable': return 'Tax Payable';
      case 'refundable': return 'Tax Refundable';
      default: return 'Balanced';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex-shrink-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm min-touch-target ${isCompact ? 'whitespace-nowrap' : ''}`}
      >
        📊 {isCompact ? 'Tax' : 'View Tax Report'}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sales Tax Report</h2>
            <p className="text-sm text-slate-500">Year {year}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors duration-150"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-slate-500">Loading tax report...</p>
            </div>
          )}

          {error && (
            <div className="bg-danger-50 text-danger-700 p-4 rounded-lg border border-danger-200">
              <p>Error loading report: {error}</p>
            </div>
          )}

          {report && !loading && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Tax Collected</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">
                    {formatCurrency(report.summary.total_tax_collected)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">From income</p>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Tax Paid</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">
                    {formatCurrency(report.summary.total_tax_paid)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">On expenses</p>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-500 mb-1">Paid to Authorities</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">
                    {formatCurrency(report.summary.tax_payments_to_authorities || 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Tax payments made</p>
                </div>
                
                <div className={`rounded-lg p-4 border ${getStatusColor(report.summary.status)}`}>
                  <p className="text-sm opacity-80 mb-1">Net Amount</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {formatCurrency(report.summary.net_tax_payable)}
                  </p>
                  <p className="text-xs opacity-70 mt-1">{getStatusLabel(report.summary.status)}</p>
                </div>
              </div>

              {/* Monthly Breakdown */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Month</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Tax Collected</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Tax Paid</th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Net</th>
                      <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {report.monthly_breakdown.map((month) => (
                      <tr key={month.month} className="hover:bg-slate-50 transition-colors duration-150">
                        <td className="px-4 py-3 text-sm text-slate-900">
                          {new Date(2026, month.month - 1).toLocaleString('default', { month: 'long' })}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 text-right tabular-nums">
                          {formatCurrency(month.tax_collected)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 text-right tabular-nums">
                          {formatCurrency(month.tax_paid)}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium text-right tabular-nums ${
                          parseFloat(month.net) > 0 ? 'text-danger-600' : 
                          parseFloat(month.net) < 0 ? 'text-success-600' : 'text-slate-900'
                        }`}>
                          {formatCurrency(month.net)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {parseFloat(month.net) > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-danger-700 bg-danger-100 rounded-full">
                              Owed
                            </span>
                          ) : parseFloat(month.net) < 0 ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-success-700 bg-success-100 rounded-full">
                              Credit
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
                              Balanced
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaxReport;
