import { useState, useEffect } from 'react'
import { fetchAccounts, createAccount, updateAccount, deleteAccount, reorderAccounts } from '../../services/settingsApi'

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank Account', icon: '🏦' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'asset', label: 'Asset', icon: '🏢' },
]

export default function AccountManagement({ businessId, onChange }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  
  const [addForm, setAddForm] = useState({ name: '', type: 'bank', opening_balance: '' })
  const [editForm, setEditForm] = useState({ name: '', type: 'bank', opening_balance: '', is_archived: false })

  useEffect(() => {
    loadAccounts()
  }, [businessId, showArchived])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const data = await fetchAccounts(businessId, showArchived)
      setAccounts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      const balance = parseFloat(addForm.opening_balance) || 0
      
      await createAccount(businessId, {
        name: addForm.name,
        type: addForm.type,
        opening_balance: balance,
      })
      
      setAddForm({ name: '', type: 'bank', opening_balance: '' })
      setShowAddForm(false)
      await loadAccounts()
      onChange?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (account) => {
    setEditingId(account.id)
    setEditForm({
      name: account.name,
      type: account.type,
      opening_balance: account.opening_balance,
      is_archived: account.is_archived,
    })
  }

  const handleUpdate = async (accountId) => {
    try {
      await updateAccount(accountId, {
        name: editForm.name,
        type: editForm.type,
        opening_balance: parseFloat(editForm.opening_balance) || 0,
        is_archived: editForm.is_archived,
      })
      
      setEditingId(null)
      await loadAccounts()
      onChange?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (accountId) => {
    if (!confirm('Are you sure you want to delete this account? This can only be done if there are no transactions.')) {
      return
    }
    
    try {
      await deleteAccount(accountId)
      await loadAccounts()
      onChange?.()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    setAddForm({ name: '', type: 'bank', opening_balance: '' })
    setError(null)
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newAccounts = [...accounts]
    const draggedItem = newAccounts[draggedIndex]
    newAccounts.splice(draggedIndex, 1)
    newAccounts.splice(index, 0, draggedItem)
    
    setAccounts(newAccounts)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      try {
        const accountIds = accounts.map(a => a.id)
        await reorderAccounts(businessId, accountIds)
        onChange?.()
      } catch (err) {
        setError(err.message)
        await loadAccounts()
      }
    }
    setDraggedIndex(null)
  }

  const getTypeLabel = (type) => {
    const typeInfo = ACCOUNT_TYPES.find(t => t.value === type)
    return typeInfo?.label || type
  }

  const getTypeIcon = (type) => {
    const typeInfo = ACCOUNT_TYPES.find(t => t.value === type)
    return typeInfo?.icon || '📁'
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Account Management</h3>
          <p className="text-sm text-slate-500">Manage your bank accounts, credit cards, and assets</p>
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
            + Add Account
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
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Add New Account</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g., Main Checking"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={addForm.type}
                onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {ACCOUNT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance</label>
              <input
                type="number"
                step="0.01"
                value={addForm.opening_balance}
                onChange={(e) => setAddForm({ ...addForm, opening_balance: e.target.value })}
                placeholder="0.00"
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

      {/* Accounts List */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
          <div className="col-span-1">Order</div>
          <div className="col-span-3">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Opening Balance</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2"></div>
        </div>

        <div className="divide-y divide-slate-200">
          {accounts.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              No accounts configured
            </div>
          ) : (
            accounts.map((account, index) => (
              <div
                key={account.id}
                draggable={editingId !== account.id}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`grid grid-cols-12 gap-4 px-4 py-3 items-center ${
                  draggedIndex === index ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
                } ${account.is_archived ? 'opacity-50' : ''} ${
                  editingId !== account.id ? 'cursor-move' : ''
                }`}
              >
                {editingId === account.id ? (
                  <>
                    <div className="col-span-1 text-slate-400 text-sm">{index + 1}</div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={editForm.type}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                      >
                        {ACCOUNT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.opening_balance}
                        onChange={(e) => setEditForm({ ...editForm, opening_balance: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                      />
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
                    <div className="col-span-2 flex justify-end gap-1">
                      <button
                        onClick={() => handleUpdate(account.id)}
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
                    <div className="col-span-1 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      <span className="text-slate-500 text-sm">{index + 1}</span>
                    </div>
                    <div className="col-span-3 flex items-center gap-2">
                      <span>{getTypeIcon(account.type)}</span>
                      <span className="text-sm font-medium text-slate-900">{account.name}</span>
                    </div>
                    <div className="col-span-2 text-sm text-slate-600">{getTypeLabel(account.type)}</div>
                    <div className="col-span-2 text-sm text-slate-600">
                      {parseFloat(account.opening_balance).toLocaleString('de-CH', {
                        style: 'currency',
                        currency: 'CHF'
                      })}
                    </div>
                    <div className="col-span-2">
                      {account.is_archived ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Archived
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        💡 Drag and drop to reorder accounts. Archive accounts to hide them from selection lists. Delete only works if there are no transactions.
      </p>
    </div>
  )
}
