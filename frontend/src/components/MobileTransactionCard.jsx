import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  AlertTriangle,
  Calendar,
  Tag,
  DollarSign,
  Percent,
  Wallet
} from 'lucide-react';
import { cn } from '../utils/cn';
import { ErrorBadge } from './ErrorDisplay';
import { TAX_RATES } from '../data/mockData';

/**
 * MobileTransactionCard - Card view for transactions on mobile
 * Replaces table view on small screens
 */
export function MobileTransactionCard({ 
  transaction, 
  categories,
  errors,
  isEditing,
  editData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditDataChange
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryName = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.name || categoryId;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const typeColors = {
    income: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-600' },
    expense: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600' },
    transfer: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600' },
  };

  const colors = typeColors[transaction.type];

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Edit Transaction</h3>
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="p-2 bg-green-100 text-green-700 rounded-lg min-touch-target"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={onCancel}
              className="p-2 bg-red-100 text-red-700 rounded-lg min-touch-target"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={editData.date}
              onChange={(e) => onEditDataChange({ ...editData, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <input
              type="text"
              value={editData.description}
              onChange={(e) => onEditDataChange({ ...editData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={editData.amount}
              onChange={(e) => onEditDataChange({ ...editData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
            <select
              value={editData.categoryId}
              onChange={(e) => onEditDataChange({ ...editData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-base bg-white"
            >
              {categories
                .filter(c => c.type === editData.type)
                .map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tax Rate</label>
            <select
              value={editData.taxRate}
              onChange={(e) => {
                const rate = parseFloat(e.target.value);
                const amount = parseFloat(editData.amount) || 0;
                onEditDataChange({ 
                  ...editData, 
                  taxRate: rate,
                  taxAmount: amount * rate
                });
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-base bg-white"
            >
              {TAX_RATES.map(rate => (
                <option key={rate.id} value={rate.value}>{rate.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-white rounded-xl shadow-sm border overflow-hidden',
      errors?.length > 0 ? 'border-red-200' : 'border-slate-200'
    )}>
      {/* Card Header */}
      <div 
        className={cn(
          'p-4',
          colors.bg,
          errors?.length > 0 && 'bg-red-50'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide',
                colors.bg,
                colors.text
              )}>
                {transaction.type}
              </span>
              {errors && errors.length > 0 && (
                <ErrorBadge errors={errors} />
              )}
            </div>
            <h3 className="font-semibold text-slate-900 truncate">
              {transaction.description}
            </h3>
            <p className="text-sm text-slate-500">{transaction.date}</p>
          </div>

          <div className="text-right ml-4">
            <p className={cn(
              'text-lg font-bold',
              transaction.type === 'income' && 'text-green-600',
              transaction.type === 'expense' && 'text-red-600',
              transaction.type === 'transfer' && 'text-blue-600',
            )}>
              {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
            </p>
            <button className="mt-2 p-1 rounded-full hover:bg-black/5 min-touch-target">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 space-y-3 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Category</p>
                <p className="text-sm font-medium text-slate-900">
                  {getCategoryName(transaction.categoryId)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Tax Rate</p>
                <p className="text-sm font-medium text-slate-900">
                  {(transaction.taxRate * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {transaction.taxAmount > 0 && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Tax Amount</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatCurrency(transaction.taxAmount)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Net Amount</p>
                <p className="text-sm font-medium text-slate-900">
                  {formatCurrency(
                    transaction.type === 'income' 
                      ? transaction.amount - transaction.taxAmount 
                      : transaction.amount
                  )}
                </p>
              </div>
            </div>
          </div>

          {errors && errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-800">Validation Issues</span>
              </div>
              <ul className="space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx} className="text-xs text-red-700">
                    • {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium min-touch-target"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg font-medium min-touch-target"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * MobileTransactionList - List of mobile transaction cards
 */
export function MobileTransactionList({ 
  transactions, 
  categories,
  getErrors,
  editingId,
  editData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onUpdate
}) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 font-medium">No transactions this month</p>
        <p className="text-sm text-slate-400 mt-1">Add a transaction to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:hidden">
      {transactions.map((transaction) => (
        <MobileTransactionCard
          key={transaction.id}
          transaction={transaction}
          categories={categories}
          errors={getErrors?.(transaction.id)}
          isEditing={editingId === transaction.id}
          editData={editData}
          onEdit={() => onEdit?.(transaction)}
          onSave={() => onSave?.(transaction.id)}
          onCancel={onCancel}
          onDelete={() => onDelete?.(transaction.id)}
          onEditDataChange={onUpdate}
        />
      ))}
    </div>
  );
}

export default {
  MobileTransactionCard,
  MobileTransactionList
};
