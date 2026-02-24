"""
Accounting Tool - FastAPI Application
Swiss cash-basis accounting SaaS

Sprint 5: Tax & Validation
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from .models import Base
from .routers import (
    businesses_router,
    accounts_router,
    categories_router,
    tax_rates_router,
    transactions_router,
    reports_router,
    validation_router,
    import_excel_router,
    settings_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Nothing to clean up


app = FastAPI(
    title="Accounting Tool API",
    description="Swiss cash-basis accounting SaaS - API for managing businesses, accounts, transactions, tax reports, validation, and Excel import",
    version="0.6.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(businesses_router)
app.include_router(accounts_router)
app.include_router(categories_router)
app.include_router(tax_rates_router)
app.include_router(transactions_router)
app.include_router(reports_router)
app.include_router(validation_router)
app.include_router(import_excel_router)
app.include_router(settings_router)


@app.get("/")
def root():
    """Root endpoint - API info."""
    return {
        "name": "Accounting Tool API",
        "version": "0.5.0",
        "docs": "/docs",
        "features": [
            "business_management",
            "account_management",
            "transaction_processing",
            "pl_reports",
            "balance_sheet_reports",
            "tax_reports",
            "transfer_validation",
            "error_highlighting",
            "excel_import",
            "csv_export",
        ],
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
