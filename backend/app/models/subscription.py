from sqlalchemy import Column, Integer, String, Float, Date, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class BillingFrequency(str, enum.Enum):
    monthly = "monthly"
    yearly = "yearly"
    quarterly = "quarterly"
    weekly = "weekly"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    billing_frequency = Column(Enum(BillingFrequency), nullable=False)
    start_date = Column(Date, nullable=False)
    status = Column(
        Enum(SubscriptionStatus), default=SubscriptionStatus.active, nullable=False
    )
    next_payment_date = Column(Date, nullable=True)
    last_active_date = Column(Date, nullable=True)
    notes = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="subscriptions")
