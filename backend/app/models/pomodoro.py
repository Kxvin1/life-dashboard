from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import DateTime
from app.db.database import Base
from enum import Enum as PyEnum


class PomodoroSessionStatus(PyEnum):
    """Status of a Pomodoro session"""
    completed = "completed"
    interrupted = "interrupted"


class PomodoroSession(Base):
    """
    Stores Pomodoro sessions for users.
    Each record represents a completed or interrupted Pomodoro session.
    """
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_name = Column(String, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False)  # Actual duration in minutes
    status = Column(String, nullable=False)  # 'completed' or 'interrupted'
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="pomodoro_sessions")


class PomodoroAIUsage(Base):
    """
    Tracks the usage of Pomodoro AI visualizations by users.
    Each record represents a single use of the AI visualization feature.
    """
    __tablename__ = "pomodoro_ai_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="pomodoro_ai_usage")


class PomodoroAIHistory(Base):
    """
    Stores the history of Pomodoro AI visualizations generated for users.
    Each record represents a single AI visualization result.
    """
    __tablename__ = "pomodoro_ai_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    summary = Column(Text, nullable=False)
    insights = Column(JSON, nullable=False)
    recommendations = Column(JSON, nullable=False)
    charts_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="pomodoro_ai_history")
