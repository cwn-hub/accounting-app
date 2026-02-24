import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Archive, GripVertical } from 'lucide-react';
import { fetchAccounts, createAccount, updateAccount, deleteAccount, reorderAccounts } from '../services/settingsApi';

const BUSINESS_ID = 1; // TODO: Get from context/auth

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank Account', icon: '🏦' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'asset', label: 'Asset', icon: '🏢' },
];

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  
  const [addForm, setAddForm] = useState({ name: '', type: 'bank', opening_balance: '' });
  const [editForm, setEditForm] = useState({ name: '', type: 'bank', opening_balance: '', is_archived: false });

  useEffect(() => {
    loadAccounts();
  }, [showArchived]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await fetchAccounts(BUSINESS_ID, showArchived);
      setAccounts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const balance = parseFloat(addForm.opening_balance) || 0;
      
      await createAccount(BUSINESS_ID, {
        name: addForm.name,
        type: addForm.type,
        opening_balance: balance,
      });
      
      setAddForm({ name: '', type: 'bank', opening_balance: '' });
      setShowAddForm(false);
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (account) => {
    setEditingId(account.id);
    setEditForm({
      name: account.name,
      type: account.type,
      opening_balance: account.opening_balance,
      is_archived: account.is_archived,
    });
  };

  const handleUpdate = async (accountId) => {
    try {
      await updateAccount(accountId, {
        name: editForm.name,
        type: editForm.type,
        opening_balance: parseFloat(editForm.opening_balance) || 0,
        is_archived: editForm.is_archived,
      });
      
      setEditingId(null);
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (accountId) => {
    if (!confirm('Are you sure you want to delete this account? This can only be done if there are no transactions.')) {
      return;
    }
    
    try {
      await deleteAccount(accountId);
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setAddForm({ name: '', type: 'bank', opening_balance: '' });
    setError(null);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newAccounts = [...accounts];
    const draggedItem = newAccounts[draggedIndex];
    newAccounts.splice(draggedIndex, 1);
    newAccounts.splice(index, 0, draggedItem);
    
    setAccounts(newAccounts);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      try {
        const accountIds = accounts.map(a => a.id);
        await reorderAccounts(BUSINESS_ID, accountIds);
      } catch (err) {
        setError(err.message);
        await loadAccounts();
      }
    }
    setDraggedIndex(null);
  };

  const getTypeLabel = (type) => {
    const typeInfo = ACCOUNT_TYPES.find(t => t.value === type);
    return typeInfo?.label || type;
  };

  const getTypeIcon = (type) => {
    const typeInfo = ACCOUNT_TYPES.find(t => t.value === type);
    return typeInfo?.icon || '📁';
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toLocaleString('de-CH', {
      style: 'currency',
      currency: 'CHF'
    });
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
          <p className="text-slate-600">Manage your bank accounts, credit cards, and assets</p>
        </div>
        <div className="flex items-center gap-3">
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h4 className="text-sm font-semibold text-indigo-900 mb-3">Add New Account</h4>
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-10"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Opening Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  No accounts configured
                </td>
              </tr>
            ) : (
              accounts.map((account, index) => (
                <tr
                  key={account.id}
                  draggable={editingId !== account.id}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`${draggedIndex === index ? 'bg-indigo-50' : 'hover:bg-slate-50'} ${
                    account.is_archived ? 'opacity-50' : ''
                  } ${editingId !== account.id ? 'cursor-move' : ''}`}
                >
                  {editingId === account.id ? (
                    <>
                      <td className="px-4 py-4"></td>
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
                          {ACCOUNT_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.opening_balance}
                          onChange={(e) => setEditForm({ ...editForm, opening_balance: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                        />
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
                          onClick={() => handleUpdate(account.id)}
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
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <span className="mr-2">{getTypeIcon(account.type)}</span>
                        {account.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{getTypeLabel(account.type)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatCurrency(account.opening_balance)}</td>
                      <td className="px-6 py-4">
                        {account.is_archived ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            <Archive className="w-3 h-3" />
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
                          onClick={() => handleEdit(account)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded mr-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Drag and drop to reorder accounts. Archive accounts to hide them from selection lists. Delete only works if there are no transactions.
      </p>
    </div>
  );
};

export default Accounts;
