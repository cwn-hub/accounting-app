import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Star, Archive } from 'lucide-react';
import { fetchTaxRates, createTaxRate, updateTaxRate, setDefaultTaxRate } from '../services/settingsApi';

const BUSINESS_ID = 1; // TODO: Get from context/auth

const TaxRates = () => {
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  
  const [addForm, setAddForm] = useState({ name: '', rate: '' });
  const [editForm, setEditForm] = useState({ name: '', rate: '', is_archived: false });

  useEffect(() => {
    loadTaxRates();
  }, [showArchived]);

  const loadTaxRates = async () => {
    try {
      setLoading(true);
      const data = await fetchTaxRates(BUSINESS_ID, showArchived);
      setTaxRates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const rate = parseFloat(addForm.rate) / 100;
      if (isNaN(rate) || rate < 0 || rate >= 1) {
        setError('Rate must be between 0 and 100%');
        return;
      }
      
      await createTaxRate(BUSINESS_ID, {
        name: addForm.name,
        rate: rate,
      });
      
      setAddForm({ name: '', rate: '' });
      setShowAddForm(false);
      await loadTaxRates();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (taxRate) => {
    setEditingId(taxRate.id);
    setEditForm({
      name: taxRate.name,
      rate: (taxRate.rate * 100).toFixed(2),
      is_archived: taxRate.is_archived,
    });
  };

  const handleUpdate = async (taxRateId) => {
    try {
      const rate = parseFloat(editForm.rate) / 100;
      if (isNaN(rate) || rate < 0 || rate >= 1) {
        setError('Rate must be between 0 and 100%');
        return;
      }
      
      await updateTaxRate(taxRateId, {
        name: editForm.name,
        rate: rate,
        is_archived: editForm.is_archived,
      });
      
      setEditingId(null);
      await loadTaxRates();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetDefault = async (taxRateId) => {
    try {
      await setDefaultTaxRate(BUSINESS_ID, taxRateId);
      await loadTaxRates();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setAddForm({ name: '', rate: '' });
    setError(null);
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
          <h1 className="text-2xl font-bold text-slate-900">Tax Rates</h1>
          <p className="text-slate-600">Manage VAT and sales tax rates</p>
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
            Add Tax Rate
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
          <h4 className="text-sm font-semibold text-indigo-900 mb-3">Add New Tax Rate</h4>
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Tax Rates Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Default</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {taxRates.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                  No tax rates configured
                </td>
              </tr>
            ) : (
              taxRates.map((taxRate) => (
                <tr key={taxRate.id} className={`hover:bg-slate-50 ${taxRate.is_archived ? 'opacity-50' : ''}`}>
                  {editingId === taxRate.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleUpdate(taxRate.id)}
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
                      <td className="px-6 py-4 font-medium text-slate-900">{taxRate.name}</td>
                      <td className="px-6 py-4 text-slate-600">{(taxRate.rate * 100).toFixed(2)}%</td>
                      <td className="px-6 py-4">
                        {taxRate.is_archived ? (
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
                      <td className="px-6 py-4">
                        {taxRate.is_default ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                            <Star className="w-3 h-3 fill-current" />
                            Default
                          </span>
                        ) : !taxRate.is_archived ? (
                          <button
                            onClick={() => handleSetDefault(taxRate.id)}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            Set as Default
                          </button>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(taxRate)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
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
        The default tax rate will be pre-selected when creating new transactions.
      </p>
    </div>
  );
};

export default TaxRates;
