"""
Validation Services - Transfer Validation and Error Highlighting
"""
from datetime import date
from decimal import Decimal
from typing import Dict, List, Optional, Any
from enum import Enum as PyEnum

from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.models import (
    Business,
    Account,
    Category,
    Transaction,
    TransactionLine,
    TaxRate,
    AccountType,
    CategoryType,
    TransactionDirection,
    SpecialType,
)


# ============================================================================
# Enums for Validation
# ============================================================================

class ValidationSeverity(str, PyEnum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ValidationErrorType(str, PyEnum):
    MISSING_ALLOCATION = "missing_allocation"
    ALLOCATION_MISMATCH = "allocation_mismatch"
    UNBALANCED_TRANSFER = "unbalanced_transfer"
    MISSING_TAX_RATE = "missing_tax_rate"
    UNRECONCILED_TRANSACTION = "unreconciled_transaction"


# ============================================================================
# Interbank Transfer Validation Service
# ============================================================================

class TransferValidationService:
    """
    Interbank Transfer Validation Service.
    
    For each month: SUM(transfers OUT) - SUM(transfers IN) = 0
    If not balanced, flag as error with the difference amount.
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def validate_transfers(
        self,
        business_id: int,
        year: int,
        month: Optional[int] = None,
    ) -> Dict:
        """
        Validate interbank transfers for a business.
        
        Args:
            business_id: The business to validate
            year: The year to validate
            month: Optional specific month (1-12). If None, validates all months.
        
        Returns:
            Dictionary with validation results per month
        """
        months_to_check = [month] if month else list(range(1, 13))
        
        results = {
            "business_id": business_id,
            "year": year,
            "months": {},
            "all_balanced": True,
            "unbalanced_months": [],
        }
        
        for m in months_to_check:
            month_result = self._validate_month(business_id, year, m)
            results["months"][m] = month_result
            
            if not month_result["is_balanced"]:
                results["all_balanced"] = False
                results["unbalanced_months"].append(m)
        
        return results
    
    def _validate_month(self, business_id: int, year: int, month: int) -> Dict:
        """Validate transfers for a single month."""
        
        # Get date range
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year, 12, 31)
        else:
            end_date = date(year, month + 1, 1)
        
        # Query transfer lines
        transfer_lines = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date >= start_date,
            Transaction.date < end_date if month != 12 else Transaction.date <= end_date,
            TransactionLine.special_type.in_([SpecialType.TRANSFER_IN, SpecialType.TRANSFER_OUT]),
        ).all()
        
        # Calculate totals
        total_out = Decimal("0.00")
        total_in = Decimal("0.00")
        
        transfers_out = []
        transfers_in = []
        
        for line in transfer_lines:
            if line.special_type == SpecialType.TRANSFER_OUT:
                total_out += line.amount
                transfers_out.append({
                    "transaction_id": line.transaction_id,
                    "line_id": line.id,
                    "amount": line.amount,
                })
            elif line.special_type == SpecialType.TRANSFER_IN:
                total_in += line.amount
                transfers_in.append({
                    "transaction_id": line.transaction_id,
                    "line_id": line.id,
                    "amount": line.amount,
                })
        
        # Calculate difference
        difference = total_out - total_in
        is_balanced = difference == 0
        
        return {
            "month": month,
            "is_balanced": is_balanced,
            "total_transfers_out": total_out,
            "total_transfers_in": total_in,
            "difference": difference,
            "transfers_out_count": len(transfers_out),
            "transfers_in_count": len(transfers_in),
            "transfers_out": transfers_out,
            "transfers_in": transfers_in,
        }


# ============================================================================
# Error Highlighting Service
# ============================================================================

class ErrorHighlightingService:
    """
    Error Highlighting Service.
    
    Scans transactions for various validation errors and returns
    a list of errors with transaction IDs, error types, and severity.
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def validate_transactions(
        self,
        business_id: int,
        year: Optional[int] = None,
        month: Optional[int] = None,
    ) -> Dict:
        """
        Validate all transactions for a business and return errors.
        
        Args:
            business_id: The business to validate
            year: Optional year filter
            month: Optional month filter (requires year)
        
        Returns:
            Dictionary with list of validation errors
        """
        # Build base query
        query = self.db.query(Transaction).join(Account).filter(
            Account.business_id == business_id,
        )
        
        if year:
            query = query.filter(extract('year', Transaction.date) == year)
        if month and year:
            query = query.filter(extract('month', Transaction.date) == month)
        
        transactions = query.all()
        
        errors = []
        warnings = []
        
        for txn in transactions:
            # Check for missing allocations
            missing_alloc = self._check_missing_allocation(txn)
            if missing_alloc:
                errors.append(missing_alloc)
            
            # Check for allocation mismatch
            alloc_mismatch = self._check_allocation_mismatch(txn)
            if alloc_mismatch:
                errors.append(alloc_mismatch)
            
            # Check for transfer issues
            transfer_issue = self._check_transfer_balance(txn)
            if transfer_issue:
                warnings.append(transfer_issue)
            
            # Check for unreconciled old transactions
            unreconciled = self._check_unreconciled_transaction(txn)
            if unreconciled:
                warnings.append(unreconciled)
        
        return {
            "business_id": business_id,
            "year": year,
            "month": month,
            "total_transactions_checked": len(transactions),
            "error_count": len(errors),
            "warning_count": len(warnings),
            "errors": errors,
            "warnings": warnings,
        }
    
    def _check_missing_allocation(self, txn: Transaction) -> Optional[Dict]:
        """Check if transaction has no allocation lines."""
        if not txn.lines or len(txn.lines) == 0:
            return {
                "transaction_id": txn.id,
                "account_id": txn.account_id,
                "date": txn.date.isoformat(),
                "gross_amount": str(txn.gross_amount),
                "error_type": ValidationErrorType.MISSING_ALLOCATION,
                "severity": ValidationSeverity.ERROR,
                "message": "Transaction has no allocation lines",
            }
        return None
    
    def _check_allocation_mismatch(self, txn: Transaction) -> Optional[Dict]:
        """Check if allocations sum doesn't match net amount."""
        if not txn.lines:
            return None
        
        total_allocated = sum(line.amount for line in txn.lines)
        expected_amount = txn.net_amount if txn.net_amount else txn.gross_amount - txn.tax_amount
        
        if abs(total_allocated - expected_amount) > Decimal("0.01"):
            return {
                "transaction_id": txn.id,
                "account_id": txn.account_id,
                "date": txn.date.isoformat(),
                "gross_amount": str(txn.gross_amount),
                "expected_net": str(expected_amount),
                "allocated_total": str(total_allocated),
                "difference": str(abs(total_allocated - expected_amount)),
                "error_type": ValidationErrorType.ALLOCATION_MISMATCH,
                "severity": ValidationSeverity.ERROR,
                "message": f"Allocations sum ({total_allocated}) doesn't match expected net amount ({expected_amount})",
            }
        return None
    
    def _check_transfer_balance(self, txn: Transaction) -> Optional[Dict]:
        """Check if transaction is a standalone transfer without matching counterpart."""
        # This is a simplified check - in production, you'd want to cross-reference
        # with the transfer validation service
        transfer_lines = [line for line in txn.lines if line.special_type in 
                         [SpecialType.TRANSFER_IN, SpecialType.TRANSFER_OUT]]
        
        if transfer_lines and len(transfer_lines) == len(txn.lines):
            # This transaction is entirely a transfer - flag as needing verification
            return {
                "transaction_id": txn.id,
                "account_id": txn.account_id,
                "date": txn.date.isoformat(),
                "amount": str(txn.gross_amount),
                "transfer_type": transfer_lines[0].special_type.value,
                "error_type": ValidationErrorType.UNBALANCED_TRANSFER,
                "severity": ValidationSeverity.WARNING,
                "message": f"Transfer transaction - verify matching {('incoming' if transfer_lines[0].special_type == SpecialType.TRANSFER_OUT else 'outgoing')} transfer exists",
            }
        return None
    
    def _check_unreconciled_transaction(self, txn: Transaction) -> Optional[Dict]:
        """Check for old unreconciled transactions."""
        import datetime
        
        # Flag transactions older than 30 days that aren't reconciled
        if not txn.is_reconciled:
            days_old = (datetime.date.today() - txn.date).days
            if days_old > 30:
                return {
                    "transaction_id": txn.id,
                    "account_id": txn.account_id,
                    "date": txn.date.isoformat(),
                    "gross_amount": str(txn.gross_amount),
                    "days_unreconciled": days_old,
                    "error_type": ValidationErrorType.UNRECONCILED_TRANSACTION,
                    "severity": ValidationSeverity.WARNING,
                    "message": f"Transaction unreconciled for {days_old} days",
                }
        return None


# ============================================================================
# Validation Summary Service
# ============================================================================

class ValidationSummaryService:
    """
    Provides a comprehensive validation summary combining all validators.
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self.transfer_validator = TransferValidationService(db_session)
        self.error_highlighter = ErrorHighlightingService(db_session)
    
    def get_full_validation_report(
        self,
        business_id: int,
        year: int,
    ) -> Dict:
        """
        Get a comprehensive validation report for a business.
        
        Returns:
            Dictionary with all validation results
        """
        # Run all validations
        transfer_validation = self.transfer_validator.validate_transfers(business_id, year)
        transaction_errors = self.error_highlighter.validate_transactions(business_id, year)
        
        # Determine overall status
        has_errors = (
            transaction_errors["error_count"] > 0 or
            not transfer_validation["all_balanced"]
        )
        has_warnings = transaction_errors["warning_count"] > 0
        
        status = "valid"
        if has_errors:
            status = "invalid"
        elif has_warnings:
            status = "warnings"
        
        return {
            "business_id": business_id,
            "year": year,
            "status": status,
            "has_errors": has_errors,
            "has_warnings": has_warnings,
            "summary": {
                "total_transactions_checked": transaction_errors["total_transactions_checked"],
                "total_errors": transaction_errors["error_count"],
                "total_warnings": transaction_errors["warning_count"],
                "unbalanced_transfer_months": transfer_validation["unbalanced_months"],
            },
            "transfer_validation": transfer_validation,
            "transaction_validation": transaction_errors,
        }
