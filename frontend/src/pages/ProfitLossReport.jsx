import { useState, useMemo, useRef } from 'react'
import { 
  ChevronDown, 
  ChevronRight, 
  Download, 
  FileText, 
  FileSpreadsheet,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react'
import { generateMockTransactions, CATEGORIES } from '../data/mockData'
import { cn } from '../utils/cn'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

function ProfitLossReport() {
  const [transactions] = useState(() => generateMockTransactions())
  const [expandedSections, setExpandedSections] = useState({
    income: true,
    expenses: true
  })
  const [selectedYear] = useState(2026)
  const tableRef = useRef(null)

  // Calculate P&L data by month and category
  const plData = useMemo(() => {
    const incomeCategories = CATEGORIES.filter(c => c.type === 'income')
    const expenseCategories = CATEGORIES.filter(c => c.type === 'expense')
    
    // Initialize data structure
    const incomeData = incomeCategories.map(cat => ({
      category: cat,
      monthly: Array(12).fill(0),
      total: 0
    }))
    
    const expenseData = expenseCategories.map(cat => ({
      category: cat,
      monthly: Array(12).fill(0),
      total: 0
    }))
    
    // Populate with transaction data
    transactions.forEach(txn => {
      const month = txn.month - 1
      if (txn.type === 'income') {
        const catData = incomeData.find(d => d.category.id === txn.categoryId)
        if (catData) {
          catData.monthly[month] += txn.amount
          catData.total += txn.amount
        }
      } else if (txn.type === 'expense') {
        const catData = expenseData.find(d => d.category.id === txn.categoryId)
        if (catData) {
          catData.monthly[month] += txn.amount
          catData.total += txn.amount
        }
      }
    })
    
    // Calculate monthly totals
    const monthlyIncome = Array(12).fill(0)
    const monthlyExpenses = Array(12).fill(0)
    const monthlyNet = Array(12).fill(0)
    
    incomeData.forEach(cat => {
      cat.monthly.forEach((amount, month) => {
        monthlyIncome[month] += amount
      })
    })
    
    expenseData.forEach(cat => {
      cat.monthly.forEach((amount, month) => {
        monthlyExpenses[month] += amount
      })
    })
    
    monthlyIncome.forEach((income, month) => {
      monthlyNet[month] = income - monthlyExpenses[month]
    })
    
    // Calculate YTD (year-to-date) totals for each month
    const ytdIncome = []
    const ytdExpenses = []
    const ytdNet = []
    
    for (let i = 0; i < 12; i++) {
      ytdIncome.push(monthlyIncome.slice(0, i + 1).reduce((a, b) => a + b, 0))
      ytdExpenses.push(monthlyExpenses.slice(0, i + 1).reduce((a, b) => a + b, 0))
      ytdNet.push(ytdIncome[i] - ytdExpenses[i])
    }
    
    return {
      income: incomeData.filter(c => c.total > 0),
      expenses: expenseData.filter(c => c.total > 0),
      monthlyIncome,
      monthlyExpenses,
      monthlyNet,
      ytdIncome,
      ytdExpenses,
      ytdNet,
      totalIncome: monthlyIncome.reduce((a, b) => a + b, 0),
      totalExpenses: monthlyExpenses.reduce((a, b) => a + b, 0),
      totalNet: monthlyIncome.reduce((a, b) => a + b, 0) - monthlyExpenses.reduce((a, b) => a + b, 0)
    }
  }, [transactions])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Export to CSV
  const exportCSV = () => {
    let csv = 'Profit & Loss Report\n'
    csv += `Year: ${selectedYear}\n\n`
    csv += 'Category,' + MONTHS.join(',') + ',Total\n'
    
    // Income section
    csv += '\nINCOME\n'
    plData.income.forEach(item => {
      csv += `"${item.category.name}",${item.monthly.join(',')},${item.total}\n`
    })
    csv += `"Total Income",${plData.monthlyIncome.join(',')},${plData.totalIncome}\n`
    
    // Expenses section
    csv += '\nEXPENSES\n'
    plData.expenses.forEach(item => {
      csv += `"${item.category.name}",${item.monthly.join(',')},${item.total}\n`
    })
    csv += `"Total Expenses",${plData.monthlyExpenses.join(',')},${plData.totalExpenses}\n`
    
    // Net
    csv += '\nNET PROFIT/LOSS\n'
    csv += `"Net",${plData.monthlyNet.join(',')},${plData.totalNet}\n`
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `profit-loss-${selectedYear}.csv`
    link.click()
  }

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF('landscape')
    
    // Title
    doc.setFontSize(18)
    doc.text('Profit & Loss Report', 14, 20)
    doc.setFontSize(12)
    doc.text(`Year: ${selectedYear}`, 14, 30)
    
    // Summary table
    const summaryData = [
      ['Total Income', formatCurrency(plData.totalIncome)],
      ['Total Expenses', formatCurrency(plData.totalExpenses)],
      ['Net Profit/Loss', formatCurrency(plData.totalNet)]
    ]
    
    doc.autoTable({
      startY: 40,
      head: [['Description', 'Amount']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    })
    
    // Monthly breakdown
    const monthlyData = MONTHS.map((month, i) => [
      month,
      formatCurrency(plData.monthlyIncome[i]),
      formatCurrency(plData.monthlyExpenses[i]),
      formatCurrency(plData.monthlyNet[i])
    ])
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Month', 'Income', 'Expenses', 'Net']],
      body: monthlyData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    })
    
    doc.save(`profit-loss-${selectedYear}.pdf`)
  }

  // Print report
  const printReport = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profit & Loss Report</h1>
          <p className="text-slate-500 flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            Fiscal Year {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={printReport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-700">Total Income</p>
              <p className="text-2xl font-bold text-emerald-800">{formatCurrency(plData.totalIncome)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-rose-50 rounded-xl p-5 border border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-rose-700">Total Expenses</p>
              <p className="text-2xl font-bold text-rose-800">{formatCurrency(plData.totalExpenses)}</p>
            </div>
          </div>
        </div>
        
        <div className={cn(
          "rounded-xl p-5 border",
          plData.totalNet >= 0 
            ? "bg-indigo-50 border-indigo-100" 
            : "bg-amber-50 border-amber-100"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              plData.totalNet >= 0 ? "bg-indigo-100" : "bg-amber-100"
            )}>
              <Wallet className={cn(
                "w-5 h-5",
                plData.totalNet >= 0 ? "text-indigo-600" : "text-amber-600"
              )} />
            </div>
            <div>
              <p className={cn(
                "text-sm font-medium",
                plData.totalNet >= 0 ? "text-indigo-700" : "text-amber-700"
              )}>
                {plData.totalNet >= 0 ? 'Net Profit' : 'Net Loss'}
              </p>
              <p className={cn(
                "text-2xl font-bold",
                plData.totalNet >= 0 ? "text-indigo-800" : "text-amber-800"
              )}>
                {formatCurrency(Math.abs(plData.totalNet))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* P&L Table */}
      <div ref={tableRef} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-400">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-64">
                  Account
                </th>
                {MONTHS.map(month => (
                  <th 
                    key={month} 
                    className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-3 min-w-[80px]"
                  >
                    {month}
                  </th>
                ))}
                <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-3 bg-slate-100">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Income Section */}
              <tr className="bg-indigo-50/50">
                <td colSpan={14} className="px-4 py-2">
                  <button
                    onClick={() => toggleSection('income')}
                    className="flex items-center gap-2 font-semibold text-indigo-900 hover:text-indigo-700"
                  >
                    {expandedSections.income ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    INCOME
                  </button>
                </td>
              </tr>
              
              {expandedSections.income && plData.income.map(item => (
                <tr key={item.category.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-sm text-slate-700 pl-8">
                    {item.category.name}
                  </td>
                  {item.monthly.map((amount, i) => (
                    <td key={i} className="px-2 py-2 text-sm text-right text-slate-600">
                      {amount > 0 ? formatCurrency(amount) : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-sm font-medium text-right text-emerald-600 bg-slate-50">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
              
              {/* Total Income Row */}
              <tr className="bg-emerald-50 font-semibold">
                <td className="px-4 py-3 text-emerald-900">Total Income</td>
                {plData.monthlyIncome.map((amount, i) => (
                  <td key={i} className="px-2 py-3 text-right text-emerald-800">
                    {formatCurrency(amount)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-emerald-800 bg-emerald-100">
                  {formatCurrency(plData.totalIncome)}
                </td>
              </tr>

              {/* Expenses Section */}
              <tr className="bg-rose-50/50">
                <td colSpan={14} className="px-4 py-2">
                  <button
                    onClick={() => toggleSection('expenses')}
                    className="flex items-center gap-2 font-semibold text-rose-900 hover:text-rose-700"
                  >
                    {expandedSections.expenses ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    EXPENSES
                  </button>
                </td>
              </tr>
              
              {expandedSections.expenses && plData.expenses.map(item => (
                <tr key={item.category.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-sm text-slate-700 pl-8">
                    {item.category.name}
                  </td>
                  {item.monthly.map((amount, i) => (
                    <td key={i} className="px-2 py-2 text-sm text-right text-slate-600">
                      {amount > 0 ? formatCurrency(amount) : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-sm font-medium text-right text-rose-600 bg-slate-50">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
              
              {/* Total Expenses Row */}
              <tr className="bg-rose-50 font-semibold">
                <td className="px-4 py-3 text-rose-900">Total Expenses</td>
                {plData.monthlyExpenses.map((amount, i) => (
                  <td key={i} className="px-2 py-3 text-right text-rose-800">
                    {formatCurrency(amount)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-rose-800 bg-rose-100">
                  {formatCurrency(plData.totalExpenses)}
                </td>
              </tr>

              {/* Net Profit/Loss */}
              <tr className={cn(
                "font-bold text-lg",
                plData.totalNet >= 0 ? "bg-emerald-100" : "bg-rose-100"
              )}>
                <td className={cn(
                  "px-4 py-4",
                  plData.totalNet >= 0 ? "text-emerald-900" : "text-rose-900"
                )}>
                  {plData.totalNet >= 0 ? 'NET PROFIT' : 'NET LOSS'}
                </td>
                {plData.monthlyNet.map((amount, i) => (
                  <td 
                    key={i} 
                    className={cn(
                      "px-2 py-4 text-right",
                      amount >= 0 ? "text-emerald-800" : "text-rose-800"
                    )}
                  >
                    {formatCurrency(amount)}
                  </td>
                ))}
                <td className={cn(
                  "px-4 py-4 text-right",
                  plData.totalNet >= 0 ? "text-emerald-800 bg-emerald-200" : "text-rose-800 bg-rose-200"
                )}>
                  {formatCurrency(Math.abs(plData.totalNet))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* YTD Summary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Year-to-Date Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                  Description
                </th>
                {MONTHS.map(month => (
                  <th 
                    key={month} 
                    className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 py-3"
                  >
                    {month} YTD
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="bg-emerald-50/30">
                <td className="px-4 py-3 text-sm font-medium text-emerald-800">Income YTD</td>
                {plData.ytdIncome.map((amount, i) => (
                  <td key={i} className="px-2 py-3 text-sm text-right text-emerald-700">
                    {formatCurrency(amount)}
                  </td>
                ))}
              </tr>
              <tr className="bg-rose-50/30">
                <td className="px-4 py-3 text-sm font-medium text-rose-800">Expenses YTD</td>
                {plData.ytdExpenses.map((amount, i) => (
                  <td key={i} className="px-2 py-3 text-sm text-right text-rose-700">
                    {formatCurrency(amount)}
                  </td>
                ))}
              </tr>
              <tr className={cn(
                "font-semibold",
                plData.totalNet >= 0 ? "bg-emerald-100" : "bg-rose-100"
              )}>
                <td className={cn(
                  "px-4 py-3",
                  plData.totalNet >= 0 ? "text-emerald-900" : "text-rose-900"
                )}>
                  Net YTD
                </td>
                {plData.ytdNet.map((amount, i) => (
                  <td 
                    key={i} 
                    className={cn(
                      "px-2 py-3 text-right",
                      amount >= 0 ? "text-emerald-800" : "text-rose-800"
                    )}
                  >
                    {formatCurrency(amount)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ProfitLossReport
