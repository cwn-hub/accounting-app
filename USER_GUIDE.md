# SwissBooks User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Managing Transactions](#managing-transactions)
4. [Reports](#reports)
5. [Settings](#settings)
6. [Import & Export](#import--export)
7. [Mobile Usage](#mobile-usage)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Time Setup

1. **Access SwissBooks**: Open your browser and navigate to the application URL
2. **Dashboard Overview**: The dashboard displays your financial overview including:
   - Current month income and expenses
   - Net position
   - Tax payable
   - Cash position across accounts
   - Monthly trend chart
   - Recent transactions

### Navigation

The sidebar navigation provides access to all features:
- **Dashboard**: Overview of your financial position
- **Journal**: View all transactions in chronological order
- **Reports**: Generate P&L, Balance Sheet, and Tax reports
- **Settings**: Configure business info, accounts, and users
- **Import/Export**: Manage data backup and restoration
- **Help**: Access documentation and support

---

## Dashboard

The Dashboard provides a real-time overview of your business finances.

### Key Metrics

| Metric | Description |
|--------|-------------|
| Month Income | Total income for the current month |
| Month Expenses | Total expenses for the current month |
| Net Position | Income minus expenses for the month |
| Tax Payable | Estimated VAT/tax obligation |

### Cash Position Card

Shows your liquid assets:
- **Checking Account**: Primary business account balance
- **Savings Account**: Reserve funds
- **Credit Card**: Current credit card balance (negative)
- **Net Position**: Combined liquid position

### Monthly Trend Chart

Visual representation of:
- Monthly income (green line)
- Monthly expenses (red line)
- Trend over the fiscal year

### Recent Transactions

Lists the 10 most recent transactions with:
- Date
- Description
- Account
- Category
- Amount (color-coded: green for income, red for expenses)

---

## Managing Transactions

### Adding a Transaction

1. Navigate to any page with the transaction form (Dashboard)
2. Select transaction type:
   - **Income**: Money coming in (sales, refunds)
   - **Expense**: Money going out (purchases, bills)
   - **Transfer**: Moving money between accounts
3. Fill in the details:
   - **Date**: When the transaction occurred
   - **Description**: Brief explanation
   - **Amount**: Transaction value in CHF
   - **Category**: Select appropriate category
   - **Tax Rate**: Select applicable VAT rate (if applicable)
4. Click "Add [Type]" to save

### Understanding Tax Calculation

SwissBooks automatically calculates tax:
- **Tax Amount** = Amount × Tax Rate
- **Net Amount** = Amount - Tax Amount (for income)
- **Net Amount** = Amount (for expenses)

Common Swiss VAT rates:
- 0%: Exempt transactions
- 2.5%: Reduced rate (accommodation)
- 7.7%: Standard rate (most goods/services)
- 8.1%: Updated standard rate (2024+)

### Editing Transactions

Transactions can be edited from the transaction table:
1. Locate the transaction
2. Click the edit (pencil) icon
3. Modify the fields
4. Click save (checkmark) or cancel (X)

### Deleting Transactions

1. Find the transaction in the list
2. Click the delete (trash) icon
3. Confirm deletion

---

## Reports

### Profit & Loss Report

The P&L report shows your income and expenses over time.

**Access**: Reports → Profit & Loss

**Features**:
- Monthly breakdown by category
- Collapsible sections (Income/Expenses)
- Year-to-date summary
- Export to CSV or PDF
- Print functionality

**Sections**:
1. **Income**: All revenue sources categorized
2. **Expenses**: All costs categorized
3. **Net Profit/Loss**: Income minus expenses

### Balance Sheet

Shows your financial position at a specific point in time.

**Access**: Reports → Balance Sheet

**Components**:
- **Assets**: What you own
  - Cash and equivalents
  - Accounts receivable
  - Fixed assets
- **Liabilities**: What you owe
  - Credit card payable
  - Accounts payable
  - Loans
- **Equity**: Owner's stake
  - Initial equity
  - Retained earnings

**Validation**: The report automatically checks that Assets = Liabilities + Equity

### Tax Report

Summarizes tax-related transactions for filing.

**Access**: Reports → Tax Report

**Information Provided**:
- Total tax collected (on income)
- Total tax paid (on expenses)
- Tax payments to authorities
- Net tax payable/refundable
- Monthly breakdown

---

## Settings

### Business Settings

Configure your business information:
- Business name
- Fiscal year start month
- Base currency (CHF recommended for Swiss businesses)
- Tax registration numbers

### Chart of Accounts

Manage your account categories:
- **Income Categories**: Revenue sources
- **Expense Categories**: Cost types
- **COGS**: Cost of goods sold (for product businesses)

Standard Swiss categories are pre-configured but can be customized.

### Tax Rates

Configure applicable tax rates:
- Name (e.g., "VAT 7.7%")
- Rate (as decimal, e.g., 0.077)
- Default status

### Account Management

Manage bank and credit accounts:
- Account name
- Type (Bank, Credit Card, Asset)
- Opening balance
- Currency

### User Management

For multi-user access:
- Add/remove users
- Assign roles (Admin, Accountant, Viewer)
- Set permissions

---

## Import & Export

### Exporting Data

**CSV Export**:
1. Go to Import/Export
2. Click "Export CSV"
3. Select date range and entities
4. Download the file

**Full Backup**:
1. Click "Full Backup"
2. Save the JSON file securely
3. Contains all business data

### Importing Data

**Excel Import**:
1. Prepare your Excel file with the required format
2. Click "Import from Excel"
3. Select your file
4. Review and confirm import

**Restore from Backup**:
1. Click "Select Backup File"
2. Choose your backup JSON
3. Select merge strategy:
   - **Replace All**: Overwrites existing data
   - **Merge**: Adds to existing data
4. Confirm restoration

### Excel Template Format

The Excel import expects these sheets:
1. **Business Config**: Company details
2. **Accounts**: Bank accounts and opening balances
3. **Categories**: Income/expense categories
4. **Tax Rates**: Applicable tax rates
5. **Month1-12**: Transaction data per month

---

## Mobile Usage

SwissBooks is fully responsive and works on mobile devices.

### Mobile Features

- **Touch-Optimized**: All buttons are sized for easy tapping
- **Swipe Gestures**: Navigate between months
- **Mobile Form**: Simplified transaction entry
- **Offline Support**: Basic functionality works offline

### Installing as App (PWA)

**iOS (Safari)**:
1. Open SwissBooks in Safari
2. Tap Share button
3. Select "Add to Home Screen"

**Android (Chrome)**:
1. Open SwissBooks in Chrome
2. Tap menu (three dots)
3. Select "Add to Home screen"

---

## Troubleshooting

### Common Issues

**Page Not Loading**
- Check internet connection
- Clear browser cache
- Try a different browser

**Data Not Saving**
- Check browser permissions
- Ensure cookies are enabled
- Try refreshing the page

**Reports Show Incorrect Data**
- Verify transaction dates
- Check category assignments
- Ensure tax rates are correct

**Mobile Issues**
- Rotate device for better view
- Use landscape mode for reports
- Ensure iOS/Android is up to date

### Getting Help

1. **In-App Help**: Click the help icon (?) next to fields
2. **Documentation**: Check the Help page
3. **Support**: Contact your system administrator

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | New transaction |
| `Ctrl + S` | Save (when editing) |
| `Escape` | Cancel/Close |
| `Ctrl + P` | Print current report |

---

## Best Practices

1. **Regular Backups**: Export your data weekly
2. **Reconcile Monthly**: Compare with bank statements
3. **Categorize Promptly**: Don't let transactions pile up uncategorized
4. **Review Reports**: Check P&L monthly for insights
5. **Tax Planning**: Monitor tax payable to avoid surprises

---

## Privacy & Security

- All data is stored locally in your browser
- No data is sent to external servers
- Use strong passwords for multi-user setups
- Regular backups protect against data loss

---

*Last Updated: February 2026*
