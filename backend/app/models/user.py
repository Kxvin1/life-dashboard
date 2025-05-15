from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.sql.sqltypes import DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_demo_user = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    transactions = relationship("Transaction", back_populates="user", lazy="dynamic")
    subscriptions = relationship("Subscription", back_populates="user", lazy="dynamic")
    ai_insight_usage = relationship(
        "AIInsightUsage", back_populates="user", lazy="dynamic"
    )
    ai_insight_history = relationship(
        "AIInsightHistory", back_populates="user", lazy="dynamic"
    )
    pomodoro_sessions = relationship(
        "PomodoroSession", back_populates="user", lazy="dynamic"
    )
    pomodoro_ai_usage = relationship(
        "PomodoroAIUsage", back_populates="user", lazy="dynamic"
    )
    pomodoro_ai_history = relationship(
        "PomodoroAIHistory", back_populates="user", lazy="dynamic"
    )
