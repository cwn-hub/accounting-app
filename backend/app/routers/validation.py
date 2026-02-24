"""
Router for Validation endpoints - Transfer Validation and Error Highlighting.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..validation import (
    TransferValidationService,
    ErrorHighlightingService,
    ValidationSummaryService,
)
from ..database import get_db

router = APIRouter(prefix="/validation", tags=["validation"])


@router.get("/transfers")
def validate_transfers(
    business_id: int = Query(..., description="Business ID"),
    year: int = Query(..., description="Year to validate"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Optional specific month (1-12)"),
    db: Session = Depends(get_db),
):
    """
    Validate interbank transfers for a business.
    
    For each month, verifies that:
    SUM(transfers OUT) - SUM(transfers IN) = 0
    
    If transfers are unbalanced, the difference is flagged.
    
    Returns:
        Validation results per month with:
        - is_balanced: boolean
        - total_transfers_out: sum of outgoing transfers
        - total_transfers_in: sum of incoming transfers
        - difference: amount of imbalance (if any)
        - lists of transfer transaction IDs
    """
    service = TransferValidationService(db)
    result = service.validate_transfers(business_id, year, month)
    return result


@router.get("/transactions")
def validate_transactions(
    business_id: int = Query(..., description="Business ID"),
    year: Optional[int] = Query(None, description="Optional year filter"),
    month: Optional[int] = Query(None, ge=1, le=12, description="Optional month filter"),
    db: Session = Depends(get_db),
):
    """
    Validate transactions and return errors with transaction IDs.
    
    Checks for:
    - Missing allocations (transactions without line items)
    - Allocation mismatches (sum doesn't match expected amount)
    - Unbalanced transfers (standalone transfer transactions)
    - Unreconciled old transactions
    
    Returns:
        List of errors with:
        - transaction_id
        - error_type
        - severity (error, warning, info)
        - message
        - additional context
    """
    service = ErrorHighlightingService(db)
    result = service.validate_transactions(business_id, year, month)
    return result


@router.get("/full-report")
def get_full_validation_report(
    business_id: int = Query(..., description="Business ID"),
    year: int = Query(..., description="Year to validate"),
    db: Session = Depends(get_db),
):
    """
    Get a comprehensive validation report combining all validators.
    
    Includes:
    - Transfer validation results
    - Transaction error highlighting
    - Overall status summary
    
    Returns:
        Complete validation report with status, counts, and detailed errors.
    """
    service = ValidationSummaryService(db)
    result = service.get_full_validation_report(business_id, year)
    return result
