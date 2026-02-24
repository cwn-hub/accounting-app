export const ACCOUNTS = [
  { id: 'checking', name: 'Checking Account' },
  { id: 'savings', name: 'Savings Account' },
  { id: 'credit', name: 'Credit Card' },
]

export const CATEGORIES = [
  { id: 'salary', name: 'Salary', type: 'income' },
  { id: 'freelance', name: 'Freelance', type: 'income' },
  { id: 'investment', name: 'Investment Income', type: 'income' },
  { id: 'rental', name: 'Rental Income', type: 'income' },
  { id: 'other_income', name: 'Other Income', type: 'income' },
  { id: 'groceries', name: 'Groceries', type: 'expense' },
  { id: 'rent', name: 'Rent/Mortgage', type: 'expense' },
  { id: 'utilities', name: 'Utilities', type: 'expense' },
  { id: 'transportation', name: 'Transportation', type: 'expense' },
  { id: 'healthcare', name: 'Healthcare', type: 'expense' },
  { id: 'insurance', name: 'Insurance', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense' },
  { id: 'dining', name: 'Dining Out', type: 'expense' },
  { id: 'shopping', name: 'Shopping', type: 'expense' },
  { id: 'education', name: 'Education', type: 'expense' },
  { id: 'travel', name: 'Travel', type: 'expense' },
  { id: 'subscriptions', name: 'Subscriptions', type: 'expense' },
  { id: 'maintenance', name: 'Maintenance/Repairs', type: 'expense' },
  { id: 'gifts', name: 'Gifts/Donations', type: 'expense' },
  { id: 'personal', name: 'Personal Care', type: 'expense' },
  { id: 'pets', name: 'Pets', type: 'expense' },
  { id: 'office', name: 'Office Supplies', type: 'expense' },
  { id: 'taxes', name: 'Taxes', type: 'expense' },
  { id: 'transfer', name: 'Transfer', type: 'transfer' },
  { id: 'refund', name: 'Refund', type: 'income' },
  { id: 'misc', name: 'Miscellaneous', type: 'expense' },
]

export const TAX_RATES = [
  { id: 0, name: '0%', value: 0 },
  { id: 5, name: '5%', value: 0.05 },
  { id: 8, name: '8%', value: 0.08 },
  { id: 10, name: '10%', value: 0.10 },
  { id: 15, name: '15%', value: 0.15 },
  { id: 20, name: '20%', value: 0.20 },
  { id: 25, name: '25%', value: 0.25 },
]

export function generateMockTransactions() {
  const transactions = []
  
  for (let month = 1; month <= 12; month++) {
    for (const account of ACCOUNTS) {
      // Add some sample transactions per month per account
      const count = Math.floor(Math.random() * 5) + 3
      
      for (let i = 0; i < count; i++) {
        const day = Math.floor(Math.random() * 28) + 1
        const isIncome = Math.random() > 0.7
        const isTransfer = Math.random() > 0.9
        
        let type = 'expense'
        let categoryId = 'groceries'
        let amount = Math.floor(Math.random() * 200) + 20
        
        if (isTransfer) {
          type = 'transfer'
          categoryId = 'transfer'
          amount = Math.floor(Math.random() * 500) + 100
        } else if (isIncome) {
          type = 'income'
          categoryId = ['salary', 'freelance', 'investment'][Math.floor(Math.random() * 3)]
          amount = Math.floor(Math.random() * 2000) + 500
        } else {
          const expenseCats = CATEGORIES.filter(c => c.type === 'expense')
          categoryId = expenseCats[Math.floor(Math.random() * expenseCats.length)].id
        }
        
        const taxRate = type === 'income' ? 0.15 : 0
        const taxAmount = amount * taxRate
        
        transactions.push({
          id: `${month}-${account.id}-${i}`,
          date: new Date(2024, month - 1, day).toISOString().split('T')[0],
          description: `Sample ${type} transaction`,
          amount,
          type,
          categoryId,
          taxRate,
          taxAmount,
          month,
          accountId: account.id,
        })
      }
    }
  }
  
  return transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
}
