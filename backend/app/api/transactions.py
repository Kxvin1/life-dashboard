from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.db.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import TransactionCreate, Transaction as TransactionSchema
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/transactions/", response_model=TransactionSchema)
async def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_transaction = Transaction(
        **transaction.model_dump(),
        user_id=current_user.id
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@router.get("/transactions/", response_model=List[TransactionSchema])
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    type: Optional[TransactionType] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if type:
        query = query.filter(Transaction.type == type)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category:
        query = query.filter(Transaction.category == category)
    
    transactions = query.offset(skip).limit(limit).all()
    return transactions

@router.get("/transactions/{transaction_id}", response_model=TransactionSchema)
async def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.get("/transactions/summary/")
async def get_transaction_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    transactions = query.all()
    
    income = sum(t.amount for t in transactions if t.type == TransactionType.INCOME)
    expenses = sum(t.amount for t in transactions if t.type == TransactionType.EXPENSE)
    
    return {
        "total_income": income,
        "total_expenses": expenses,
        "net_income": income - expenses,
        "transaction_count": len(transactions)
    } 