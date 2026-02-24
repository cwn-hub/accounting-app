import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { cn } from '../utils/cn'

export default function RunningBalance({ transactions, isCompact = false }) {
  const { income, expenses, balance } = useMemo(() => {
    let income = 0
    let expenses = 0
    
    transactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount
      } else if (t.type === 'expense') {
        expenses += t.amount
      }
    })
    
    return {
      income,
      expenses,
      balance: income - expenses
    }
  }, [transactions])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: isCompact ? 'compact' : 'standard'
    }).format(amount)
  }

  // Compact mobile view
  if (isCompact) {
    return (
      <div className="flex flex-col items-end">
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border",
          balance >= 0 
            ? "bg-blue-50 border-blue-200" 
            : "bg-orange-50 border-orange-200"
        )}>
          <Wallet className={cn(
            "w-4 h-4",
            balance >= 0 ? "text-blue-600" : "text-orange-600"
          )} />
          <div>
            <p className={cn(
              "text-xs font-medium",
              balance >= 0 ? "text-blue-600" : "text-orange-600"
            )}>Balance</p>
            <p className={cn(
              "text-sm font-bold",
              balance >= 0 ? "text-blue-700" : "text-orange-700"
            )}>{formatCurrency(balance)}</p>
          </div>
        </div>
      </div>
    )
  }

  // Full desktop view
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
        <TrendingUp className="w-4 h-4 text-green-600" />
        <div>
          <p className="text-xs text-green-600 font-medium">Income</p>
          <p className="text-sm font-bold text-green-700">{formatCurrency(income)}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
        <TrendingDown className="w-4 h-4 text-red-600" />
        <div>
          <p className="text-xs text-red-600 font-medium">Expenses</p>
          <p className="text-sm font-bold text-red-700">{formatCurrency(expenses)}</p>
        </div>
      </div>
      
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
        balance >= 0 
          ? "bg-blue-50 border-blue-200" 
          : "bg-orange-50 border-orange-200"
      )}>
        <Wallet className={cn(
          "w-4 h-4",
          balance >= 0 ? "text-blue-600" : "text-orange-600"
        )} />
        <div>
          <p className={cn(
            "text-xs font-medium",
            balance >= 0 ? "text-blue-600" : "text-orange-600"
          )}>Balance</p>
          <p className={cn(
            "text-sm font-bold",
            balance >= 0 ? "text-blue-700" : "text-orange-700"
          )}>{formatCurrency(balance)}</p>
        </div>
      </div>
    </div>
  )
}
