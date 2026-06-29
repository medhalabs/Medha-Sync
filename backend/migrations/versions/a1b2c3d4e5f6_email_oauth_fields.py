"""add_email_oauth_fields

Revision ID: a1b2c3d4e5f6
Revises: 878fe3c75433
Create Date: 2026-06-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '878fe3c75433'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Only add columns if the table exists (init_db may have already created them)
    tables = inspector.get_table_names()
    if "email_accounts" not in tables:
        return

    existing_cols = {c["name"] for c in inspector.get_columns("email_accounts")}

    if "provider" not in existing_cols:
        op.add_column("email_accounts", sa.Column("provider", sa.String(32), nullable=False, server_default="imap"))
    if "email_address" not in existing_cols:
        op.add_column("email_accounts", sa.Column("email_address", sa.String(255), nullable=True))
    if "password_encrypted" not in existing_cols:
        op.add_column("email_accounts", sa.Column("password_encrypted", sa.Text, nullable=True))
    if "access_token_encrypted" not in existing_cols:
        op.add_column("email_accounts", sa.Column("access_token_encrypted", sa.Text, nullable=True))
    if "refresh_token" not in existing_cols:
        op.add_column("email_accounts", sa.Column("refresh_token", sa.Text, nullable=True))


def downgrade() -> None:
    op.drop_column("email_accounts", "refresh_token")
    op.drop_column("email_accounts", "access_token_encrypted")
    op.drop_column("email_accounts", "password_encrypted")
    op.drop_column("email_accounts", "email_address")
    op.drop_column("email_accounts", "provider")
