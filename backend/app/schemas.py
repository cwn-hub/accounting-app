"""
Pydantic schemas for request/response validation.
"""
from datetime import date
from decimal import Decimal
from typing import List, Optional, Dict

from pydantic import BaseModel, Field, ConfigDict, model_validator


# ============================================================================
# Business Schemas
# ============================================================================

class BusinessBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    fiscal_year_start_month: int = Field(default=1, ge=1, le=12)
    currency: str = Field(default="CHF", min_length=3, max_length=3)


class BusinessCreate(BusinessBase):
    pass


class BusinessUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    fiscal_year_start_month: Optional[int] = Field(None, ge=1, le=12)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)


class BusinessSettingsUpdate(BaseModel):
    """Schema for updating extended business settings."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    fiscal_year_start_month: Optional[int] = Field(None, ge=1, le=12)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, min_length=2, max_length=2)
    tax_id: Optional[str] = Field(None, max_length=50)
    vat_number: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=255)


class BusinessResponse(BusinessBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class BusinessSettingsResponse(BaseModel):
    """Full business settings response including extended fields."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    fiscal_year_start_month: int
    currency: str
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    vat_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None


# ============================================================================
# Account Schemas
# ============================================================================

class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(default="bank")
    opening_balance: Decimal = Field(default=Decimal("0.00"))


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = None
    opening_balance: Optional[Decimal] = None
    is_archived: Optional[bool] = None
    display_order: Optional[int] = None


class AccountResponse(AccountBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    business_id: int
    is_archived: bool
    display_order: int


class AccountBalanceResponse(BaseModel):
    account_id: int
    account_name: str
    opening_balance: Decimal
    current_balance: Decimal
    total_in: Decimal
    total_out: Decimal


# ============================================================================
# Category Schemas
# ============================================================================

class CategoryBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(...)
    report: str = Field(default="pl")


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    type: Optional[str] = None
    is_archived: Optional[bool] = None
    display_order: Optional[int] = None


class CategoryReorderRequest(BaseModel):
    """Request to reorder categories."""
    category_ids: List[int]


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    business_id: int
    is_archived: bool
    display_order: int


# ============================================================================
# Tax Rate Schemas
# ============================================================================

class TaxRateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    rate: Decimal = Field(..., ge=Decimal("0"), lt=Decimal("1"))


class TaxRateCreate(TaxRateBase):
    pass


class TaxRateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    rate: Optional[Decimal] = Field(None, ge=Decimal("0"), lt=Decimal("1"))
    is_default: Optional[bool] = None
    is_archived: Optional[bool] = None


class TaxRateSetDefaultRequest(BaseModel):
    """Request to set a tax rate as default."""
    tax_rate_id: int


class TaxRateResponse(TaxRateBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    business_id: int
    is_default: bool
    is_archived: bool


# ============================================================================
# Transaction Allocation Schemas
# ============================================================================

class TransactionAllocation(BaseModel):
    category_id: Optional[int] = None
    special_type: Optional[str] = None
    amount: Decimal = Field(..., gt=Decimal("0"))


# ============================================================================
# Validation Error Schemas (for Frontend Error Display)
# ============================================================================

class ValidationError(BaseModel):
    """Schema for validation errors returned to frontend."""
    transaction_id: int
    account_id: Optional[int] = None
    date: Optional[str] = None
    gross_amount: Optional[str] = None
    error_type: str
    severity: str  # error, warning, info
    message: str
    expected_net: Optional[str] = None
    allocated_total: Optional[str] = None
    difference: Optional[str] = None
    days_unreconciled: Optional[int] = None
    transfer_type: Optional[str] = None


class ValidationResponse(BaseModel):
    """Schema for validation endpoint response."""
    business_id: int
    year: Optional[int] = None
    month: Optional[int] = None
    total_transactions_checked: int
    error_count: int
    warning_count: int
    errors: List[ValidationError]
    warnings: List[ValidationError]


class TransferValidationMonth(BaseModel):
    """Schema for monthly transfer validation result."""
    month: int
    is_balanced: bool
    total_transfers_out: str
    total_transfers_in: str
    difference: str
    transfers_out_count: int
    transfers_in_count: int
    transfers_out: List[Dict]
    transfers_in: List[Dict]


class TransferValidationResponse(BaseModel):
    """Schema for transfer validation endpoint response."""
    business_id: int
    year: int
    months: Dict[str, TransferValidationMonth]
    all_balanced: bool
    unbalanced_months: List[int]


class FullValidationReport(BaseModel):
    """Schema for full validation report."""
    business_id: int
    year: int
    status: str  # valid, invalid, warnings
    has_errors: bool
    has_warnings: bool
    summary: Dict
    transfer_validation: TransferValidationResponse
    transaction_validation: ValidationResponse


# ============================================================================
# Tax Report Schemas
# ============================================================================

class TaxReportMonth(BaseModel):
    """Schema for monthly tax data."""
    month: int
    tax_collected: str
    tax_paid: str
    tax_payments: str
    net_tax_payable: str


class TaxReportSummary(BaseModel):
    """Schema for tax report summary."""
    total_tax_collected: str
    total_tax_paid: str
    total_tax_payments: str
    net_tax_payable: str


class TaxReportResponse(BaseModel):
    """Schema for tax report endpoint response."""
    business_id: int
    year: int
    currency: str
    months: Dict[str, TaxReportMonth]
    summary: TaxReportSummary


# ============================================================================
# Transaction Schemas
# ============================================================================

class TransactionBase(BaseModel):
    date: date
    payee: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    reference: Optional[str] = Field(None, max_length=100)
    direction: str = Field(..., pattern="^(in|out)$")
    gross_amount: Decimal = Field(..., ge=Decimal("0"))


class TransactionCreate(TransactionBase):
    tax_rate_id: Optional[int] = None
    tax_amount: Optional[Decimal] = None
    net_amount: Optional[Decimal] = None
    allocations: List[TransactionAllocation]

    @model_validator(mode="after")
    def validate_allocations(self):
        # Validate allocations sum to gross_amount
        if not self.allocations:
            raise ValueError("At least one allocation is required")
        
        total_allocated = sum(a.amount for a in self.allocations)
        # Allow small floating point difference
        if abs(total_allocated - self.gross_amount) > Decimal("0.01"):
            raise ValueError(
                f"Allocations must sum to gross_amount. "
                f"Sum: {total_allocated}, Expected: {self.gross_amount}"
            )
        
        # Validate that each allocation has either category_id or special_type
        for alloc in self.allocations:
            if alloc.category_id is None and alloc.special_type is None:
                raise ValueError(
                    "Each allocation must have either category_id or special_type"
                )
        
        return self


class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    payee: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    reference: Optional[str] = Field(None, max_length=100)
    direction: Optional[str] = Field(None, pattern="^(in|out)$")
    gross_amount: Optional[Decimal] = Field(None, ge=Decimal("0"))
    tax_rate_id: Optional[int] = None
    is_reconciled: Optional[bool] = None
    allocations: Optional[List[TransactionAllocation]] = None

    @model_validator(mode="after")
    def validate_allocations(self):
        if self.allocations is not None:
            if not self.allocations:
                raise ValueError("At least one allocation is required")
            
            gross = self.gross_amount
            if gross is None:
                # If updating allocations without gross_amount, skip validation
                # The CRUD layer will handle this
                return self
            
            total_allocated = sum(a.amount for a in self.allocations)
            if abs(total_allocated - gross) > Decimal("0.01"):
                raise ValueError(
                    f"Allocations must sum to gross_amount. "
                    f"Sum: {total_allocated}, Expected: {gross}"
                )
            
            for alloc in self.allocations:
                if alloc.category_id is None and alloc.special_type is None:
                    raise ValueError(
                        "Each allocation must have either category_id or special_type"
                    )
        
        return self


class TransactionLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category_id: Optional[int]
    special_type: Optional[str]
    amount: Decimal


class TransactionResponse(TransactionBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    account_id: int
    tax_rate_id: Optional[int]
    tax_amount: Decimal
    net_amount: Decimal
    is_reconciled: bool
    lines: List[TransactionLineResponse]


class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int


# ============================================================================
# Data Management Schemas
# ============================================================================

class CSVExportRequest(BaseModel):
    """Request to export data as CSV."""
    business_id: int
    year: Optional[int] = None
    month: Optional[int] = None
    entity_types: List[str] = Field(default=["transactions"])  # transactions, accounts, categories


class CSVExportResponse(BaseModel):
    """Response with CSV export data."""
    success: bool
    filename: str
    content_type: str = "text/csv"
    data: str  # CSV content as string
    row_count: int


class BackupDataResponse(BaseModel):
    """Response with full backup data."""
    version: str = "1.0"
    exported_at: str
    business: Dict
    accounts: List[Dict]
    categories: List[Dict]
    tax_rates: List[Dict]
    transactions: List[Dict]


class RestoreRequest(BaseModel):
    """Request to restore from backup."""
    backup_data: Dict
    merge_strategy: str = "replace"  # replace, merge, skip


class RestoreResponse(BaseModel):
    """Response from restore operation."""
    success: bool
    accounts_restored: int
    categories_restored: int
    tax_rates_restored: int
    transactions_restored: int
    warnings: List[str]


class DataDeleteRequest(BaseModel):
    """Request to delete all data."""
    business_id: int
    confirm_delete: bool = False
    delete_transactions: bool = True
    delete_accounts: bool = False
    delete_categories: bool = False
    delete_tax_rates: bool = False


class DataDeleteResponse(BaseModel):
    """Response from data deletion."""
    success: bool
    transactions_deleted: int
    accounts_deleted: int
    categories_deleted: int
    tax_rates_deleted: int
    message: str
