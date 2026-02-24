"""Script to run migrations directly"""
import sys
sys.path.insert(0, '/home/skai8888/code/other projects/Accounting tool/10-mvp/backend')

from alembic.config import Config
from alembic import command

alembic_cfg = Config('/home/skai8888/code/other projects/Accounting tool/10-mvp/backend/alembic.ini')
alembic_cfg.set_main_option('script_location', '/home/skai8888/code/other projects/Accounting tool/10-mvp/backend/alembic')
alembic_cfg.set_main_option('sqlalchemy.url', 'sqlite:///./accounting.db')

# Upgrade to latest
command.upgrade(alembic_cfg, 'head')
print("Migration completed successfully!")
