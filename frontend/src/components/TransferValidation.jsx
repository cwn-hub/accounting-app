import { useState, useEffect } from 'react';
import { validateTransfers, fetchTransferSummary } from '../services/sprint5Api';

/**
 * TransferValidation Component
 * Displays interbank transfer validation results
 * Flags months where transfers OUT ≠ transfers IN
 */
function TransferValidation({ businessId = 1, year = 2026, isCompact = false }) {
  const [validation, setValidation] = useState(null);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [validationData, summaryData] = await Promise.all([
          validateTransfers(businessId, year),
          fetchTransferSummary(businessId, year)
        ]);
        setValidation(validationData);
        setSummary(summaryData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [businessId, year, isOpen]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(parseFloat(amount));
  };

  const unbalancedCount = summary.filter(s => !s.is_balanced).length;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`flex-shrink-0 px-4 py-2 rounded-lg transition-all duration-150 flex items-center gap-2 font-medium text-sm min-touch-target ${
          unbalancedCount > 0 
            ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200' 
            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
        } ${isCompact ? 'whitespace-nowrap' : ''}`}
      >
        {unbalancedCount > 0 ? (
          <>
            <span>⚠️</span>
            <span>{isCompact ? `${unbalancedCount} Issue${unbalancedCount !== 1 ? 's' : ''}` : `${unbalancedCount} Unbalanced Transfer${unbalancedCount !== 1 ? 's' : ''}`}</span>
          </>
        ) : (
          <>
            <span>✓</span>
            <span>{isCompact ? 'Transfers OK' : 'Transfers Validated'}</span>
          </>
        )}
      </button>
    );
  }

  const selectedMonthData = selectedMonth 
    ? validation?.results.find(r => r.month === selectedMonth)
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Interbank Transfer Validation</h2>
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
              <p className="mt-4 text-slate-500">Validating transfers...</p>
            </div>
          )}

          {error && (
            <div className="bg-danger-50 text-danger-700 p-4 rounded-lg border border-danger-200">
              <p>Error: {error}</p>
            </div>
          )}

          {validation && !loading && (
            <>
              {/* Status Banner */}
              <div className={`mb-6 p-4 rounded-lg border ${
                validation.is_valid 
                  ? 'bg-success-50 text-success-800 border-success-200' 
                  : 'bg-danger-50 text-danger-800 border-danger-200'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{validation.is_valid ? '✓' : '⚠️'}</span>
                  <div>
                    <p className="font-semibold">
                      {validation.is_valid 
                        ? 'All transfers are balanced' 
                        : `${unbalancedCount} month${unbalancedCount !== 1 ? 's have' : ' has'} unbalanced transfers`}
                    </p>
                    <p className="text-sm opacity-80">
                      {validation.is_valid 
                        ? 'Total transfers OUT equal total transfers IN for all months'
                        : 'Some months have transfers that do not balance. Click a month to see details.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Summary Grid */}
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Monthly Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {summary.map((month) => (
                      <button
                        key={month.month}
                        onClick={() => setSelectedMonth(month.month === selectedMonth ? null : month.month)}
                        className={`p-3 rounded-lg border text-left transition-all duration-150 ${
                          month.is_balanced 
                            ? 'bg-success-50 border-success-200 hover:border-success-300 hover:shadow-sm' 
                            : 'bg-danger-50 border-danger-200 hover:border-danger-300 hover:shadow-sm'
                        } ${selectedMonth === month.month ? 'ring-2 ring-primary-500' : ''}`}
                      >
                        <p className="text-xs text-slate-500 uppercase">
                          {new Date(2026, month.month - 1).toLocaleString('default', { month: 'short' })}
                        </p>
                        <p className={`text-lg font-bold tabular-nums ${
                          month.is_balanced ? 'text-success-700' : 'text-danger-700'
                        }`}>
                          {formatCurrency(month.difference)}
                        </p>
                        <p className={`text-xs ${month.is_balanced ? 'text-success-600' : 'text-danger-600'}`}>
                          {month.is_balanced ? '✓ Balanced' : '✗ Unbalanced'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Month Detail */}
                <div className="lg:col-span-1">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
                    {selectedMonth ? 'Month Details' : 'Select a Month'}
                  </h3>
                  
                  {selectedMonthData ? (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-3">
                        {new Date(2026, selectedMonthData.month - 1).toLocaleString('default', { month: 'long' })}
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Transfers OUT:</span>
                          <span className="font-medium text-danger-600 tabular-nums">
                            -{formatCurrency(selectedMonthData.total_transfers_out)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Transfers IN:</span>
                          <span className="font-medium text-success-600 tabular-nums">
                            +{formatCurrency(selectedMonthData.total_transfers_in)}
                          </span>
                        </div>
                        <div className="border-t border-slate-200 pt-2">
                          <div className="flex justify-between font-semibold">
                            <span className={selectedMonthData.is_balanced ? 'text-slate-900' : 'text-danger-700'}>
                              Difference:
                            </span>
                            <span className={`tabular-nums ${selectedMonthData.is_balanced ? 'text-slate-900' : 'text-danger-700'}`}>
                              {formatCurrency(selectedMonthData.difference)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!selectedMonthData.is_balanced && (
                        <div className="mt-4 p-3 bg-danger-100 rounded-md text-sm text-danger-800 border border-danger-200">
                          <p className="font-semibold">⚠️ Unbalanced Transfer</p>
                          <p className="mt-1">
                            The difference of {formatCurrency(selectedMonthData.difference)} indicates 
                            {parseFloat(selectedMonthData.difference) > 0 
                              ? ' money leaving without a matching incoming transfer.'
                              : ' money entering without a matching outgoing transfer.'}
                          </p>
                        </div>
                      )}

                      {/* Transaction List */}
                      {selectedMonthData.transactions.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-slate-700 mb-2">Transactions:</p>
                          <div className="space-y-2 max-h-48 overflow-auto custom-scrollbar">
                            {selectedMonthData.transactions.map((txn) => (
                              <div 
                                key={`${txn.id}-${txn.type}`}
                                className="flex items-center justify-between p-2 bg-white rounded border border-slate-200 text-sm hover:shadow-sm transition-shadow duration-150"
                              >
                                <div>
                                  <p className="font-medium text-slate-900">{txn.account_name}</p>
                                  <p className="text-xs text-slate-500">{txn.date}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                                    txn.type === 'out' 
                                      ? 'bg-danger-100 text-danger-700' 
                                      : 'bg-success-100 text-success-700'
                                  }`}>
                                    {txn.type === 'out' ? 'OUT' : 'IN'}
                                  </span>
                                  <p className="text-slate-900 font-medium tabular-nums">
                                    {formatCurrency(txn.amount)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-8 border border-slate-200 border-dashed text-center">
                      <p className="text-slate-500">Click a month to view transfer details</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransferValidation;
