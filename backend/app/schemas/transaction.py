from pydantic import BaseModel
from datetime import date
from typing import Optional, Dict, Any, List
from app.models.transaction import TransactionType, PaymentMethod
from app.schemas.category import Category


class TransactionBase(BaseModel):
    amount: float
    description: str
    date: date
    type: TransactionType
    payment_method: PaymentMethod
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None
    notes: Optional[str] = None
    category_id: Optional[int] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    date: Optional[str] = (
        None  # Changed from date to str to handle string dates from frontend
    )
    type: Optional[TransactionType] = None
    payment_method: Optional[PaymentMethod] = None
    is_recurring: Optional[bool] = None
    recurring_frequency: Optional[str] = None
    notes: Optional[str] = None
    category_id: Optional[int] = None


class Transaction(TransactionBase):
    id: int
    user_id: int
    category: Optional[Category] = None

    model_config = {"from_attributes": True}
