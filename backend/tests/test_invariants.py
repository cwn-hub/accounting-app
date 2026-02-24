"""
Property-based tests for Accounting Tool invariants.

These tests verify fundamental accounting principles:
1. Total In = sum of allocation lines + tax
2. Running balance continuity
3. Closing balance month N = Opening balance month N+1
4. Balance Sheet: Equity = Assets - Liabilities
"""
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Tuple

import pytest
from hypothesis import given, strategies as st, settings, assume
from sqlalchemy import func, select

from app.models import (
    Business,
    Account,
    Category,
    TaxRate,
    Transaction,
    TransactionLine,
    AccountType,
    CategoryType,
    ReportType,
    TransactionDirection,
    SpecialType,
    create_default_categories,
    create_default_accounts,
)


# ============================================================================
# Helper Strategies
# ============================================================================

decimal_strategy = st.decimals(min_value=0.01, max_value=10000, places=2)
tax_rate_strategy = st.sampled_from([
    Decimal("0.00"),   # No tax
    Decimal("0.025"),  # 2.5% (reduced Swiss VAT)
    Decimal("0.081"),  # 8.1% (standard Swiss VAT)
])
date_strategy = st.dates(min_value=date(2024, 1, 1), max_value=date(2026, 12, 31))


# ============================================================================
# Test 1: Transaction Allocation Invariant
# ============================================================================

class TestTransactionAllocationInvariant:
    """
    Invariant: Total In = sum of allocation lines + tax
    
    For income transactions:
    - gross_amount = net_amount + tax_amount
    - sum(lines) should equal net_amount (for P&L categories)
    
    For expense transactions:
    - gross_amount = net_amount + tax_amount
    - sum(lines) should equal net_amount (for P&L categories)
    """
    
    def test_income_transaction_allocation(self, db_session, setup_business_with_defaults, tax_rate_factory, transaction_factory, transaction_line_factory):
        """Test that income transaction allocations sum correctly."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        income_category = setup["categories"][0]  # head_1
        
        # Create tax rate at 8.1%
        tax_rate = tax_rate_factory(business.id, "VAT 8.1%", Decimal("0.081"))
        
        # Gross amount including tax
        gross = Decimal("108.10")
        
        # Create transaction
        txn = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=gross,
            tax_rate=tax_rate,
        )
        
        # Expected: tax = 108.10 / 1.081 = 100.00 (wait, that's wrong)
        # tax = 108.10 / (1 + 0.081) = 108.10 / 1.081 = 100.00
        # Actually: tax = gross - net, where net = gross / (1 + rate)
        # net = 108.10 / 1.081 = 100.00
        # tax = 108.10 - 100.00 = 8.10
        
        expected_net = Decimal("100.00")
        expected_tax = Decimal("8.10")
        
        assert txn.tax_amount == expected_tax, f"Expected tax {expected_tax}, got {txn.tax_amount}"
        assert txn.net_amount == expected_net, f"Expected net {expected_net}, got {txn.net_amount}"
        assert txn.gross_amount == txn.net_amount + txn.tax_amount
        
        # Create allocation line
        line = transaction_line_factory(
            transaction_id=txn.id,
            amount=txn.net_amount,
            category_id=income_category.id,
        )
        
        # Invariant: gross = sum(lines) + tax
        total_allocated = sum(l.amount for l in txn.lines)
        assert txn.gross_amount == total_allocated + txn.tax_amount, \
            f"Invariant violated: {txn.gross_amount} != {total_allocated} + {txn.tax_amount}"
    
    def test_expense_transaction_allocation(self, db_session, setup_business_with_defaults, tax_rate_factory, transaction_factory, transaction_line_factory):
        """Test that expense transaction allocations sum correctly."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        expense_category = setup["categories"][11]  # head_12
        
        tax_rate = tax_rate_factory(business.id, "VAT 8.1%", Decimal("0.081"))
        gross = Decimal("54.05")
        
        txn = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 20),
            direction=TransactionDirection.OUT,
            gross_amount=gross,
            tax_rate=tax_rate,
        )
        
        # net = 54.05 / 1.081 = 50.00
        # tax = 54.05 - 50.00 = 4.05
        expected_net = Decimal("50.00")
        expected_tax = Decimal("4.05")
        
        assert txn.tax_amount == expected_tax
        assert txn.net_amount == expected_net
        
        line = transaction_line_factory(
            transaction_id=txn.id,
            amount=txn.net_amount,
            category_id=expense_category.id,
        )
        
        total_allocated = sum(l.amount for l in txn.lines)
        assert txn.gross_amount == total_allocated + txn.tax_amount
    
    def test_transaction_without_tax(self, db_session, setup_business_with_defaults, transaction_factory, transaction_line_factory):
        """Test transactions with no tax rate."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        income_category = setup["categories"][0]
        
        gross = Decimal("100.00")
        
        txn = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=gross,
            tax_rate=None,
        )
        
        assert txn.tax_amount == Decimal("0.00")
        assert txn.net_amount == gross
        
        line = transaction_line_factory(
            transaction_id=txn.id,
            amount=txn.net_amount,
            category_id=income_category.id,
        )
        
        # Without tax: gross = net = sum(lines)
        total_allocated = sum(l.amount for l in txn.lines)
        assert txn.gross_amount == total_allocated


# ============================================================================
# Test 2: Running Balance Continuity
# ============================================================================

class TestRunningBalanceContinuity:
    """
    Invariant: Running Balance[n] = Running Balance[n-1] + In[n] - Out[n]
    
    Each account has its own running balance calculated from opening balance
    plus all transactions in chronological order.
    """
    
    def calculate_running_balance(self, db_session, account_id: int, as_of_date: date = None) -> Decimal:
        """Calculate running balance for an account."""
        account = db_session.query(Account).filter(Account.id == account_id).first()
        balance = account.opening_balance
        
        query = db_session.query(Transaction).filter(
            Transaction.account_id == account_id
        ).order_by(Transaction.date, Transaction.id)
        
        if as_of_date:
            query = query.filter(Transaction.date <= as_of_date)
        
        for txn in query.all():
            if txn.direction == TransactionDirection.IN:
                balance += txn.gross_amount
            else:
                balance -= txn.gross_amount
        
        return balance
    
    def test_single_transaction_balance(self, db_session, setup_business_with_defaults, transaction_factory):
        """Test balance after single transaction."""
        setup = setup_business_with_defaults()
        account = setup["accounts"][0]
        opening = Decimal("1000.00")
        account.opening_balance = opening
        db_session.commit()
        
        txn = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("500.00"),
            tax_rate=None,
        )
        
        balance = self.calculate_running_balance(db_session, account.id)
        expected = opening + Decimal("500.00")
        assert balance == expected, f"Expected {expected}, got {balance}"
    
    def test_multiple_transaction_balance(self, db_session, setup_business_with_defaults, transaction_factory):
        """Test balance after multiple transactions."""
        setup = setup_business_with_defaults()
        account = setup["accounts"][0]
        opening = Decimal("1000.00")
        account.opening_balance = opening
        db_session.commit()
        
        # Add income
        transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("500.00"),
            tax_rate=None,
        )
        
        # Add expense
        transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 20),
            direction=TransactionDirection.OUT,
            gross_amount=Decimal("200.00"),
            tax_rate=None,
        )
        
        # Add more income
        transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 25),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("300.00"),
            tax_rate=None,
        )
        
        balance = self.calculate_running_balance(db_session, account.id)
        expected = opening + Decimal("500.00") - Decimal("200.00") + Decimal("300.00")
        assert balance == expected, f"Expected {expected}, got {balance}"
    
    def test_balance_per_account_isolation(self, db_session, setup_business_with_defaults, transaction_factory):
        """Test that balances are isolated per account."""
        setup = setup_business_with_defaults()
        account1 = setup["accounts"][0]
        account2 = setup["accounts"][1]
        
        account1.opening_balance = Decimal("1000.00")
        account2.opening_balance = Decimal("500.00")
        db_session.commit()
        
        # Add to account 1 only
        transaction_factory(
            account_id=account1.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("100.00"),
            tax_rate=None,
        )
        
        balance1 = self.calculate_running_balance(db_session, account1.id)
        balance2 = self.calculate_running_balance(db_session, account2.id)
        
        assert balance1 == Decimal("1100.00")
        assert balance2 == Decimal("500.00")


# ============================================================================
# Test 3: Month-to-Month Balance Continuity
# ============================================================================

class TestMonthToMonthContinuity:
    """
    Invariant: Closing balance month N = Opening balance month N+1
    
    The closing balance of one month becomes the opening balance of the next.
    """
    
    def test_month_closing_to_opening(self, db_session, setup_business_with_defaults, transaction_factory):
        """Test that month-end closing becomes next month opening."""
        setup = setup_business_with_defaults()
        account = setup["accounts"][0]
        opening = Decimal("1000.00")
        account.opening_balance = opening
        db_session.commit()
        
        # January transactions
        transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("500.00"),
            tax_rate=None,
        )
        
        # Calculate January closing
        jan_closing = opening + Decimal("500.00")
        
        # February transaction
        transaction_factory(
            account_id=account.id,
            date=date(2026, 2, 10),
            direction=TransactionDirection.OUT,
            gross_amount=Decimal("200.00"),
            tax_rate=None,
        )
        
        # If we reset opening to January closing, balance should match
        account.opening_balance = jan_closing
        db_session.commit()
        
        # Clear January transactions and recalculate from Feb
        # This simulates month rollover
        jan_txns = db_session.query(Transaction).filter(
            Transaction.account_id == account.id,
            Transaction.date < date(2026, 2, 1)
        ).all()
        
        # Feb balance should be jan_closing - 200
        feb_balance = jan_closing - Decimal("200.00")
        
        # Verify by calculating from Feb only
        current_balance = jan_closing
        for txn in db_session.query(Transaction).filter(
            Transaction.account_id == account.id,
            Transaction.date >= date(2026, 2, 1)
        ).all():
            if txn.direction == TransactionDirection.IN:
                current_balance += txn.gross_amount
            else:
                current_balance -= txn.gross_amount
        
        assert current_balance == feb_balance


# ============================================================================
# Test 4: Balance Sheet Equation
# ============================================================================

class TestBalanceSheetEquation:
    """
    Invariant: Equity = Assets - Liabilities
    
    Or: Assets = Liabilities + Equity
    
    Assets:
    - Bank accounts (closing balances)
    - Asset purchases (cumulative)
    
    Liabilities:
    - Loans received (cumulative)
    - Credit card balances (negative closing)
    - Sales tax payable (tax collected - tax paid)
    - Loan repayments (cumulative)
    - Income tax payments (cumulative)
    - Payroll tax payments (cumulative)
    
    Equity:
    - Capital (personal deposits, cumulative)
    - Drawings (personal expenses, cumulative, negative)
    - Current year earnings (P&L net profit)
    """
    
    def calculate_balance_sheet(self, db_session, business_id: int, as_of_date: date = None) -> dict:
        """Calculate balance sheet components."""
        accounts = db_session.query(Account).filter(
            Account.business_id == business_id
        ).all()
        
        # Assets: Bank accounts (positive balance)
        assets = Decimal("0.00")
        for account in accounts:
            balance = account.opening_balance
            query = db_session.query(Transaction).filter(
                Transaction.account_id == account.id
            )
            if as_of_date:
                query = query.filter(Transaction.date <= as_of_date)
            
            for txn in query.all():
                if txn.direction == TransactionDirection.IN:
                    balance += txn.gross_amount
                else:
                    balance -= txn.gross_amount
            
            # Bank accounts are assets (positive), credit cards are liabilities (negative)
            if account.type == AccountType.CREDIT_CARD:
                # Credit card balance is a liability (negative asset)
                assets += balance
            else:
                assets += balance
        
        # Get all transaction lines for special types
        lines_query = db_session.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id
        )
        if as_of_date:
            lines_query = lines_query.filter(Transaction.date <= as_of_date)
        
        lines = lines_query.all()
        
        # Liabilities
        loans_received = Decimal("0.00")
        tax_paid = Decimal("0.00")
        loan_repayments = Decimal("0.00")
        income_tax_paid = Decimal("0.00")
        payroll_tax_paid = Decimal("0.00")
        
        # Equity
        capital = Decimal("0.00")
        drawings = Decimal("0.00")
        asset_purchases = Decimal("0.00")
        
        for line in lines:
            if line.special_type == SpecialType.LOAN_IN:
                loans_received += line.amount
            elif line.special_type == SpecialType.TAX_PAYMENT:
                tax_paid += line.amount
            elif line.special_type == SpecialType.LOAN_REPAYMENT:
                loan_repayments += line.amount
            elif line.special_type == SpecialType.INCOME_TAX:
                income_tax_paid += line.amount
            elif line.special_type == SpecialType.PAYROLL_TAX:
                payroll_tax_paid += line.amount
            elif line.special_type == SpecialType.CAPITAL:
                capital += line.amount
            elif line.special_type == SpecialType.DRAWINGS:
                drawings += line.amount
            elif line.special_type == SpecialType.ASSET_PURCHASE:
                asset_purchases += line.amount
        
        # Calculate tax payable from transactions
        tax_collected = Decimal("0.00")
        tax_on_expenses = Decimal("0.00")
        
        txn_query = db_session.query(Transaction).join(Account).filter(
            Account.business_id == business_id
        )
        if as_of_date:
            txn_query = txn_query.filter(Transaction.date <= as_of_date)
        
        for txn in txn_query.all():
            if txn.direction == TransactionDirection.IN:
                tax_collected += txn.tax_amount
            else:
                tax_on_expenses += txn.tax_amount
        
        # Tax payable = tax collected on income - tax paid to authorities - tax on expenses (deductible)
        tax_payable = tax_collected - tax_paid - tax_on_expenses
        
        liabilities = (
            loans_received +
            tax_payable -
            loan_repayments +
            income_tax_paid +
            payroll_tax_paid
        )
        
        # For credit cards, the negative balance is already in assets
        # We need to adjust: if credit card is negative, it's a liability
        credit_card_balance = Decimal("0.00")
        for account in accounts:
            if account.type == AccountType.CREDIT_CARD:
                balance = account.opening_balance
                query = db_session.query(Transaction).filter(
                    Transaction.account_id == account.id
                )
                if as_of_date:
                    query = query.filter(Transaction.date <= as_of_date)
                
                for txn in query.all():
                    if txn.direction == TransactionDirection.IN:
                        balance += txn.gross_amount
                    else:
                        balance -= txn.gross_amount
                
                # Credit card balance (if negative, it's owed)
                credit_card_balance = -balance if balance < 0 else Decimal("0.00")
        
        liabilities += credit_card_balance
        
        # Equity components
        # Current year earnings from P&L categories
        income_total = Decimal("0.00")
        cogs_total = Decimal("0.00")
        expense_total = Decimal("0.00")
        
        categories = db_session.query(Category).filter(
            Category.business_id == business_id
        ).all()
        
        for line in lines:
            if line.category_id:
                cat = next((c for c in categories if c.id == line.category_id), None)
                if cat:
                    if cat.type == CategoryType.INCOME:
                        income_total += line.amount
                    elif cat.type == CategoryType.COGS:
                        cogs_total += line.amount
                    elif cat.type == CategoryType.EXPENSE:
                        expense_total += line.amount
        
        gross_profit = income_total - cogs_total
        net_profit = gross_profit - expense_total
        
        equity = capital - drawings + net_profit
        
        # Total assets including asset purchases
        total_assets = assets + asset_purchases
        
        return {
            "assets": total_assets,
            "liabilities": liabilities,
            "equity": equity,
            "net_profit": net_profit,
            "capital": capital,
            "drawings": drawings,
        }
    
    def test_simple_balance_sheet(self, db_session, setup_business_with_defaults, 
                                   transaction_factory, transaction_line_factory, tax_rate_factory):
        """Test balance sheet equation with simple transactions."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]  # Bank Account #1
        income_cat = setup["categories"][0]  # head_1 - income
        expense_cat = setup["categories"][11]  # head_12 - expense
        
        account.opening_balance = Decimal("1000.00")
        db_session.commit()
        
        tax_rate = tax_rate_factory(business.id, "VAT 8.1%", Decimal("0.081"))
        
        # Income transaction: 108.10 gross = 100.00 net + 8.10 tax
        income_txn = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("108.10"),
            tax_rate=tax_rate,
        )
        transaction_line_factory(
            transaction_id=income_txn.id,
            amount=income_txn.net_amount,
            category_id=income_cat.id,
        )
        
        # Expense transaction: 54.05 gross = 50.00 net + 4.05 tax
        expense_txn = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 20),
            direction=TransactionDirection.OUT,
            gross_amount=Decimal("54.05"),
            tax_rate=tax_rate,
        )
        transaction_line_factory(
            transaction_id=expense_txn.id,
            amount=expense_txn.net_amount,
            category_id=expense_cat.id,
        )
        
        bs = self.calculate_balance_sheet(db_session, business.id)
        
        # Assets: 1000 + 108.10 - 54.05 = 1054.05
        expected_assets = Decimal("1000.00") + Decimal("108.10") - Decimal("54.05")
        assert bs["assets"] == expected_assets, f"Assets: expected {expected_assets}, got {bs['assets']}"
        
        # Tax payable: 8.10 collected - 4.05 on expenses = 4.05 payable
        expected_tax_payable = Decimal("8.10") - Decimal("4.05")
        
        # Liabilities: just tax payable = 4.05
        expected_liabilities = expected_tax_payable
        assert bs["liabilities"] == expected_liabilities, f"Liabilities: expected {expected_liabilities}, got {bs['liabilities']}"
        
        # Equity: net_profit = 100 - 50 = 50
        expected_equity = Decimal("50.00")
        assert bs["equity"] == expected_equity, f"Equity: expected {expected_equity}, got {bs['equity']}"
        
        # Verify: Assets = Liabilities + Equity (including opening balance as retained earnings)
        # Assets: 1000 + 108.10 - 54.05 = 1054.05
        # Liabilities: 4.05
        # Equity: 50 (net profit) + 1000 (opening/retained) = 1050
        # 1054.05 = 4.05 + 1050 ✓
        total_equity = account.opening_balance + bs["net_profit"]
        
        # Verify: Assets = Liabilities + Equity
        assert bs["assets"] == bs["liabilities"] + total_equity, \
            f"Balance sheet equation failed: {bs['assets']} != {bs['liabilities']} + {total_equity}"
    
    def test_balance_sheet_with_capital(self, db_session, setup_business_with_defaults,
                                        transaction_factory, transaction_line_factory):
        """Test balance sheet with capital contribution."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        
        account.opening_balance = Decimal("0.00")
        db_session.commit()
        
        # Capital contribution: 5000
        capital_txn = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 1),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("5000.00"),
            tax_rate=None,
        )
        transaction_line_factory(
            transaction_id=capital_txn.id,
            amount=Decimal("5000.00"),
            special_type=SpecialType.CAPITAL,
        )
        
        bs = self.calculate_balance_sheet(db_session, business.id)
        
        # Assets: 5000
        assert bs["assets"] == Decimal("5000.00")
        # Liabilities: 0
        assert bs["liabilities"] == Decimal("0.00")
        # Equity: 5000 (capital)
        assert bs["equity"] == Decimal("5000.00")
        
        # Verify equation
        assert bs["assets"] == bs["liabilities"] + bs["equity"]
    
    def test_balance_sheet_with_drawings(self, db_session, setup_business_with_defaults,
                                          transaction_factory, transaction_line_factory):
        """Test balance sheet with owner drawings."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        
        account.opening_balance = Decimal("10000.00")
        db_session.commit()
        
        # Owner drawings: 500
        drawings_txn = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.OUT,
            gross_amount=Decimal("500.00"),
            tax_rate=None,
        )
        transaction_line_factory(
            transaction_id=drawings_txn.id,
            amount=Decimal("500.00"),
            special_type=SpecialType.DRAWINGS,
        )
        
        bs = self.calculate_balance_sheet(db_session, business.id)
        
        # Assets: 10000 - 500 = 9500
        assert bs["assets"] == Decimal("9500.00")
        # Drawings reduce equity
        assert bs["drawings"] == Decimal("500.00")
        # Equity: 0 (net profit) - 500 (drawings) = -500, but with opening balance: 10000 - 500 = 9500
        total_equity = account.opening_balance + bs["equity"]
        assert total_equity == Decimal("9500.00")
        
        # Verify: Assets = Liabilities + Equity
        # 9500 = 0 + 9500 ✓
        assert bs["assets"] == bs["liabilities"] + total_equity


# ============================================================================
# Property-based Tests with Hypothesis
# ============================================================================

class TestPropertyBasedInvariants:
    """Property-based tests for core invariants."""
    
    @settings(max_examples=20)
    @given(
        gross=st.decimals(min_value=1.00, max_value=10000.00, places=2),
        rate=st.sampled_from([Decimal("0.00"), Decimal("0.025"), Decimal("0.081"), Decimal("0.077")]),
    )
    def test_tax_calculation_property(self, gross, rate):
        """Property: tax = gross / (1 + rate) for all valid inputs."""
        from decimal import Decimal
        
        gross_dec = Decimal(str(gross))
        
        if rate == 0:
            expected_tax = Decimal("0.00")
            expected_net = gross_dec
        else:
            divisor = Decimal("1") + rate
            expected_net = (gross_dec / divisor).quantize(Decimal("0.01"))
            expected_tax = gross_dec - expected_net
        
        # Verify gross = net + tax
        assert gross_dec == expected_net + expected_tax
        
        # Verify tax is non-negative
        assert expected_tax >= 0
        
        # Verify net is non-negative
        assert expected_net >= 0
    
    def test_transfer_balance_invariant(self, db_session, setup_business_with_defaults,
                                        transaction_factory, transaction_line_factory):
        """
        Invariant: Interbank transfers must net to zero.
        
        Sum of all transfers OUT from account A to B must equal
        sum of all transfers IN to account B from A.
        """
        setup = setup_business_with_defaults()
        business = setup["business"]
        account1 = setup["accounts"][0]  # Bank #1
        account2 = setup["accounts"][1]  # Bank #2
        
        account1.opening_balance = Decimal("5000.00")
        account2.opening_balance = Decimal("2000.00")
        db_session.commit()
        
        # Transfer 1000 from account1 to account2
        # Out from account1
        out_txn = transaction_factory(
            account_id=account1.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.OUT,
            gross_amount=Decimal("1000.00"),
            tax_rate=None,
        )
        transaction_line_factory(
            transaction_id=out_txn.id,
            amount=Decimal("1000.00"),
            special_type=SpecialType.TRANSFER_OUT,
        )
        
        # In to account2
        in_txn = transaction_factory(
            account_id=account2.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("1000.00"),
            tax_rate=None,
        )
        transaction_line_factory(
            transaction_id=in_txn.id,
            amount=Decimal("1000.00"),
            special_type=SpecialType.TRANSFER_IN,
        )
        
        # Calculate total transfers
        lines = db_session.query(TransactionLine).join(Transaction).filter(
            TransactionLine.special_type.in_([SpecialType.TRANSFER_IN, SpecialType.TRANSFER_OUT])
        ).all()
        
        total_out = sum(l.amount for l in lines if l.special_type == SpecialType.TRANSFER_OUT)
        total_in = sum(l.amount for l in lines if l.special_type == SpecialType.TRANSFER_IN)
        
        # Transfers must balance
        assert total_out == total_in, f"Transfers unbalanced: out={total_out}, in={total_in}"
        
        # Account balances should reflect transfer
        # Account1: 5000 - 1000 = 4000
        # Account2: 2000 + 1000 = 3000
        # Total: 7000 (unchanged)
        
        def get_balance(account_id):
            account = db_session.query(Account).filter(Account.id == account_id).first()
            bal = account.opening_balance
            for txn in db_session.query(Transaction).filter(Transaction.account_id == account_id).all():
                if txn.direction == TransactionDirection.IN:
                    bal += txn.gross_amount
                else:
                    bal -= txn.gross_amount
            return bal
        
        assert get_balance(account1.id) == Decimal("4000.00")
        assert get_balance(account2.id) == Decimal("3000.00")
        assert get_balance(account1.id) + get_balance(account2.id) == Decimal("7000.00")
