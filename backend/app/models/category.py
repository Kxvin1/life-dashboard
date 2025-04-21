from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.models.transaction import TransactionType

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    type = Column(Enum(TransactionType, name='transaction_type'), nullable=False)

    # Relationship with transactions
    transactions = relationship("Transaction", back_populates="category", lazy="dynamic") 