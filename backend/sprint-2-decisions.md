# Sprint 2 Decisions Log

## Initial Assessment
- Timestamp: 2026-02-24 01:56
- Task: Build FastAPI backend for Accounting Tool
- Mode: JOLO (Just Operate, Little Overseer)

## Assumptions Made
1. Using FastAPI + SQLAlchemy + Pydantic stack
2. SQLite database named `accounting.db`
3. Tax calculation formula: `tax = gross / (1 + rate)`
4. Transaction allocations must sum to transaction total
5. Business-centric design: all entities belong to a business
6. Using Python 3.10+ type hints
7. No authentication for MVP (Phase 1)
8. Auto-calculate tax on transaction creation if not provided

## Architecture Decisions
- Single `app/` directory with modular structure
- Separate routers, schemas, models, and crud modules
- Database session management with dependency injection
- Transaction table with JSON allocations field
- Balance computed on-the-fly from transaction allocations

## Implementation Notes

### Files Created/Modified
1. `app/database.py` - Database engine and session management
2. `app/schemas.py` - Pydantic schemas for all entities
3. `app/crud.py` - CRUD operations for all entities
4. `app/routers/businesses.py` - Business endpoints
5. `app/routers/accounts.py` - Account endpoints (includes /balance)
6. `app/routers/categories.py` - Category endpoints
7. `app/routers/tax_rates.py` - Tax rate endpoints
8. `app/routers/transactions.py` - Transaction endpoints
9. `app/routers/__init__.py` - Router exports
10. `app/main.py` - FastAPI application entry point
11. `app/__init__.py` - App package init
12. `accounting.db` - SQLite database (created at runtime)

### Endpoints Implemented
- GET/POST /businesses
- GET/PATCH/DELETE /businesses/{id}
- GET/POST /accounts?business_id={id}
- GET/PATCH/DELETE /accounts/{id}
- GET /accounts/{id}/balance
- GET/POST /categories?business_id={id}
- GET/PATCH/DELETE /categories/{id}
- GET/POST /tax-rates?business_id={id}
- GET/PATCH/DELETE /tax-rates/{id}
- GET/POST /transactions?account_id={id}
- GET/PATCH/DELETE /transactions/{id}

### Acceptance Criteria Verified
✅ POST /transactions creates with auto tax calc
✅ GET /accounts/{id}/balance returns current balance
✅ Invalid allocations return 422

### Tax Calculation Formula
- tax = gross / (1 + rate)
- net = gross - tax
- Example: gross=1081, rate=0.081 → tax=1000, net=81

### Transaction Allocation Validation
- Allocations must sum to gross_amount (±0.01 for rounding)
- Each allocation must have category_id OR special_type
- Validation returns 422 Unprocessable Entity on failure

### Running Balance Computation
- Opening balance + total_in - total_out
- Computed on-the-fly from all transactions for account

## Completion
- Timestamp: 2026-02-24 02:09
- Status: COMPLETE
