"""
Router for Excel Import endpoints.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..excel_import import ExcelImportService, ExcelImportError

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/excel", status_code=status.HTTP_200_OK)
def import_excel(
    file: UploadFile = File(..., description="Excel file to import (.xlsx format)"),
    business_id: Optional[int] = Query(None, description="Optional existing business ID to update"),
    db: Session = Depends(get_db),
):
    """
    Import accounting data from an Excel file.
    
    The Excel file should follow the Accounting-Excel-Template.xlsx format with sheets:
    - Business Config: Business name, fiscal year start, currency
    - Accounts: Bank accounts, credit cards, assets
    - Categories: Chart of accounts (head_1 through head_26)
    - Tax Rates: VAT/sales tax rates
    - Month1-12: Monthly transactions
    
    **Import Process:**
    1. If business_id is provided, updates that business; otherwise creates new
    2. Imports all accounts, categories, and tax rates
    3. Imports transactions from Month1-12 sheets
    4. Returns summary of imported data and any warnings
    
    **File Requirements:**
    - Format: .xlsx (Excel 2007+)
    - Maximum 1000 accounts, categories, tax rates each
    - Maximum 10,000 transactions per month sheet
    - Dates: YYYY-MM-DD format recommended
    - Amounts: Positive numbers for both income and expenses
    - Direction: 'in' for income/money received, 'out' for expense/money paid
    
    **Example Response:**
    ```json
    {
        "success": true,
        "business_id": 1,
        "business_name": "My Company Ltd",
        "accounts_imported": 3,
        "categories_imported": 26,
        "tax_rates_imported": 3,
        "transactions_imported": 150,
        "errors": [],
        "warnings": ["Row 5: Unknown category 'head_99'"]
    }
    ```
    """
    # Validate file type
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an .xlsx Excel file"
        )
    
    try:
        service = ExcelImportService(db)
        result = service.import_excel(file, business_id)
        
        return result
        
    except ExcelImportError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}"
        )


@router.get("/template")
def get_template_info():
    """
    Get information about the expected Excel template structure.
    
    Returns details about required sheets, columns, and data formats.
    """
    return {
        "template_name": "Accounting-Excel-Template.xlsx",
        "sheets": [
            {
                "name": "Business Config",
                "description": "Business configuration settings",
                "required": True,
                "columns": [
                    {"name": "Field", "description": "Configuration field name"},
                    {"name": "Value", "description": "Field value"},
                    {"name": "Description", "description": "Help text"},
                ]
            },
            {
                "name": "Accounts",
                "description": "Financial accounts (banks, credit cards, assets)",
                "required": True,
                "columns": [
                    {"name": "Account Name", "description": "Display name", "example": "Bank Account #1"},
                    {"name": "Type", "description": "bank, credit_card, or asset", "example": "bank"},
                    {"name": "Opening Balance", "description": "Starting balance", "example": 10000.00},
                    {"name": "Currency", "description": "ISO currency code", "example": "CHF"},
                    {"name": "Notes", "description": "Optional notes", "example": "Primary account"},
                ]
            },
            {
                "name": "Categories",
                "description": "Chart of accounts categories",
                "required": True,
                "columns": [
                    {"name": "Code", "description": "Category code", "example": "head_1"},
                    {"name": "Name", "description": "Display name", "example": "Sales Revenue"},
                    {"name": "Type", "description": "income, cogs, or expense", "example": "income"},
                    {"name": "Report", "description": "pl or bs", "example": "pl"},
                ]
            },
            {
                "name": "Tax Rates",
                "description": "VAT/sales tax configuration",
                "required": True,
                "columns": [
                    {"name": "Name", "description": "Tax rate name", "example": "VAT 8.1%"},
                    {"name": "Rate (decimal)", "description": "Rate as decimal", "example": 0.081},
                    {"name": "Description", "description": "Optional description", "example": "Standard Swiss VAT"},
                ]
            },
        ],
        "transaction_sheets": {
            "pattern": "Month1 through Month12",
            "description": "One sheet per month for transactions",
            "columns": [
                {"name": "Date (YYYY-MM-DD)", "required": True},
                {"name": "Account Name", "required": True},
                {"name": "Payee", "required": False},
                {"name": "Description", "required": False},
                {"name": "Reference", "required": False},
                {"name": "Direction (in/out)", "required": True},
                {"name": "Gross Amount", "required": True},
                {"name": "Tax Rate Name", "required": False},
                {"name": "Category Code(s)", "required": False, "note": "Semicolon-separated for splits"},
                {"name": "Special Type", "required": False, "note": "For balance sheet items"},
                {"name": "Allocation Amount(s)", "required": False, "note": "Semicolon-separated"},
                {"name": "Is Reconciled (yes/no)", "required": False},
            ],
            "special_types": [
                "capital", "loan_in", "loan_repayment", "transfer_in",
                "transfer_out", "asset_purchase", "tax_payment",
                "drawings", "income_tax", "payroll_tax"
            ]
        },
        "limits": {
            "max_accounts": 1000,
            "max_categories": 1000,
            "max_tax_rates": 1000,
            "max_transactions_per_month": 10000,
        }
    }
