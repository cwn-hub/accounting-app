import { useState, useEffect } from 'react'
import { fetchTaxRates, createTaxRate, updateTaxRate, setDefaultTaxRate, fetchDefaultTaxRate } from '../../services/settingsApi'

export default function TaxRateSettings({ businessId, onChange }) {
  const [taxRates, setTaxRates] = useState([])
  const [defaultTaxRateId, setDefaultTaxRateId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const [addForm, setAddForm] = useState({ name: '', rate: '' })
  const [editForm, setEditForm] = useState({ name: '', rate: '', is_archived: false })

  useEffect(() => {
    loadTaxRates()
  }, [businessId, showArchived])

  const loadTaxRates = async () => {
    try {
      setLoading(true)
      const [rates, defaultRate] = await Promise.all([
        fetchTaxRates(businessId, showArchived),
        fetchDefaultTaxRate(businessId),
      ])
      setTaxRates(rates)
      setDefaultTaxRateId(defaultRate?.id || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      const rate = parseFloat(addForm.rate) / 100
      if (isNaN(rate) || rate < 0 || rate >= 1) {
        setError('Rate must be between 0 and 100%')
        return
      }
      
      await createTaxRate(businessId, {
        name: addForm.name,
        rate: rate,
      })
      
      setAddForm({ name: '', rate: '' })
      setShowAddForm(false)
      await loadTaxRates()
      onChange?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (taxRate) => {
    setEditingId(taxRate.id)
    setEditForm({
      name: taxRate.name,
      rate: (taxRate.rate * 100).toFixed(2),
      is_archived: taxRate.is_archived,
    })
  }

  const handleUpdate = async (taxRateId) => {
    try {
      const rate = parseFloat(editForm.rate) / 100
      if (isNaN(rate) || rate < 0 || rate >= 1) {
        setError('Rate must be between 0 and 100%')
        return
      }
      
      await updateTaxRate(taxRateId, {
        name: editForm.name,
        rate: rate,
        is_archived: editForm.is_archived,
      })
      
      setEditingId(null)
      await loadTaxRates()
      onChange?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSetDefault = async (taxRateId) => {
    try {
      await setDefaultTaxRate(businessId, taxRateId)
      await loadTaxRates()
      onChange?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    setAddForm({ name: '', rate: '' })
    setError(null)
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Tax Rates</h3>
          <p className="text-sm text-slate-500">Manage VAT and sales tax rates</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show archived
          </label>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Add Tax Rate
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Add New Tax Rate</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g., VAT 8.1%"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={addForm.rate}
                onChange={(e) => setAddForm({ ...addForm, rate: e.target.value })}
                placeholder="8.1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Tax Rates List */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Rate</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Default</div>
          <div className="col-span-2"></div>
        </div>

        <div className="divide-y divide-slate-200">
          {taxRates.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              No tax rates configured
            </div>
          ) : (
            taxRates.map((taxRate) => (
              <div
                key={taxRate.id}
                className={`grid grid-cols-12 gap-4 px-4 py-3 items-center ${
                  taxRate.is_archived ? 'opacity-50' : 'bg-white'
                }`}
              >
                {editingId === taxRate.id ? (
                  <>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={editForm.rate}
                          onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                          className="w-20 px-2 py-1 text-sm border border-slate-300 rounded"
                        />
                        <span className="text-sm text-slate-500">%</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.is_archived}
                          onChange={(e) => setEditForm({ ...editForm, is_archived: e.target.checked })}
                          className="rounded"
                        />
                        Archived
                      </label>
                    </div>
                    <div className="col-span-2"></div>
                    <div className="col-span-2 flex justify-end gap-1">
                      <button
                        onClick={() => handleUpdate(taxRate.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-4 text-sm font-medium text-slate-900">{taxRate.name}</div>
                    <div className="col-span-2 text-sm text-slate-600">{(taxRate.rate * 100).toFixed(2)}%</div>
                    <div className="col-span-2">
                      {taxRate.is_archived ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Archived
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="col-span-2">
                      {defaultTaxRateId === taxRate.id ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          Default
                        </span>
                      ) : !taxRate.is_archived ? (
                        <button
                          onClick={() => handleSetDefault(taxRate.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Set as Default
                        </button>
                      ) : null}
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => handleEdit(taxRate)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        💡 The default tax rate will be pre-selected when creating new transactions.
      </p>
    </div>
  )
}
