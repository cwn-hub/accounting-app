"""
Pytest configuration and fixtures for Accounting Tool tests.
"""
from datetime import date
from decimal import Decimal
from typing import Generator

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.models import (
    Base,
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
# Database Fixtures
# ============================================================================

# Use SQLite for testing (file-based to ensure persistence works)
TEST_DATABASE_URL = "sqlite:///./test_accounting.db"
TEST_ASYNC_DATABASE_URL = "sqlite+aiosqlite:///./test_accounting.db"


@pytest.fixture(scope="session")
def engine():
    """Create a SQLAlchemy engine for the test session."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    # Create all tables
    Base.metadata.create_all(bind=engine)
    yield engine
    # Cleanup
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(engine) -> Generator[Session, None, None]:
    """Provide a transactional database session."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()
    
    # Enable foreign key constraints for SQLite
    session.execute(text("PRAGMA foreign_keys=ON"))
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


# ============================================================================
# Model Factories (as fixtures)
# ============================================================================

@pytest.fixture
def business_factory(db_session):
    """Factory for creating Business entities."""
    def _create(name: str = "Test Business", fiscal_month: int = 1, currency: str = "CHF") -> Business:
        business = Business(
            name=name,
            fiscal_year_start_month=fiscal_month,
            currency=currency,
        )
        db_session.add(business)
        db_session.commit()
        db_session.refresh(business)
        return business
    return _create


@pytest.fixture
def account_factory(db_session):
    """Factory for creating Account entities."""
    def _create(
        business_id: int,
        name: str = "Test Account",
        account_type: AccountType = AccountType.BANK,
        opening_balance: Decimal = Decimal("0.00"),
    ) -> Account:
        account = Account(
            business_id=business_id,
            name=name,
            type=account_type,
            opening_balance=opening_balance,
        )
        db_session.add(account)
        db_session.commit()
        db_session.refresh(account)
        return account
    return _create


@pytest.fixture
def category_factory(db_session):
    """Factory for creating Category entities."""
    def _create(
        business_id: int,
        code: str,
        name: str,
        cat_type: CategoryType,
        report: ReportType = ReportType.PL,
    ) -> Category:
        category = Category(
            business_id=business_id,
            code=code,
            name=name,
            type=cat_type,
            report=report,
        )
        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)
        return category
    return _create


@pytest.fixture
def tax_rate_factory(db_session):
    """Factory for creating TaxRate entities."""
    def _create(
        business_id: int,
        name: str = "VAT 8.1%",
        rate: Decimal = Decimal("0.081"),
    ) -> TaxRate:
        tax_rate = TaxRate(
            business_id=business_id,
            name=name,
            rate=rate,
        )
        db_session.add(tax_rate)
        db_session.commit()
        db_session.refresh(tax_rate)
        return tax_rate
    return _create


@pytest.fixture
def transaction_factory(db_session):
    """Factory for creating Transaction entities."""
    def _create(
        account_id: int,
        date: date,
        direction: TransactionDirection,
        gross_amount: Decimal,
        tax_rate: TaxRate = None,
        payee: str = None,
        description: str = None,
        is_reconciled: bool = False,
    ) -> Transaction:
        # Calculate tax and net
        # Formula: net = gross / (1 + rate), tax = gross - net
        if tax_rate and tax_rate.rate > 0:
            divisor = Decimal("1") + tax_rate.rate
            net_amount = (gross_amount / divisor).quantize(Decimal("0.01"))
            tax_amount = gross_amount - net_amount
        else:
            net_amount = gross_amount
            tax_amount = Decimal("0.00")
        
        transaction = Transaction(
            account_id=account_id,
            date=date,
            payee=payee,
            description=description,
            direction=direction,
            gross_amount=gross_amount,
            tax_rate_id=tax_rate.id if tax_rate else None,
            tax_amount=tax_amount,
            net_amount=net_amount,
            is_reconciled=is_reconciled,
        )
        db_session.add(transaction)
        db_session.commit()
        db_session.refresh(transaction)
        return transaction
    return _create


@pytest.fixture
def transaction_line_factory(db_session):
    """Factory for creating TransactionLine entities."""
    def _create(
        transaction_id: int,
        amount: Decimal,
        category_id: int = None,
        special_type: SpecialType = None,
    ) -> TransactionLine:
        line = TransactionLine(
            transaction_id=transaction_id,
            category_id=category_id,
            special_type=special_type,
            amount=amount,
        )
        db_session.add(line)
        db_session.commit()
        db_session.refresh(line)
        return line
    return _create


# ============================================================================
# Pre-built Fixture Combinations
# ============================================================================

@pytest.fixture
def setup_business_with_defaults(db_session, business_factory, account_factory, category_factory):
    """Create a complete business with default accounts and categories."""
    def _create():
        business = business_factory()
        
        # Create default accounts
        accounts = create_default_accounts(business.id)
        for account in accounts:
            db_session.add(account)
        db_session.commit()
        
        # Create default categories
        categories = create_default_categories(business.id)
        for category in categories:
            db_session.add(category)
        db_session.commit()
        
        # Refresh all
        for account in accounts:
            db_session.refresh(account)
        for category in categories:
            db_session.refresh(category)
        
        return {
            "business": business,
            "accounts": accounts,
            "categories": categories,
        }
    return _create


@pytest.fixture
def sample_income_transaction(db_session, setup_business_with_defaults, tax_rate_factory, transaction_factory, transaction_line_factory):
    """Create a sample income transaction with allocation."""
    def _create(gross_amount: Decimal = Decimal("108.10"), tax_rate: Decimal = Decimal("0.081")):
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]  # Bank Account #1
        income_category = setup["categories"][0]  # head_1 (income)
        
        # Create tax rate
        tax = tax_rate_factory(business.id, "VAT 8.1%", tax_rate)
        
        # Create transaction
        transaction = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 15),
            direction=TransactionDirection.IN,
            gross_amount=gross_amount,
            tax_rate=tax,
            payee="Customer A",
            description="Service revenue",
        )
        
        # Calculate expected values
        tax_amount = transaction.tax_amount
        net_amount = transaction.net_amount
        
        # Create allocation line (net amount goes to income category)
        line = transaction_line_factory(
            transaction_id=transaction.id,
            amount=net_amount,
            category_id=income_category.id,
        )
        
        return {
            "business": business,
            "account": account,
            "transaction": transaction,
            "line": line,
            "category": income_category,
            "tax_rate": tax,
        }
    return _create


@pytest.fixture
def sample_expense_transaction(db_session, setup_business_with_defaults, tax_rate_factory, transaction_factory, transaction_line_factory):
    """Create a sample expense transaction with allocation."""
    def _create(gross_amount: Decimal = Decimal("54.05"), tax_rate: Decimal = Decimal("0.081")):
        setup = setup_business_with_defaults()
        business = setup["business"]
        account = setup["accounts"][0]  # Bank Account #1
        expense_category = setup["categories"][11]  # head_12 (expense)
        
        # Create tax rate
        tax = tax_rate_factory(business.id, "VAT 8.1%", tax_rate)
        
        # Create transaction
        transaction = transaction_factory(
            account_id=account.id,
            date=date(2026, 1, 20),
            direction=TransactionDirection.OUT,
            gross_amount=gross_amount,
            tax_rate=tax,
            payee="Supplier B",
            description="Office supplies",
        )
        
        # Calculate expected values
        tax_amount = transaction.tax_amount
        net_amount = transaction.net_amount
        
        # Create allocation line (net amount goes to expense category)
        line = transaction_line_factory(
            transaction_id=transaction.id,
            amount=net_amount,
            category_id=expense_category.id,
        )
        
        return {
            "business": business,
            "account": account,
            "transaction": transaction,
            "line": line,
            "category": expense_category,
            "tax_rate": tax,
        }
    return _create
