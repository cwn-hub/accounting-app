# Accounting Tool Backend

Swiss cash-basis accounting SaaS - Sprint 1 Foundation

## Project Structure

```
backend/
├── alembic/                  # Database migrations
│   ├── versions/
│   │   └── 001_initial_schema.py
│   ├── env.py
│   └── alembic.ini
├── app/
│   ├── __init__.py
│   └── models.py            # SQLAlchemy 2.0 models
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures
│   └── test_invariants.py   # Property-based accounting tests
├── requirements.txt
└── README.md
```

## Quick Start

### 1. Setup Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Tests

```bash
pytest tests/ -v
```

### 3. Run Migrations

```bash
alembic upgrade head
```

## Models

### Business
- Single business entity (single-tenant for Variant A)
- Fiscal year start month (1-12)
- Currency (default: CHF)

### Account
- 3 default accounts: Bank #1, Bank #2, Credit Card
- Types: bank, credit_card, asset
- Opening balance

### Category
- 26 categories: 5 income, 6 COGS, 15 expense
- Codes: head_1 through head_26
- Reports to: P&L or Balance Sheet

### TaxRate
- Configurable tax rates (e.g., VAT 8.1%)
- Stored as Decimal (0.081 = 8.1%)

### Transaction
- Account, date, payee, description
- Direction: in/out
- Gross amount (includes tax)
- Tax amount (computed: tax = gross / (1 + rate))
- Net amount (gross - tax)
- Reconciliation flag

### TransactionLine
- Links transaction to category OR special type
- Special types: capital, loan_in, transfer_in/out, asset_purchase,
  tax_payment, loan_repayment, drawings, income_tax, payroll_tax

## Accounting Invariants (Tested)

1. **Transaction Allocation**: Total In = sum of allocation lines + tax
2. **Running Balance Continuity**: Balance[n] = Balance[n-1] + In[n] - Out[n]
3. **Month-to-Month Continuity**: Closing balance month N = Opening balance month N+1
4. **Balance Sheet Equation**: Equity = Assets - Liabilities
5. **Transfer Balance**: Interbank transfers must net to zero

## Tax Calculation

Formula: `tax = gross / (1 + rate)`

Example:
- Gross: 108.10 CHF
- Rate: 8.1% (0.081)
- Net: 108.10 / 1.081 = 100.00 CHF
- Tax: 108.10 - 100.00 = 8.10 CHF

## Database

Default: SQLite (for development)
Production: PostgreSQL (configured via DATABASE_URL)
