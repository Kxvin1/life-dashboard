from pydantic import BaseModel
from datetime import date
from typing import Optional

class TransactionBase(BaseModel):
    amount: float
    description: str
    category: str
    date: date
    type: str

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int

    class Config:
        from_attributes = True 