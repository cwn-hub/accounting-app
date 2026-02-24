"""
Router for Account endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=List[schemas.AccountResponse])
def list_accounts(
    business_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all accounts for a business."""
    return crud.get_accounts_by_business(db, business_id, skip=skip, limit=limit)


@router.post("", response_model=schemas.AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account(
    business_id: int, account: schemas.AccountCreate, db: Session = Depends(get_db)
):
    """Create a new account for a business."""
    # Verify business exists
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    return crud.create_account(db, business_id, account)


@router.get("/{account_id}", response_model=schemas.AccountResponse)
def get_account(account_id: int, db: Session = Depends(get_db)):
    """Get an account by ID."""
    account = crud.get_account(db, account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_id} not found",
        )
    return account


@router.get("/{account_id}/balance", response_model=schemas.AccountBalanceResponse)
def get_account_balance(account_id: int, db: Session = Depends(get_db)):
    """Get the running balance for an account."""
    balance = crud.get_account_balance(db, account_id)
    if not balance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_id} not found",
        )
    return balance


@router.patch("/{account_id}", response_model=schemas.AccountResponse)
def update_account(
    account_id: int, updates: schemas.AccountUpdate, db: Session = Depends(get_db)
):
    """Update an account."""
    account = crud.get_account(db, account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_id} not found",
        )
    return crud.update_account(db, account, updates)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    """Delete an account."""
    account = crud.get_account(db, account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_id} not found",
        )
    crud.delete_account(db, account)
    return None
