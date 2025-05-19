from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.sql.sqltypes import DateTime
from app.db.database import Base
import enum

class TaskStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"

class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class EnergyLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class RecurringFrequency(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    custom = "custom"

class Task(Base):
    """
    Stores tasks for users.
    Each record represents a task that can be short-term or long-term.
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.not_started, nullable=False)
    priority = Column(Enum(TaskPriority), default=TaskPriority.medium, nullable=False)
    energy_level = Column(Enum(EnergyLevel), default=EnergyLevel.medium, nullable=True)
    category_id = Column(Integer, ForeignKey("task_categories.id"), nullable=True)
    estimated_time_minutes = Column(Integer, nullable=True)
    is_recurring = Column(Boolean, default=False)
    recurring_frequency = Column(Enum(RecurringFrequency), nullable=True)
    parent_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    is_long_term = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="tasks")
    category = relationship("TaskCategory", back_populates="tasks")
    parent_task = relationship("Task", remote_side=[id], backref="child_tasks")

class TaskCategory(Base):
    """
    Stores categories for tasks.
    Categories can be system defaults or user-created.
    """
    __tablename__ = "task_categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for system defaults
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="task_categories")
    tasks = relationship("Task", back_populates="category")

class TaskAIUsage(Base):
    """
    Tracks the usage of AI features for tasks by users.
    Each record represents usage for a specific date.
    """
    __tablename__ = "task_ai_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="task_ai_usage")

class TaskAIHistory(Base):
    """
    Stores the history of AI-generated content for tasks.
    Each record represents a single AI interaction.
    """
    __tablename__ = "task_ai_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    input_text = Column(Text, nullable=False)
    output_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="task_ai_history")
