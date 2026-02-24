"""
Router for Transaction endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=List[schemas.TransactionResponse])
def list_transactions(
    account_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all transactions for an account."""
    return crud.get_transactions_by_account(db, account_id, skip=skip, limit=limit)


@router.post("", response_model=schemas.TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    account_id: int,
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
):
    """Create a new transaction with auto tax calculation."""
    # Verify account exists
    account = crud.get_account(db, account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_id} not found",
        )
    
    # Validate allocations sum to gross_amount (extra validation)
    is_valid, error_msg = crud.validate_transaction_allocations(
        transaction.gross_amount, transaction.allocations
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_msg,
        )
    
    return crud.create_transaction(db, account_id, transaction)


@router.get("/{transaction_id}", response_model=schemas.TransactionResponse)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Get a transaction by ID."""
    transaction = crud.get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found",
        )
    return transaction


@router.patch("/{transaction_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    transaction_id: int,
    updates: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
):
    """Update a transaction."""
    transaction = crud.get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found",
        )
    
    # Validate allocations if provided
    if updates.allocations is not None:
        gross = updates.gross_amount or transaction.gross_amount
        is_valid, error_msg = crud.validate_transaction_allocations(
            gross, updates.allocations
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=error_msg,
            )
    
    return crud.update_transaction(db, transaction, updates)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Delete a transaction."""
    transaction = crud.get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction {transaction_id} not found",
        )
    crud.delete_transaction(db, transaction)
    return None
