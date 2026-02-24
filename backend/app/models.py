"""
Accounting Tool - SQLAlchemy 2.0 Models
Swiss cash-basis accounting SaaS
"""
from datetime import date
from decimal import Decimal
from enum import Enum as PyEnum
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


# ============================================================================
# Enums
# ============================================================================

class AccountType(str, PyEnum):
    BANK = "bank"
    CREDIT_CARD = "credit_card"
    CASH = "cash"
    ASSET = "asset"


class CategoryType(str, PyEnum):
    INCOME = "income"
    COGS = "cogs"
    EXPENSE = "expense"


class ReportType(str, PyEnum):
    PL = "pl"  # Profit & Loss
    BS = "bs"  # Balance Sheet


class TransactionDirection(str, PyEnum):
    IN = "in"
    OUT = "out"


class SpecialType(str, PyEnum):
    """Special transaction line types for balance sheet items."""
    CAPITAL = "capital"
    LOAN_IN = "loan_in"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    ASSET_PURCHASE = "asset_purchase"
    TAX_PAYMENT = "tax_payment"
    LOAN_REPAYMENT = "loan_repayment"
    DRAWINGS = "drawings"
    INCOME_TAX = "income_tax"
    PAYROLL_TAX = "payroll_tax"


# ============================================================================
# Models
# ============================================================================

class Business(Base):
    """A business entity (single-tenant for Variant A)."""
    __tablename__ = "businesses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    fiscal_year_start_month: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )  # 1-12 (January = 1)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="CHF")
    
    # Extended business settings
    address_line1: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address_line2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(2), nullable=True, default="CH")
    tax_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    vat_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    accounts: Mapped[List["Account"]] = relationship(
        "Account", back_populates="business", cascade="all, delete-orphan"
    )
    categories: Mapped[List["Category"]] = relationship(
        "Category", back_populates="business", cascade="all, delete-orphan"
    )
    tax_rates: Mapped[List["TaxRate"]] = relationship(
        "TaxRate", back_populates="business", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "fiscal_year_start_month >= 1 AND fiscal_year_start_month <= 12",
            name="valid_fiscal_month",
        ),
    )

    def __repr__(self) -> str:
        return f"<Business(id={self.id}, name='{self.name}', currency='{self.currency}')>"


class Account(Base):
    """A financial account (Bank, Credit Card, etc.)."""
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[AccountType] = mapped_column(
        Enum(AccountType), nullable=False, default=AccountType.BANK
    )
    opening_balance: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), nullable=False, default=Decimal("0.00")
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    business: Mapped["Business"] = relationship("Business", back_populates="accounts")
    transactions: Mapped[List["Transaction"]] = relationship(
        "Transaction", back_populates="account", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("business_id", "name", name="unique_account_name_per_business"),
    )

    def __repr__(self) -> str:
        return f"<Account(id={self.id}, name='{self.name}', type='{self.type.value}')>"


class Category(Base):
    """
    Chart of accounts category.
    26 categories total: 5 income, 6 COGS, 15 expense.
    Codes: head_1 through head_26.
    """
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g., "head_1"
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[CategoryType] = mapped_column(Enum(CategoryType), nullable=False)
    report: Mapped[ReportType] = mapped_column(Enum(ReportType), nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    business: Mapped["Business"] = relationship("Business", back_populates="categories")
    transaction_lines: Mapped[List["TransactionLine"]] = relationship(
        "TransactionLine", back_populates="category"
    )

    __table_args__ = (
        UniqueConstraint("business_id", "code", name="unique_category_code_per_business"),
    )

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, code='{self.code}', name='{self.name}')>"


class TaxRate(Base):
    """Sales tax / VAT rate configuration."""
    __tablename__ = "tax_rates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_id: Mapped[int] = mapped_column(
        ForeignKey("businesses.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "VAT 8.1%"
    rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), nullable=False
    )  # e.g., 0.081 for 8.1%
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    business: Mapped["Business"] = relationship("Business", back_populates="tax_rates")
    transactions: Mapped[List["Transaction"]] = relationship(
        "Transaction", back_populates="tax_rate"
    )

    __table_args__ = (
        CheckConstraint("rate >= 0 AND rate < 1", name="valid_tax_rate"),
        UniqueConstraint("business_id", "name", name="unique_tax_name_per_business"),
    )

    def __repr__(self) -> str:
        return f"<TaxRate(id={self.id}, name='{self.name}', rate={self.rate})>"


class Transaction(Base):
    """
    A financial transaction.
    
    Tax calculation: tax = gross / (1 + rate)
    Net amount: net = gross - tax
    """
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(
        ForeignKey("accounts.id"), nullable=False, index=True
    )
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    payee: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    direction: Mapped[TransactionDirection] = mapped_column(
        Enum(TransactionDirection), nullable=False
    )
    
    # Amounts (gross includes tax)
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    tax_rate_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("tax_rates.id"), nullable=True
    )
    tax_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), nullable=False, default=Decimal("0.00")
    )
    net_amount: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), nullable=False, default=Decimal("0.00")
    )
    
    is_reconciled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    account: Mapped["Account"] = relationship("Account", back_populates="transactions")
    tax_rate: Mapped[Optional["TaxRate"]] = relationship("TaxRate", back_populates="transactions")
    lines: Mapped[List["TransactionLine"]] = relationship(
        "TransactionLine", back_populates="transaction", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("gross_amount >= 0", name="non_negative_gross"),
    )

    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, date='{self.date}', gross={self.gross_amount})>"

    def calculate_tax(self) -> Decimal:
        """Calculate tax amount: tax = gross / (1 + rate)"""
        if self.tax_rate is None or self.tax_rate.rate == 0:
            return Decimal("0.00")
        # tax = gross / (1 + rate)
        divisor = Decimal("1") + self.tax_rate.rate
        tax = self.gross_amount / divisor
        return tax.quantize(Decimal("0.01"))  # Round to 2 decimal places

    def calculate_net(self) -> Decimal:
        """Calculate net amount: net = gross - tax"""
        return self.gross_amount - self.tax_amount


class TransactionLine(Base):
    """
    Allocation of a transaction to categories or special balance sheet items.
    
    Either category_id OR special_type must be set (not both, not neither for 
    balance sheet affecting transactions).
    """
    __tablename__ = "transaction_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("transactions.id"), nullable=False, index=True
    )
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categories.id"), nullable=True
    )
    special_type: Mapped[Optional[SpecialType]] = mapped_column(
        Enum(SpecialType), nullable=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    # Relationships
    transaction: Mapped["Transaction"] = relationship(
        "Transaction", back_populates="lines"
    )
    category: Mapped[Optional["Category"]] = relationship(
        "Category", back_populates="transaction_lines"
    )

    __table_args__ = (
        CheckConstraint("amount > 0", name="positive_amount"),
    )

    def __repr__(self) -> str:
        if self.category:
            return f"<TransactionLine(id={self.id}, category='{self.category.code}', amount={self.amount})>"
        return f"<TransactionLine(id={self.id}, special='{self.special_type.value}', amount={self.amount})>"


# ============================================================================
# Default Data Setup Helpers
# ============================================================================

def create_default_categories(business_id: int) -> List[Category]:
    """
    Create the default 26 categories for a new business.
    - 5 income categories (head_1 to head_5) -> P&L
    - 6 COGS categories (head_6 to head_11) -> P&L
    - 15 expense categories (head_12 to head_26) -> P&L
    """
    categories = []
    
    # Income categories (head_1 - head_5)
    for i in range(1, 6):
        categories.append(
            Category(
                business_id=business_id,
                code=f"head_{i}",
                name=f"Income Category {i}",
                type=CategoryType.INCOME,
                report=ReportType.PL,
            )
        )
    
    # COGS categories (head_6 - head_11)
    for i in range(6, 12):
        categories.append(
            Category(
                business_id=business_id,
                code=f"head_{i}",
                name=f"COGS Category {i-5}",
                type=CategoryType.COGS,
                report=ReportType.PL,
            )
        )
    
    # Expense categories (head_12 - head_26)
    for i in range(12, 27):
        categories.append(
            Category(
                business_id=business_id,
                code=f"head_{i}",
                name=f"Expense Category {i-11}",
                type=CategoryType.EXPENSE,
                report=ReportType.PL,
            )
        )
    
    return categories


def create_default_accounts(business_id: int) -> List[Account]:
    """
    Create the default 3 accounts:
    - Bank Account #1
    - Bank Account #2  
    - Credit Card Account
    """
    return [
        Account(
            business_id=business_id,
            name="Bank Account #1",
            type=AccountType.BANK,
            opening_balance=Decimal("0.00"),
        ),
        Account(
            business_id=business_id,
            name="Bank Account #2",
            type=AccountType.BANK,
            opening_balance=Decimal("0.00"),
        ),
        Account(
            business_id=business_id,
            name="Credit Card Account",
            type=AccountType.CREDIT_CARD,
            opening_balance=Decimal("0.00"),
        ),
    ]
