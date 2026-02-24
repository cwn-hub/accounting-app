"""
Reports Service - P&L and Balance Sheet calculations.
Matches Excel calculation logic exactly.
"""
from datetime import date
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
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
# P&L Report Service
# ============================================================================

class PLReportService:
    """
    Profit & Loss Report service with monthly columns and YTD.
    
    Income: sum of Head 1-5
    COGS: sum of Head 6-11 + inventory adjustment
    Expenses: sum of Head 12-26
    Net Profit = Income - COGS - Expenses
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def generate_report(
        self,
        business_id: int,
        year: int,
    ) -> Dict:
        """
        Generate P&L report for a business for a given year.
        
        Returns:
            Dictionary with monthly columns (1-12) and YTD totals
        """
        # Get all categories for this business
        categories = self.db.query(Category).filter(
            Category.business_id == business_id
        ).all()
        
        # Organize categories by type and code
        income_cats = [c for c in categories if c.type == CategoryType.INCOME]  # head_1-5
        cogs_cats = [c for c in categories if c.type == CategoryType.COGS]  # head_6-11
        expense_cats = [c for c in categories if c.type == CategoryType.EXPENSE]  # head_12-26
        
        # Initialize report structure
        months = list(range(1, 13))
        report = {
            "business_id": business_id,
            "year": year,
            "currency": "CHF",
            "months": {},
            "ytd": {},
        }
        
        # Calculate for each month
        for month in months:
            month_data = self._calculate_month(
                business_id, year, month,
                income_cats, cogs_cats, expense_cats
            )
            report["months"][month] = month_data
        
        # Calculate YTD totals
        report["ytd"] = self._calculate_ytd(report["months"])
        
        return report
    
    def _calculate_month(
        self,
        business_id: int,
        year: int,
        month: int,
        income_cats: List[Category],
        cogs_cats: List[Category],
        expense_cats: List[Category],
    ) -> Dict:
        """Calculate P&L for a single month."""
        
        # Get start and end date for the month
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year, 12, 31)
        else:
            end_date = date(year, month + 1, 1)
        
        # Build category ID lists
        income_cat_ids = [c.id for c in income_cats]
        cogs_cat_ids = [c.id for c in cogs_cats]
        expense_cat_ids = [c.id for c in expense_cats]
        
        # Query transaction lines for this month
        lines_query = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date >= start_date,
            Transaction.date < end_date if month != 12 else Transaction.date <= end_date,
        )
        
        lines = lines_query.all()
        
        # Calculate Income (Head 1-5)
        income_total = Decimal("0.00")
        income_by_category = {}
        for line in lines:
            if line.category_id and line.category_id in income_cat_ids:
                income_total += line.amount
                cat_code = next((c.code for c in income_cats if c.id == line.category_id), "unknown")
                if cat_code not in income_by_category:
                    income_by_category[cat_code] = Decimal("0.00")
                income_by_category[cat_code] += line.amount
        
        # Calculate COGS (Head 6-11) + inventory adjustment
        cogs_total = Decimal("0.00")
        cogs_by_category = {}
        for line in lines:
            if line.category_id and line.category_id in cogs_cat_ids:
                cogs_total += line.amount
                cat_code = next((c.code for c in cogs_cats if c.id == line.category_id), "unknown")
                if cat_code not in cogs_by_category:
                    cogs_by_category[cat_code] = Decimal("0.00")
                cogs_by_category[cat_code] += line.amount
        
        # TODO: Add inventory adjustment when inventory tracking is implemented
        inventory_adjustment = Decimal("0.00")
        cogs_total += inventory_adjustment
        
        # Calculate Expenses (Head 12-26)
        expenses_total = Decimal("0.00")
        expenses_by_category = {}
        for line in lines:
            if line.category_id and line.category_id in expense_cat_ids:
                expenses_total += line.amount
                cat_code = next((c.code for c in expense_cats if c.id == line.category_id), "unknown")
                if cat_code not in expenses_by_category:
                    expenses_by_category[cat_code] = Decimal("0.00")
                expenses_by_category[cat_code] += line.amount
        
        # Calculate Gross Profit and Net Profit
        gross_profit = income_total - cogs_total
        net_profit = gross_profit - expenses_total
        
        return {
            "income": {
                "total": income_total,
                "by_category": income_by_category,
            },
            "cogs": {
                "total": cogs_total,
                "by_category": cogs_by_category,
                "inventory_adjustment": inventory_adjustment,
            },
            "expenses": {
                "total": expenses_total,
                "by_category": expenses_by_category,
            },
            "gross_profit": gross_profit,
            "net_profit": net_profit,
        }
    
    def _calculate_ytd(self, months_data: Dict[int, Dict]) -> Dict:
        """Calculate year-to-date totals from monthly data."""
        ytd = {
            "income": {
                "total": Decimal("0.00"),
                "by_category": {},
            },
            "cogs": {
                "total": Decimal("0.00"),
                "by_category": {},
                "inventory_adjustment": Decimal("0.00"),
            },
            "expenses": {
                "total": Decimal("0.00"),
                "by_category": {},
            },
            "gross_profit": Decimal("0.00"),
            "net_profit": Decimal("0.00"),
        }
        
        for month_data in months_data.values():
            # Income
            ytd["income"]["total"] += month_data["income"]["total"]
            for cat_code, amount in month_data["income"]["by_category"].items():
                if cat_code not in ytd["income"]["by_category"]:
                    ytd["income"]["by_category"][cat_code] = Decimal("0.00")
                ytd["income"]["by_category"][cat_code] += amount
            
            # COGS
            ytd["cogs"]["total"] += month_data["cogs"]["total"]
            ytd["cogs"]["inventory_adjustment"] += month_data["cogs"]["inventory_adjustment"]
            for cat_code, amount in month_data["cogs"]["by_category"].items():
                if cat_code not in ytd["cogs"]["by_category"]:
                    ytd["cogs"]["by_category"][cat_code] = Decimal("0.00")
                ytd["cogs"]["by_category"][cat_code] += amount
            
            # Expenses
            ytd["expenses"]["total"] += month_data["expenses"]["total"]
            for cat_code, amount in month_data["expenses"]["by_category"].items():
                if cat_code not in ytd["expenses"]["by_category"]:
                    ytd["expenses"]["by_category"][cat_code] = Decimal("0.00")
                ytd["expenses"]["by_category"][cat_code] += amount
            
            # Profits
            ytd["gross_profit"] += month_data["gross_profit"]
            ytd["net_profit"] += month_data["net_profit"]
        
        return ytd


# ============================================================================
# Balance Sheet Service
# ============================================================================

class BalanceSheetService:
    """
    Balance Sheet Report service with monthly snapshots.
    
    Assets: Bank closing balances + Inventory + Asset purchases
    Liabilities: Loans + Tax payable + Credit Card
    Equity: Capital + Retained Earnings + Net Profit - Drawings
    
    VALIDATION: Equity must equal Net Assets (Assets - Liabilities)
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def generate_report(
        self,
        business_id: int,
        year: int,
    ) -> Dict:
        """
        Generate Balance Sheet report for a business for a given year.
        
        Returns:
            Dictionary with monthly snapshots (1-12) and year-end
        """
        # Get business info
        business = self.db.query(Business).filter(Business.id == business_id).first()
        if not business:
            raise ValueError(f"Business {business_id} not found")
        
        # Initialize report structure
        months = list(range(1, 13))
        report = {
            "business_id": business_id,
            "year": year,
            "currency": business.currency if business else "CHF",
            "months": {},
            "validation": {},
        }
        
        # Calculate opening retained earnings (from prior years)
        # For now, we use opening balance of bank accounts as proxy
        opening_retained_earnings = self._calculate_opening_retained_earnings(business_id, year)
        
        # Calculate for each month
        for month in months:
            as_of_date = date(year, month, 1)
            if month == 12:
                as_of_date = date(year, 12, 31)
            else:
                # Last day of the month
                if month in [1, 3, 5, 7, 8, 10, 12]:
                    as_of_date = date(year, month, 31)
                elif month == 2:
                    # Simple leap year check
                    if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):
                        as_of_date = date(year, month, 29)
                    else:
                        as_of_date = date(year, month, 28)
                else:
                    as_of_date = date(year, month, 30)
            
            month_data = self._calculate_snapshot(
                business_id, year, month, as_of_date,
                opening_retained_earnings
            )
            report["months"][month] = month_data
        
        # Validate: Equity must equal Net Assets for each month
        for month, data in report["months"].items():
            net_assets = data["assets"]["total"] - data["liabilities"]["total"]
            equity = data["equity"]["total"]
            report["validation"][month] = {
                "net_assets": net_assets,
                "equity": equity,
                "balanced": net_assets == equity,
            }
        
        return report
    
    def _calculate_opening_retained_earnings(self, business_id: int, year: int) -> Decimal:
        """Calculate retained earnings from prior years."""
        # Sum of all opening balances of bank accounts
        # This is a simplified approach - in reality, retained earnings
        # would be calculated from prior year P&L
        accounts = self.db.query(Account).filter(
            Account.business_id == business_id
        ).all()
        
        total_opening = Decimal("0.00")
        for account in accounts:
            if account.type == AccountType.BANK:
                total_opening += account.opening_balance
            elif account.type == AccountType.CREDIT_CARD:
                total_opening -= account.opening_balance  # Credit cards are liabilities
        
        return total_opening
    
    def _calculate_snapshot(
        self,
        business_id: int,
        year: int,
        month: int,
        as_of_date: date,
        opening_retained_earnings: Decimal,
    ) -> Dict:
        """Calculate balance sheet snapshot as of a specific date."""
        
        # ============================================================================
        # ASSETS
        # ============================================================================
        
        # Bank accounts - closing balances
        bank_balance = Decimal("0.00")
        accounts = self.db.query(Account).filter(
            Account.business_id == business_id
        ).all()
        
        bank_accounts = []
        for account in accounts:
            if account.type == AccountType.BANK:
                balance = account.opening_balance
                transactions = self.db.query(Transaction).filter(
                    Transaction.account_id == account.id,
                    Transaction.date <= as_of_date,
                ).all()
                
                for txn in transactions:
                    if txn.direction == TransactionDirection.IN:
                        balance += txn.gross_amount
                    else:
                        balance -= txn.gross_amount
                
                bank_balance += balance
                bank_accounts.append({
                    "id": account.id,
                    "name": account.name,
                    "balance": balance,
                })
        
        # Inventory (placeholder - would come from inventory module)
        inventory_value = Decimal("0.00")
        
        # Asset purchases (cumulative)
        asset_purchases = Decimal("0.00")
        lines = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date <= as_of_date,
            TransactionLine.special_type == SpecialType.ASSET_PURCHASE,
        ).all()
        
        for line in lines:
            asset_purchases += line.amount
        
        total_assets = bank_balance + inventory_value + asset_purchases
        
        # ============================================================================
        # LIABILITIES
        # ============================================================================
        
        # Credit card balances (negative balance = liability)
        credit_card_balance = Decimal("0.00")
        credit_cards = []
        for account in accounts:
            if account.type == AccountType.CREDIT_CARD:
                balance = account.opening_balance
                transactions = self.db.query(Transaction).filter(
                    Transaction.account_id == account.id,
                    Transaction.date <= as_of_date,
                ).all()
                
                for txn in transactions:
                    if txn.direction == TransactionDirection.IN:
                        balance += txn.gross_amount
                    else:
                        balance -= txn.gross_amount
                
                # Credit card balance: if negative, it's owed (liability)
                if balance < 0:
                    credit_card_balance = -balance
                else:
                    credit_card_balance = Decimal("0.00")
                
                credit_cards.append({
                    "id": account.id,
                    "name": account.name,
                    "balance": balance,
                    "liability": credit_card_balance if balance < 0 else Decimal("0.00"),
                })
        
        # Loans received (cumulative)
        loans = Decimal("0.00")
        lines = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date <= as_of_date,
            TransactionLine.special_type == SpecialType.LOAN_IN,
        ).all()
        
        for line in lines:
            loans += line.amount
        
        # Loan repayments (reduce liability)
        loan_repayments = Decimal("0.00")
        lines = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date <= as_of_date,
            TransactionLine.special_type == SpecialType.LOAN_REPAYMENT,
        ).all()
        
        for line in lines:
            loan_repayments += line.amount
        
        net_loans = loans - loan_repayments
        
        # Tax payable (tax collected - tax paid)
        tax_collected = Decimal("0.00")
        tax_paid = Decimal("0.00")
        
        transactions = self.db.query(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date <= as_of_date,
        ).all()
        
        for txn in transactions:
            if txn.direction == TransactionDirection.IN:
                tax_collected += txn.tax_amount
            else:
                tax_paid += txn.tax_amount
        
        # Additional tax payments
        tax_payment_lines = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date <= as_of_date,
            TransactionLine.special_type == SpecialType.TAX_PAYMENT,
        ).all()
        
        for line in tax_payment_lines:
            tax_paid += line.amount
        
        tax_payable = tax_collected - tax_paid
        if tax_payable < 0:
            tax_payable = Decimal("0.00")  # Overpayment is an asset, not liability
        
        # Income tax payable
        income_tax_paid = Decimal("0.00")
        lines = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date <= as_of_date,
            TransactionLine.special_type == SpecialType.INCOME_TAX,
        ).all()
        
        for line in lines:
            income_tax_paid += line.amount
        
        # Payroll tax payable
        payroll_tax_paid = Decimal("0.00")
        lines = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date <= as_of_date,
            TransactionLine.special_type == SpecialType.PAYROLL_TAX,
        ).all()
        
        for line in lines:
            payroll_tax_paid += line.amount
        
        total_liabilities = (
            credit_card_balance +
            net_loans +
            tax_payable +
            income_tax_paid +
            payroll_tax_paid
        )
        
        # ============================================================================
        # EQUITY
        # ============================================================================
        
        # Capital contributions (cumulative)
        capital = Decimal("0.00")
        lines = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date <= as_of_date,
            TransactionLine.special_type == SpecialType.CAPITAL,
        ).all()
        
        for line in lines:
            capital += line.amount
        
        # Drawings (cumulative, reduce equity)
        drawings = Decimal("0.00")
        lines = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date <= as_of_date,
            TransactionLine.special_type == SpecialType.DRAWINGS,
        ).all()
        
        for line in lines:
            drawings += line.amount
        
        # Current year net profit (from P&L)
        # Calculate from the beginning of the year to as_of_date
        current_year_profit = self._calculate_net_profit_ytd(business_id, year, as_of_date)
        
        # Retained earnings from prior years + current year profit
        retained_earnings = opening_retained_earnings + current_year_profit
        
        total_equity = capital + retained_earnings - drawings
        
        return {
            "as_of_date": as_of_date.isoformat(),
            "assets": {
                "total": total_assets,
                "bank_accounts": {
                    "total": bank_balance,
                    "accounts": bank_accounts,
                },
                "inventory": inventory_value,
                "asset_purchases": asset_purchases,
            },
            "liabilities": {
                "total": total_liabilities,
                "credit_cards": {
                    "total": credit_card_balance,
                    "accounts": credit_cards,
                },
                "loans": {
                    "received": loans,
                    "repayments": loan_repayments,
                    "net": net_loans,
                },
                "tax_payable": {
                    "vat": tax_payable,
                    "income_tax": income_tax_paid,
                    "payroll_tax": payroll_tax_paid,
                    "total": tax_payable + income_tax_paid + payroll_tax_paid,
                },
            },
            "equity": {
                "total": total_equity,
                "capital": capital,
                "retained_earnings": retained_earnings,
                "current_year_profit": current_year_profit,
                "drawings": drawings,
            },
        }
    
    def _calculate_net_profit_ytd(
        self,
        business_id: int,
        year: int,
        as_of_date: date,
    ) -> Decimal:
        """Calculate net profit from beginning of year to as_of_date."""
        
        start_date = date(year, 1, 1)
        
        # Get all categories
        categories = self.db.query(Category).filter(
            Category.business_id == business_id
        ).all()
        
        income_cats = [c.id for c in categories if c.type == CategoryType.INCOME]
        cogs_cats = [c.id for c in categories if c.type == CategoryType.COGS]
        expense_cats = [c.id for c in categories if c.type == CategoryType.EXPENSE]
        
        # Query transaction lines
        lines = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date >= start_date,
            Transaction.date <= as_of_date,
        ).all()
        
        income = Decimal("0.00")
        cogs = Decimal("0.00")
        expenses = Decimal("0.00")
        
        for line in lines:
            if line.category_id:
                if line.category_id in income_cats:
                    income += line.amount
                elif line.category_id in cogs_cats:
                    cogs += line.amount
                elif line.category_id in expense_cats:
                    expenses += line.amount
        
        return income - cogs - expenses


# ============================================================================
# Sales Tax Report Service
# ============================================================================

class TaxReportService:
    """
    Sales Tax Report service.
    
    Calculates:
    - Tax collected (from income transactions)
    - Tax paid (from expense transactions)
    - Tax payments to authorities
    - Net tax payable or refundable
    
    Formula: tax_collected - tax_paid - tax_payments = net_payable
    Positive = payable to authorities
    Negative = refundable from authorities
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def generate_report(
        self,
        business_id: int,
        year: int,
    ) -> Dict:
        """
        Generate Sales Tax report for a business for a given year.
        
        Returns:
            Dictionary with monthly breakdowns and annual summary
        """
        # Get business info
        business = self.db.query(Business).filter(Business.id == business_id).first()
        if not business:
            raise ValueError(f"Business {business_id} not found")
        
        # Initialize report structure
        months = list(range(1, 13))
        report = {
            "business_id": business_id,
            "year": year,
            "currency": business.currency if business else "CHF",
            "months": {},
            "summary": {
                "total_tax_collected": Decimal("0.00"),
                "total_tax_paid": Decimal("0.00"),
                "total_tax_payments": Decimal("0.00"),
                "net_tax_payable": Decimal("0.00"),
            },
        }
        
        # Calculate for each month
        for month in months:
            month_data = self._calculate_month(business_id, year, month)
            report["months"][month] = month_data
            
            # Accumulate totals
            report["summary"]["total_tax_collected"] += month_data["tax_collected"]
            report["summary"]["total_tax_paid"] += month_data["tax_paid"]
            report["summary"]["total_tax_payments"] += month_data["tax_payments"]
            report["summary"]["net_tax_payable"] += month_data["net_tax_payable"]
        
        return report
    
    def _calculate_month(self, business_id: int, year: int, month: int) -> Dict:
        """Calculate tax data for a single month."""
        
        # Get start and end date for the month
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year, 12, 31)
        else:
            end_date = date(year, month + 1, 1)
        
        # Query all transactions for this month
        transactions_query = self.db.query(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date >= start_date,
            Transaction.date < end_date if month != 12 else Transaction.date <= end_date,
        )
        
        transactions = transactions_query.all()
        
        # Calculate tax collected (from income)
        tax_collected = Decimal("0.00")
        for txn in transactions:
            if txn.direction == TransactionDirection.IN:
                tax_collected += txn.tax_amount
        
        # Calculate tax paid (from expenses)
        tax_paid = Decimal("0.00")
        for txn in transactions:
            if txn.direction == TransactionDirection.OUT and txn.tax_amount > 0:
                tax_paid += txn.tax_amount
        
        # Calculate tax payments to authorities
        tax_payment_lines = self.db.query(TransactionLine).join(Transaction).join(Account).filter(
            Account.business_id == business_id,
            Transaction.date >= start_date,
            Transaction.date < end_date if month != 12 else Transaction.date <= end_date,
            TransactionLine.special_type == SpecialType.TAX_PAYMENT,
        ).all()
        
        tax_payments = sum(line.amount for line in tax_payment_lines)
        
        # Calculate net tax payable
        net_tax_payable = tax_collected - tax_paid - tax_payments
        
        return {
            "month": month,
            "tax_collected": tax_collected,
            "tax_paid": tax_paid,
            "tax_payments": tax_payments,
            "net_tax_payable": net_tax_payable,
        }


# ============================================================================
# CSV Export Service
# ============================================================================

import csv
import io


class CSVExportService:
    """Service for exporting reports to CSV format."""
    
    @staticmethod
    def export_pl_to_csv(report: Dict) -> str:
        """Export P&L report to CSV format."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["P&L Report", f"Year: {report['year']}", f"Currency: {report['currency']}"])
        writer.writerow([])
        
        # Month headers
        months = list(range(1, 13))
        header = ["Category"] + [f"Month {m}" for m in months] + ["YTD"]
        writer.writerow(header)
        
        # Income section
        writer.writerow(["INCOME"])
        income_cats = sorted(set(
            cat
            for month_data in report["months"].values()
            for cat in month_data["income"]["by_category"].keys()
        ))
        
        for cat in income_cats:
            row = [cat]
            for month in months:
                amount = report["months"][month]["income"]["by_category"].get(cat, Decimal("0.00"))
                row.append(str(amount))
            ytd_amount = report["ytd"]["income"]["by_category"].get(cat, Decimal("0.00"))
            row.append(str(ytd_amount))
            writer.writerow(row)
        
        writer.writerow(["Total Income"] + 
                       [str(report["months"][m]["income"]["total"]) for m in months] +
                       [str(report["ytd"]["income"]["total"])])
        writer.writerow([])
        
        # COGS section
        writer.writerow(["COGS"])
        cogs_cats = sorted(set(
            cat
            for month_data in report["months"].values()
            for cat in month_data["cogs"]["by_category"].keys()
        ))
        
        for cat in cogs_cats:
            row = [cat]
            for month in months:
                amount = report["months"][month]["cogs"]["by_category"].get(cat, Decimal("0.00"))
                row.append(str(amount))
            ytd_amount = report["ytd"]["cogs"]["by_category"].get(cat, Decimal("0.00"))
            row.append(str(ytd_amount))
            writer.writerow(row)
        
        writer.writerow(["Inventory Adjustment"] +
                       [str(report["months"][m]["cogs"]["inventory_adjustment"]) for m in months] +
                       [str(report["ytd"]["cogs"]["inventory_adjustment"])])
        writer.writerow(["Total COGS"] +
                       [str(report["months"][m]["cogs"]["total"]) for m in months] +
                       [str(report["ytd"]["cogs"]["total"])])
        writer.writerow([])
        
        # Gross Profit
        writer.writerow(["Gross Profit"] +
                       [str(report["months"][m]["gross_profit"]) for m in months] +
                       [str(report["ytd"]["gross_profit"])])
        writer.writerow([])
        
        # Expenses section
        writer.writerow(["EXPENSES"])
        expense_cats = sorted(set(
            cat
            for month_data in report["months"].values()
            for cat in month_data["expenses"]["by_category"].keys()
        ))
        
        for cat in expense_cats:
            row = [cat]
            for month in months:
                amount = report["months"][month]["expenses"]["by_category"].get(cat, Decimal("0.00"))
                row.append(str(amount))
            ytd_amount = report["ytd"]["expenses"]["by_category"].get(cat, Decimal("0.00"))
            row.append(str(ytd_amount))
            writer.writerow(row)
        
        writer.writerow(["Total Expenses"] +
                       [str(report["months"][m]["expenses"]["total"]) for m in months] +
                       [str(report["ytd"]["expenses"]["total"])])
        writer.writerow([])
        
        # Net Profit
        writer.writerow(["Net Profit"] +
                       [str(report["months"][m]["net_profit"]) for m in months] +
                       [str(report["ytd"]["net_profit"])])
        
        return output.getvalue()
    
    @staticmethod
    def export_balance_sheet_to_csv(report: Dict) -> str:
        """Export Balance Sheet report to CSV format."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Balance Sheet Report", f"Year: {report['year']}", f"Currency: {report['currency']}"])
        writer.writerow([])
        
        # Month headers
        months = list(range(1, 13))
        header = ["Item"] + [f"Month {m}" for m in months]
        writer.writerow(header)
        
        # Assets section
        writer.writerow(["ASSETS"])
        writer.writerow(["Bank Accounts"] +
                       [str(report["months"][m]["assets"]["bank_accounts"]["total"]) for m in months])
        writer.writerow(["Inventory"] +
                       [str(report["months"][m]["assets"]["inventory"]) for m in months])
        writer.writerow(["Asset Purchases"] +
                       [str(report["months"][m]["assets"]["asset_purchases"]) for m in months])
        writer.writerow(["Total Assets"] +
                       [str(report["months"][m]["assets"]["total"]) for m in months])
        writer.writerow([])
        
        # Liabilities section
        writer.writerow(["LIABILITIES"])
        writer.writerow(["Credit Cards"] +
                       [str(report["months"][m]["liabilities"]["credit_cards"]["total"]) for m in months])
        writer.writerow(["Loans (Net)"] +
                       [str(report["months"][m]["liabilities"]["loans"]["net"]) for m in months])
        writer.writerow(["Tax Payable"] +
                       [str(report["months"][m]["liabilities"]["tax_payable"]["total"]) for m in months])
        writer.writerow(["Total Liabilities"] +
                       [str(report["months"][m]["liabilities"]["total"]) for m in months])
        writer.writerow([])
        
        # Equity section
        writer.writerow(["EQUITY"])
        writer.writerow(["Capital"] +
                       [str(report["months"][m]["equity"]["capital"]) for m in months])
        writer.writerow(["Retained Earnings"] +
                       [str(report["months"][m]["equity"]["retained_earnings"]) for m in months])
        writer.writerow(["Current Year Profit"] +
                       [str(report["months"][m]["equity"]["current_year_profit"]) for m in months])
        writer.writerow(["Drawings"] +
                       [str(report["months"][m]["equity"]["drawings"]) for m in months])
        writer.writerow(["Total Equity"] +
                       [str(report["months"][m]["equity"]["total"]) for m in months])
        writer.writerow([])
        
        # Validation
        writer.writerow(["VALIDATION"])
        writer.writerow(["Net Assets (A - L)"] +
                       [str(report["validation"][m]["net_assets"]) for m in months])
        writer.writerow(["Equity"] +
                       [str(report["validation"][m]["equity"]) for m in months])
        writer.writerow(["Balanced?"] +
                       [str(report["validation"][m]["balanced"]) for m in months])
        
        return output.getvalue()
    
    @staticmethod
    def export_tax_report_to_csv(report: Dict) -> str:
        """Export Tax report to CSV format."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Sales Tax Report", f"Year: {report['year']}", f"Currency: {report['currency']}"])
        writer.writerow([])
        
        # Month headers
        months = list(range(1, 13))
        header = ["Item"] + [f"Month {m}" for m in months] + ["Annual Total"]
        writer.writerow(header)
        
        # Tax collected
        writer.writerow(["Tax Collected (from income)"] +
                       [str(report["months"][m]["tax_collected"]) for m in months] +
                       [str(report["summary"]["total_tax_collected"])])
        
        # Tax paid
        writer.writerow(["Tax Paid (from expenses)"] +
                       [str(report["months"][m]["tax_paid"]) for m in months] +
                       [str(report["summary"]["total_tax_paid"])])
        
        # Tax payments to authorities
        writer.writerow(["Tax Payments to Authorities"] +
                       [str(report["months"][m]["tax_payments"]) for m in months] +
                       [str(report["summary"]["total_tax_payments"])])
        
        writer.writerow([])
        
        # Net tax payable
        writer.writerow(["Net Tax Payable/(Refundable)"] +
                       [str(report["months"][m]["net_tax_payable"]) for m in months] +
                       [str(report["summary"]["net_tax_payable"])])
        
        writer.writerow([])
        writer.writerow(["Note: Positive values = payable to authorities"])
        writer.writerow(["       Negative values = refundable from authorities"])
        
        return output.getvalue()
