# Accounting Tool - Frontend

React frontend for the Accounting Tool MVP.

## Features

- **Month Tabs**: Navigate between 12 months
- **Transaction Grid**: Spreadsheet-like table using TanStack Table
- **Transaction Entry Form**: Add income, expense, or transfer transactions
- **26 Categories**: Full category dropdown with income/expense/transfer types
- **Tax Rate Selector**: Auto-calculates tax on blur
- **Running Balance**: Real-time income, expenses, and balance display
- **Account Selector**: Switch between 3 accounts (Checking, Savings, Credit Card)
- **Inline Editing**: Edit transactions directly in the table
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## Tech Stack

- React 19
- Vite
- TanStack Table v8
- Tailwind CSS
- Lucide React (icons)
- Axios (ready for API integration)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── AccountSelector.jsx   # Account dropdown
│   ├── MonthTabs.jsx         # Month navigation tabs
│   ├── RunningBalance.jsx    # Balance display cards
│   ├── TransactionForm.jsx   # Add transaction form
│   └── TransactionTable.jsx  # Main data grid
├── data/
│   └── mockData.js           # Mock data & constants
├── utils/
│   └── cn.js                 # Tailwind class utility
├── App.jsx                   # Main app component
├── main.jsx                  # Entry point
└── index.css                 # Global styles
```

## Mock Data

The app currently uses mock data for demonstration. To connect to a real API:

1. Update `src/data/mockData.js` to export API endpoints
2. Replace mock data calls in `App.jsx` with Axios requests
3. The UI is already designed to work with async data loading

## Categories (26 Total)

**Income (5):** Salary, Freelance, Investment Income, Rental Income, Other Income, Refund

**Expense (19):** Groceries, Rent/Mortgage, Utilities, Transportation, Healthcare, Insurance, Entertainment, Dining Out, Shopping, Education, Travel, Subscriptions, Maintenance/Repairs, Gifts/Donations, Personal Care, Pets, Office Supplies, Taxes, Miscellaneous

**Transfer (1):** Transfer

## Tax Rates

0%, 5%, 8%, 10%, 15%, 20%, 25%

## License

MIT
