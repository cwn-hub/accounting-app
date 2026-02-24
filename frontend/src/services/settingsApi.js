/**
 * Settings API Service
 * Business settings, Chart of Accounts, Tax Rates, Account Management, Data Management
 */

const API_BASE_URL = 'http://localhost:8000/api';

// ============================================================================
// Business Settings
// ============================================================================

export async function fetchBusinessSettings(businessId) {
  const response = await fetch(`${API_BASE_URL}/settings/business/${businessId}`);
  if (!response.ok) throw new Error('Failed to fetch business settings');
  return response.json();
}

export async function updateBusinessSettings(businessId, settings) {
  const response = await fetch(`${API_BASE_URL}/settings/business/${businessId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error('Failed to update business settings');
  return response.json();
}

export async function uploadBusinessLogo(businessId, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/settings/business/${businessId}/logo`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload logo');
  return response.json();
}

// ============================================================================
// Chart of Accounts Settings
// ============================================================================

export async function fetchCategories(businessId, includeArchived = false) {
  const url = `${API_BASE_URL}/settings/categories/${businessId}?include_archived=${includeArchived}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
}

export async function updateCategory(categoryId, updates) {
  const response = await fetch(`${API_BASE_URL}/settings/categories/${categoryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update category');
  return response.json();
}

export async function reorderCategories(businessId, categoryIds) {
  const response = await fetch(`${API_BASE_URL}/settings/categories/${businessId}/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category_ids: categoryIds }),
  });
  if (!response.ok) throw new Error('Failed to reorder categories');
  return response.json();
}

export async function resetDefaultCategories(businessId) {
  const response = await fetch(`${API_BASE_URL}/settings/categories/${businessId}/reset-defaults`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to reset categories');
  return response.json();
}

// ============================================================================
// Tax Rate Configuration
// ============================================================================

export async function fetchTaxRates(businessId, includeArchived = false) {
  const url = `${API_BASE_URL}/settings/tax-rates/${businessId}?include_archived=${includeArchived}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch tax rates');
  return response.json();
}

export async function createTaxRate(businessId, taxRate) {
  const response = await fetch(`${API_BASE_URL}/settings/tax-rates/${businessId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taxRate),
  });
  if (!response.ok) throw new Error('Failed to create tax rate');
  return response.json();
}

export async function updateTaxRate(taxRateId, updates) {
  const response = await fetch(`${API_BASE_URL}/settings/tax-rates/${taxRateId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update tax rate');
  return response.json();
}

export async function setDefaultTaxRate(businessId, taxRateId) {
  const response = await fetch(`${API_BASE_URL}/settings/tax-rates/${businessId}/set-default`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tax_rate_id: taxRateId }),
  });
  if (!response.ok) throw new Error('Failed to set default tax rate');
  return response.json();
}

export async function fetchDefaultTaxRate(businessId) {
  const response = await fetch(`${API_BASE_URL}/settings/tax-rates/${businessId}/default`);
  if (!response.ok) throw new Error('Failed to fetch default tax rate');
  return response.json();
}

// ============================================================================
// Account Management
// ============================================================================

export async function fetchAccounts(businessId, includeArchived = false) {
  const url = `${API_BASE_URL}/settings/accounts/${businessId}?include_archived=${includeArchived}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch accounts');
  return response.json();
}

export async function createAccount(businessId, account) {
  const response = await fetch(`${API_BASE_URL}/settings/accounts/${businessId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  });
  if (!response.ok) throw new Error('Failed to create account');
  return response.json();
}

export async function updateAccount(accountId, updates) {
  const response = await fetch(`${API_BASE_URL}/settings/accounts/${accountId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update account');
  return response.json();
}

export async function deleteAccount(accountId) {
  const response = await fetch(`${API_BASE_URL}/settings/accounts/${accountId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete account');
  return true;
}

export async function reorderAccounts(businessId, accountIds) {
  const response = await fetch(`${API_BASE_URL}/settings/accounts/${businessId}/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(accountIds),
  });
  if (!response.ok) throw new Error('Failed to reorder accounts');
  return response.json();
}

// ============================================================================
// Data Management
// ============================================================================

export async function exportCSV(businessId, options = {}) {
  const request = {
    business_id: businessId,
    entity_types: options.entity_types || ['transactions'],
    year: options.year,
    month: options.month,
  };
  
  const response = await fetch(`${API_BASE_URL}/settings/export/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to export CSV');
  return response.json();
}

export async function downloadCSV(exportData) {
  const blob = new Blob([exportData.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportData.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function createBackup(businessId) {
  const response = await fetch(`${API_BASE_URL}/settings/backup/${businessId}`);
  if (!response.ok) throw new Error('Failed to create backup');
  return response.json();
}

export function downloadBackup(backupData) {
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup_${backupData.business.name}_${backupData.exported_at.split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function restoreBackup(backupData, mergeStrategy = 'replace') {
  const response = await fetch(`${API_BASE_URL}/settings/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ backup_data: backupData, merge_strategy: mergeStrategy }),
  });
  if (!response.ok) throw new Error('Failed to restore backup');
  return response.json();
}

export async function deleteAllData(businessId, options = {}) {
  const request = {
    business_id: businessId,
    confirm_delete: true,
    delete_transactions: options.deleteTransactions !== false,
    delete_accounts: options.deleteAccounts || false,
    delete_categories: options.deleteCategories || false,
    delete_tax_rates: options.deleteTaxRates || false,
  };
  
  const response = await fetch(`${API_BASE_URL}/settings/delete-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Failed to delete data');
  return response.json();
}

export async function importExcel(file, businessId = null) {
  const formData = new FormData();
  formData.append('file', file);
  if (businessId) {
    formData.append('business_id', businessId);
  }
  
  const response = await fetch(`${API_BASE_URL}/settings/import/excel`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to import Excel');
  return response.json();
}

export async function fetchImportTemplateInfo() {
  const response = await fetch(`${API_BASE_URL}/settings/import/template`);
  if (!response.ok) throw new Error('Failed to fetch import template info');
  return response.json();
}
