"""add job type and format fields
Revision ID: 29a4f9c2ca8c
Revises: 81a8034fa5f0
Create Date: 2026-06-19 20:09:20.258873
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '29a4f9c2ca8c'
down_revision: Union[str, Sequence[str], None] = '81a8034fa5f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    job_type_enum = sa.Enum('VIDEO', 'AUDIO', 'IMAGE', 'DOCUMENT', name='jobtype')
    job_type_enum.create(op.get_bind(), checkfirst=True)

    op.add_column('jobs', sa.Column('job_type', job_type_enum, nullable=False, server_default='VIDEO'))
    op.add_column('jobs', sa.Column('input_format', sa.String(length=16), nullable=False, server_default='mp4'))
    op.add_column('jobs', sa.Column('output_format', sa.String(length=16), nullable=False, server_default='mp3'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('jobs', 'output_format')
    op.drop_column('jobs', 'input_format')
    op.drop_column('jobs', 'job_type')

    sa.Enum(name='jobtype').drop(op.get_bind(), checkfirst=True)