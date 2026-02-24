/**
 * API service for Sprint 5 features
 * Tax reports, transfer validation, and error highlighting
 * Includes mock fallbacks for when API is unavailable
 */

const API_BASE_URL = 'http://localhost:8000/api';

// Mock data for when API is not available
const mockTaxReport = {
  summary: {
    total_tax_collected: 12500.00,
    total_tax_paid: 3200.00,
    tax_payments_to_authorities: 8000.00,
    net_tax_payable: 1300.00,
    status: 'payable'
  },
  monthly_breakdown: Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    tax_collected: 1000 + Math.random() * 500,
    tax_paid: 200 + Math.random() * 300,
    net: 800 + Math.random() * 200
  }))
};

const mockTransferValidation = {
  is_valid: false,
  results: Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    total_transfers_out: 5000 + Math.random() * 2000,
    total_transfers_in: 4800 + Math.random() * 2000,
    difference: Math.random() * 400 - 200,
    is_balanced: Math.random() > 0.3,
    transactions: []
  }))
};

const mockTransferSummary = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  transfers_out: 5000 + Math.random() * 2000,
  transfers_in: 4800 + Math.random() * 2000,
  difference: Math.random() * 400 - 200,
  is_balanced: Math.random() > 0.3
}));

const mockErrorHighlights = [];

/**
 * Check if API is available
 * @returns {Promise<boolean>} Whether the API is available
 */
export async function checkApiAvailable() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${API_BASE_URL}/health`, { 
      signal: controller.signal,
      method: 'HEAD'
    }).catch(() => null);
    clearTimeout(timeoutId);
    return response?.ok || false;
  } catch {
    return false;
  }
}

/**
 * Fetch tax report for a business
 */
export async function fetchTaxReport(businessId, year) {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/tax/${businessId}?year=${year}`);
    if (!response.ok) throw new Error('Failed to fetch tax report');
    return response.json();
  } catch (err) {
    console.warn('API unavailable, using mock tax report:', err.message);
    return mockTaxReport;
  }
}

/**
 * Validate interbank transfers
 */
export async function validateTransfers(businessId, year, month = null) {
  try {
    let url = `${API_BASE_URL}/validation/transfers/${businessId}?year=${year}`;
    if (month) url += `&month=${month}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to validate transfers');
    return response.json();
  } catch (err) {
    console.warn('API unavailable, using mock transfer validation:', err.message);
    return mockTransferValidation;
  }
}

/**
 * Get monthly transfer summary
 */
export async function fetchTransferSummary(businessId, year) {
  try {
    const response = await fetch(`${API_BASE_URL}/validation/transfers/monthly-summary/${businessId}?year=${year}`);
    if (!response.ok) throw new Error('Failed to fetch transfer summary');
    return response.json();
  } catch (err) {
    console.warn('API unavailable, using mock transfer summary:', err.message);
    return mockTransferSummary;
  }
}

/**
 * Get validation errors
 */
export async function fetchValidationErrors(businessId, year = null, month = null) {
  try {
    let url = `${API_BASE_URL}/validation/errors/${businessId}`;
    const params = [];
    if (year) params.push(`year=${year}`);
    if (month) params.push(`month=${month}`);
    if (params.length) url += '?' + params.join('&');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch validation errors');
    return response.json();
  } catch (err) {
    console.warn('API unavailable, using mock validation errors:', err.message);
    return [];
  }
}

/**
 * Get error highlights (simplified for UI)
 */
export async function fetchErrorHighlights(businessId, year = null, month = null) {
  try {
    let url = `${API_BASE_URL}/validation/errors/highlight/${businessId}`;
    const params = [];
    if (year) params.push(`year=${year}`);
    if (month) params.push(`month=${month}`);
    if (params.length) url += '?' + params.join('&');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch error highlights');
    return response.json();
  } catch (err) {
    console.warn('API unavailable, using mock error highlights:', err.message);
    return mockErrorHighlights;
  }
}

/**
 * Build a map of transaction IDs to their errors for quick lookup
 */
export function buildErrorMap(errors) {
  const map = new Map();
  errors.forEach(error => {
    if (!map.has(error.transaction_id)) {
      map.set(error.transaction_id, []);
    }
    map.get(error.transaction_id).push(error);
  });
  return map;
}

/**
 * Get CSS classes for error highlighting based on severity
 */
export function getErrorClasses(errors) {
  if (!errors || errors.length === 0) {
    return {
      row: '',
      badge: '',
      icon: ''
    };
  }
  
  const hasError = errors.some(e => e.severity === 'error');
  const hasWarning = errors.some(e => e.severity === 'warning');
  
  if (hasError) {
    return {
      row: 'bg-red-50 border-red-200',
      badge: 'bg-red-100 text-red-800',
      icon: 'text-red-500'
    };
  }
  if (hasWarning) {
    return {
      row: 'bg-yellow-50 border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800',
      icon: 'text-yellow-500'
    };
  }
  return {
    row: '',
    badge: '',
    icon: ''
  };
}

/**
 * Get human-readable error type label
 */
export function getErrorTypeLabel(errorType) {
  const labels = {
    'missing_allocation': 'Missing Category',
    'allocation_mismatch': 'Amount Mismatch',
    'unbalanced_transfer': 'Unbalanced Transfer',
    'orphaned_transfer': 'Orphaned Transfer'
  };
  return labels[errorType] || errorType;
}
