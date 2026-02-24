"""
Router for Reports endpoints - P&L, Balance Sheet, and Tax Reports.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..reports import PLReportService, BalanceSheetService, TaxReportService, CSVExportService
from ..database import get_db

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/pl")
def get_pl_report(
    business_id: int = Query(..., description="Business ID"),
    year: int = Query(..., description="Fiscal year"),
    format: Optional[str] = Query("json", description="Output format: json or csv"),
    db: Session = Depends(get_db),
):
    """
    Generate Profit & Loss report for a business.
    
    Income: sum of Head 1-5
    COGS: sum of Head 6-11 + inventory adjustment
    Expenses: sum of Head 12-26
    Net Profit = Income - COGS - Expenses
    """
    service = PLReportService(db)
    report = service.generate_report(business_id, year)
    
    if format.lower() == "csv":
        csv_content = CSVExportService.export_pl_to_csv(report)
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=pl_report_{year}.csv"}
        )
    
    return report


@router.get("/balance-sheet")
def get_balance_sheet_report(
    business_id: int = Query(..., description="Business ID"),
    year: int = Query(..., description="Fiscal year"),
    format: Optional[str] = Query("json", description="Output format: json or csv"),
    db: Session = Depends(get_db),
):
    """
    Generate Balance Sheet report for a business.
    
    Assets: Bank closing balances + Inventory + Asset purchases
    Liabilities: Loans + Tax payable + Credit Card
    Equity: Capital + Retained Earnings + Net Profit - Drawings
    
    Validation: Equity must equal Net Assets
    """
    service = BalanceSheetService(db)
    report = service.generate_report(business_id, year)
    
    if format.lower() == "csv":
        csv_content = CSVExportService.export_balance_sheet_to_csv(report)
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=balance_sheet_{year}.csv"}
        )
    
    return report


@router.get("/tax")
def get_tax_report(
    business_id: int = Query(..., description="Business ID"),
    year: int = Query(..., description="Fiscal year"),
    format: Optional[str] = Query("json", description="Output format: json or csv"),
    db: Session = Depends(get_db),
):
    """
    Generate Sales Tax report for a business.
    
    Calculates:
    - Tax collected (from income transactions with tax)
    - Tax paid (from expense transactions with tax)
    - Tax payments to authorities (TAX_PAYMENT special type)
    - Net tax payable or refundable
    
    Formula: tax_collected - tax_paid - tax_payments = net_payable
    - Positive value = amount payable to authorities
    - Negative value = amount refundable from authorities
    """
    service = TaxReportService(db)
    report = service.generate_report(business_id, year)
    
    if format.lower() == "csv":
        csv_content = CSVExportService.export_tax_report_to_csv(report)
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=tax_report_{year}.csv"}
        )
    
    return report
