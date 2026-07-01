"""message attachments column

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-07-01

"""
from alembic import op
import sqlalchemy as sa

revision = "e5f6a7b8c9d0"
down_revision = "d4e5f6a7b8c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("messages")]
    if "attachments" not in columns:
        op.add_column("messages", sa.Column("attachments", sa.JSON(), nullable=True, server_default="[]"))
        op.execute("UPDATE messages SET attachments = '[]' WHERE attachments IS NULL")
        op.alter_column("messages", "attachments", nullable=False, server_default="[]")


def downgrade() -> None:
    op.drop_column("messages", "attachments")
