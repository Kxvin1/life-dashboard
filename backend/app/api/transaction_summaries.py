from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from app.db.database import get_db
from app.models.transaction import Transaction
from app.models.category import Category
from app.core.security import get_current_user
from app.models.user import User
from app.services.redis_service import redis_service

router = APIRouter()


@router.get("/monthly")
async def get_monthly_summary(
    response: Response,
    year: int = Query(..., description="Year to get summary for"),
    month: Optional[int] = Query(None, description="Month to get summary for (1-12)"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get monthly transaction summary with optional filtering.
    Uses caching to improve performance.
    """
    try:
        # Create a cache key based on the parameters
        cache_key = (
            f"user_{current_user.id}_monthly_summary_{year}_{month}_{category_id}"
        )

        # Try to get from Redis cache first
        cached_result = redis_service.get(cache_key)
        if cached_result is not None:
            return cached_result

        # If not in cache, fetch from database
        def get_monthly_summary_from_db(user_id, year_val, month_val, category_id_val):
            # Base query for transactions
            query = db.query(
                extract("month", Transaction.date).label("month"),
                func.sum(Transaction.amount).label("total_amount"),
                Transaction.type,
            ).filter(
                Transaction.user_id == user_id,
                extract("year", Transaction.date) == year_val,
            )

            # Add month filter if provided
            if month_val:
                query = query.filter(extract("month", Transaction.date) == month_val)

            # Add category filter if provided
            if category_id_val:
                query = query.filter(Transaction.category_id == category_id_val)

            # Group by month and type
            results = query.group_by(
                extract("month", Transaction.date), Transaction.type
            ).all()

            # Format results
            summary = {}
            for result in results:
                month_num = int(result.month)
                if month_num not in summary:
                    summary[month_num] = {"income": 0, "expense": 0, "net": 0}

                if result.type == "income":
                    summary[month_num]["income"] = float(result.total_amount)
                else:
                    summary[month_num]["expense"] = float(result.total_amount)

                summary[month_num]["net"] = (
                    summary[month_num]["income"] - summary[month_num]["expense"]
                )

            return {"summary": summary}

        # Get summary from database and cache it
        result = get_monthly_summary_from_db(current_user.id, year, month, category_id)

        # Cache the result for 30 minutes
        redis_service.set(cache_key, result, ttl_seconds=1800)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/yearly")
async def get_yearly_summary(
    response: Response,
    year: int = Query(..., description="Year to get summary for"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get yearly transaction summary with optional filtering.
    Uses caching to improve performance.
    """
    try:
        # Create a cache key based on the parameters
        cache_key = f"yearly_summary:{current_user.id}:{year}:{category_id}"

        # Try to get from Redis cache first
        cached_result = redis_service.get(cache_key)
        if cached_result is not None:
            return cached_result

        # If not in cache, fetch from database
        def get_yearly_summary_from_db(user_id, year_val, category_id_val):
            # Get total income and expenses for the year
            query = db.query(
                func.sum(Transaction.amount).label("total_amount"), Transaction.type
            ).filter(
                Transaction.user_id == user_id,
                extract("year", Transaction.date) == year_val,
            )

            # Add category filter if provided
            if category_id_val:
                query = query.filter(Transaction.category_id == category_id_val)

            # Group by type
            results = query.group_by(Transaction.type).all()

            # Calculate totals
            total_income = 0
            total_expense = 0

            for result in results:
                amount = float(result.total_amount)
                if result.type == "income":
                    total_income = amount
                else:
                    total_expense = amount

            return {
                "year": year_val,
                "total_income": total_income,
                "total_expense": total_expense,
                "net_income": total_income - total_expense,
            }

        # Get summary from database and cache it
        result = get_yearly_summary_from_db(current_user.id, year, category_id)

        # Cache the result for 30 minutes
        redis_service.set(cache_key, result, ttl_seconds=1800)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
