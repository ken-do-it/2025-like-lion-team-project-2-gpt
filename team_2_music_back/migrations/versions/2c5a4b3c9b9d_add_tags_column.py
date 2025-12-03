"""Add tags column to tracks"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2c5a4b3c9b9d"
down_revision: Union[str, None] = "03e09e13dffd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tracks", sa.Column("tags", sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column("tracks", "tags")
