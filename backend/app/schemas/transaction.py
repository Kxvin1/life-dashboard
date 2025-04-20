from pydantic import BaseModel
from datetime import date
from typing import Optional
from app.models.transaction import TransactionType, PaymentMethod

class TransactionBase(BaseModel):
    amount: float
    description: str
    date: date
    type: TransactionType
    payment_method: PaymentMethod
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True 