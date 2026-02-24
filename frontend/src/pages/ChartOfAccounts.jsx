import React, { useState, useEffect } from 'react';
import { Calculator, Search, Edit2, RotateCcw, GripVertical } from 'lucide-react';
import { fetchCategories, updateCategory, reorderCategories, resetDefaultCategories } from '../services/settingsApi';

const BUSINESS_ID = 1; // TODO: Get from context/auth

const CATEGORY_TYPES = [
  { value: 'income', label: 'Income', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'cogs', label: 'COGS', color: 'bg-amber-100 text-amber-800' },
  { value: 'expense', label: 'Expense', color: 'bg-rose-100 text-rose-800' },
];

const ChartOfAccounts = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCategories();
  }, [showArchived]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories(BUSINESS_ID, showArchived);
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      code: category.code,
      type: category.type,
      is_archived: category.is_archived,
    });
  };

  const handleSave = async (categoryId) => {
    try {
      await updateCategory(categoryId, editForm);
      setEditingId(null);
      await loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCategories = [...categories];
    const draggedItem = newCategories[draggedIndex];
    newCategories.splice(draggedIndex, 1);
    newCategories.splice(index, 0, draggedItem);
    
    setCategories(newCategories);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      try {
        const categoryIds = categories.map(c => c.id);
        await reorderCategories(BUSINESS_ID, categoryIds);
      } catch (err) {
        setError(err.message);
        await loadCategories();
      }
    }
    setDraggedIndex(null);
  };

  const handleResetDefaults = async () => {
    if (!confirm('Reset all category names to defaults? This will not affect your transaction data.')) {
      return;
    }
    
    try {
      setLoading(true);
      await resetDefaultCategories(BUSINESS_ID);
      await loadCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type) => {
    const typeInfo = CATEGORY_TYPES.find(t => t.value === type);
    return typeInfo?.color || 'bg-slate-100 text-slate-800';
  };

  const getTypeLabel = (type) => {
    const typeInfo = CATEGORY_TYPES.find(t => t.value === type);
    return typeInfo?.label || type;
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chart of Accounts</h1>
          <p className="text-slate-600">Manage your 26 accounting categories (5 income, 6 COGS, 15 expense)</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show archived
          </label>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORY_TYPES.map(type => (
          <span key={type.value} className={`px-3 py-1 rounded-full text-xs font-medium ${type.color}`}>
            {type.label}
          </span>
        ))}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-10"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredCategories.map((category, index) => (
              <tr
                key={category.id}
                draggable={editingId !== category.id}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`${draggedIndex === index ? 'bg-indigo-50' : 'hover:bg-slate-50'} ${
                  category.is_archived ? 'opacity-50' : ''
                } ${editingId !== category.id ? 'cursor-move' : ''}`}
              >
                {editingId === category.id ? (
                  <>
                    <td className="px-4 py-4"></td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editForm.code}
                        onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded font-mono"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={editForm.type}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                      >
                        {CATEGORY_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.is_archived}
                          onChange={(e) => setEditForm({ ...editForm, is_archived: e.target.checked })}
                          className="rounded"
                        />
                        Archived
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSave(category.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded mr-1"
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
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-4">
                      <GripVertical className="w-4 h-4 text-slate-400" />
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-600">{category.code}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{category.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(category.type)}`}>
                        {getTypeLabel(category.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {category.is_archived ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Archived
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Drag and drop to reorder categories. Changes are saved automatically.
      </p>
    </div>
  );
};

export default ChartOfAccounts;
