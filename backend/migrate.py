"""Direct migration using SQLAlchemy"""
import sys
sys.path.insert(0, '/home/skai8888/code/other projects/Accounting tool/10-mvp/backend')

from sqlalchemy import create_engine, text

# Create engine
engine = create_engine('sqlite:///./accounting.db')

# Get connection
with engine.connect() as conn:
    # Check if columns exist
    result = conn.execute(text("""
        SELECT name FROM pragma_table_info('businesses')
    """))
    existing_columns = [row[0] for row in result]
    
    # Add columns to businesses if not exists
    if 'address_line1' not in existing_columns:
        conn.execute(text("ALTER TABLE businesses ADD COLUMN address_line1 VARCHAR(255)"))
    if 'address_line2' not in existing_columns:
        conn.execute(text("ALTER TABLE businesses ADD COLUMN address_line2 VARCHAR(255)"))
    if 'city' not in existing_columns:
        conn.execute(text("ALTER TABLE businesses ADD COLUMN city VARCHAR(100)"))
    if 'postal_code' not in existing_columns:
        conn.execute(text("ALTER TABLE businesses ADD COLUMN postal_code VARCHAR(20)"))
    if 'country' not in existing_columns:
        conn.execute(text("ALTER TABLE businesses ADD COLUMN country VARCHAR(2) DEFAULT 'CH'"))
    if 'vat_number' not in existing_columns:
        conn.execute(text("ALTER TABLE businesses ADD COLUMN vat_number VARCHAR(50)"))
    if 'phone' not in existing_columns:
        conn.execute(text("ALTER TABLE businesses ADD COLUMN phone VARCHAR(50)"))
    if 'email' not in existing_columns:
        conn.execute(text("ALTER TABLE businesses ADD COLUMN email VARCHAR(255)"))
    if 'website' not in existing_columns:
        conn.execute(text("ALTER TABLE businesses ADD COLUMN website VARCHAR(255)"))
    if 'logo_url' not in existing_columns:
        conn.execute(text("ALTER TABLE businesses ADD COLUMN logo_url VARCHAR(500)"))
    
    # Add columns to accounts if not exists
    result = conn.execute(text("""
        SELECT name FROM pragma_table_info('accounts')
    """))
    existing_columns = [row[0] for row in result]
    
    if 'is_archived' not in existing_columns:
        conn.execute(text("ALTER TABLE accounts ADD COLUMN is_archived BOOLEAN DEFAULT 0"))
    if 'display_order' not in existing_columns:
        conn.execute(text("ALTER TABLE accounts ADD COLUMN display_order INTEGER DEFAULT 0"))
    
    # Add columns to categories if not exists
    result = conn.execute(text("""
        SELECT name FROM pragma_table_info('categories')
    """))
    existing_columns = [row[0] for row in result]
    
    if 'is_archived' not in existing_columns:
        conn.execute(text("ALTER TABLE categories ADD COLUMN is_archived BOOLEAN DEFAULT 0"))
    if 'display_order' not in existing_columns:
        conn.execute(text("ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0"))
    
    # Add columns to tax_rates if not exists
    result = conn.execute(text("""
        SELECT name FROM pragma_table_info('tax_rates')
    """))
    existing_columns = [row[0] for row in result]
    
    if 'is_default' not in existing_columns:
        conn.execute(text("ALTER TABLE tax_rates ADD COLUMN is_default BOOLEAN DEFAULT 0"))
    if 'is_archived' not in existing_columns:
        conn.execute(text("ALTER TABLE tax_rates ADD COLUMN is_archived BOOLEAN DEFAULT 0"))
    
    conn.commit()

print("Migration completed successfully!")
