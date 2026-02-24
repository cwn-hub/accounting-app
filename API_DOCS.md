# SwissBooks API Documentation

## Base URL

```
Development: http://localhost:8000
Production: https://your-domain.com
```

## Authentication

SwissBooks uses a simple business-scoped authentication model. Include the `business_id` parameter in requests.

## Content Types

- **Request**: `application/json`
- **Response**: `application/json` or `text/csv` (for exports)

---

## Business Management

### List All Businesses

```http
GET /api/businesses/
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "My Company Ltd",
    "fiscal_year_start_month": 1,
    "currency": "CHF",
    "created_at": "2026-01-15T10:30:00Z"
  }
]
```

### Create Business

```http
POST /api/businesses/
Content-Type: application/json

{
  "name": "My Company Ltd",
  "fiscal_year_start_month": 1,
  "currency": "CHF"
}
```

### Get Business Details

```http
GET /api/businesses/{id}
```

### Update Business

```http
PUT /api/businesses/{id}
Content-Type: application/json

{
  "name": "Updated Company Name",
  "fiscal_year_start_month": 1,
  "currency": "CHF"
}
```

### Delete Business

```http
DELETE /api/businesses/{id}
```

---

## Accounts

### List Accounts

```http
GET /api/businesses/{business_id}/accounts/
```

**Response**:
```json
[
  {
    "id": 1,
    "business_id": 1,
    "name": "Checking Account",
    "type": "bank",
    "opening_balance": 15000.00,
    "currency": "CHF",
    "current_balance": 23450.50
  }
]
```

### Create Account

```http
POST /api/businesses/{business_id}/accounts/
Content-Type: application/json

{
  "name": "Savings Account",
  "type": "bank",
  "opening_balance": 25000.00,
  "currency": "CHF"
}
```

**Account Types**:
- `bank`: Checking/savings accounts
- `credit_card`: Credit card accounts
- `asset`: Fixed assets

### Get Account Balance

```http
GET /api/accounts/{id}/balance
```

**Response**:
```json
{
  "account_id": 1,
  "opening_balance": 15000.00,
  "current_balance": 23450.50,
  "total_income": 45000.00,
  "total_expenses": 36549.50
}
```

### Update Account

```http
PUT /api/accounts/{id}
Content-Type: application/json

{
  "name": "Updated Account Name",
  "opening_balance": 20000.00
}
```

### Delete Account

```http
DELETE /api/accounts/{id}
```

---

## Transactions

### List Transactions

```http
GET /api/accounts/{account_id}/transactions/
```

**Query Parameters**:
- `start_date`: Filter from date (YYYY-MM-DD)
- `end_date`: Filter to date (YYYY-MM-DD)
- `category_id`: Filter by category
- `type`: Filter by type (income, expense, transfer)

**Response**:
```json
[
  {
    "id": 1,
    "account_id": 1,
    "date": "2026-02-15",
    "description": "Office Supplies",
    "payee": "Staples",
    "reference": "INV-001",
    "direction": "out",
    "gross_amount": 150.00,
    "tax_rate": 0.081,
    "tax_amount": 11.24,
    "net_amount": 138.76,
    "category_ids": ["office_supplies"],
    "is_reconciled": false,
    "created_at": "2026-02-15T10:30:00Z"
  }
]
```

### Create Transaction

```http
POST /api/accounts/{account_id}/transactions/
Content-Type: application/json

{
  "date": "2026-02-15",
  "description": "Client Payment",
  "payee": "ABC Corp",
  "reference": "INV-2026-001",
  "direction": "in",
  "gross_amount": 5000.00,
  "tax_rate": 0.081,
  "category_ids": ["sales"],
  "is_reconciled": true
}
```

**Tax Calculation**:
The API automatically calculates:
- `tax_amount = gross_amount / (1 + tax_rate) * tax_rate` (for VAT-inclusive)
- `net_amount = gross_amount - tax_amount`

### Get Transaction

```http
GET /api/transactions/{id}
```

### Update Transaction

```http
PUT /api/transactions/{id}
Content-Type: application/json

{
  "description": "Updated description",
  "gross_amount": 5500.00,
  "category_ids": ["sales", "consulting"]
}
```

### Delete Transaction

```http
DELETE /api/transactions/{id}
```

### Batch Import Transactions

```http
POST /api/businesses/{business_id}/transactions/batch
Content-Type: application/json

{
  "transactions": [
    {
      "date": "2026-02-15",
      "description": "Transaction 1",
      "gross_amount": 100.00,
      "type": "expense"
    },
    {
      "date": "2026-02-16",
      "description": "Transaction 2",
      "gross_amount": 200.00,
      "type": "income"
    }
  ]
}
```

---

## Categories (Chart of Accounts)

### List Categories

```http
GET /api/businesses/{business_id}/categories/
```

**Response**:
```json
[
  {
    "id": "head_1",
    "business_id": 1,
    "code": "head_1",
    "name": "Sales Revenue",
    "type": "income",
    "report": "pl"
  }
]
```

**Category Types**:
- `income`: Revenue categories (head_1 to head_5)
- `cogs`: Cost of goods sold (head_6 to head_11)
- `expense`: Operating expenses (head_12 to head_26)

### Create Category

```http
POST /api/businesses/{business_id}/categories/
Content-Type: application/json

{
  "code": "custom_1",
  "name": "Custom Category",
  "type": "expense",
  "report": "pl"
}
```

---

## Tax Rates

### List Tax Rates

```http
GET /api/businesses/{business_id}/tax-rates/
```

**Response**:
```json
[
  {
    "id": 1,
    "business_id": 1,
    "name": "VAT 8.1%",
    "rate": 0.081,
    "is_default": true
  }
]
```

### Create Tax Rate

```http
POST /api/businesses/{business_id}/tax-rates/
Content-Type: application/json

{
  "name": "VAT 2.5%",
  "rate": 0.025,
  "is_default": false
}
```

---

## Reports

### Profit & Loss Report

```http
GET /api/reports/pl?business_id={id}&year={year}
```

**Query Parameters**:
- `business_id` (required): Business ID
- `year` (required): Fiscal year
- `format`: `json` (default) or `csv`

**Response**:
```json
{
  "business_id": 1,
  "year": 2026,
  "income": {
    "categories": [...],
    "total": 150000.00
  },
  "expenses": {
    "categories": [...],
    "total": 85000.00
  },
  "net_profit": 65000.00,
  "monthly_breakdown": [...]
}
```

### Balance Sheet

```http
GET /api/reports/balance-sheet?business_id={id}&year={year}&month={month}
```

**Query Parameters**:
- `business_id` (required): Business ID
- `year` (required): Fiscal year
- `month` (optional): Month (1-12), defaults to year-end
- `format`: `json` (default) or `csv`

**Response**:
```json
{
  "business_id": 1,
  "as_of_date": "2026-12-31",
  "assets": {
    "current": {...},
    "fixed": {...},
    "total": 200000.00
  },
  "liabilities": {
    "current": {...},
    "long_term": {...},
    "total": 50000.00
  },
  "equity": {
    "initial": 100000.00,
    "retained_earnings": 50000.00,
    "total": 150000.00
  },
  "is_balanced": true
}
```

### Tax Report

```http
GET /api/reports/tax?business_id={id}&year={year}
```

**Query Parameters**:
- `business_id` (required): Business ID
- `year` (required): Fiscal year
- `format`: `json` (default) or `csv`

**Response**:
```json
{
  "business_id": 1,
  "year": 2026,
  "summary": {
    "total_tax_collected": 12500.00,
    "total_tax_paid": 3200.00,
    "tax_payments_to_authorities": 8000.00,
    "net_tax_payable": 1300.00
  },
  "monthly_breakdown": [...]
}
```

---

## Import/Export

### Excel Import

```http
POST /api/import/excel?business_id={id}
Content-Type: multipart/form-data

file: <excel-file>
```

**Response**:
```json
{
  "success": true,
  "accounts_imported": 3,
  "categories_imported": 26,
  "transactions_imported": 450,
  "tax_rates_imported": 4,
  "warnings": []
}
```

### Export Template Info

```http
GET /api/import/template
```

Returns the expected Excel template structure.

---

## Validation

### Get Validation Errors

```http
GET /api/validation/errors/{business_id}?year={year}&month={month}
```

**Response**:
```json
[
  {
    "transaction_id": 123,
    "error_type": "missing_allocation",
    "severity": "error",
    "message": "Transaction has no category allocation"
  }
]
```

**Error Types**:
- `missing_allocation`: No category assigned
- `allocation_mismatch`: Allocations don't sum to total
- `unbalanced_transfer`: Transfer without matching entry
- `orphaned_transfer`: One side of transfer missing

### Validate Transfers

```http
GET /api/validation/transfers/{business_id}?year={year}&month={month}
```

Validates that inter-account transfers balance correctly.

---

## Error Responses

All errors follow this format:

```json
{
  "error": true,
  "message": "Description of what went wrong",
  "code": "ERROR_CODE",
  "details": {}
}
```

**HTTP Status Codes**:
- `200 OK`: Successful GET/PUT
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

---

## Rate Limits

- **Default**: 100 requests per minute per IP
- **Bulk operations**: 10 requests per minute

---

## Data Types

| Field | Type | Format | Example |
|-------|------|--------|---------|
| id | integer | | 1 |
| date | string | YYYY-MM-DD | "2026-02-15" |
| datetime | string | ISO 8601 | "2026-02-15T10:30:00Z" |
| amount | number | Decimal | 1500.50 |
| rate | number | Decimal (0-1) | 0.081 |
| currency | string | ISO 4217 | "CHF" |

---

## SDK Examples

### JavaScript/Fetch

```javascript
// Get all transactions
const response = await fetch('/api/accounts/1/transactions/');
const transactions = await response.json();

// Create a transaction
const newTransaction = await fetch('/api/accounts/1/transactions/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2026-02-15',
    description: 'Client Payment',
    direction: 'in',
    gross_amount: 5000.00,
    tax_rate: 0.081
  })
});
```

### cURL

```bash
# Get P&L report
curl "http://localhost:8000/api/reports/pl?business_id=1&year=2026"

# Create transaction
curl -X POST "http://localhost:8000/api/accounts/1/transactions/" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-02-15",
    "description": "Office Supplies",
    "direction": "out",
    "gross_amount": 150.00
  }'
```

---

*API Version: 1.0*
*Last Updated: February 2026*
