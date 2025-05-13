from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import DateTime
from app.db.database import Base


class AIInsightUsage(Base):
    """
    Tracks the usage of AI insights by users.
    Each record represents a single use of the AI insights feature.
    """

    __tablename__ = "ai_insight_usage"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="ai_insight_usage")


class AIInsightHistory(Base):
    """
    Stores the history of AI insights generated for users.
    Each record represents a single AI insight result.
    """

    __tablename__ = "ai_insight_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    time_period = Column(String, nullable=False)  # "month", "quarter", "year", "all"
    summary = Column(Text, nullable=False)
    insights = Column(JSON, nullable=False)
    recommendations = Column(JSON, nullable=False)
    charts_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="ai_insight_history")


class SystemSetting(Base):
    """
    Stores system-wide settings for the application.
    Used for configurable values like default AI usage limits.
    """

    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
