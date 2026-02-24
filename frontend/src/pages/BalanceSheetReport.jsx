import { useState, useMemo } from 'react'
import { 
  Download, 
  FileText, 
  FileSpreadsheet,
  Printer,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Building2,
  Scale,
  PiggyBank,
  CreditCard,
  Wallet
} from 'lucide-react'
import { generateMockTransactions, ACCOUNTS } from '../data/mockData'
import { cn } from '../utils/cn'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function BalanceSheetReport() {
  const [transactions] = useState(() => generateMockTransactions())
  const [selectedMonth, setSelectedMonth] = useState(12)
  const [selectedYear] = useState(2026)

  // Calculate Balance Sheet data for selected month
  const balanceSheet = useMemo(() => {
    const relevantTransactions = transactions.filter(t => t.month <= selectedMonth)
    
    const accountBalances = {}
    ACCOUNTS.forEach(acc => {
      accountBalances[acc.id] = {
        name: acc.name,
        balance: 0,
        type: acc.id === 'credit' ? 'liability' : 'asset'
      }
    })
    
    accountBalances.checking.balance = 15000
    accountBalances.savings.balance = 25000
    accountBalances.credit.balance = -2500
    
    relevantTransactions.forEach(txn => {
      if (accountBalances[txn.accountId]) {
        if (txn.type === 'income') {
          accountBalances[txn.accountId].balance += txn.amount
        } else if (txn.type === 'expense') {
          accountBalances[txn.accountId].balance -= txn.amount
        }
      }
    })
    
    const cashAndEquivalents = [
      { name: 'Checking Account', amount: Math.max(0, accountBalances.checking.balance), accountId: 'checking' },
      { name: 'Savings Account', amount: Math.max(0, accountBalances.savings.balance), accountId: 'savings' },
    ].filter(item => item.amount > 0)
    
    const accountsReceivable = relevantTransactions
      .filter(t => t.type === 'income' && !t.isReconciled)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalCash = cashAndEquivalents.reduce((sum, item) => sum + item.amount, 0)
    const totalCurrentAssets = totalCash + accountsReceivable
    const fixedAssets = 50000 + (selectedMonth * 1000)
    const totalAssets = totalCurrentAssets + fixedAssets
    
    const creditPayable = Math.abs(Math.min(0, accountBalances.credit.balance))
    const accountsPayable = relevantTransactions
      .filter(t => t.type === 'expense' && !t.isReconciled)
      .reduce((sum, t) => sum + t.amount, 5000)
    
    const shortTermLoans = 15000
    const totalCurrentLiabilities = creditPayable + accountsPayable + shortTermLoans
    const longTermDebt = 100000 - (selectedMonth * 1000)
    const totalLiabilities = totalCurrentLiabilities + longTermDebt
    
    const retainedEarnings = totalAssets - totalLiabilities - 50000
    const totalEquity = 50000 + retainedEarnings
    
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    
    return {
      assets: {
        cashAndEquivalents,
        accountsReceivable,
        totalCash,
        totalCurrentAssets,
        fixedAssets,
        totalAssets
      },
      liabilities: {
        creditPayable,
        accountsPayable,
        shortTermLoans,
        totalCurrentLiabilities,
        longTermDebt,
        totalLiabilities
      },
      equity: {
        initialEquity: 50000,
        retainedEarnings,
        totalEquity
      },
      isBalanced,
      check: totalAssets - (totalLiabilities + totalEquity)
    }
  }, [transactions, selectedMonth])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount)
  }

  const exportCSV = () => {
    let csv = 'Balance Sheet Report\n'
    csv += `As of: ${MONTHS[selectedMonth - 1]} ${selectedYear}\n\n`
    
    csv += 'ASSETS\n'
    csv += `Cash and Equivalents,${formatCurrency(balanceSheet.assets.totalCash)}\n`
    balanceSheet.assets.cashAndEquivalents.forEach(item => {
      csv += `  ${item.name},${formatCurrency(item.amount)}\n`
    })
    csv += `Accounts Receivable,${formatCurrency(balanceSheet.assets.accountsReceivable)}\n`
    csv += `Total Current Assets,${formatCurrency(balanceSheet.assets.totalCurrentAssets)}\n`
    csv += `Fixed Assets,${formatCurrency(balanceSheet.assets.fixedAssets)}\n`
    csv += `TOTAL ASSETS,${formatCurrency(balanceSheet.assets.totalAssets)}\n\n`
    
    csv += 'LIABILITIES\n'
    csv += `Credit Card Payable,${formatCurrency(balanceSheet.liabilities.creditPayable)}\n`
    csv += `Accounts Payable,${formatCurrency(balanceSheet.liabilities.accountsPayable)}\n`
    csv += `Short-term Loans,${formatCurrency(balanceSheet.liabilities.shortTermLoans)}\n`
    csv += `Total Current Liabilities,${formatCurrency(balanceSheet.liabilities.totalCurrentLiabilities)}\n`
    csv += `Long-term Debt,${formatCurrency(balanceSheet.liabilities.longTermDebt)}\n`
    csv += `TOTAL LIABILITIES,${formatCurrency(balanceSheet.liabilities.totalLiabilities)}\n\n`
    
    csv += 'EQUITY\n'
    csv += `Initial Equity,${formatCurrency(balanceSheet.equity.initialEquity)}\n`
    csv += `Retained Earnings,${formatCurrency(balanceSheet.equity.retainedEarnings)}\n`
    csv += `TOTAL EQUITY,${formatCurrency(balanceSheet.equity.totalEquity)}\n\n`
    
    csv += `VALIDATION: ${balanceSheet.isBalanced ? 'BALANCED' : 'UNBALANCED'}\n`
    csv += `Check: ${formatCurrency(balanceSheet.check)}\n`
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `balance-sheet-${selectedYear}-${selectedMonth}.csv`
    link.click()
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.text('Balance Sheet', 14, 20)
    doc.setFontSize(12)
    doc.text(`As of ${MONTHS[selectedMonth - 1]} ${selectedYear}`, 14, 30)
    
    const data = [
      ['ASSETS', ''],
      ['Cash and Equivalents', formatCurrency(balanceSheet.assets.totalCash)],
      ['Accounts Receivable', formatCurrency(balanceSheet.assets.accountsReceivable)],
      ['Total Current Assets', formatCurrency(balanceSheet.assets.totalCurrentAssets)],
      ['Fixed Assets', formatCurrency(balanceSheet.assets.fixedAssets)],
      ['TOTAL ASSETS', formatCurrency(balanceSheet.assets.totalAssets)],
      ['', ''],
      ['LIABILITIES', ''],
      ['Credit Card Payable', formatCurrency(balanceSheet.liabilities.creditPayable)],
      ['Accounts Payable', formatCurrency(balanceSheet.liabilities.accountsPayable)],
      ['Short-term Loans', formatCurrency(balanceSheet.liabilities.shortTermLoans)],
      ['Total Current Liabilities', formatCurrency(balanceSheet.liabilities.totalCurrentLiabilities)],
      ['Long-term Debt', formatCurrency(balanceSheet.liabilities.longTermDebt)],
      ['TOTAL LIABILITIES', formatCurrency(balanceSheet.liabilities.totalLiabilities)],
      ['', ''],
      ['EQUITY', ''],
      ['Initial Equity', formatCurrency(balanceSheet.equity.initialEquity)],
      ['Retained Earnings', formatCurrency(balanceSheet.equity.retainedEarnings)],
      ['TOTAL EQUITY', formatCurrency(balanceSheet.equity.totalEquity)],
    ]
    
    doc.autoTable({
      startY: 40,
      body: data,
      theme: 'striped',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' }
      },
      didParseCell: (data) => {
        const rowText = data.row.raw[0]
        if (['ASSETS', 'LIABILITIES', 'EQUITY', 'TOTAL ASSETS', 'TOTAL LIABILITIES', 'TOTAL EQUITY'].includes(rowText)) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [241, 245, 249]
        }
      }
    })
    
    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.text(`Validation: ${balanceSheet.isBalanced ? 'BALANCED ✓' : 'UNBALANCED ✗'}`, 14, finalY)
    
    doc.save(`balance-sheet-${selectedYear}-${selectedMonth}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Balance Sheet</h1>
          <p className="text-slate-500 flex items-center gap-2 mt-1">
            <Building2 className="w-4 h-4" />
            Statement of Financial Position
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
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Month Selector & Validation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <label className="text-sm font-medium text-slate-700">Snapshot as of:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {MONTHS.map((month, i) => (
                  <option key={i + 1} value={i + 1}>{month} {selectedYear}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg",
            balanceSheet.isBalanced 
              ? "bg-emerald-50 border border-emerald-200" 
              : "bg-rose-50 border border-rose-200"
          )}>
            {balanceSheet.isBalanced ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">
                  Validated: Assets = Liabilities + Equity
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-rose-600" />
                <span className="text-sm font-medium text-rose-800">
                  Error: Discrepancy {formatCurrency(balanceSheet.check)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Balance Sheet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Column */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-emerald-900">ASSETS</h2>
            </div>
          </div>
          
          <div className="p-5 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Current Assets
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <PiggyBank className="w-4 h-4" />
                  Cash and Equivalents
                </div>
                {balanceSheet.assets.cashAndEquivalents.map(item => (
                  <div key={item.accountId} className="flex justify-between pl-6 text-sm">
                    <span className="text-slate-600">{item.name}</span>
                    <span className="font-medium text-slate-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between pl-6 pt-2 border-t border-slate-100">
                  <span className="text-sm font-medium text-slate-700">Total Cash</span>
                  <span className="text-sm font-bold text-emerald-700">{formatCurrency(balanceSheet.assets.totalCash)}</span>
                </div>
              </div>
              
              <div className="flex justify-between text-sm py-2">
                <span className="text-slate-600">Accounts Receivable</span>
                <span className="font-medium text-slate-900">{formatCurrency(balanceSheet.assets.accountsReceivable)}</span>
              </div>
              
              <div className="flex justify-between pt-3 border-t-2 border-slate-200">
                <span className="font-semibold text-slate-800">Total Current Assets</span>
                <span className="font-bold text-emerald-700">{formatCurrency(balanceSheet.assets.totalCurrentAssets)}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Non-Current Assets
              </h3>
              <div className="flex justify-between text-sm py-2">
                <span className="text-slate-600">Fixed Assets (Net)</span>
                <span className="font-medium text-slate-900">{formatCurrency(balanceSheet.assets.fixedAssets)}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t-2 border-emerald-200 bg-emerald-50 -mx-5 -mb-5 px-5 py-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-900">TOTAL ASSETS</span>
                <span className="text-xl font-bold text-emerald-800">{formatCurrency(balanceSheet.assets.totalAssets)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity Column */}
        <div className="space-y-6">
          {/* Liabilities */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-rose-50 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-600" />
                <h2 className="text-lg font-bold text-rose-900">LIABILITIES</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Current Liabilities
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Credit Card Payable</span>
                    <span className="font-medium text-slate-900">{formatCurrency(balanceSheet.liabilities.creditPayable)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Accounts Payable</span>
                    <span className="font-medium text-slate-900">{formatCurrency(balanceSheet.liabilities.accountsPayable)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Short-term Loans</span>
                    <span className="font-medium text-slate-900">{formatCurrency(balanceSheet.liabilities.shortTermLoans)}</span>
                  </div>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-100 mt-2">
                  <span className="font-semibold text-slate-700">Total Current Liabilities</span>
                  <span className="font-bold text-rose-700">{formatCurrency(balanceSheet.liabilities.totalCurrentLiabilities)}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Non-Current Liabilities
                </h3>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Long-term Debt</span>
                  <span className="font-medium text-slate-900">{formatCurrency(balanceSheet.liabilities.longTermDebt)}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t-2 border-rose-200 bg-rose-50 -mx-5 -mb-5 px-5 py-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-900">TOTAL LIABILITIES</span>
                  <span className="text-xl font-bold text-rose-800">{formatCurrency(balanceSheet.liabilities.totalLiabilities)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-indigo-50 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-indigo-900">EQUITY</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Initial Equity</span>
                <span className="font-medium text-slate-900">{formatCurrency(balanceSheet.equity.initialEquity)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Retained Earnings</span>
                <span className={cn(
                  "font-medium",
                  balanceSheet.equity.retainedEarnings >= 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {formatCurrency(balanceSheet.equity.retainedEarnings)}
                </span>
              </div>
              
              <div className="pt-4 border-t-2 border-indigo-200 bg-indigo-50 -mx-5 -mb-5 px-5 py-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-indigo-900">TOTAL EQUITY</span>
                  <span className="text-xl font-bold text-indigo-800">{formatCurrency(balanceSheet.equity.totalEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Check Summary */}
      <div className={cn(
        "rounded-xl p-6 text-center",
        balanceSheet.isBalanced 
          ? "bg-emerald-50 border-2 border-emerald-200" 
          : "bg-rose-50 border-2 border-rose-200"
      )}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <Scale className={cn(
            "w-6 h-6",
            balanceSheet.isBalanced ? "text-emerald-600" : "text-rose-600"
          )} />
          <span className={cn(
            "text-lg font-bold",
            balanceSheet.isBalanced ? "text-emerald-900" : "text-rose-900"
          )}>
            {balanceSheet.isBalanced ? 'Balance Sheet Validated' : 'Balance Check Failed'}
          </span>
        </div>
        <p className={cn(
          "text-sm",
          balanceSheet.isBalanced ? "text-emerald-700" : "text-rose-700"
        )}>
          Assets ({formatCurrency(balanceSheet.assets.totalAssets)}) = 
          Liabilities ({formatCurrency(balanceSheet.liabilities.totalLiabilities)}) + 
          Equity ({formatCurrency(balanceSheet.equity.totalEquity)})
        </p>
        {!balanceSheet.isBalanced && (
          <p className="text-rose-600 text-sm mt-2 font-medium">
            Discrepancy: {formatCurrency(balanceSheet.check)}
          </p>
        )}
      </div>
    </div>
  )
}

export default BalanceSheetReport
