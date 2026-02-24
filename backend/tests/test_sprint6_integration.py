"""
Integration Test for Sprint 6: End-to-End Workflow
Tests: Import Excel → View Reports → Export CSV
"""
import pytest
from decimal import Decimal
from datetime import date
import io
import csv

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import Business, Account, Category, TaxRate, Transaction


# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module")
def setup_db():
    """Create test database tables."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Get a database session for tests."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestEndToEndWorkflow:
    """End-to-end integration test: Import → Reports → Export"""
    
    def test_step1_import_excel_template(self, setup_db):
        """Step 1: Import the Excel template."""
        # Load the template file
        template_path = "/home/skai8888/code/other projects/Accounting tool/10-mvp/00-source-excel/Accounting-Excel-Template.xlsx"
        
        with open(template_path, "rb") as f:
            response = client.post(
                "/import/excel",
                files={"file": ("Accounting-Excel-Template.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            )
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["success"] is True
        assert result["business_id"] is not None
        assert result["business_name"] == "My Company Ltd"
        assert result["accounts_imported"] == 3
        assert result["categories_imported"] == 26
        assert result["tax_rates_imported"] == 3
        
        # Store business_id for subsequent tests
        self.__class__.business_id = result["business_id"]
        self.__class__.year = 2024
    
    def test_step2_verify_business_config(self, setup_db, db_session):
        """Step 2: Verify business was created with correct config."""
        business = db_session.query(Business).filter(Business.id == self.business_id).first()
        
        assert business is not None
        assert business.name == "My Company Ltd"
        assert business.fiscal_year_start_month == 1
        assert business.currency == "CHF"
    
    def test_step3_verify_accounts(self, setup_db, db_session):
        """Step 3: Verify accounts were imported."""
        accounts = db_session.query(Account).filter(Account.business_id == self.business_id).all()
        
        assert len(accounts) == 3
        
        account_names = {a.name for a in accounts}
        assert "Bank Account #1" in account_names
        assert "Bank Account #2" in account_names
        assert "Credit Card Account" in account_names
    
    def test_step4_verify_categories(self, setup_db, db_session):
        """Step 4: Verify all 26 categories were imported."""
        categories = db_session.query(Category).filter(Category.business_id == self.business_id).all()
        
        assert len(categories) == 26
        
        # Verify income categories (head_1-5)
        income_cats = [c for c in categories if c.type == "income"]
        assert len(income_cats) == 5
        
        # Verify COGS categories (head_6-11)
        cogs_cats = [c for c in categories if c.type == "cogs"]
        assert len(cogs_cats) == 6
        
        # Verify expense categories (head_12-26)
        expense_cats = [c for c in categories if c.type == "expense"]
        assert len(expense_cats) == 15
    
    def test_step5_verify_tax_rates(self, setup_db, db_session):
        """Step 5: Verify tax rates were imported."""
        tax_rates = db_session.query(TaxRate).filter(TaxRate.business_id == self.business_id).all()
        
        assert len(tax_rates) == 3
        
        tax_names = {t.name for t in tax_rates}
        assert "VAT Exempt" in tax_names
        assert "VAT 2.5%" in tax_names
        assert "VAT 8.1%" in tax_names
    
    def test_step6_generate_pl_report(self, setup_db):
        """Step 6: Generate P&L report."""
        response = client.get(
            "/reports/pl",
            params={"business_id": self.business_id, "year": self.year}
        )
        
        assert response.status_code == 200
        report = response.json()
        
        assert report["business_id"] == self.business_id
        assert report["year"] == self.year
        assert "months" in report
        assert "ytd" in report
        assert len(report["months"]) == 12
    
    def test_step7_export_pl_csv(self, setup_db):
        """Step 7: Export P&L report as CSV."""
        response = client.get(
            "/reports/pl",
            params={"business_id": self.business_id, "year": self.year, "format": "csv"}
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        
        # Verify CSV content
        csv_content = response.text
        assert "P&L Report" in csv_content
        assert "Year:" in csv_content
        assert "Category" in csv_content
        assert "YTD" in csv_content
        
        # Try parsing as CSV
        reader = csv.reader(io.StringIO(csv_content))
        rows = list(reader)
        assert len(rows) > 0
    
    def test_step8_generate_balance_sheet(self, setup_db):
        """Step 8: Generate Balance Sheet report."""
        response = client.get(
            "/reports/balance-sheet",
            params={"business_id": self.business_id, "year": self.year}
        )
        
        assert response.status_code == 200
        report = response.json()
        
        assert report["business_id"] == self.business_id
        assert report["year"] == self.year
        assert "months" in report
        assert "validation" in report
        
        # Verify validation is present for each month
        for month in range(1, 13):
            assert str(month) in report["validation"]
    
    def test_step9_export_balance_sheet_csv(self, setup_db):
        """Step 9: Export Balance Sheet as CSV."""
        response = client.get(
            "/reports/balance-sheet",
            params={"business_id": self.business_id, "year": self.year, "format": "csv"}
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        
        csv_content = response.text
        assert "Balance Sheet Report" in csv_content
        assert "ASSETS" in csv_content
        assert "LIABILITIES" in csv_content
        assert "EQUITY" in csv_content
        assert "VALIDATION" in csv_content
    
    def test_step10_generate_tax_report(self, setup_db):
        """Step 10: Generate Tax report."""
        response = client.get(
            "/reports/tax",
            params={"business_id": self.business_id, "year": self.year}
        )
        
        assert response.status_code == 200
        report = response.json()
        
        assert report["business_id"] == self.business_id
        assert report["year"] == self.year
        assert "months" in report
        assert "summary" in report
        
        summary = report["summary"]
        assert "total_tax_collected" in summary
        assert "total_tax_paid" in summary
        assert "net_tax_payable" in summary
    
    def test_step11_export_tax_csv(self, setup_db):
        """Step 11: Export Tax report as CSV."""
        response = client.get(
            "/reports/tax",
            params={"business_id": self.business_id, "year": self.year, "format": "csv"}
        )
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        
        csv_content = response.text
        assert "Sales Tax Report" in csv_content
        assert "Tax Collected" in csv_content
        assert "Tax Paid" in csv_content
        assert "Net Tax Payable" in csv_content
    
    def test_step12_api_health_check(self):
        """Step 12: Verify API health."""
        response = client.get("/health")
        
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_step13_root_endpoint(self):
        """Step 13: Verify root endpoint."""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "Accounting Tool API"
        assert "excel_import" in data["features"]
        assert "csv_export" in data["features"]
    
    def test_step14_import_template_info(self):
        """Step 14: Verify import template info endpoint."""
        response = client.get("/import/template")
        
        assert response.status_code == 200
        info = response.json()
        
        assert "template_name" in info
        assert "sheets" in info
        assert "transaction_sheets" in info
        assert "limits" in info
        
        # Verify required sheets are documented
        sheet_names = {s["name"] for s in info["sheets"]}
        assert "Business Config" in sheet_names
        assert "Accounts" in sheet_names
        assert "Categories" in sheet_names
        assert "Tax Rates" in sheet_names


class TestExcelImportEdgeCases:
    """Test Excel import edge cases and error handling."""
    
    def test_import_invalid_file_type(self, setup_db):
        """Test importing non-Excel file."""
        response = client.post(
            "/import/excel",
            files={"file": ("test.txt", b"not an excel file", "text/plain")}
        )
        
        assert response.status_code == 400
        assert "xlsx" in response.json()["detail"].lower()
    
    def test_import_nonexistent_business_id(self, setup_db):
        """Test importing with non-existent business ID."""
        template_path = "/home/skai8888/code/other projects/Accounting tool/10-mvp/00-source-excel/Accounting-Excel-Template.xlsx"
        
        with open(template_path, "rb") as f:
            response = client.post(
                "/import/excel?business_id=99999",
                files={"file": ("Accounting-Excel-Template.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            )
        
        assert response.status_code == 400


class TestReportErrorHandling:
    """Test report endpoint error handling."""
    
    def test_pl_report_missing_params(self, setup_db):
        """Test P&L report without required params."""
        response = client.get("/reports/pl")
        assert response.status_code == 422  # Validation error
    
    def test_balance_sheet_missing_params(self, setup_db):
        """Test Balance Sheet without required params."""
        response = client.get("/reports/balance-sheet")
        assert response.status_code == 422
    
    def test_tax_report_missing_params(self, setup_db):
        """Test Tax report without required params."""
        response = client.get("/reports/tax")
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
