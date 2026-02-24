import { useState, useEffect } from 'react'
import { fetchCategories, updateCategory, reorderCategories, resetDefaultCategories } from '../../services/settingsApi'

const CATEGORY_TYPES = [
  { value: 'income', label: 'Income', color: 'bg-green-100 text-green-800' },
  { value: 'cogs', label: 'COGS', color: 'bg-orange-100 text-orange-800' },
  { value: 'expense', label: 'Expense', color: 'bg-red-100 text-red-800' },
]

export default function ChartOfAccountsSettings({ businessId, onChange }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [businessId, showArchived])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await fetchCategories(businessId, showArchived)
      setCategories(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category) => {
    setEditingId(category.id)
    setEditForm({
      name: category.name,
      code: category.code,
      type: category.type,
      is_archived: category.is_archived,
    })
  }

  const handleSave = async (categoryId) => {
    try {
      setSaving(true)
      await updateCategory(categoryId, editForm)
      setEditingId(null)
      await loadCategories()
      onChange?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newCategories = [...categories]
    const draggedItem = newCategories[draggedIndex]
    newCategories.splice(draggedIndex, 1)
    newCategories.splice(index, 0, draggedItem)
    
    setCategories(newCategories)
    setDraggedIndex(index)
  }

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      try {
        const categoryIds = categories.map(c => c.id)
        await reorderCategories(businessId, categoryIds)
        onChange?.()
      } catch (err) {
        setError(err.message)
        await loadCategories()
      }
    }
    setDraggedIndex(null)
  }

  const handleResetDefaults = async () => {
    if (!confirm('Reset all category names to defaults? This will not affect your transaction data.')) {
      return
    }
    
    try {
      setLoading(true)
      await resetDefaultCategories(businessId)
      await loadCategories()
      onChange?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type) => {
    const typeInfo = CATEGORY_TYPES.find(t => t.value === type)
    return typeInfo?.color || 'bg-slate-100 text-slate-800'
  }

  const getTypeLabel = (type) => {
    const typeInfo = CATEGORY_TYPES.find(t => t.value === type)
    return typeInfo?.label || type
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Chart of Accounts</h3>
          <p className="text-sm text-slate-500">Manage your 26 accounting categories (5 income, 6 COGS, 15 expense)</p>
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
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_TYPES.map(type => (
          <span key={type.value} className={`px-2 py-1 rounded-full text-xs font-medium ${type.color}`}>
            {type.label}
          </span>
        ))}
      </div>

      {/* Categories List */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
          <div className="col-span-1">Order</div>
          <div className="col-span-2">Code</div>
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-slate-200">
          {categories.map((category, index) => (
            <div
              key={category.id}
              draggable={editingId !== category.id}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${
                draggedIndex === index ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
              } ${category.is_archived ? 'opacity-50' : ''} ${
                editingId !== category.id ? 'cursor-move' : ''
              }`}
            >
              {editingId === category.id ? (
                <>
                  <div className="col-span-1 text-slate-400 text-sm">{index + 1}</div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={editForm.code}
                      onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                    />
                  </div>
                  <div className="col-span-4">
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
                      {CATEGORY_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
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
                  <div className="col-span-1 flex justify-end gap-1">
                    <button
                      onClick={() => handleSave(category.id)}
                      disabled={saving}
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
                  <div className="col-span-2 font-mono text-sm text-slate-600">{category.code}</div>
                  <div className="col-span-4 text-sm font-medium text-slate-900">{category.name}</div>
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(category.type)}`}>
                      {getTypeLabel(category.type)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    {category.is_archived ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Archived
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => handleEdit(category)}
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
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        💡 Drag and drop to reorder categories. Changes are saved automatically.
      </p>
    </div>
  )
}
