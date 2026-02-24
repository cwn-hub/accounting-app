"""
CRUD operations for all entities.
"""
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from . import models, schemas


# ============================================================================
# Tax Calculation Service
# ============================================================================

def calculate_tax_amount(gross_amount: Decimal, tax_rate: Optional[models.TaxRate]) -> Decimal:
    """
    Calculate tax amount: tax = gross / (1 + rate)
    Returns rounded 2-decimal tax amount.
    """
    if tax_rate is None or tax_rate.rate == 0:
        return Decimal("0.00")
    
    divisor = Decimal("1") + tax_rate.rate
    tax = gross_amount / divisor
    return tax.quantize(Decimal("0.01"))


def calculate_net_amount(gross_amount: Decimal, tax_amount: Decimal) -> Decimal:
    """Calculate net amount: net = gross - tax"""
    return gross_amount - tax_amount


# ============================================================================
# Business CRUD
# ============================================================================

def get_business(db: Session, business_id: int) -> Optional[models.Business]:
    return db.query(models.Business).filter(models.Business.id == business_id).first()


def get_businesses(db: Session, skip: int = 0, limit: int = 100) -> List[models.Business]:
    return db.query(models.Business).offset(skip).limit(limit).all()


def create_business(db: Session, business: schemas.BusinessCreate) -> models.Business:
    db_business = models.Business(
        name=business.name,
        fiscal_year_start_month=business.fiscal_year_start_month,
        currency=business.currency,
    )
    db.add(db_business)
    db.commit()
    db.refresh(db_business)
    
    # Create default categories and accounts
    default_categories = models.create_default_categories(db_business.id)
    default_accounts = models.create_default_accounts(db_business.id)
    
    db.add_all(default_categories)
    db.add_all(default_accounts)
    db.commit()
    
    return db_business


def update_business(
    db: Session, business: models.Business, updates: schemas.BusinessUpdate
) -> models.Business:
    if updates.name is not None:
        business.name = updates.name
    if updates.fiscal_year_start_month is not None:
        business.fiscal_year_start_month = updates.fiscal_year_start_month
    if updates.currency is not None:
        business.currency = updates.currency
    
    db.commit()
    db.refresh(business)
    return business


def delete_business(db: Session, business: models.Business) -> None:
    db.delete(business)
    db.commit()


# ============================================================================
# Account CRUD
# ============================================================================

def get_account(db: Session, account_id: int) -> Optional[models.Account]:
    return db.query(models.Account).filter(models.Account.id == account_id).first()


def get_accounts_by_business(
    db: Session, business_id: int, skip: int = 0, limit: int = 100
) -> List[models.Account]:
    return (
        db.query(models.Account)
        .filter(models.Account.business_id == business_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_account(
    db: Session, business_id: int, account: schemas.AccountCreate
) -> models.Account:
    db_account = models.Account(
        business_id=business_id,
        name=account.name,
        type=account.type,
        opening_balance=account.opening_balance,
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


def update_account(
    db: Session, account: models.Account, updates: schemas.AccountUpdate
) -> models.Account:
    if updates.name is not None:
        account.name = updates.name
    if updates.type is not None:
        account.type = updates.type
    if updates.opening_balance is not None:
        account.opening_balance = updates.opening_balance
    
    db.commit()
    db.refresh(account)
    return account


def delete_account(db: Session, account: models.Account) -> None:
    db.delete(account)
    db.commit()


# ============================================================================
# Running Balance Computation
# ============================================================================

def get_account_balance(db: Session, account_id: int) -> dict:
    """
    Compute running balance for an account.
    Returns opening balance, current balance, and totals.
    """
    account = get_account(db, account_id)
    if not account:
        return None
    
    # Calculate totals from transactions
    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.account_id == account_id)
        .all()
    )
    
    total_in = Decimal("0.00")
    total_out = Decimal("0.00")
    
    for tx in transactions:
        if tx.direction == models.TransactionDirection.IN:
            total_in += tx.gross_amount
        else:
            total_out += tx.gross_amount
    
    current_balance = account.opening_balance + total_in - total_out
    
    return {
        "account_id": account.id,
        "account_name": account.name,
        "opening_balance": account.opening_balance,
        "current_balance": current_balance,
        "total_in": total_in,
        "total_out": total_out,
    }


# ============================================================================
# Category CRUD
# ============================================================================

def get_category(db: Session, category_id: int) -> Optional[models.Category]:
    return db.query(models.Category).filter(models.Category.id == category_id).first()


def get_categories_by_business(
    db: Session, business_id: int, skip: int = 0, limit: int = 100
) -> List[models.Category]:
    return (
        db.query(models.Category)
        .filter(models.Category.business_id == business_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_category_by_code(
    db: Session, business_id: int, code: str
) -> Optional[models.Category]:
    return (
        db.query(models.Category)
        .filter(models.Category.business_id == business_id)
        .filter(models.Category.code == code)
        .first()
    )


def create_category(
    db: Session, business_id: int, category: schemas.CategoryCreate
) -> models.Category:
    db_category = models.Category(
        business_id=business_id,
        code=category.code,
        name=category.name,
        type=category.type,
        report=category.report,
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(
    db: Session, category: models.Category, updates: schemas.CategoryUpdate
) -> models.Category:
    if updates.name is not None:
        category.name = updates.name
    if updates.code is not None:
        category.code = updates.code
    
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category: models.Category) -> None:
    db.delete(category)
    db.commit()


# ============================================================================
# Tax Rate CRUD
# ============================================================================

def get_tax_rate(db: Session, tax_rate_id: int) -> Optional[models.TaxRate]:
    return db.query(models.TaxRate).filter(models.TaxRate.id == tax_rate_id).first()


def get_tax_rates_by_business(
    db: Session, business_id: int, skip: int = 0, limit: int = 100
) -> List[models.TaxRate]:
    return (
        db.query(models.TaxRate)
        .filter(models.TaxRate.business_id == business_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_tax_rate(
    db: Session, business_id: int, tax_rate: schemas.TaxRateCreate
) -> models.TaxRate:
    db_tax_rate = models.TaxRate(
        business_id=business_id,
        name=tax_rate.name,
        rate=tax_rate.rate,
    )
    db.add(db_tax_rate)
    db.commit()
    db.refresh(db_tax_rate)
    return db_tax_rate


def update_tax_rate(
    db: Session, tax_rate: models.TaxRate, updates: schemas.TaxRateUpdate
) -> models.TaxRate:
    if updates.name is not None:
        tax_rate.name = updates.name
    if updates.rate is not None:
        tax_rate.rate = updates.rate
    
    db.commit()
    db.refresh(tax_rate)
    return tax_rate


def delete_tax_rate(db: Session, tax_rate: models.TaxRate) -> None:
    db.delete(tax_rate)
    db.commit()


# ============================================================================
# Transaction CRUD
# ============================================================================

def get_transaction(db: Session, transaction_id: int) -> Optional[models.Transaction]:
    return (
        db.query(models.Transaction)
        .options(joinedload(models.Transaction.lines))
        .filter(models.Transaction.id == transaction_id)
        .first()
    )


def get_transactions_by_account(
    db: Session, account_id: int, skip: int = 0, limit: int = 100
) -> List[models.Transaction]:
    return (
        db.query(models.Transaction)
        .options(joinedload(models.Transaction.lines))
        .filter(models.Transaction.account_id == account_id)
        .order_by(models.Transaction.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_transaction(
    db: Session, account_id: int, transaction: schemas.TransactionCreate
) -> models.Transaction:
    # Get tax rate if provided
    tax_rate = None
    if transaction.tax_rate_id:
        tax_rate = get_tax_rate(db, transaction.tax_rate_id)
    
    # Calculate tax and net amounts
    if transaction.tax_amount is not None:
        tax_amount = transaction.tax_amount
    else:
        tax_amount = calculate_tax_amount(transaction.gross_amount, tax_rate)
    
    if transaction.net_amount is not None:
        net_amount = transaction.net_amount
    else:
        net_amount = calculate_net_amount(transaction.gross_amount, tax_amount)
    
    # Create transaction
    db_transaction = models.Transaction(
        account_id=account_id,
        date=transaction.date,
        payee=transaction.payee,
        description=transaction.description,
        reference=transaction.reference,
        direction=transaction.direction,
        gross_amount=transaction.gross_amount,
        tax_rate_id=transaction.tax_rate_id,
        tax_amount=tax_amount,
        net_amount=net_amount,
        is_reconciled=False,
    )
    db.add(db_transaction)
    db.flush()  # Get the transaction ID without committing
    
    # Create transaction lines (allocations)
    for alloc in transaction.allocations:
        db_line = models.TransactionLine(
            transaction_id=db_transaction.id,
            category_id=alloc.category_id,
            special_type=alloc.special_type,
            amount=alloc.amount,
        )
        db.add(db_line)
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def update_transaction(
    db: Session, transaction: models.Transaction, updates: schemas.TransactionUpdate
) -> models.Transaction:
    # Update basic fields
    if updates.date is not None:
        transaction.date = updates.date
    if updates.payee is not None:
        transaction.payee = updates.payee
    if updates.description is not None:
        transaction.description = updates.description
    if updates.reference is not None:
        transaction.reference = updates.reference
    if updates.direction is not None:
        transaction.direction = updates.direction
    if updates.tax_rate_id is not None:
        transaction.tax_rate_id = updates.tax_rate_id
    if updates.is_reconciled is not None:
        transaction.is_reconciled = updates.is_reconciled
    
    # Handle gross amount change (recalculate tax)
    if updates.gross_amount is not None:
        transaction.gross_amount = updates.gross_amount
        tax_rate = None
        if transaction.tax_rate_id:
            tax_rate = get_tax_rate(db, transaction.tax_rate_id)
        transaction.tax_amount = calculate_tax_amount(updates.gross_amount, tax_rate)
        transaction.net_amount = calculate_net_amount(
            updates.gross_amount, transaction.tax_amount
        )
    
    # Handle allocation updates
    if updates.allocations is not None:
        # Delete existing lines
        for line in transaction.lines:
            db.delete(line)
        
        # Create new lines
        for alloc in updates.allocations:
            db_line = models.TransactionLine(
                transaction_id=transaction.id,
                category_id=alloc.category_id,
                special_type=alloc.special_type,
                amount=alloc.amount,
            )
            db.add(db_line)
    
    db.commit()
    db.refresh(transaction)
    return transaction


def delete_transaction(db: Session, transaction: models.Transaction) -> None:
    db.delete(transaction)
    db.commit()


# ============================================================================
# Transaction Allocation Validation
# ============================================================================

def validate_transaction_allocations(
    gross_amount: Decimal, allocations: List[schemas.TransactionAllocation]
) -> tuple[bool, str]:
    """
    Validate that allocations sum correctly and have proper structure.
    Returns (is_valid, error_message).
    """
    if not allocations:
        return False, "At least one allocation is required"
    
    total_allocated = sum(a.amount for a in allocations)
    if abs(total_allocated - gross_amount) > Decimal("0.01"):
        return (
            False,
            f"Allocations must sum to gross_amount. "
            f"Sum: {total_allocated}, Expected: {gross_amount}",
        )
    
    for i, alloc in enumerate(allocations):
        if alloc.category_id is None and alloc.special_type is None:
            return (
                False,
                f"Allocation {i} must have either category_id or special_type",
            )
    
    return True, ""
