import { useState, useMemo } from 'react'
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Check, 
  X,
  Calendar,
  CreditCard,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { generateMockTransactions, ACCOUNTS, CATEGORIES, TAX_RATES } from '../data/mockData'
import { cn } from '../utils/cn'

const ITEMS_PER_PAGE = 25

function JournalView() {
  const [transactions, setTransactions] = useState(() => generateMockTransactions())
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    account: '',
    category: '',
    type: '',
    minAmount: '',
    maxAmount: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
  
  // Editing state
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions]
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(t => 
        t.description.toLowerCase().includes(query) ||
        getCategoryName(t.categoryId).toLowerCase().includes(query) ||
        getAccountName(t.accountId).toLowerCase().includes(query)
      )
    }
    
    // Filters
    if (filters.dateFrom) {
      result = result.filter(t => t.date >= filters.dateFrom)
    }
    if (filters.dateTo) {
      result = result.filter(t => t.date <= filters.dateTo)
    }
    if (filters.account) {
      result = result.filter(t => t.accountId === filters.account)
    }
    if (filters.category) {
      result = result.filter(t => t.categoryId === filters.category)
    }
    if (filters.type) {
      result = result.filter(t => t.type === filters.type)
    }
    if (filters.minAmount) {
      result = result.filter(t => t.amount >= parseFloat(filters.minAmount))
    }
    if (filters.maxAmount) {
      result = result.filter(t => t.amount <= parseFloat(filters.maxAmount))
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]
      
      if (sortConfig.key === 'date') {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    
    return result
  }, [transactions, searchQuery, filters, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredTransactions, currentPage])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount)
  }

  const getCategoryName = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId)?.name || categoryId
  }

  const getAccountName = (accountId) => {
    return ACCOUNTS.find(a => a.id === accountId)?.name || accountId
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-indigo-600" />
      : <ArrowDown className="w-3 h-3 text-indigo-600" />
  }

  const startEditing = (transaction) => {
    setEditingId(transaction.id)
    setEditData({ ...transaction })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditData({})
  }

  const saveEditing = () => {
    setTransactions(prev =>
      prev.map(t => (t.id === editingId ? { ...t, ...editData } : t))
    )
    setEditingId(null)
    setEditData({})
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      account: '',
      category: '',
      type: '',
      minAmount: '',
      maxAmount: ''
    })
    setSearchQuery('')
  }

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Journal View</h1>
          <p className="text-slate-500 mt-1">
            {filteredTransactions.length} transactions found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeFilterCount > 0
                ? "bg-indigo-100 text-indigo-700"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Account */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Account
                </label>
                <select
                  value={filters.account}
                  onChange={(e) => setFilters(prev => ({ ...prev, account: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">All Accounts</option>
                  {ACCOUNTS.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Min Amount</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Max Amount</label>
                <input
                  type="number"
                  placeholder="∞"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th 
                  className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <SortIcon columnKey="date" />
                  </div>
                </th>
                <th 
                  className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center gap-1">
                    Description
                    <SortIcon columnKey="description" />
                  </div>
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Account
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Category
                </th>
                <th 
                  className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-1">
                    Type
                    <SortIcon columnKey="type" />
                  </div>
                </th>
                <th 
                  className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount
                    <SortIcon columnKey="amount" />
                  </div>
                </th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedTransactions.map((txn) => (
                <tr 
                  key={txn.id} 
                  className={cn(
                    "transition-colors",
                    editingId === txn.id ? "bg-indigo-50" : "hover:bg-slate-50"
                  )}
                >
                  <td className="px-5 py-3">
                    {editingId === txn.id ? (
                      <input
                        type="date"
                        value={editData.date}
                        onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded"
                      />
                    ) : (
                      <span className="text-sm text-slate-900">{txn.date}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {editingId === txn.id ? (
                      <input
                        type="text"
                        value={editData.description}
                        onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded"
                      />
                    ) : (
                      <span className="text-sm font-medium text-slate-900">{txn.description}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {editingId === txn.id ? (
                      <select
                        value={editData.accountId}
                        onChange={(e) => setEditData(prev => ({ ...prev, accountId: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded"
                      >
                        {ACCOUNTS.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-slate-600">{getAccountName(txn.accountId)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {editingId === txn.id ? (
                      <select
                        value={editData.categoryId}
                        onChange={(e) => setEditData(prev => ({ ...prev, categoryId: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded"
                      >
                        {CATEGORIES
                          .filter(c => c.type === editData.type)
                          .map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                      </select>
                    ) : (
                      <span className="text-sm text-slate-600">{getCategoryName(txn.categoryId)}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {editingId === txn.id ? (
                      <select
                        value={editData.type}
                        onChange={(e) => {
                          const newType = e.target.value
                          const newCategory = CATEGORIES.find(c => c.type === newType)?.id || ''
                          setEditData(prev => ({ 
                            ...prev, 
                            type: newType,
                            categoryId: newCategory
                          }))
                        }}
                        className="w-full px-2 py-1 text-sm border border-slate-200 rounded"
                      >
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="transfer">Transfer</option>
                      </select>
                    ) : (
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        txn.type === 'income' && "bg-emerald-100 text-emerald-800",
                        txn.type === 'expense' && "bg-rose-100 text-rose-800",
                        txn.type === 'transfer' && "bg-blue-100 text-blue-800"
                      )}>
                        {txn.type}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {editingId === txn.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editData.amount}
                        onChange={(e) => setEditData(prev => ({ 
                          ...prev, 
                          amount: parseFloat(e.target.value) || 0 
                        }))}
                        className="w-28 px-2 py-1 text-sm border border-slate-200 rounded text-right"
                      />
                    ) : (
                      <span className={cn(
                        "text-sm font-medium",
                        txn.type === 'income' && "text-emerald-600",
                        txn.type === 'expense' && "text-rose-600",
                        txn.type === 'transfer' && "text-blue-600"
                      )}>
                        {txn.type === 'expense' ? '-' : '+'}{formatCurrency(txn.amount)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {editingId === txn.id ? (
                        <>
                          <button
                            onClick={saveEditing}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEditing(txn)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No transactions found matching your filters.</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of{' '}
              {filteredTransactions.length} transactions
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JournalView
