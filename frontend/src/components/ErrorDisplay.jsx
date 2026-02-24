import { useState, useEffect } from 'react';
import { fetchErrorHighlights, buildErrorMap, getErrorTypeLabel } from '../services/sprint5Api';

/**
 * ErrorBadge Component
 * Shows error/warning badges on transaction rows
 */
export function ErrorBadge({ errors }) {
  if (!errors || errors.length === 0) return null;
  
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  
  return (
    <div className="flex items-center gap-1">
      {errorCount > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-danger-700 bg-danger-100 rounded">
          {errorCount} error{errorCount !== 1 ? 's' : ''}
        </span>
      )}
      {warningCount > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-warning-700 bg-warning-100 rounded">
          {warningCount}
        </span>
      )}
    </div>
  );
}

/**
 * ErrorTooltip Component
 * Shows detailed error info on hover
 */
export function ErrorTooltip({ errors }) {
  if (!errors || errors.length === 0) return null;
  
  return (
    <div className="absolute z-50 left-full ml-2 top-0 w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-3 animate-fade-in">
      <div className="space-y-2">
        {errors.map((error, idx) => (
          <div 
            key={idx} 
            className={`p-2 rounded text-sm ${
              error.severity === 'error' ? 'bg-danger-50 text-danger-800 border border-danger-200' : 'bg-warning-50 text-warning-800 border border-warning-200'
            }`}
          >
            <p className="font-semibold">{getErrorTypeLabel(error.error_type)}</p>
            <p className="text-xs opacity-80 mt-0.5">{error.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ErrorIndicator Component
 * Icon indicator with hover tooltip
 */
export function ErrorIndicator({ errors }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!errors || errors.length === 0) return null;
  
  const hasError = errors.some(e => e.severity === 'error');
  const icon = hasError ? '⚠️' : '⚡';
  const colorClass = hasError ? 'text-danger-500' : 'text-warning-500';
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={`${colorClass} cursor-help`} title="Validation issues">
        {icon}
      </span>
      {showTooltip && <ErrorTooltip errors={errors} />}
    </div>
  );
}

/**
 * ValidationPanel Component
 * Side panel showing all validation errors
 */
export function ValidationPanel({ businessId = 1, year = 2026, month = null }) {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    async function loadErrors() {
      setLoading(true);
      try {
        const data = await fetchErrorHighlights(businessId, year, month);
        setErrors(data);
      } catch (err) {
        console.error('Failed to load errors:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadErrors();
  }, [businessId, year, month]);

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  if (errors.length === 0 && !loading) {
    return (
      <div className="bg-success-50 border border-success-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-success-800">
          <span>✓</span>
          <span className="font-medium">No validation errors</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors duration-150"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🔍</span>
          <span className="font-medium text-slate-900">Validation Issues</span>
          {errorCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-danger-700 bg-danger-100 rounded-full">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-warning-700 bg-warning-100 rounded-full">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-slate-400 transition-transform duration-150">{isExpanded ? '▼' : '▶'}</span>
      </button>
      
      {isExpanded && (
        <div className="p-4 max-h-64 overflow-auto custom-scrollbar">
          {loading ? (
            <p className="text-slate-500 text-sm">Loading...</p>
          ) : (
            <div className="space-y-2">
              {errors.map((error, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg text-sm border ${
                    error.severity === 'error' 
                      ? 'bg-danger-50 border-danger-200' 
                      : 'bg-warning-50 border-warning-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span>{error.severity === 'error' ? '⚠️' : '⚡'}</span>
                    <div>
                      <p className="font-medium">
                        Transaction #{error.transaction_id}
                      </p>
                      <p className={`text-xs ${
                        error.severity === 'error' ? 'text-danger-600' : 'text-warning-600'
                      }`}>
                        {getErrorTypeLabel(error.error_type)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * useTransactionErrors Hook
 * Provides error lookup for transactions
 */
export function useTransactionErrors(businessId, year, month) {
  const [errorMap, setErrorMap] = useState(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadErrors() {
      setLoading(true);
      try {
        const highlights = await fetchErrorHighlights(businessId, year, month);
        setErrorMap(buildErrorMap(highlights));
      } catch (err) {
        console.error('Failed to load error highlights:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadErrors();
  }, [businessId, year, month]);

  const getErrors = (transactionId) => {
    return errorMap.get(transactionId) || [];
  };

  const hasErrors = (transactionId) => {
    return errorMap.has(transactionId);
  };

  return { errorMap, getErrors, hasErrors, loading };
}

export default { ErrorBadge, ErrorIndicator, ValidationPanel, useTransactionErrors };
