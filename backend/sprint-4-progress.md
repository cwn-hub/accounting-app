# Sprint 4 Progress - Reports (P&L & Balance Sheet)

## Status: COMPLETE ✅

### Deliverables Completed:

#### 1. P&L Report Service ✅
- Monthly columns (1-12) and YTD totals
- Income: Sum of Head 1-5 categories
- COGS: Sum of Head 6-11 + inventory adjustment placeholder
- Expenses: Sum of Head 12-26 categories
- Net Profit = Income - COGS - Expenses
- Located in: `app/reports.py` - `PLReportService` class

#### 2. Balance Sheet Service ✅
- Monthly snapshots (end of month) for all 12 months
- Assets:
  - Bank closing balances (calculated from transactions)
  - Inventory (placeholder)
  - Asset purchases (cumulative via `ASSET_PURCHASE` special type)
- Liabilities:
  - Credit card balances (negative balance = liability)
  - Loans received minus repayments
  - Tax payable (VAT collected - paid)
  - Income tax and payroll tax
- Equity:
  - Capital contributions
  - Retained earnings (opening + current year profit)
  - Current year net profit
  - Drawings (reduces equity)
- Validation: Equity = Net Assets check for each month
- Located in: `app/reports.py` - `BalanceSheetService` class

#### 3. Report Endpoints ✅
- `GET /reports/pl` - Profit & Loss report
  - Query params: `business_id`, `year`, `format` (json/csv)
- `GET /reports/balance-sheet` - Balance Sheet report
  - Query params: `business_id`, `year`, `format` (json/csv)
- Located in: `app/routers/reports.py`

#### 4. CSV Export ✅
- `CSVExportService` class in `app/reports.py`
- `export_pl_to_csv()` - Exports P&L to CSV format
- `export_balance_sheet_to_csv()` - Exports Balance Sheet to CSV format
- Both endpoints support `?format=csv` query parameter

### Files Modified/Created:
1. ✅ `app/reports.py` - Report services (P&L, Balance Sheet, CSV export)
2. ✅ `app/routers/reports.py` - Report endpoints (NEW)
3. ✅ `app/routers/__init__.py` - Added reports_router export
4. ✅ `app/main.py` - Added reports_router to app
5. ✅ `tests/test_reports.py` - Unit tests for reports (NEW)

### API Verification:
```bash
# Routes registered successfully:
- GET /reports/pl
- GET /reports/balance-sheet
```

### Test Results:
```
tests/test_reports.py::TestPLReport::test_pl_report_empty_business PASSED
tests/test_reports.py::TestPLReport::test_pl_report_income_calculation PASSED
tests/test_reports.py::TestPLReport::test_pl_report_expense_calculation PASSED
tests/test_reports.py::TestPLReport::test_pl_report_net_profit_calculation PASSED
tests/test_reports.py::TestBalanceSheet::test_balance_sheet_empty_business PASSED
tests/test_reports.py::TestBalanceSheet::test_balance_sheet_bank_balance PASSED
tests/test_reports.py::TestBalanceSheet::test_balance_sheet_validation_equity_equals_net_assets PASSED
tests/test_reports.py::TestCSVExport::test_export_pl_to_csv PASSED
tests/test_reports.py::TestCSVExport::test_export_balance_sheet_to_csv PASSED

9 passed in 2.59s
```

### Implementation Notes:
- P&L calculations follow Excel logic exactly
- Balance Sheet validates: Equity = Assets - Liabilities
- CSV exports include proper headers and month columns
- Services use SQLAlchemy 2.0 ORM queries
- Decimal precision maintained throughout calculations
- All existing tests continue to pass (12/12)

### Example Usage:
```bash
# Get P&L report as JSON
curl "http://localhost:8000/reports/pl?business_id=1&year=2026"

# Download P&L as CSV
curl "http://localhost:8000/reports/pl?business_id=1&year=2026&format=csv"

# Get Balance Sheet as JSON
curl "http://localhost:8000/reports/balance-sheet?business_id=1&year=2026"

# Download Balance Sheet as CSV
curl "http://localhost:8000/reports/balance-sheet?business_id=1&year=2026&format=csv"
```
