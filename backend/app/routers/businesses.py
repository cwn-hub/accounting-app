"""
Router for Business endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(prefix="/businesses", tags=["businesses"])


@router.get("", response_model=List[schemas.BusinessResponse])
def list_businesses(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    """List all businesses."""
    return crud.get_businesses(db, skip=skip, limit=limit)


@router.post("", response_model=schemas.BusinessResponse, status_code=status.HTTP_201_CREATED)
def create_business(
    business: schemas.BusinessCreate, db: Session = Depends(get_db)
):
    """Create a new business with default categories and accounts."""
    return crud.create_business(db, business)


@router.get("/{business_id}", response_model=schemas.BusinessResponse)
def get_business(business_id: int, db: Session = Depends(get_db)):
    """Get a business by ID."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    return business


@router.patch("/{business_id}", response_model=schemas.BusinessResponse)
def update_business(
    business_id: int, updates: schemas.BusinessUpdate, db: Session = Depends(get_db)
):
    """Update a business."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    return crud.update_business(db, business, updates)


@router.delete("/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business(business_id: int, db: Session = Depends(get_db)):
    """Delete a business and all associated data."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    crud.delete_business(db, business)
    return None
