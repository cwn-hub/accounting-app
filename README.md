# Accounting Tool (Variant A)

Swiss cash-basis accounting SaaS with FastAPI backend and React frontend.

## Features

- **Business Management**: Multi-business support with fiscal year configuration
- **Account Management**: Bank accounts, credit cards, and asset tracking
- **Transaction Processing**: Income/expense tracking with tax calculations
- **Chart of Accounts**: 26 categories (5 income, 6 COGS, 15 expense)
- **Tax Support**: Configurable VAT/sales tax rates with automatic calculations
- **Reports**:
  - Profit & Loss (monthly + YTD)
  - Balance Sheet with validation
  - Sales Tax report
  - All reports exportable to CSV
- **Excel Import**: Import entire business data from Excel template
- **Docker Deployment**: Production-ready containerization

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd 10-mvp

# Start services
docker-compose up -d

# Access the application
# Frontend: http://localhost
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Or build for production
npm run build
```

## API Documentation

### Base URL
- Development: `http://localhost:8000`
- Production: `http://your-domain.com`

### Authentication
Variant A uses single-tenant mode per business. All endpoints require a `business_id` parameter.

### Endpoints

#### Business Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/businesses/` | List all businesses |
| POST | `/businesses/` | Create new business |
| GET | `/businesses/{id}` | Get business details |
| PUT | `/businesses/{id}` | Update business |
| DELETE | `/businesses/{id}` | Delete business |

#### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/businesses/{id}/accounts/` | List accounts |
| POST | `/businesses/{id}/accounts/` | Create account |
| GET | `/accounts/{id}/balance` | Get account balance |
| PUT | `/accounts/{id}` | Update account |
| DELETE | `/accounts/{id}` | Delete account |

#### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts/{id}/transactions/` | List transactions |
| POST | `/accounts/{id}/transactions/` | Create transaction |
| GET | `/transactions/{id}` | Get transaction |
| PUT | `/transactions/{id}` | Update transaction |
| DELETE | `/transactions/{id}` | Delete transaction |

#### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/pl` | P&L report (JSON/CSV) |
| GET | `/reports/balance-sheet` | Balance Sheet (JSON/CSV) |
| GET | `/reports/tax` | Tax report (JSON/CSV) |

**Report Parameters:**
- `business_id` (required): Business ID
- `year` (required): Fiscal year
- `format` (optional): `json` or `csv` (default: json)

#### Import
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/import/excel` | Import Excel file |
| GET | `/import/template` | Get template info |

### Tax Calculation

Tax is calculated using the formula: `tax = gross / (1 + rate)`

Example: For a CHF 100 transaction with 8.1% VAT:
- Tax = 100 / 1.081 = CHF 7.49
- Net = 100 - 7.49 = CHF 92.51

## Excel Import Guide

### Template Structure

The Excel template (`00-source-excel/Accounting-Excel-Template.xlsx`) contains:

#### 1. Business Config Sheet
| Field | Description | Example |
|-------|-------------|---------|
| Business Name | Company name | "My Company Ltd" |
| Fiscal Year Start Month | 1-12 | 1 (January) |
| Currency | ISO code | CHF |

#### 2. Accounts Sheet
| Column | Description | Valid Values |
|--------|-------------|--------------|
| Account Name | Display name | Any text |
| Type | Account type | bank, credit_card, asset |
| Opening Balance | Starting balance | Number |
| Currency | Currency code | CHF, USD, EUR |

#### 3. Categories Sheet
| Column | Description | Pattern |
|--------|-------------|---------|
| Code | Category code | head_1 to head_26 |
| Name | Display name | Any text |
| Type | Category type | income, cogs, expense |
| Report | Report type | pl, bs |

**Category Codes:**
- **Income**: head_1 to head_5
- **COGS**: head_6 to head_11
- **Expense**: head_12 to head_26

#### 4. Tax Rates Sheet
| Column | Description | Example |
|--------|-------------|---------|
| Name | Tax rate name | "VAT 8.1%" |
| Rate | Decimal rate | 0.081 |

#### 5. Month1-12 Sheets (Transactions)
| Column | Required | Description |
|--------|----------|-------------|
| Date (YYYY-MM-DD) | Yes | Transaction date |
| Account Name | Yes | Must match Accounts sheet |
| Payee | No | Who paid/received |
| Description | No | Transaction notes |
| Reference | No | Invoice #, etc. |
| Direction (in/out) | Yes | in = income, out = expense |
| Gross Amount | Yes | Amount including tax |
| Tax Rate Name | No | Must match Tax Rates sheet |
| Category Code(s) | No | Semicolon-separated |
| Special Type | No | See below |
| Allocation Amount(s) | No | Semicolon-separated |
| Is Reconciled | No | yes/no |

**Special Types** (for balance sheet items):
- `capital` - Owner capital injection
- `loan_in` - Loan received
- `loan_repayment` - Loan payment
- `transfer_in` - Transfer between accounts (incoming)
- `transfer_out` - Transfer between accounts (outgoing)
- `asset_purchase` - Fixed asset purchase
- `tax_payment` - Tax paid to authorities
- `drawings` - Owner drawings
- `income_tax` - Income tax payment
- `payroll_tax` - Payroll tax payment

### Import Process

```bash
# Upload Excel file via API
curl -X POST \
  -F "file=@Accounting-Excel-Template.xlsx" \
  http://localhost:8000/import/excel

# Or with business ID to update existing
curl -X POST \
  -F "file=@Accounting-Excel-Template.xlsx" \
  "http://localhost:8000/import/excel?business_id=1"
```

### Import Limits
- Maximum 1,000 accounts
- Maximum 1,000 categories
- Maximum 1,000 tax rates
- Maximum 10,000 transactions per month sheet

## CSV Export

All reports support CSV export by adding `?format=csv`:

```bash
# P&L Report CSV
curl "http://localhost:8000/reports/pl?business_id=1&year=2024&format=csv" \
  -o pl_report_2024.csv

# Balance Sheet CSV
curl "http://localhost:8000/reports/balance-sheet?business_id=1&year=2024&format=csv" \
  -o balance_sheet_2024.csv

# Tax Report CSV
curl "http://localhost:8000/reports/tax?business_id=1&year=2024&format=csv" \
  -o tax_report_2024.csv
```

## Deployment

### Production Deployment to CWN-CPU

```bash
# SSH to target server
ssh user@cwn-cpu

# Create directory
sudo mkdir -p /opt/coown/accounting-tool
sudo chown $USER:$USER /opt/coown/accounting-tool

# Clone repository
cd /opt/coown/accounting-tool
git clone <repository-url> .

# Start services
cd 10-mvp
docker-compose up -d

# Verify services are running
docker-compose ps
docker-compose logs -f
```

### Backup

```bash
# Backup SQLite database
docker cp accounting-backend:/data/accounting.db ./backup-$(date +%Y%m%d).db

# Or backup the entire volume
docker run --rm -v accounting-data:/data -v $(pwd):/backup alpine tar czf /backup/accounting-backup.tar.gz -C /data .
```

### Update

```bash
cd /opt/coown/accounting-tool/10-mvp

# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Data Model

### Business
- `name`: Company name
- `fiscal_year_start_month`: 1-12
- `currency`: ISO code (default: CHF)

### Account
- `name`: Display name
- `type`: bank, credit_card, asset
- `opening_balance`: Starting balance

### Transaction
- `date`: Transaction date
- `payee`: Counterparty
- `description`: Notes
- `reference`: Invoice/reference number
- `direction`: in (income) or out (expense)
- `gross_amount`: Amount including tax
- `tax_amount`: Calculated tax
- `net_amount`: Amount excluding tax

### Transaction Line (Allocations)
- Links transactions to categories
- Supports split transactions (multiple categories)
- Special types for balance sheet items

## Development

### Running Tests

```bash
cd backend
pytest -v
```

### Database Migrations

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection | `sqlite:///./accounting.db` |
| `ALLOWED_ORIGINS` | CORS origins | `*` |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
│                 (React + TypeScript)                    │
│                      Port 80                            │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      Backend                            │
│              (FastAPI + SQLAlchemy 2.0)                 │
│                     Port 8000                           │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    SQLite Database                      │
│                  (/data/accounting.db)                  │
└─────────────────────────────────────────────────────────┘
```

## License

Proprietary - All rights reserved.

## Support

For support, please contact your system administrator.
