import { useState, useRef } from 'react'
import {
  exportCSV,
  downloadCSV,
  createBackup,
  downloadBackup,
  restoreBackup,
  deleteAllData,
  importExcel,
} from '../../services/settingsApi'

export default function DataManagement({ businessId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeOperation, setActiveOperation] = useState(null)
  const [restoreData, setRestoreData] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteOptions, setDeleteOptions] = useState({
    deleteTransactions: true,
    deleteAccounts: false,
    deleteCategories: false,
    deleteTaxRates: false,
  })
  
  const fileInputRef = useRef(null)
  const backupInputRef = useRef(null)

  const showMessage = (type, message) => {
    if (type === 'error') {
      setError(message)
      setSuccess(null)
    } else {
      setSuccess(message)
      setError(null)
    }
    setTimeout(() => {
      setError(null)
      setSuccess(null)
    }, 5000)
  }

  // CSV Export
  const handleExportCSV = async () => {
    try {
      setLoading(true)
      setActiveOperation('export')
      const result = await exportCSV(businessId, {
        entity_types: ['transactions', 'accounts', 'categories', 'tax_rates'],
      })
      downloadCSV(result)
      showMessage('success', `Exported ${result.row_count} rows to CSV`)
    } catch (err) {
      showMessage('error', err.message)
    } finally {
      setLoading(false)
      setActiveOperation(null)
    }
  }

  // Backup
  const handleBackup = async () => {
    try {
      setLoading(true)
      setActiveOperation('backup')
      const result = await createBackup(businessId)
      downloadBackup(result)
      showMessage('success', 'Backup created and downloaded')
    } catch (err) {
      showMessage('error', err.message)
    } finally {
      setLoading(false)
      setActiveOperation(null)
    }
  }

  // Restore
  const handleRestoreFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        setRestoreData(data)
      } catch {
        showMessage('error', 'Invalid backup file')
      }
    }
    reader.readAsText(file)
  }

  const handleRestore = async (mergeStrategy = 'replace') => {
    if (!restoreData) return
    
    try {
      setLoading(true)
      setActiveOperation('restore')
      const result = await restoreBackup(restoreData, mergeStrategy)
      showMessage('success', `Restored: ${result.transactions_restored} transactions, ${result.accounts_restored} accounts`)
      setRestoreData(null)
    } catch (err) {
      showMessage('error', err.message)
    } finally {
      setLoading(false)
      setActiveOperation(null)
    }
  }

  // Excel Import
  const handleExcelImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      setActiveOperation('import')
      const result = await importExcel(file, businessId)
      showMessage('success', `Imported: ${result.transactions_imported} transactions, ${result.accounts_imported} accounts`)
    } catch (error) {
      showMessage('error', error.message)
    } finally {
      setLoading(false)
      setActiveOperation(null)
    }
  }

  // Delete All
  const handleDeleteAll = async () => {
    try {
      setLoading(true)
      setActiveOperation('delete')
      const result = await deleteAllData(businessId, deleteOptions)
      showMessage('success', `Deleted: ${result.transactions_deleted} transactions, ${result.accounts_deleted} accounts`)
      setShowDeleteConfirm(false)
    } catch (err) {
      showMessage('error', err.message)
    } finally {
      setLoading(false)
      setActiveOperation(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Data Management</h3>
        <p className="text-sm text-slate-500">Import, export, backup, and manage your data</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Import Section */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span>📥</span> Import Data
        </h4>
        <div className="space-y-3">
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <span>📊</span>
              Import from Excel (.xlsx)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={handleExcelImport}
              className="hidden"
            />
          </div>
          <p className="text-xs text-slate-500">
            Import transactions, accounts, and settings from an Excel file.
          </p>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span>📤</span> Export Data
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <span>📄</span>
            Export CSV
          </button>
          <button
            onClick={handleBackup}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <span>💾</span>
            Full Backup
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          CSV exports transactions for spreadsheet analysis. Backup creates a complete JSON export for restoration.
        </p>
      </div>

      {/* Restore Section */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <span>🔄</span> Restore from Backup
        </h4>
        
        {!restoreData ? (
          <div>
            <button
              onClick={() => backupInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              <span>📂</span>
              Select Backup File
            </button>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-sm font-medium text-slate-900">
                {restoreData.business?.name}
              </p>
              <p className="text-xs text-slate-500">
                Exported: {new Date(restoreData.exported_at).toLocaleDateString()}
              </p>
              <div className="mt-2 text-xs text-slate-600 space-y-1">
                <p>• {restoreData.accounts?.length || 0} accounts</p>
                <p>• {restoreData.categories?.length || 0} categories</p>
                <p>• {restoreData.transactions?.length || 0} transactions</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRestore('replace')}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Replace All
              </button>
              <button
                onClick={() => handleRestore('merge')}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
              >
                Merge
              </button>
              <button
                onClick={() => setRestoreData(null)}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h4 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
          <span>⚠️</span> Danger Zone
        </h4>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <span>🗑️</span>
            Delete All Data
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-700 font-medium">
              This action cannot be undone. Select what to delete:
            </p>
            <div className="space-y-2 bg-white p-3 rounded border border-red-200">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={deleteOptions.deleteTransactions}
                  onChange={(e) => setDeleteOptions({ ...deleteOptions, deleteTransactions: e.target.checked })}
                  className="rounded border-red-300"
                />
                Delete all transactions
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={deleteOptions.deleteAccounts}
                  onChange={(e) => setDeleteOptions({ ...deleteOptions, deleteAccounts: e.target.checked })}
                  className="rounded border-red-300"
                />
                Delete all accounts
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={deleteOptions.deleteCategories}
                  onChange={(e) => setDeleteOptions({ ...deleteOptions, deleteCategories: e.target.checked })}
                  className="rounded border-red-300"
                />
                Delete all categories
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={deleteOptions.deleteTaxRates}
                  onChange={(e) => setDeleteOptions({ ...deleteOptions, deleteTaxRates: e.target.checked })}
                  className="rounded border-red-300"
                />
                Delete all tax rates
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAll}
                disabled={loading || (!deleteOptions.deleteTransactions && !deleteOptions.deleteAccounts && !deleteOptions.deleteCategories && !deleteOptions.deleteTaxRates)}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium text-slate-700">
              {activeOperation === 'export' && 'Exporting...'}
              {activeOperation === 'backup' && 'Creating backup...'}
              {activeOperation === 'restore' && 'Restoring...'}
              {activeOperation === 'import' && 'Importing...'}
              {activeOperation === 'delete' && 'Deleting...'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
