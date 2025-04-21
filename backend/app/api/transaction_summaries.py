from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from typing import List, Optional
from datetime import datetime, date
from app.db.database import get_db
from app.models.transaction import Transaction
from app.models.category import Category
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/monthly")
async def get_monthly_summary(
    year: int = Query(..., description="Year to get summary for"),
    month: Optional[int] = Query(None, description="Month to get summary for (1-12)"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Base query for transactions
        query = db.query(
            extract('month', Transaction.date).label('month'),
            func.sum(Transaction.amount).label('total_amount'),
            Transaction.type
        ).filter(
            Transaction.user_id == current_user.id,
            extract('year', Transaction.date) == year
        )

        # Add month filter if provided
        if month:
            query = query.filter(extract('month', Transaction.date) == month)

        # Add category filter if provided
        if category_id:
            query = query.filter(Transaction.category_id == category_id)

        # Group by month and type
        results = query.group_by(
            extract('month', Transaction.date),
            Transaction.type
        ).all()

        # Format results
        summary = {}
        for result in results:
            month = int(result.month)
            if month not in summary:
                summary[month] = {
                    'income': 0,
                    'expense': 0,
                    'net': 0
                }
            
            if result.type == 'income':
                summary[month]['income'] = float(result.total_amount)
            else:
                summary[month]['expense'] = float(result.total_amount)
            
            summary[month]['net'] = summary[month]['income'] - summary[month]['expense']

        return {'summary': summary}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/yearly")
async def get_yearly_summary(
    year: int = Query(..., description="Year to get summary for"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Get total income and expenses for the year
        query = db.query(
            func.sum(Transaction.amount).label('total_amount'),
            Transaction.type
        ).filter(
            Transaction.user_id == current_user.id,
            extract('year', Transaction.date) == year
        )

        # Add category filter if provided
        if category_id:
            query = query.filter(Transaction.category_id == category_id)

        # Group by type
        results = query.group_by(Transaction.type).all()

        # Calculate totals
        total_income = 0
        total_expense = 0
        
        for result in results:
            amount = float(result.total_amount)
            if result.type == 'income':
                total_income = amount
            else:
                total_expense = amount

        return {
            'year': year,
            'total_income': total_income,
            'total_expense': total_expense,
            'net_income': total_income - total_expense
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 