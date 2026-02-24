import { useState, useMemo } from 'react'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Receipt, 
  TrendingUp, 
  AlertCircle,
  Calendar
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { generateMockTransactions, ACCOUNTS, CATEGORIES } from '../data/mockData'
import { cn } from '../utils/cn'

function Dashboard() {
  const [transactions] = useState(() => generateMockTransactions())
  const [currentMonth] = useState(new Date().getMonth() + 1)

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    const currentMonthTxns = transactions.filter(t => t.month === currentMonth)
    const allIncome = transactions.filter(t => t.type === 'income')
    const allExpenses = transactions.filter(t => t.type === 'expense')
    
    // Current month totals
    const currentIncome = currentMonthTxns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const currentExpenses = currentMonthTxns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    const currentNet = currentIncome - currentExpenses
    
    // YTD totals
    const ytdIncome = allIncome
      .filter(t => t.month <= currentMonth)
      .reduce((sum, t) => sum + t.amount, 0)
    const ytdExpenses = allExpenses
      .filter(t => t.month <= currentMonth)
      .reduce((sum, t) => sum + t.amount, 0)
    
    // Cash position (checking + savings)
    const checkingBalance = 15000 + Math.random() * 5000
    const savingsBalance = 25000 + Math.random() * 10000
    const creditBalance = -2500 - Math.random() * 1000
    
    // Tax payable calculation (simplified)
    const taxCollected = allIncome
      .filter(t => t.month <= currentMonth)
      .reduce((sum, t) => sum + (t.taxAmount || 0), 0)
    const taxPaid = allExpenses
      .filter(t => t.month <= currentMonth)
      .reduce((sum, t) => sum + (t.taxAmount || 0), 0)
    const taxPayable = taxCollected - taxPaid
    
    // Monthly trend data
    const monthlyTrend = Array.from({ length: currentMonth }, (_, i) => {
      const month = i + 1
      const monthIncome = transactions
        .filter(t => t.month === month && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const monthExpenses = transactions
        .filter(t => t.month === month && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
      return {
        month,
        monthName: new Date(2026, month - 1).toLocaleString('default', { month: 'short' }),
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses
      }
    })
    
    // Recent transactions
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
    
    return {
      currentIncome,
      currentExpenses,
      currentNet,
      ytdIncome,
      ytdExpenses,
      checkingBalance,
      savingsBalance,
      creditBalance,
      totalCash: checkingBalance + savingsBalance,
      taxPayable,
      monthlyTrend,
      recentTransactions
    }
  }, [transactions, currentMonth])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            {new Date(2026, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Month Income */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Month Income</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(metrics.currentIncome)}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            YTD: {formatCurrency(metrics.ytdIncome)}
          </p>
        </div>

        {/* Current Month Expenses */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Month Expenses</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {formatCurrency(metrics.currentExpenses)}
              </p>
            </div>
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            YTD: {formatCurrency(metrics.ytdExpenses)}
          </p>
        </div>

        {/* Net Position */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Net Position</p>
              <p className={cn(
                "text-2xl font-bold mt-1",
                metrics.currentNet >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {formatCurrency(metrics.currentNet)}
              </p>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              metrics.currentNet >= 0 ? "bg-emerald-100" : "bg-rose-100"
            )}>
              <TrendingUp className={cn(
                "w-5 h-5",
                metrics.currentNet >= 0 ? "text-emerald-600" : "text-rose-600"
              )} />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {metrics.currentNet >= 0 ? 'Surplus' : 'Deficit'} this month
          </p>
        </div>

        {/* Tax Payable */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Tax Payable</p>
              <p className="text-2xl font-bold text-violet-600 mt-1">
                {formatCurrency(metrics.taxPayable)}
              </p>
            </div>
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            VAT obligation
          </p>
        </div>
      </div>

      {/* Cash Position & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Position Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Cash Position</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-emerald-900">Total Cash</p>
                <p className="text-xs text-emerald-600">Checking + Savings</p>
              </div>
              <p className="text-xl font-bold text-emerald-700">
                {formatCurrency(metrics.totalCash)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Checking Account</span>
                <span className="font-medium text-slate-900">{formatCurrency(metrics.checkingBalance)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Savings Account</span>
                <span className="font-medium text-slate-900">{formatCurrency(metrics.savingsBalance)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Credit Card</span>
                <span className="font-medium text-rose-600">{formatCurrency(metrics.creditBalance)}</span>
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Net Position</span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatCurrency(metrics.totalCash + metrics.creditBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Monthly Trend</h3>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-slate-600">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <span className="text-slate-600">Expenses</span>
              </div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.monthlyTrend}>
                <XAxis 
                  dataKey="monthName" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `CHF ${value / 1000}k`}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Description</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Account</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Category</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {metrics.recentTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-600">{txn.date}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-900">{txn.description}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{getAccountName(txn.accountId)}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      txn.type === 'income' && "bg-emerald-100 text-emerald-800",
                      txn.type === 'expense' && "bg-rose-100 text-rose-800",
                      txn.type === 'transfer' && "bg-blue-100 text-blue-800"
                    )}>
                      {getCategoryName(txn.categoryId)}
                    </span>
                  </td>
                  <td className={cn(
                    "px-5 py-3 text-sm font-medium text-right",
                    txn.type === 'income' && "text-emerald-600",
                    txn.type === 'expense' && "text-rose-600",
                    txn.type === 'transfer' && "text-blue-600"
                  )}>
                    {txn.type === 'expense' ? '-' : '+'}{formatCurrency(txn.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
