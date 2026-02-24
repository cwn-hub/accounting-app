"""add_settings_fields

Revision ID: 002
Revises: 001
Create Date: 2026-02-24 04:06:43

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to businesses table
    op.add_column('businesses', sa.Column('address_line1', sa.String(255), nullable=True))
    op.add_column('businesses', sa.Column('address_line2', sa.String(255), nullable=True))
    op.add_column('businesses', sa.Column('city', sa.String(100), nullable=True))
    op.add_column('businesses', sa.Column('postal_code', sa.String(20), nullable=True))
    op.add_column('businesses', sa.Column('country', sa.String(2), nullable=True, server_default='CH'))
    op.add_column('businesses', sa.Column('vat_number', sa.String(50), nullable=True))
    op.add_column('businesses', sa.Column('phone', sa.String(50), nullable=True))
    op.add_column('businesses', sa.Column('email', sa.String(255), nullable=True))
    op.add_column('businesses', sa.Column('website', sa.String(255), nullable=True))
    op.add_column('businesses', sa.Column('logo_url', sa.String(500), nullable=True))
    
    # Add new columns to accounts table
    op.add_column('accounts', sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('accounts', sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'))
    
    # Add new columns to categories table
    op.add_column('categories', sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('categories', sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'))
    
    # Add new columns to tax_rates table
    op.add_column('tax_rates', sa.Column('is_default', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('tax_rates', sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='0'))


def downgrade() -> None:
    # Remove columns from businesses table
    op.drop_column('businesses', 'address_line1')
    op.drop_column('businesses', 'address_line2')
    op.drop_column('businesses', 'city')
    op.drop_column('businesses', 'postal_code')
    op.drop_column('businesses', 'country')
    op.drop_column('businesses', 'vat_number')
    op.drop_column('businesses', 'phone')
    op.drop_column('businesses', 'email')
    op.drop_column('businesses', 'website')
    op.drop_column('businesses', 'logo_url')
    
    # Remove columns from accounts table
    op.drop_column('accounts', 'is_archived')
    op.drop_column('accounts', 'display_order')
    
    # Remove columns from categories table
    op.drop_column('categories', 'is_archived')
    op.drop_column('categories', 'display_order')
    
    # Remove columns from tax_rates table
    op.drop_column('tax_rates', 'is_default')
    op.drop_column('tax_rates', 'is_archived')
