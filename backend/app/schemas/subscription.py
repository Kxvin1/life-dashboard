from pydantic import BaseModel
from datetime import date
from typing import Optional
from app.models.subscription import SubscriptionStatus, BillingFrequency


class SubscriptionBase(BaseModel):
    name: str
    amount: float
    billing_frequency: BillingFrequency
    start_date: date
    status: SubscriptionStatus = SubscriptionStatus.active
    notes: Optional[str] = None


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    billing_frequency: Optional[BillingFrequency] = None
    start_date: Optional[date] = None
    status: Optional[SubscriptionStatus] = None
    next_payment_date: Optional[date] = None
    last_active_date: Optional[date] = None
    notes: Optional[str] = None


class Subscription(SubscriptionBase):
    id: int
    user_id: int
    next_payment_date: Optional[date] = None
    last_active_date: Optional[date] = None

    class Config:
        from_attributes = True
