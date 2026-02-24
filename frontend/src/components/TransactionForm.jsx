import { useState } from 'react'
import { Plus, Calendar, FileText, DollarSign, Percent, X } from 'lucide-react'
import { cn } from '../utils/cn'
import { TAX_RATES } from '../data/mockData'
import { FieldTooltip } from './ContextualHelp'

const TRANSACTION_TYPES = [
  { id: 'income', name: 'Income', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  { id: 'expense', name: 'Expense', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { id: 'transfer', name: 'Transfer', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
]

export default function TransactionForm({ onSubmit, categories }) {
  const [type, setType] = useState('expense')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false)

  const filteredCategories = categories.filter(c => c.type === type)

  const handleAmountBlur = () => {
    const numAmount = parseFloat(amount) || 0
    const calculatedTax = numAmount * taxRate
    setTaxAmount(calculatedTax)
  }

  const handleTaxRateChange = (newRate) => {
    setTaxRate(newRate)
    const numAmount = parseFloat(amount) || 0
    setTaxAmount(numAmount * newRate)
  }

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setTaxAmount(0)
    setTaxRate(0)
    setCategoryId('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const numAmount = parseFloat(amount) || 0
    
    onSubmit({
      date,
      description,
      amount: numAmount,
      type,
      categoryId: categoryId || filteredCategories[0]?.id,
      taxRate,
      taxAmount,
    })
    
    resetForm()
    setIsMobileFormOpen(false)
  }

  const handleCancel = () => {
    resetForm()
    setIsMobileFormOpen(false)
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Transaction
            <FieldTooltip content="Record income, expenses, or transfers between accounts. Each transaction is automatically balanced using double-entry bookkeeping." />
          </h2>
          {/* Mobile FAB */}
          <button
            onClick={() => setIsMobileFormOpen(true)}
            className="sm:hidden flex items-center justify-center w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        {/* Desktop Form */}
        <form onSubmit={handleSubmit} className="hidden sm:block mt-4 space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              Transaction Type
              <FieldTooltip content="Income adds money to your account. Expenses reduce your balance. Transfers move money between accounts." />
            </label>
            <div className="flex gap-2">
              {TRANSACTION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setType(t.id)
                    setCategoryId('')
                  }}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    type === t.id
                      ? `${t.bgColor} ${t.color} border-2 ${t.borderColor}`
                      : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Date
                <FieldTooltip content="The date when this transaction occurred. Used for monthly reporting and tax periods." />
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={cn(
                  'block w-full rounded-md border-slate-300 shadow-sm',
                  'focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
                  'border px-3 py-2'
                )}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Description
                <FieldTooltip content="A clear description of the transaction. This will appear in your reports and statements." />
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description..."
                required
                className={cn(
                  'block w-full rounded-md border-slate-300 shadow-sm',
                  'focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
                  'border px-3 py-2'
                )}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Amount
                <FieldTooltip content="The transaction amount in CHF. For expenses, enter as a positive number." />
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={handleAmountBlur}
                placeholder="0.00"
                required
                className={cn(
                  'block w-full rounded-md border-slate-300 shadow-sm',
                  'focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
                  'border px-3 py-2'
                )}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                Category
                <FieldTooltip content="Select the appropriate category for this transaction. Categories help organize your books and generate accurate reports." />
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className={cn(
                  'block w-full rounded-md border-slate-300 shadow-sm',
                  'focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
                  'border px-3 py-2'
                )}
              >
                <option value="">Select category...</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tax Rate */}
          <div className="flex items-end gap-4">
            <div className="w-40">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Percent className="w-4 h-4" />
                Tax Rate
                <FieldTooltip content="Select the applicable VAT rate. Standard Swiss VAT is 7.7%, reduced rate is 2.5% for accommodation, and 3.7% for food." />
              </label>
              <select
                value={taxRate}
                onChange={(e) => handleTaxRateChange(parseFloat(e.target.value))}
                className={cn(
                  'block w-full rounded-md border-slate-300 shadow-sm',
                  'focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
                  'border px-3 py-2'
                )}
              >
                {TAX_RATES.map((rate) => (
                  <option key={rate.id} value={rate.value}>
                    {rate.name}
                  </option>
                ))}
              </select>
            </div>

            {taxAmount > 0 && (
              <div className="pb-2 text-sm text-slate-600">
                Tax Amount: <span className="font-semibold">CHF {taxAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                type === 'income' && 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
                type === 'expense' && 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
                type === 'transfer' && 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
              )}
            >
              <Plus className="w-4 h-4" />
              Add {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          </div>
        </form>
      </div>

      {/* Mobile Form Modal */}
      {isMobileFormOpen && (
        <MobileTransactionForm
          type={type}
          setType={setType}
          date={date}
          setDate={setDate}
          description={description}
          setDescription={setDescription}
          amount={amount}
          setAmount={setAmount}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          taxRate={taxRate}
          setTaxRate={handleTaxRateChange}
          taxAmount={taxAmount}
          filteredCategories={filteredCategories}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}

function MobileTransactionForm({
  type, setType,
  date, setDate,
  description, setDescription,
  amount, setAmount,
  categoryId, setCategoryId,
  taxRate, setTaxRate,
  taxAmount,
  filteredCategories,
  onSubmit, onCancel
}) {
  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Add Transaction</h2>
            <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {TRANSACTION_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setType(t.id)
                      setCategoryId('')
                    }}
                    className={cn(
                      'py-2 px-3 rounded-lg text-sm font-medium',
                      type === t.id
                        ? `${t.bgColor} ${t.color} border-2 ${t.borderColor}`
                        : 'bg-slate-50 text-slate-600 border-2 border-transparent'
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (CHF)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-3 py-3 border border-slate-300 rounded-lg text-xl font-semibold"
                autoFocus
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this for?"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Select category...</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate</label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                {TAX_RATES.map((rate) => (
                  <option key={rate.id} value={rate.value}>{rate.name}</option>
                ))}
              </select>
            </div>

            {taxAmount > 0 && (
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-sm text-slate-600">
                  Tax: <span className="font-semibold">CHF {taxAmount.toFixed(2)}</span>
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 border border-slate-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={cn(
                  'flex-1 py-3 rounded-lg font-medium text-white',
                  type === 'income' && 'bg-emerald-600',
                  type === 'expense' && 'bg-rose-600',
                  type === 'transfer' && 'bg-indigo-600'
                )}
              >
                Add {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
