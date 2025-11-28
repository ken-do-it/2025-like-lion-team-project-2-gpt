"""add ai provider/model columns to tracks

Revision ID: 7b9d7c0c9f9a
Revises: 2c5a4b3c9b9d
Create Date: 2025-11-27
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "7b9d7c0c9f9a"
down_revision = "2c5a4b3c9b9d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tracks", sa.Column("ai_provider", sa.String(length=50), nullable=True))
    op.add_column("tracks", sa.Column("ai_model", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("tracks", "ai_model")
    op.drop_column("tracks", "ai_provider")
