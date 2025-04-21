from sqlalchemy import Column, Integer, String, Float, Date, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.models.user import User
import enum

class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    OTHER = "other"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    is_recurring = Column(Boolean, default=False)
    recurring_frequency = Column(String, nullable=True)  # e.g., "monthly", "weekly"
    notes = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="transactions", lazy="joined")
    category = relationship("Category", back_populates="transactions", lazy="joined") 