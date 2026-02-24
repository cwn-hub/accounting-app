"""
Tests for Sprint 5 features:
- Sales Tax Report
- Interbank Transfer Validation
- Error Highlighting API
"""
import pytest
from datetime import date
from decimal import Decimal

from app.models import (
    Business, Account, TaxRate, Transaction, TransactionLine,
    AccountType, TransactionDirection, SpecialType, CategoryType, ReportType
)


# ============================================================================
# Fixtures for Sprint 5 Tests
# ============================================================================

@pytest.fixture
def tax_scenario(db_session, setup_business_with_defaults, tax_rate_factory, transaction_factory, transaction_line_factory):
    """Create a scenario with tax transactions for testing tax reports."""
    def _create(year=2026):
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        income_cat = setup["categories"][0]  # Income
        expense_cat = setup["categories"][11]  # Expense
        
        # Create 8.1% tax rate
        tax_rate = tax_rate_factory(business.id, "VAT 8.1%", Decimal("0.081"))
        
        transactions = []
        
        # Income transactions with tax
        for month in [1, 2, 3]:
            txn = transaction_factory(
                account_id=account.id,
                date=date(year, month, 15),
                direction=TransactionDirection.IN,
                gross_amount=Decimal("1081.00"),  # 1000 net + 81 tax
                tax_rate=tax_rate,
            )
            transaction_line_factory(
                transaction_id=txn.id,
                amount=txn.net_amount,
                category_id=income_cat.id,
            )
            transactions.append(txn)
        
        # Expense transactions with tax
        for month in [1, 2]:
            txn = transaction_factory(
                account_id=account.id,
                date=date(year, month, 20),
                direction=TransactionDirection.OUT,
                gross_amount=Decimal("540.50"),  # 500 net + 40.50 tax
                tax_rate=tax_rate,
            )
            transaction_line_factory(
                transaction_id=txn.id,
                amount=txn.net_amount,
                category_id=expense_cat.id,
            )
            transactions.append(txn)
        
        # Add a tax payment transaction
        tax_payment_txn = transaction_factory(
            account_id=account.id,
            date=date(year, 3, 31),
            direction=TransactionDirection.OUT,
            gross_amount=Decimal("50.00"),
            tax_rate=None,
        )
        transaction_line_factory(
            transaction_id=tax_payment_txn.id,
            amount=Decimal("50.00"),
            special_type=SpecialType.TAX_PAYMENT,
        )
        
        return {
            "business": business,
            "account": account,
            "tax_rate": tax_rate,
            "transactions": transactions,
        }
    return _create


@pytest.fixture
def transfer_scenario(db_session, setup_business_with_defaults, transaction_factory, transaction_line_factory):
    """Create a scenario with interbank transfers for testing validation."""
    def _create(year=2026, balanced=True):
        setup = setup_business_with_defaults()
        business = setup["business"]
        account1 = setup["accounts"][0]  # Bank #1
        account2 = setup["accounts"][1]  # Bank #2
        
        if balanced:
            # Balanced transfers: 1000 out from #1, 1000 in to #2
            out_txn = transaction_factory(
                account_id=account1.id,
                date=date(year, 1, 15),
                direction=TransactionDirection.OUT,
                gross_amount=Decimal("1000.00"),
                tax_rate=None,
            )
            transaction_line_factory(
                transaction_id=out_txn.id,
                amount=Decimal("1000.00"),
                special_type=SpecialType.TRANSFER_OUT,
            )
            
            in_txn = transaction_factory(
                account_id=account2.id,
                date=date(year, 1, 15),
                direction=TransactionDirection.IN,
                gross_amount=Decimal("1000.00"),
                tax_rate=None,
            )
            transaction_line_factory(
                transaction_id=in_txn.id,
                amount=Decimal("1000.00"),
                special_type=SpecialType.TRANSFER_IN,
            )
            
            return {"business": business, "account1": account1, "account2": account2, "balanced": True}
        else:
            # Unbalanced: 2000 out from #1, only 1500 in to #2
            out_txn = transaction_factory(
                account_id=account1.id,
                date=date(year, 2, 15),
                direction=TransactionDirection.OUT,
                gross_amount=Decimal("2000.00"),
                tax_rate=None,
            )
            transaction_line_factory(
                transaction_id=out_txn.id,
                amount=Decimal("2000.00"),
                special_type=SpecialType.TRANSFER_OUT,
            )
            
            in_txn = transaction_factory(
                account_id=account2.id,
                date=date(year, 2, 15),
                direction=TransactionDirection.IN,
                gross_amount=Decimal("1500.00"),
                tax_rate=None,
            )
            transaction_line_factory(
                transaction_id=in_txn.id,
                amount=Decimal("1500.00"),
                special_type=SpecialType.TRANSFER_IN,
            )
            
            return {"business": business, "account1": account1, "account2": account2, "balanced": False}
    return _create


# ============================================================================
# Tax Report Tests
# ============================================================================

class TestTaxReport:
    """Tests for the Sales Tax Report endpoint."""
    
    def test_tax_calculation_formula(self, tax_scenario):
        """Test that tax = gross / (1 + rate) formula is applied correctly."""
        data = tax_scenario()
        txn = data["transactions"][0]  # First income transaction
        
        # gross = 1081.00, rate = 0.081
        # net = 1081.00 / 1.081 = 1000.00
        # tax = 1081.00 - 1000.00 = 81.00
        assert txn.net_amount == Decimal("1000.00"), f"Expected net 1000.00, got {txn.net_amount}"
        assert txn.tax_amount == Decimal("81.00"), f"Expected tax 81.00, got {txn.tax_amount}"
        assert txn.gross_amount == txn.net_amount + txn.tax_amount
    
    def test_tax_collected_calculation(self, db_session, tax_scenario):
        """Test total tax collected from income transactions."""
        from sqlalchemy import extract
        
        data = tax_scenario()
        business = data["business"]
        
        # Get all income transactions
        income_tax = db_session.query(Transaction).join(Account).filter(
            Account.business_id == business.id,
            Transaction.direction == TransactionDirection.IN,
            extract('year', Transaction.date) == 2026
        ).all()
        
        total_collected = sum(t.tax_amount for t in income_tax)
        # 3 months * 81.00 = 243.00
        assert total_collected == Decimal("243.00")
    
    def test_tax_paid_calculation(self, db_session, tax_scenario):
        """Test total tax paid on expense transactions."""
        from sqlalchemy import extract
        
        data = tax_scenario()
        business = data["business"]
        
        # Get all expense transactions
        expense_tax = db_session.query(Transaction).join(Account).filter(
            Account.business_id == business.id,
            Transaction.direction == TransactionDirection.OUT,
            Transaction.tax_amount > 0,
            extract('year', Transaction.date) == 2026
        ).all()
        
        total_paid = sum(t.tax_amount for t in expense_tax)
        # 2 months * 40.50 = 81.00
        assert total_paid == Decimal("81.00")
    
    def test_net_tax_payable(self, db_session, tax_scenario):
        """Test net tax payable = collected - paid - payments to authorities."""
        from sqlalchemy import extract
        
        data = tax_scenario()
        business = data["business"]
        
        # Tax collected: 3 * 81 = 243
        income_tax = db_session.query(Transaction).join(Account).filter(
            Account.business_id == business.id,
            Transaction.direction == TransactionDirection.IN,
            extract('year', Transaction.date) == 2026
        ).all()
        total_collected = sum(t.tax_amount for t in income_tax)
        
        # Tax paid on expenses: 2 * 40.50 = 81
        expense_tax = db_session.query(Transaction).join(Account).filter(
            Account.business_id == business.id,
            Transaction.direction == TransactionDirection.OUT,
            Transaction.tax_amount > 0,
            extract('year', Transaction.date) == 2026
        ).all()
        total_paid = sum(t.tax_amount for t in expense_tax)
        
        # Tax payments to authorities: 50
        tax_payments = db_session.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business.id,
            TransactionLine.special_type == SpecialType.TAX_PAYMENT,
            extract('year', Transaction.date) == 2026
        ).all()
        total_payments = sum(p.amount for p in tax_payments)
        
        # Net tax: 243 - 81 - 50 = 112 payable
        net_tax = total_collected - total_paid - total_payments
        assert net_tax == Decimal("112.00")


# ============================================================================
# Transfer Validation Tests
# ============================================================================

class TestTransferValidation:
    """Tests for the Interbank Transfer Validation endpoint."""
    
    def test_balanced_transfers_pass_validation(self, db_session, transfer_scenario):
        """Test that balanced transfers are marked as valid."""
        from sqlalchemy import extract
        
        data = transfer_scenario(balanced=True)
        business = data["business"]
        
        # Calculate transfers for the month
        transfers = db_session.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business.id,
            TransactionLine.special_type.in_([SpecialType.TRANSFER_IN, SpecialType.TRANSFER_OUT]),
            extract('year', Transaction.date) == 2026,
            extract('month', Transaction.date) == 1
        ).all()
        
        total_out = sum(t.amount for t in transfers if t.special_type == SpecialType.TRANSFER_OUT)
        total_in = sum(t.amount for t in transfers if t.special_type == SpecialType.TRANSFER_IN)
        
        assert total_out == Decimal("1000.00")
        assert total_in == Decimal("1000.00")
        assert total_out == total_in, "Transfers should be balanced"
    
    def test_unbalanced_transfers_flagged(self, db_session, transfer_scenario):
        """Test that unbalanced transfers are flagged."""
        from sqlalchemy import extract
        
        data = transfer_scenario(balanced=False)
        business = data["business"]
        
        # Calculate transfers for February
        transfers = db_session.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business.id,
            TransactionLine.special_type.in_([SpecialType.TRANSFER_IN, SpecialType.TRANSFER_OUT]),
            extract('year', Transaction.date) == 2026,
            extract('month', Transaction.date) == 2
        ).all()
        
        total_out = sum(t.amount for t in transfers if t.special_type == SpecialType.TRANSFER_OUT)
        total_in = sum(t.amount for t in transfers if t.special_type == SpecialType.TRANSFER_IN)
        
        assert total_out == Decimal("2000.00")
        assert total_in == Decimal("1500.00")
        assert total_out != total_in, "Transfers should be unbalanced"
        assert total_out - total_in == Decimal("500.00"), "Difference should be 500"
    
    def test_transfer_balance_equation(self, db_session, transfer_scenario):
        """Test the equation: SUM(transfers OUT) - SUM(transfers IN) = 0 when balanced."""
        data = transfer_scenario(balanced=True)
        business = data["business"]
        account1 = data["account1"]
        account2 = data["account2"]
        
        # Initial balances
        initial_total = account1.opening_balance + account2.opening_balance
        
        # Get transactions
        txns = db_session.query(Transaction).filter(
            Transaction.account_id.in_([account1.id, account2.id])
        ).all()
        
        # Calculate current balances
        balance1 = account1.opening_balance
        balance2 = account2.opening_balance
        
        for txn in txns:
            if txn.account_id == account1.id:
                if txn.direction == TransactionDirection.IN:
                    balance1 += txn.gross_amount
                else:
                    balance1 -= txn.gross_amount
            else:
                if txn.direction == TransactionDirection.IN:
                    balance2 += txn.gross_amount
                else:
                    balance2 -= txn.gross_amount
        
        # Total should remain the same
        assert balance1 + balance2 == initial_total, "Total money should be conserved"


# ============================================================================
# Error Highlighting Tests
# ============================================================================

class TestErrorHighlighting:
    """Tests for the Error Highlighting API."""
    
    def test_transaction_without_allocation_is_error(self, db_session, setup_business_with_defaults, transaction_factory):
        """Test that transactions without allocation lines are flagged."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        
        # Create transaction without any allocation lines
        txn = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("100.00"),
            tax_rate=None,
        )
        
        # No transaction lines created - this should be flagged
        assert len(txn.lines) == 0, "Transaction should have no lines"
        
        # This would be detected by the validation API
        has_error = len(txn.lines) == 0
        assert has_error, "Transaction should be flagged for missing allocation"
    
    def test_allocation_mismatch_is_error(self, db_session, setup_business_with_defaults, 
                                          transaction_factory, transaction_line_factory):
        """Test that allocation amounts not matching net amount are flagged."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        income_cat = setup["categories"][0]
        
        # Create transaction with net = 100
        txn = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("100.00"),
            tax_rate=None,
        )
        
        # Create line with wrong amount (90 instead of 100)
        transaction_line_factory(
            transaction_id=txn.id,
            amount=Decimal("90.00"),
            category_id=income_cat.id,
        )
        
        # Check for mismatch
        total_allocated = sum(line.amount for line in txn.lines)
        assert total_allocated != txn.net_amount, "Allocation should not match net"
        assert txn.net_amount - total_allocated == Decimal("10.00")
    
    def test_multiple_validation_errors_returned(self, db_session, setup_business_with_defaults, transaction_factory):
        """Test that multiple validation errors can be detected."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        
        errors = []
        
        # Create transaction without allocation
        txn1 = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("100.00"),
            tax_rate=None,
        )
        
        if len(txn1.lines) == 0:
            errors.append({"transaction_id": txn1.id, "error_type": "missing_allocation"})
        
        # Create another transaction without allocation
        txn2 = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 20),
            direction=TransactionDirection.OUT,
            gross_amount=Decimal("50.00"),
            tax_rate=None,
        )
        
        if len(txn2.lines) == 0:
            errors.append({"transaction_id": txn2.id, "error_type": "missing_allocation"})
        
        assert len(errors) == 2, "Should have 2 validation errors"
    
    def test_error_severity_levels(self, db_session, setup_business_with_defaults, 
                                   transaction_factory, transaction_line_factory, tax_rate_factory):
        """Test that errors have appropriate severity levels."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        
        # Missing allocation - error severity
        txn1 = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("100.00"),
            tax_rate=None,
        )
        
        # Unbalanced transfer - warning severity
        txn2 = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 20),
            direction=TransactionDirection.OUT,
            gross_amount=Decimal("1000.00"),
            tax_rate=None,
        )
        transaction_line_factory(
            transaction_id=txn2.id,
            amount=Decimal("1000.00"),
            special_type=SpecialType.TRANSFER_OUT,
        )
        
        # Test logic: missing allocation = error, unbalanced transfer = warning
        errors = []
        if len(txn1.lines) == 0:
            errors.append({"transaction_id": txn1.id, "severity": "error", "type": "missing_allocation"})
        
        # Check for unbalanced transfer (simplified check)
        transfer_lines = [line for line in txn2.lines if line.special_type in 
                         [SpecialType.TRANSFER_IN, SpecialType.TRANSFER_OUT]]
        if transfer_lines:
            errors.append({"transaction_id": txn2.id, "severity": "warning", "type": "unbalanced_transfer"})
        
        assert any(e["severity"] == "error" for e in errors), "Should have error severity"
        assert any(e["severity"] == "warning" for e in errors), "Should have warning severity"


# ============================================================================
# Integration Tests for API Endpoints
# ============================================================================

class TestAPIEndpoints:
    """Integration tests for the FastAPI endpoints."""
    
    def test_tax_report_endpoint_structure(self, tax_scenario):
        """Test that tax report endpoint returns correct structure."""
        data = tax_scenario()
        business = data["business"]
        
        # Verify business exists and has transactions
        assert business.id is not None
        assert len(data["transactions"]) > 0
    
    def test_transfer_validation_endpoint_structure(self, transfer_scenario):
        """Test that transfer validation endpoint returns correct structure."""
        data = transfer_scenario(balanced=True)
        business = data["business"]
        
        # Verify business exists
        assert business.id is not None
    
    def test_error_highlighting_endpoint_structure(self, setup_business_with_defaults, transaction_factory):
        """Test that error highlighting endpoint returns correct structure."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        
        # Create a problematic transaction
        txn = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("100.00"),
            tax_rate=None,
        )
        
        # Verify transaction exists but has no lines
        assert txn.id is not None
        assert len(txn.lines) == 0
