"""
Tests for P&L and Balance Sheet Reports.
Matches Excel calculation logic exactly.
"""
from datetime import date
from decimal import Decimal

import pytest

from app.models import (
    TransactionDirection,
    CategoryType,
    SpecialType,
)
from app.reports import PLReportService, BalanceSheetService, CSVExportService


# =============================================================================
# P&L Report Tests
# =============================================================================

class TestPLReport:
    """Tests for Profit & Loss Report."""
    
    def test_pl_report_empty_business(self, db_session, setup_business_with_defaults):
        """P&L report for business with no transactions returns zeros."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        
        service = PLReportService(db_session)
        report = service.generate_report(business.id, 2026)
        
        assert report["business_id"] == business.id
        assert report["year"] == 2026
        
        # All months should have zero values
        for month in range(1, 13):
            month_data = report["months"][month]
            assert month_data["income"]["total"] == Decimal("0.00")
            assert month_data["cogs"]["total"] == Decimal("0.00")
            assert month_data["expenses"]["total"] == Decimal("0.00")
            assert month_data["gross_profit"] == Decimal("0.00")
            assert month_data["net_profit"] == Decimal("0.00")
        
        # YTD should also be zero
        assert report["ytd"]["income"]["total"] == Decimal("0.00")
        assert report["ytd"]["net_profit"] == Decimal("0.00")
    
    def test_pl_report_income_calculation(self, db_session, sample_income_transaction):
        """Income correctly sums Head 1-5 categories."""
        data = sample_income_transaction(gross_amount=Decimal("108.10"))
        business = data["business"]
        
        # Expected: net amount = 108.10 / 1.081 = 100.00
        expected_net = Decimal("100.00")
        
        service = PLReportService(db_session)
        report = service.generate_report(business.id, 2026)
        
        # January should have the income
        jan_data = report["months"][1]
        assert jan_data["income"]["total"] == expected_net
        assert "head_1" in jan_data["income"]["by_category"]
        assert jan_data["income"]["by_category"]["head_1"] == expected_net
        
        # Other months should be zero
        for month in range(2, 13):
            assert report["months"][month]["income"]["total"] == Decimal("0.00")
        
        # YTD should match
        assert report["ytd"]["income"]["total"] == expected_net
    
    def test_pl_report_expense_calculation(self, db_session, sample_expense_transaction):
        """Expenses correctly sums Head 12-26 categories."""
        data = sample_expense_transaction(gross_amount=Decimal("54.05"))
        business = data["business"]
        
        # Expected: net amount = 54.05 / 1.081 = 50.00
        expected_net = Decimal("50.00")
        
        service = PLReportService(db_session)
        report = service.generate_report(business.id, 2026)
        
        # January should have the expense
        jan_data = report["months"][1]
        assert jan_data["expenses"]["total"] == expected_net
        assert "head_12" in jan_data["expenses"]["by_category"]
        assert jan_data["expenses"]["by_category"]["head_12"] == expected_net
        
        # YTD should match
        assert report["ytd"]["expenses"]["total"] == expected_net
    
    def test_pl_report_net_profit_calculation(
        self, db_session, setup_business_with_defaults
    ):
        """Net Profit = Income - COGS - Expenses."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        income_category = setup["categories"][0]  # head_1
        expense_category = setup["categories"][11]  # head_12
        
        from app.models import TaxRate, Transaction, TransactionLine
        
        # Create tax rate
        tax = TaxRate(
            business_id=business.id,
            name="VAT 8.1%",
            rate=Decimal("0.081"),
        )
        db_session.add(tax)
        db_session.commit()
        
        # Create income transaction: 108.10 gross = 100.00 net
        income_gross = Decimal("108.10")
        income_net = (income_gross / Decimal("1.081")).quantize(Decimal("0.01"))
        
        txn_in = Transaction(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=income_gross,
            tax_rate_id=tax.id,
            tax_amount=income_gross - income_net,
            net_amount=income_net,
        )
        db_session.add(txn_in)
        db_session.commit()
        db_session.refresh(txn_in)
        
        line_in = TransactionLine(
            transaction_id=txn_in.id,
            category_id=income_category.id,
            amount=income_net,
        )
        db_session.add(line_in)
        db_session.commit()
        
        # Create expense transaction: 54.05 gross = 50.00 net
        expense_gross = Decimal("54.05")
        expense_net = (expense_gross / Decimal("1.081")).quantize(Decimal("0.01"))
        
        txn_out = Transaction(
            account_id=account.id,
            date=date(2026, 1, 20),
            direction=TransactionDirection.OUT,
            gross_amount=expense_gross,
            tax_rate_id=tax.id,
            tax_amount=expense_gross - expense_net,
            net_amount=expense_net,
        )
        db_session.add(txn_out)
        db_session.commit()
        db_session.refresh(txn_out)
        
        line_out = TransactionLine(
            transaction_id=txn_out.id,
            category_id=expense_category.id,
            amount=expense_net,
        )
        db_session.add(line_out)
        db_session.commit()
        
        # Expected: Income 100.00 - Expenses 50.00 = Net Profit 50.00
        expected_income = income_net
        expected_expense = expense_net
        expected_net_profit = expected_income - expected_expense
        
        service = PLReportService(db_session)
        report = service.generate_report(business.id, 2026)
        
        jan_data = report["months"][1]
        assert jan_data["income"]["total"] == expected_income
        assert jan_data["expenses"]["total"] == expected_expense
        assert jan_data["net_profit"] == expected_net_profit


# =============================================================================
# Balance Sheet Tests
# =============================================================================

class TestBalanceSheet:
    """Tests for Balance Sheet Report."""
    
    def test_balance_sheet_empty_business(self, db_session, setup_business_with_defaults):
        """Balance Sheet for business with no transactions returns zeros."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        
        service = BalanceSheetService(db_session)
        report = service.generate_report(business.id, 2026)
        
        assert report["business_id"] == business.id
        assert report["year"] == 2026
        
        # All months should have zero values
        for month in range(1, 13):
            month_data = report["months"][month]
            assert month_data["assets"]["total"] == Decimal("0.00")
            assert month_data["liabilities"]["total"] == Decimal("0.00")
            assert month_data["equity"]["total"] == Decimal("0.00")
            
            # Validation should pass (0 = 0)
            assert report["validation"][month]["balanced"] is True
    
    def test_balance_sheet_bank_balance(
        self, db_session, setup_business_with_defaults, transaction_factory, transaction_line_factory
    ):
        """Bank balance is correctly calculated from transactions."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]  # Bank Account #1
        income_category = setup["categories"][0]  # head_1 (income)
        
        # Create an income transaction
        from app.models import Transaction, TransactionLine
        txn = Transaction(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("1000.00"),
            tax_amount=Decimal("0.00"),
            net_amount=Decimal("1000.00"),
        )
        db_session.add(txn)
        db_session.commit()
        db_session.refresh(txn)
        
        line = TransactionLine(
            transaction_id=txn.id,
            category_id=income_category.id,
            amount=Decimal("1000.00"),
        )
        db_session.add(line)
        db_session.commit()
        
        service = BalanceSheetService(db_session)
        report = service.generate_report(business.id, 2026)
        
        # Bank balance should be 1000
        jan_data = report["months"][1]
        assert jan_data["assets"]["bank_accounts"]["total"] == Decimal("1000.00")
        assert jan_data["assets"]["total"] == Decimal("1000.00")
    
    def test_balance_sheet_validation_equity_equals_net_assets(
        self, db_session, setup_business_with_defaults, transaction_factory, transaction_line_factory
    ):
        """Equity must equal Net Assets (Assets - Liabilities)."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]
        income_category = setup["categories"][0]
        
        # Create income transaction
        from app.models import Transaction, TransactionLine
        txn = Transaction(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=Decimal("1000.00"),
            tax_amount=Decimal("0.00"),
            net_amount=Decimal("1000.00"),
        )
        db_session.add(txn)
        db_session.commit()
        db_session.refresh(txn)
        
        line = TransactionLine(
            transaction_id=txn.id,
            category_id=income_category.id,
            amount=Decimal("1000.00"),
        )
        db_session.add(line)
        db_session.commit()
        
        service = BalanceSheetService(db_session)
        report = service.generate_report(business.id, 2026)
        
        # Validation: Equity should equal Net Assets
        for month in range(1, 13):
            validation = report["validation"][month]
            assert validation["balanced"] is True
            assert validation["net_assets"] == validation["equity"]


# =============================================================================
# CSV Export Tests
# =============================================================================

class TestCSVExport:
    """Tests for CSV export functionality."""
    
    def test_export_pl_to_csv(self, db_session, sample_income_transaction):
        """P&L report can be exported to CSV."""
        data = sample_income_transaction()
        business = data["business"]
        
        service = PLReportService(db_session)
        report = service.generate_report(business.id, 2026)
        
        csv_content = CSVExportService.export_pl_to_csv(report)
        
        # Check CSV contains expected headers
        assert "P&L Report" in csv_content
        assert "Year: 2026" in csv_content
        assert "INCOME" in csv_content
        assert "COGS" in csv_content
        assert "EXPENSES" in csv_content
        assert "Net Profit" in csv_content
        
        # Check CSV has month columns
        assert "Month 1" in csv_content
        assert "Month 12" in csv_content
        assert "YTD" in csv_content
    
    def test_export_balance_sheet_to_csv(self, db_session, setup_business_with_defaults):
        """Balance Sheet report can be exported to CSV."""
        setup = setup_business_with_defaults()
        business = setup["business"]
        
        service = BalanceSheetService(db_session)
        report = service.generate_report(business.id, 2026)
        
        csv_content = CSVExportService.export_balance_sheet_to_csv(report)
        
        # Check CSV contains expected headers
        assert "Balance Sheet Report" in csv_content
        assert "Year: 2026" in csv_content
        assert "ASSETS" in csv_content
        assert "LIABILITIES" in csv_content
        assert "EQUITY" in csv_content
        assert "VALIDATION" in csv_content
        
        # Check CSV has month columns
        assert "Month 1" in csv_content
        assert "Month 12" in csv_content
