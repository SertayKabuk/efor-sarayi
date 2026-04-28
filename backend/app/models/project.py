import uuid
from datetime import datetime

from sqlalchemy import ARRAY, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.services.effort import calculate_implementation_plan_effort


class Base(DeclarativeBase):
    pass


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    modules: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    integrations: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    requirements: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    tech_stack: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    complexity: Mapped[str] = mapped_column(String(20), nullable=False)
    constraints: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    implementation_plan: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    team_composition: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    assumptions: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    risks: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    questions: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    documents: Mapped[list["Document"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def effort_person_days(self) -> float:
        return calculate_implementation_plan_effort(self.implementation_plan)


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    project: Mapped["Project"] = relationship(back_populates="documents")
