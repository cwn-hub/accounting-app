"""
Router for Tax Rate endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/tax-rates", tags=["tax-rates"])


@router.get("", response_model=List[schemas.TaxRateResponse])
def list_tax_rates(
    business_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all tax rates for a business."""
    return crud.get_tax_rates_by_business(db, business_id, skip=skip, limit=limit)


@router.post("", response_model=schemas.TaxRateResponse, status_code=status.HTTP_201_CREATED)
def create_tax_rate(
    business_id: int, tax_rate: schemas.TaxRateCreate, db: Session = Depends(get_db)
):
    """Create a new tax rate for a business."""
    # Verify business exists
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    return crud.create_tax_rate(db, business_id, tax_rate)


@router.get("/{tax_rate_id}", response_model=schemas.TaxRateResponse)
def get_tax_rate(tax_rate_id: int, db: Session = Depends(get_db)):
    """Get a tax rate by ID."""
    tax_rate = crud.get_tax_rate(db, tax_rate_id)
    if not tax_rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tax rate {tax_rate_id} not found",
        )
    return tax_rate


@router.patch("/{tax_rate_id}", response_model=schemas.TaxRateResponse)
def update_tax_rate(
    tax_rate_id: int, updates: schemas.TaxRateUpdate, db: Session = Depends(get_db)
):
    """Update a tax rate."""
    tax_rate = crud.get_tax_rate(db, tax_rate_id)
    if not tax_rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tax rate {tax_rate_id} not found",
        )
    return crud.update_tax_rate(db, tax_rate, updates)


@router.delete("/{tax_rate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tax_rate(tax_rate_id: int, db: Session = Depends(get_db)):
    """Delete a tax rate."""
    tax_rate = crud.get_tax_rate(db, tax_rate_id)
    if not tax_rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tax rate {tax_rate_id} not found",
        )
    crud.delete_tax_rate(db, tax_rate)
    return None
