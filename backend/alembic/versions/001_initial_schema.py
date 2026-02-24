"""Initial migration: Create all accounting tables

Revision ID: 001
Revises: 
Create Date: 2026-02-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create businesses table
    op.create_table(
        'businesses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('fiscal_year_start_month', sa.Integer(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.CheckConstraint('fiscal_year_start_month >= 1 AND fiscal_year_start_month <= 12', name='valid_fiscal_month'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create accounts table
    op.create_table(
        'accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('business_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('type', sa.Enum('BANK', 'CREDIT_CARD', 'ASSET', name='accounttype'), nullable=False),
        sa.Column('opening_balance', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('business_id', 'name', name='unique_account_name_per_business')
    )
    
    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('business_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('type', sa.Enum('INCOME', 'COGS', 'EXPENSE', name='categorytype'), nullable=False),
        sa.Column('report', sa.Enum('PL', 'BS', name='reporttype'), nullable=False),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('business_id', 'code', name='unique_category_code_per_business')
    )
    
    # Create tax_rates table
    op.create_table(
        'tax_rates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('business_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('rate', sa.Numeric(precision=5, scale=4), nullable=False),
        sa.CheckConstraint('rate >= 0 AND rate < 1', name='valid_tax_rate'),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('business_id', 'name', name='unique_tax_name_per_business')
    )
    
    # Create transactions table
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('payee', sa.String(length=255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reference', sa.String(length=100), nullable=True),
        sa.Column('direction', sa.Enum('IN', 'OUT', name='transactiondirection'), nullable=False),
        sa.Column('gross_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('tax_rate_id', sa.Integer(), nullable=True),
        sa.Column('tax_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('net_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('is_reconciled', sa.Boolean(), nullable=False),
        sa.CheckConstraint('gross_amount >= 0', name='non_negative_gross'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
        sa.ForeignKeyConstraint(['tax_rate_id'], ['tax_rates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_transactions_account_id', 'transactions', ['account_id'])
    op.create_index('ix_transactions_date', 'transactions', ['date'])
    
    # Create transaction_lines table
    op.create_table(
        'transaction_lines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('special_type', sa.Enum(
            'CAPITAL', 'LOAN_IN', 'TRANSFER_IN', 'TRANSFER_OUT',
            'ASSET_PURCHASE', 'TAX_PAYMENT', 'LOAN_REPAYMENT',
            'DRAWINGS', 'INCOME_TAX', 'PAYROLL_TAX',
            name='specialtype'
        ), nullable=True),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.CheckConstraint('amount > 0', name='positive_amount'),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.ForeignKeyConstraint(['transaction_id'], ['transactions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_transaction_lines_transaction_id', 'transaction_lines', ['transaction_id'])


def downgrade() -> None:
    op.drop_index('ix_transaction_lines_transaction_id', table_name='transaction_lines')
    op.drop_table('transaction_lines')
    op.drop_index('ix_transactions_date', table_name='transactions')
    op.drop_index('ix_transactions_account_id', table_name='transactions')
    op.drop_table('transactions')
    op.drop_table('tax_rates')
    op.drop_table('categories')
    op.drop_table('accounts')
    op.drop_table('businesses')
    
    # Drop enum types (PostgreSQL-specific, harmless in SQLite)
    op.execute('DROP TYPE IF EXISTS specialtype')
    op.execute('DROP TYPE IF EXISTS transactiondirection')
    op.execute('DROP TYPE IF EXISTS reporttype')
    op.execute('DROP TYPE IF EXISTS categorytype')
    op.execute('DROP TYPE IF EXISTS accounttype')
