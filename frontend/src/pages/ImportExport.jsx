import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, FileJson, CheckCircle, AlertTriangle } from 'lucide-react';
import { 
  exportCSV, 
  downloadCSV, 
  createBackup, 
  downloadBackup, 
  restoreBackup,
  importExcel 
} from '../services/settingsApi';

const BUSINESS_ID = 1; // TODO: Get from context/auth

const ImportExport = () => {
  const [activeTab, setActiveTab] = useState('import');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [restoreData, setRestoreData] = useState(null);
  
  const fileInputRef = useRef(null);
  const backupInputRef = useRef(null);

  const showMessage = (type, message) => {
    if (type === 'error') {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  // CSV Export
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const result = await exportCSV(BUSINESS_ID, {
        entity_types: ['transactions', 'accounts', 'categories', 'tax_rates'],
      });
      downloadCSV(result);
      showMessage('success', `Exported ${result.row_count} rows to CSV`);
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Backup
  const handleBackup = async () => {
    try {
      setLoading(true);
      const result = await createBackup(BUSINESS_ID);
      downloadBackup(result);
      showMessage('success', 'Backup created and downloaded');
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Restore
  const handleRestoreFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setRestoreData(data);
      } catch (err) {
        showMessage('error', 'Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleRestore = async (mergeStrategy = 'replace') => {
    if (!restoreData) return;
    
    try {
      setLoading(true);
      const result = await restoreBackup(restoreData, mergeStrategy);
      showMessage('success', `Restored: ${result.transactions_restored} transactions, ${result.accounts_restored} accounts`);
      setRestoreData(null);
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Excel Import
  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const result = await importExcel(file, BUSINESS_ID);
      showMessage('success', `Imported: ${result.transactions_imported} transactions, ${result.accounts_imported} accounts`);
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Import / Export</h1>
        <p className="text-slate-600">Transfer data to and from SwissBooks</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 mb-6">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Import Data
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Export Data
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'backup'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileJson className="w-4 h-4 inline mr-2" />
            Backup & Restore
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'import' ? (
            <div className="space-y-6">
              {/* Excel Import */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-900 mb-2">Import from Excel</p>
                <p className="text-slate-500 mb-4">Upload your .xlsx accounting file</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleExcelImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Select Excel File
                </button>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-2">Import Tips</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Use the Accounting-Excel-Template.xlsx format
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Dates should be in YYYY-MM-DD format
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                    Supported sheets: Business Config, Accounts, Categories, Tax Rates, Month1-12
                  </li>
                </ul>
              </div>
            </div>
          ) : activeTab === 'export' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleExportCSV}
                  disabled={loading}
                  className="p-6 border-2 border-slate-200 rounded-xl text-left hover:border-indigo-400 transition-all"
                >
                  <FileSpreadsheet className="w-10 h-10 text-emerald-500 mb-3" />
                  <p className="font-medium text-slate-900">Export to CSV</p>
                  <p className="text-sm text-slate-500 mt-1">Download all transactions, accounts, and categories as a CSV file for spreadsheet analysis.</p>
                </button>
                
                <button
                  onClick={handleBackup}
                  disabled={loading}
                  className="p-6 border-2 border-slate-200 rounded-xl text-left hover:border-indigo-400 transition-all"
                >
                  <FileJson className="w-10 h-10 text-indigo-500 mb-3" />
                  <p className="font-medium text-slate-900">Full JSON Backup</p>
                  <p className="text-sm text-slate-500 mt-1">Create a complete backup of all your data that can be restored later.</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!restoreData ? (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                  <FileJson className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900 mb-2">Restore from Backup</p>
                  <p className="text-slate-500 mb-4">Select a JSON backup file to restore your data</p>
                  <input
                    ref={backupInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => backupInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Select Backup File
                  </button>
                </div>
              ) : (
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
                  <h4 className="text-lg font-semibold text-indigo-900 mb-4">Restore Backup</h4>
                  <div className="bg-white p-4 rounded-lg border border-indigo-200 mb-4">
                    <p className="font-medium text-slate-900">
                      {restoreData.business?.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      Exported: {new Date(restoreData.exported_at).toLocaleDateString()}
                    </p>
                    <div className="mt-3 text-sm text-slate-600 space-y-1">
                      <p>• {restoreData.accounts?.length || 0} accounts</p>
                      <p>• {restoreData.categories?.length || 0} categories</p>
                      <p>• {restoreData.tax_rates?.length || 0} tax rates</p>
                      <p>• {restoreData.transactions?.length || 0} transactions</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRestore('replace')}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Replace All Data
                    </button>
                    <button
                      onClick={() => handleRestore('merge')}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 disabled:opacity-50"
                    >
                      Merge Data
                    </button>
                    <button
                      onClick={() => setRestoreData(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-indigo-600">
                    Replace: Deletes all existing data before restoring. Merge: Combines with existing data.
                  </p>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Important</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Restoring from backup will modify your data. Consider creating a backup first before restoring.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
            <span className="text-sm font-medium text-slate-700">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportExport;
