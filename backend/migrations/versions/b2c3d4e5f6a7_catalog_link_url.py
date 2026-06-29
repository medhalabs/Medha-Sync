"""add link_url to catalog_items

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-29

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "catalog_items" in inspector.get_table_names():
        existing_cols = {c["name"] for c in inspector.get_columns("catalog_items")}
        if "link_url" not in existing_cols:
            op.add_column("catalog_items", sa.Column("link_url", sa.String(), nullable=True))


def downgrade():
    op.drop_column('catalog_items', 'link_url')
