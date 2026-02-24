"""
Router for Settings & Configuration endpoints.
Business settings, Chart of Accounts, Tax Rates, Account Management, Data Management
"""
import io
import csv
import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import asc

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(prefix="/settings", tags=["settings"])


# ============================================================================
# Business Settings
# ============================================================================

@router.get("/business/{business_id}", response_model=schemas.BusinessSettingsResponse)
def get_business_settings(business_id: int, db: Session = Depends(get_db)):
    """Get full business settings including extended fields."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    return business


@router.patch("/business/{business_id}", response_model=schemas.BusinessSettingsResponse)
def update_business_settings(
    business_id: int, 
    updates: schemas.BusinessSettingsUpdate, 
    db: Session = Depends(get_db)
):
    """Update business settings including extended fields."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    
    # Update all provided fields
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(business, field, value)
    
    db.commit()
    db.refresh(business)
    return business


@router.post("/business/{business_id}/logo")
def upload_business_logo(
    business_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload business logo. Returns logo URL."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # In production, upload to cloud storage (S3, etc.)
    # For now, store filename as URL reference
    logo_url = f"/uploads/logos/{business_id}_{file.filename}"
    business.logo_url = logo_url
    db.commit()
    
    return {"logo_url": logo_url, "message": "Logo uploaded successfully"}


# ============================================================================
# Chart of Accounts Settings
# ============================================================================

@router.get("/categories/{business_id}", response_model=List[schemas.CategoryResponse])
def list_categories_with_order(
    business_id: int,
    include_archived: bool = Query(False),
    db: Session = Depends(get_db)
):
    """List all categories for a business with ordering."""
    query = db.query(models.Category).filter(models.Category.business_id == business_id)
    if not include_archived:
        query = query.filter(models.Category.is_archived == False)
    return query.order_by(asc(models.Category.display_order), asc(models.Category.code)).all()


@router.patch("/categories/{category_id}", response_model=schemas.CategoryResponse)
def update_category_settings(
    category_id: int,
    updates: schemas.CategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a category (name, code, type, archive status)."""
    category = crud.get_category(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category {category_id} not found",
        )
    
    return crud.update_category(db, category, updates)


@router.post("/categories/{business_id}/reorder")
def reorder_categories(
    business_id: int,
    request: schemas.CategoryReorderRequest,
    db: Session = Depends(get_db)
):
    """Reorder categories by setting display_order based on provided ID list."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    
    for index, category_id in enumerate(request.category_ids):
        category = db.query(models.Category).filter(
            models.Category.id == category_id,
            models.Category.business_id == business_id
        ).first()
        if category:
            category.display_order = index
    
    db.commit()
    return {"message": "Categories reordered successfully"}


@router.post("/categories/{business_id}/reset-defaults")
def reset_default_categories(
    business_id: int,
    db: Session = Depends(get_db)
):
    """Reset categories to default names while preserving transaction data."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    
    # Get existing categories
    existing = db.query(models.Category).filter(models.Category.business_id == business_id).all()
    existing_by_code = {c.code: c for c in existing}
    
    # Default category definitions
    defaults = []
    # Income categories (head_1 - head_5)
    for i in range(1, 6):
        defaults.append({
            "code": f"head_{i}",
            "name": f"Income Category {i}",
            "type": models.CategoryType.INCOME,
            "report": models.ReportType.PL,
        })
    # COGS categories (head_6 - head_11)
    for i in range(6, 12):
        defaults.append({
            "code": f"head_{i}",
            "name": f"COGS Category {i-5}",
            "type": models.CategoryType.COGS,
            "report": models.ReportType.PL,
        })
    # Expense categories (head_12 - head_26)
    for i in range(12, 27):
        defaults.append({
            "code": f"head_{i}",
            "name": f"Expense Category {i-11}",
            "type": models.CategoryType.EXPENSE,
            "report": models.ReportType.PL,
        })
    
    updated = 0
    created = 0
    
    for default in defaults:
        if default["code"] in existing_by_code:
            # Update name only
            cat = existing_by_code[default["code"]]
            cat.name = default["name"]
            updated += 1
        else:
            # Create new category
            new_cat = models.Category(
                business_id=business_id,
                code=default["code"],
                name=default["name"],
                type=default["type"],
                report=default["report"],
            )
            db.add(new_cat)
            created += 1
    
    db.commit()
    return {
        "message": "Categories reset to defaults",
        "updated": updated,
        "created": created
    }


# ============================================================================
# Tax Rate Configuration
# ============================================================================

@router.get("/tax-rates/{business_id}", response_model=List[schemas.TaxRateResponse])
def list_tax_rates_with_defaults(
    business_id: int,
    include_archived: bool = Query(False),
    db: Session = Depends(get_db)
):
    """List all tax rates for a business."""
    query = db.query(models.TaxRate).filter(models.TaxRate.business_id == business_id)
    if not include_archived:
        query = query.filter(models.TaxRate.is_archived == False)
    return query.order_by(asc(models.TaxRate.rate)).all()


@router.post("/tax-rates/{business_id}", response_model=schemas.TaxRateResponse, status_code=status.HTTP_201_CREATED)
def create_tax_rate_settings(
    business_id: int,
    tax_rate: schemas.TaxRateCreate,
    db: Session = Depends(get_db)
):
    """Create a new tax rate for a business."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    return crud.create_tax_rate(db, business_id, tax_rate)


@router.patch("/tax-rates/{tax_rate_id}", response_model=schemas.TaxRateResponse)
def update_tax_rate_settings(
    tax_rate_id: int,
    updates: schemas.TaxRateUpdate,
    db: Session = Depends(get_db)
):
    """Update a tax rate."""
    tax_rate = crud.get_tax_rate(db, tax_rate_id)
    if not tax_rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tax rate {tax_rate_id} not found",
        )
    return crud.update_tax_rate(db, tax_rate, updates)


@router.post("/tax-rates/{business_id}/set-default")
def set_default_tax_rate(
    business_id: int,
    request: schemas.TaxRateSetDefaultRequest,
    db: Session = Depends(get_db)
):
    """Set a tax rate as the default for the business."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    
    # Clear existing default
    db.query(models.TaxRate).filter(
        models.TaxRate.business_id == business_id
    ).update({"is_default": False})
    
    # Set new default
    tax_rate = crud.get_tax_rate(db, request.tax_rate_id)
    if not tax_rate or tax_rate.business_id != business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tax rate {request.tax_rate_id} not found for this business",
        )
    
    tax_rate.is_default = True
    db.commit()
    
    return {"message": "Default tax rate set successfully", "tax_rate_id": request.tax_rate_id}


@router.get("/tax-rates/{business_id}/default", response_model=Optional[schemas.TaxRateResponse])
def get_default_tax_rate(business_id: int, db: Session = Depends(get_db)):
    """Get the default tax rate for a business."""
    return db.query(models.TaxRate).filter(
        models.TaxRate.business_id == business_id,
        models.TaxRate.is_default == True
    ).first()


# ============================================================================
# Account Management
# ============================================================================

@router.get("/accounts/{business_id}", response_model=List[schemas.AccountResponse])
def list_accounts_with_order(
    business_id: int,
    include_archived: bool = Query(False),
    db: Session = Depends(get_db)
):
    """List all accounts for a business with ordering."""
    query = db.query(models.Account).filter(models.Account.business_id == business_id)
    if not include_archived:
        query = query.filter(models.Account.is_archived == False)
    return query.order_by(asc(models.Account.display_order), asc(models.Account.name)).all()


@router.post("/accounts/{business_id}", response_model=schemas.AccountResponse, status_code=status.HTTP_201_CREATED)
def create_account_settings(
    business_id: int,
    account: schemas.AccountCreate,
    db: Session = Depends(get_db)
):
    """Create a new account for a business."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    
    # Set display_order to end
    max_order = db.query(models.Account).filter(
        models.Account.business_id == business_id
    ).count()
    
    db_account = models.Account(
        business_id=business_id,
        name=account.name,
        type=account.type,
        opening_balance=account.opening_balance,
        display_order=max_order,
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@router.patch("/accounts/{account_id}", response_model=schemas.AccountResponse)
def update_account_settings(
    account_id: int,
    updates: schemas.AccountUpdate,
    db: Session = Depends(get_db)
):
    """Update an account."""
    account = crud.get_account(db, account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_id} not found",
        )
    return crud.update_account(db, account, updates)


@router.delete("/accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account_settings(account_id: int, db: Session = Depends(get_db)):
    """Delete an account (only if no transactions)."""
    account = crud.get_account(db, account_id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account {account_id} not found",
        )
    
    # Check if account has transactions
    if account.transactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete account with transactions. Archive it instead."
        )
    
    crud.delete_account(db, account)
    return None


@router.post("/accounts/{business_id}/reorder")
def reorder_accounts(
    business_id: int,
    account_ids: List[int],
    db: Session = Depends(get_db)
):
    """Reorder accounts by setting display_order based on provided ID list."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    
    for index, account_id in enumerate(account_ids):
        account = db.query(models.Account).filter(
            models.Account.id == account_id,
            models.Account.business_id == business_id
        ).first()
        if account:
            account.display_order = index
    
    db.commit()
    return {"message": "Accounts reordered successfully"}


# ============================================================================
# Data Management
# ============================================================================

@router.post("/export/csv")
def export_csv(
    request: schemas.CSVExportRequest,
    db: Session = Depends(get_db)
):
    """Export data as CSV."""
    business = crud.get_business(db, request.business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {request.business_id} not found",
        )
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Export transactions
    if "transactions" in request.entity_types:
        writer.writerow([
            "Date", "Account", "Payee", "Description", "Reference",
            "Direction", "Gross Amount", "Tax Amount", "Net Amount",
            "Category", "Special Type"
        ])
        
        accounts = db.query(models.Account).filter(
            models.Account.business_id == request.business_id
        ).all()
        
        row_count = 0
        for account in accounts:
            transactions = db.query(models.Transaction).filter(
                models.Transaction.account_id == account.id
            ).all()
            
            for tx in transactions:
                for line in tx.lines:
                    writer.writerow([
                        tx.date.isoformat(),
                        account.name,
                        tx.payee or "",
                        tx.description or "",
                        tx.reference or "",
                        tx.direction.value,
                        str(tx.gross_amount),
                        str(tx.tax_amount),
                        str(tx.net_amount),
                        line.category.code if line.category else "",
                        line.special_type.value if line.special_type else ""
                    ])
                    row_count += 1
    
    return schemas.CSVExportResponse(
        success=True,
        filename=f"export_{business.name}_{datetime.now().strftime('%Y%m%d')}.csv",
        data=output.getvalue(),
        row_count=row_count
    )


@router.get("/backup/{business_id}", response_model=schemas.BackupDataResponse)
def create_backup(
    business_id: int,
    db: Session = Depends(get_db)
):
    """Create a full backup of business data."""
    business = crud.get_business(db, business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {business_id} not found",
        )
    
    accounts = [
        {
            "id": a.id,
            "name": a.name,
            "type": a.type.value,
            "opening_balance": str(a.opening_balance),
            "is_archived": a.is_archived,
            "display_order": a.display_order,
        }
        for a in business.accounts
    ]
    
    categories = [
        {
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "type": c.type.value,
            "report": c.report.value,
            "is_archived": c.is_archived,
            "display_order": c.display_order,
        }
        for c in business.categories
    ]
    
    tax_rates = [
        {
            "id": t.id,
            "name": t.name,
            "rate": str(t.rate),
            "is_default": t.is_default,
            "is_archived": t.is_archived,
        }
        for t in business.tax_rates
    ]
    
    transactions = []
    for account in business.accounts:
        for tx in account.transactions:
            transactions.append({
                "id": tx.id,
                "account_name": account.name,
                "date": tx.date.isoformat(),
                "payee": tx.payee,
                "description": tx.description,
                "reference": tx.reference,
                "direction": tx.direction.value,
                "gross_amount": str(tx.gross_amount),
                "tax_amount": str(tx.tax_amount),
                "net_amount": str(tx.net_amount),
                "tax_rate_name": tx.tax_rate.name if tx.tax_rate else None,
                "is_reconciled": tx.is_reconciled,
                "lines": [
                    {
                        "category_code": line.category.code if line.category else None,
                        "special_type": line.special_type.value if line.special_type else None,
                        "amount": str(line.amount),
                    }
                    for line in tx.lines
                ]
            })
    
    return schemas.BackupDataResponse(
        exported_at=datetime.utcnow().isoformat(),
        business={
            "id": business.id,
            "name": business.name,
            "fiscal_year_start_month": business.fiscal_year_start_month,
            "currency": business.currency,
            "address_line1": business.address_line1,
            "address_line2": business.address_line2,
            "city": business.city,
            "postal_code": business.postal_code,
            "country": business.country,
            "tax_id": business.tax_id,
            "vat_number": business.vat_number,
            "phone": business.phone,
            "email": business.email,
            "website": business.website,
        },
        accounts=accounts,
        categories=categories,
        tax_rates=tax_rates,
        transactions=transactions,
    )


@router.post("/restore", response_model=schemas.RestoreResponse)
def restore_backup(
    request: schemas.RestoreRequest,
    db: Session = Depends(get_db)
):
    """Restore data from a backup."""
    warnings = []
    
    try:
        backup = request.backup_data
        business_data = backup.get("business", {})
        
        # Get or create business
        business_id = business_data.get("id")
        business = None
        if business_id:
            business = crud.get_business(db, business_id)
        
        if not business:
            business = models.Business(
                name=business_data.get("name", "Restored Business"),
                fiscal_year_start_month=business_data.get("fiscal_year_start_month", 1),
                currency=business_data.get("currency", "CHF"),
            )
            db.add(business)
            db.flush()
            business_id = business.id
        
        # Restore accounts
        account_map = {}  # old_id -> new_account
        for acc_data in backup.get("accounts", []):
            existing = db.query(models.Account).filter(
                models.Account.business_id == business_id,
                models.Account.name == acc_data["name"]
            ).first()
            
            if existing and request.merge_strategy == "skip":
                account_map[acc_data["id"]] = existing
                continue
            
            if existing and request.merge_strategy == "replace":
                existing.name = acc_data["name"]
                existing.type = acc_data["type"]
                existing.opening_balance = acc_data["opening_balance"]
                account_map[acc_data["id"]] = existing
            else:
                new_acc = models.Account(
                    business_id=business_id,
                    name=acc_data["name"],
                    type=acc_data["type"],
                    opening_balance=acc_data["opening_balance"],
                    is_archived=acc_data.get("is_archived", False),
                    display_order=acc_data.get("display_order", 0),
                )
                db.add(new_acc)
                db.flush()
                account_map[acc_data["id"]] = new_acc
        
        # Restore categories
        category_map = {}  # code -> category
        for cat_data in backup.get("categories", []):
            existing = db.query(models.Category).filter(
                models.Category.business_id == business_id,
                models.Category.code == cat_data["code"]
            ).first()
            
            if existing:
                existing.name = cat_data["name"]
                existing.type = cat_data["type"]
                category_map[cat_data["code"]] = existing
            else:
                new_cat = models.Category(
                    business_id=business_id,
                    code=cat_data["code"],
                    name=cat_data["name"],
                    type=cat_data["type"],
                    report=cat_data["report"],
                    is_archived=cat_data.get("is_archived", False),
                    display_order=cat_data.get("display_order", 0),
                )
                db.add(new_cat)
                db.flush()
                category_map[cat_data["code"]] = new_cat
        
        # Restore tax rates
        tax_rate_map = {}  # name -> tax_rate
        for tax_data in backup.get("tax_rates", []):
            existing = db.query(models.TaxRate).filter(
                models.TaxRate.business_id == business_id,
                models.TaxRate.name == tax_data["name"]
            ).first()
            
            if existing:
                existing.rate = tax_data["rate"]
                existing.is_default = tax_data.get("is_default", False)
                tax_rate_map[tax_data["name"]] = existing
            else:
                new_tax = models.TaxRate(
                    business_id=business_id,
                    name=tax_data["name"],
                    rate=tax_data["rate"],
                    is_default=tax_data.get("is_default", False),
                    is_archived=tax_data.get("is_archived", False),
                )
                db.add(new_tax)
                db.flush()
                tax_rate_map[tax_data["name"]] = new_tax
        
        # Restore transactions
        tx_count = 0
        for tx_data in backup.get("transactions", []):
            account_name = tx_data.get("account_name")
            account = None
            for acc in account_map.values():
                if acc.name == account_name:
                    account = acc
                    break
            
            if not account:
                warnings.append(f"Skipping transaction: account '{account_name}' not found")
                continue
            
            tax_rate = None
            if tx_data.get("tax_rate_name"):
                tax_rate = tax_rate_map.get(tx_data["tax_rate_name"])
            
            new_tx = models.Transaction(
                account_id=account.id,
                date=tx_data["date"],
                payee=tx_data.get("payee"),
                description=tx_data.get("description"),
                reference=tx_data.get("reference"),
                direction=tx_data["direction"],
                gross_amount=tx_data["gross_amount"],
                tax_amount=tx_data["tax_amount"],
                net_amount=tx_data["net_amount"],
                tax_rate_id=tax_rate.id if tax_rate else None,
                is_reconciled=tx_data.get("is_reconciled", False),
            )
            db.add(new_tx)
            db.flush()
            
            # Restore transaction lines
            for line_data in tx_data.get("lines", []):
                category = None
                if line_data.get("category_code"):
                    category = category_map.get(line_data["category_code"])
                
                line = models.TransactionLine(
                    transaction_id=new_tx.id,
                    category_id=category.id if category else None,
                    special_type=line_data.get("special_type"),
                    amount=line_data["amount"],
                )
                db.add(line)
            
            tx_count += 1
        
        db.commit()
        
        return schemas.RestoreResponse(
            success=True,
            accounts_restored=len(account_map),
            categories_restored=len(category_map),
            tax_rates_restored=len(tax_rate_map),
            transactions_restored=tx_count,
            warnings=warnings
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Restore failed: {str(e)}"
        )


@router.post("/delete-all", response_model=schemas.DataDeleteResponse)
def delete_all_data(
    request: schemas.DataDeleteRequest,
    db: Session = Depends(get_db)
):
    """Delete all data for a business."""
    if not request.confirm_delete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must set confirm_delete=true to proceed"
        )
    
    business = crud.get_business(db, request.business_id)
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Business {request.business_id} not found",
        )
    
    transactions_deleted = 0
    accounts_deleted = 0
    categories_deleted = 0
    tax_rates_deleted = 0
    
    # Delete transactions
    if request.delete_transactions:
        for account in business.accounts:
            transactions_deleted += len(account.transactions)
            for tx in account.transactions:
                db.delete(tx)
    
    # Delete accounts
    if request.delete_accounts:
        accounts_deleted = len(business.accounts)
        for account in business.accounts:
            db.delete(account)
    
    # Delete categories
    if request.delete_categories:
        categories_deleted = len(business.categories)
        for category in business.categories:
            db.delete(category)
    
    # Delete tax rates
    if request.delete_tax_rates:
        tax_rates_deleted = len(business.tax_rates)
        for tax_rate in business.tax_rates:
            db.delete(tax_rate)
    
    db.commit()
    
    return schemas.DataDeleteResponse(
        success=True,
        transactions_deleted=transactions_deleted,
        accounts_deleted=accounts_deleted,
        categories_deleted=categories_deleted,
        tax_rates_deleted=tax_rates_deleted,
        message="Data deleted successfully"
    )


# ============================================================================
# Excel Import (moved from import_excel router)
# ============================================================================

@router.post("/import/excel")
def import_excel_settings(
    file: UploadFile = File(...),
    business_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Import data from Excel file."""
    from ..excel_import import ExcelImportService, ExcelImportError
    
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an .xlsx Excel file"
        )
    
    try:
        service = ExcelImportService(db)
        result = service.import_excel(file, business_id)
        return result
    except ExcelImportError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {str(e)}"
        )


@router.get("/import/template")
def get_import_template_info():
    """Get Excel import template information."""
    from ..routers.import_excel import get_template_info
    return get_template_info()
