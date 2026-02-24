import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, Edit2, Check, X, AlertTriangle } from 'lucide-react'
import { cn } from '../utils/cn'
import { TAX_RATES } from '../data/mockData'
import { useTransactionErrors, ErrorBadge, ErrorIndicator } from './ErrorDisplay'
import { getErrorClasses } from '../services/sprint5Api'
import { MobileTransactionList } from './MobileTransactionCard'
import { useIsMobileBreakpoint } from '../hooks/useMobile'

export default function TransactionTable({ 
  transactions, 
  categories, 
  onUpdate, 
  onDelete,
  businessId = 1,
  year = 2026,
  month = null
}) {
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [sorting, setSorting] = useState([{ id: 'date', desc: false }])
  
  // Mobile breakpoint detection
  const isMobile = useIsMobileBreakpoint()
  
  // Load error highlights
  const { getErrors } = useTransactionErrors(businessId, year, month)

  const getCategoryName = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.name || categoryId
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
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
    onUpdate(editingId, editData)
    setEditingId(null)
    setEditData({})
  }

  const handleTaxRateBlur = () => {
    const amount = parseFloat(editData.amount) || 0
    const taxRate = parseFloat(editData.taxRate) || 0
    setEditData(prev => ({ ...prev, taxAmount: amount * taxRate }))
  }

  const columns = useMemo(() => [
    {
      id: 'errors',
      header: '',
      cell: ({ row }) => {
        const transaction = row.original
        const errors = getErrors(transaction.id)
        if (!errors || errors.length === 0) return null
        
        return <ErrorIndicator errors={errors} />
      },
      size: 40,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => {
        const transaction = row.original
        if (editingId === transaction.id) {
          return (
            <input
              type="date"
              value={editData.date}
              onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-2 py-1 text-sm border rounded"
            />
          )
        }
        return transaction.date
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const transaction = row.original
        const errors = getErrors(transaction.id)
        
        if (editingId === transaction.id) {
          return (
            <input
              type="text"
              value={editData.description}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-2 py-1 text-sm border rounded"
            />
          )
        }
        
        return (
          <div className="flex items-center gap-2">
            <span>{transaction.description}</span>
            {errors && errors.length > 0 && (
              <ErrorBadge errors={errors} />
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const transaction = row.original
        const typeColors = {
          income: 'bg-green-100 text-green-800',
          expense: 'bg-red-100 text-red-800',
          transfer: 'bg-blue-100 text-blue-800',
        }
        return (
          <span className={cn(
            'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
            typeColors[transaction.type]
          )}>
            {transaction.type}
          </span>
        )
      },
    },
    {
      accessorKey: 'categoryId',
      header: 'Category',
      cell: ({ row }) => {
        const transaction = row.original
        if (editingId === transaction.id) {
          const typeCategories = categories.filter(c => c.type === editData.type)
          return (
            <select
              value={editData.categoryId}
              onChange={(e) => setEditData(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-2 py-1 text-sm border rounded"
            >
              {typeCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )
        }
        return getCategoryName(transaction.categoryId)
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const transaction = row.original
        if (editingId === transaction.id) {
          return (
            <input
              type="number"
              step="0.01"
              value={editData.amount}
              onChange={(e) => setEditData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              onBlur={handleTaxRateBlur}
              className="w-full px-2 py-1 text-sm border rounded text-right"
            />
          )
        }
        return (
          <span className={cn(
            'font-medium',
            transaction.type === 'income' && 'text-green-600',
            transaction.type === 'expense' && 'text-red-600',
            transaction.type === 'transfer' && 'text-blue-600',
          )}>
            {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
          </span>
        )
      },
    },
    {
      accessorKey: 'taxRate',
      header: 'Tax Rate',
      cell: ({ row }) => {
        const transaction = row.original
        if (editingId === transaction.id) {
          return (
            <select
              value={editData.taxRate}
              onChange={(e) => {
                const rate = parseFloat(e.target.value)
                const amount = parseFloat(editData.amount) || 0
                setEditData(prev => ({ 
                  ...prev, 
                  taxRate: rate,
                  taxAmount: amount * rate
                }))
              }}
              className="w-full px-2 py-1 text-sm border rounded"
            >
              {TAX_RATES.map(rate => (
                <option key={rate.id} value={rate.value}>{rate.name}</option>
              ))}
            </select>
          )
        }
        return `${(transaction.taxRate * 100).toFixed(0)}%`
      },
    },
    {
      accessorKey: 'taxAmount',
      header: 'Tax',
      cell: ({ row }) => {
        const transaction = row.original
        return transaction.taxAmount > 0 ? formatCurrency(transaction.taxAmount) : '-'
      },
    },
    {
      accessorKey: 'netAmount',
      header: 'Net Amount',
      cell: ({ row }) => {
        const transaction = row.original
        const net = transaction.type === 'income' 
          ? transaction.amount - transaction.taxAmount 
          : transaction.amount
        return formatCurrency(net)
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const transaction = row.original
        if (editingId === transaction.id) {
          return (
            <div className="flex gap-1">
              <button
                onClick={saveEditing}
                className="p-2 text-green-600 hover:bg-green-50 rounded min-touch-target"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEditing}
                className="p-2 text-red-600 hover:bg-red-50 rounded min-touch-target"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        }
        return (
          <div className="flex gap-1">
            <button
              onClick={() => startEditing(transaction)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded min-touch-target"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(transaction.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded min-touch-target"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      },
    },
  ], [editingId, editData, categories, getErrors])

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Mobile card view
  if (isMobile) {
    return (
      <MobileTransactionList
        transactions={transactions}
        categories={categories}
        getErrors={getErrors}
        editingId={editingId}
        editData={editData}
        onEdit={startEditing}
        onSave={saveEditing}
        onCancel={cancelEditing}
        onDelete={onDelete}
        onUpdate={setEditData}
      />
    )
  }

  // Desktop table view
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No transactions for this month.</p>
        <p className="text-sm text-slate-400 mt-1">Add a transaction to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    style={{ width: header.column.columnDef.size }}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className={cn(
                          'flex items-center gap-1 hover:text-slate-700 min-touch-target',
                          header.column.getCanSort() && 'cursor-pointer select-none'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-slate-400">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {table.getRowModel().rows.map(row => {
              const transaction = row.original
              const errors = getErrors(transaction.id)
              const errorClasses = getErrorClasses(errors)
              
              return (
                <tr 
                  key={row.id} 
                  className={cn(
                    'hover:bg-slate-50 transition-colors',
                    errorClasses.row
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
