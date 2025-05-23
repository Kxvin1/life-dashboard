from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
import logging
from app.db.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    Transaction as TransactionSchema,
)
from app.core.security import get_current_user
from app.models.user import User
from app.models.category import Category
from app.services.redis_service import redis_service


logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/transactions/", response_model=TransactionSchema)
async def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate category if provided
    if transaction.category_id:
        category = (
            db.query(Category).filter(Category.id == transaction.category_id).first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        if category.type != transaction.type:
            raise HTTPException(
                status_code=400,
                detail=f"Category type '{category.type}' does not match transaction type '{transaction.type}'",
            )

    db_transaction = Transaction(**transaction.model_dump(), user_id=current_user.id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    # Clear user's transaction cache
    redis_service.clear_user_cache(current_user.id)

    return db_transaction


@router.get("/transactions/", response_model=List[TransactionSchema])
async def get_transactions(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    type: Optional[TransactionType] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    year: Optional[int] = None,  # Add year parameter
    month: Optional[int] = None,  # Add month parameter
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get transactions with optional filtering.
    """
    import time

    start_time = time.time()

    # Create cache key
    cache_key = f"user_{current_user.id}_transactions_{type}_{start_date}_{end_date}_{category_id}_{year}_{month}_{skip}_{limit}"
    print(f"⏱️ Cache key: {cache_key}")

    # Try to get from Redis cache first
    cache_start = time.time()
    cached_result = redis_service.get(cache_key)
    cache_time = time.time() - cache_start

    if cached_result is not None:
        total_time = time.time() - start_time
        print(
            f"⚡ CACHE HIT - Redis: {cache_time*1000:.1f}ms, Total: {total_time*1000:.1f}ms"
        )

        # Validate cached data before returning
        try:
            if isinstance(cached_result, list) and all(
                isinstance(item, dict) for item in cached_result
            ):
                return cached_result
            else:
                # Invalid cache format, clear and fall back to database
                print(f"🧹 Invalid cache format, clearing cache entry")
                redis_service.delete(cache_key)
        except Exception as e:
            print(f"❌ Cache validation error: {e}, clearing cache")
            redis_service.delete(cache_key)

    print(f"💾 CACHE MISS - Redis: {cache_time*1000:.1f}ms, querying database...")

    try:
        # Build the query with eager loading of category
        query = (
            db.query(Transaction)
            .options(
                joinedload(
                    Transaction.category
                )  # Eager load category to avoid N+1 queries
            )
            .filter(Transaction.user_id == current_user.id)
        )

        # Apply filters
        if type:
            query = query.filter(Transaction.type == type)
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)
        if category_id:
            query = query.filter(Transaction.category_id == category_id)

        # Add filtering by year and month
        if year:
            from sqlalchemy import extract

            query = query.filter(extract("year", Transaction.date) == year)
        if month:
            from sqlalchemy import extract

            query = query.filter(extract("month", Transaction.date) == month)

        # Order by date descending for most recent transactions first
        query = query.order_by(Transaction.date.desc())

        # Apply pagination
        transactions = query.offset(skip).limit(limit).all()

    except Exception as e:
        print(f"❌ Database query error: {e}")
        print(f"❌ Error type: {type(e)}")
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

    # Ensure all transactions have valid is_recurring values
    for transaction in transactions:
        if transaction.is_recurring is None:
            transaction.is_recurring = False

    # Convert to clean dictionaries for caching and response
    print(f"🔄 Converting transactions to dictionaries for caching")
    serialize_start = time.time()

    transaction_dicts = []
    try:
        for txn in transactions:
            # Safely convert amount
            try:
                amount_value = float(txn.amount) if txn.amount is not None else None
            except (ValueError, TypeError) as e:
                print(f"❌ Amount conversion error for transaction {txn.id}: {e}")
                amount_value = None

            txn_dict = {
                "id": txn.id,
                "user_id": txn.user_id,
                "amount": amount_value,
                "description": txn.description,
                "date": txn.date.isoformat() if txn.date else None,
                "type": txn.type.value if txn.type else None,
                "payment_method": (
                    txn.payment_method.value if txn.payment_method else None
                ),
                "is_recurring": txn.is_recurring,
                "recurring_frequency": txn.recurring_frequency,
                "notes": txn.notes,
                "category_id": txn.category_id,
                "category": (
                    {
                        "id": txn.category.id,
                        "name": txn.category.name,
                        "type": txn.category.type.value,
                        "color": getattr(
                            txn.category, "color", "#6B7280"
                        ),  # Default color if missing
                    }
                    if txn.category
                    else None
                ),
            }
            transaction_dicts.append(txn_dict)

        # Cache the clean dictionaries (not SQLAlchemy objects)
        redis_service.set(
            cache_key, transaction_dicts, ttl_seconds=3600
        )  # Increased to 1 hour

    except Exception as e:
        print(f"❌ Error during serialization: {e}")
        print(f"❌ Error type: {type(e)}")
        # Continue without caching - return the data anyway
        if not transaction_dicts:
            # If serialization completely failed, create basic dicts
            transaction_dicts = []
            for txn in transactions:
                basic_dict = {
                    "id": txn.id,
                    "user_id": txn.user_id,
                    "amount": float(txn.amount) if txn.amount else 0.0,
                    "description": str(txn.description) if txn.description else "",
                    "date": txn.date.isoformat() if txn.date else None,
                    "type": txn.type.value if txn.type else "income",
                    "payment_method": (
                        txn.payment_method.value if txn.payment_method else "cash"
                    ),
                    "is_recurring": bool(txn.is_recurring),
                    "recurring_frequency": txn.recurring_frequency,
                    "notes": txn.notes,
                    "category_id": txn.category_id,
                    "category": None,  # Skip category to avoid further errors
                }
                transaction_dicts.append(basic_dict)

    serialize_time = time.time() - serialize_start
    print(f"💾 DATABASE QUERY - Serialization: {serialize_time*1000:.1f}ms")

    return transaction_dicts


@router.get("/transactions/{transaction_id}", response_model=TransactionSchema)
async def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id, Transaction.user_id == current_user.id
        )
        .first()
    )
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.put("/transactions/{transaction_id}", response_model=TransactionSchema)
async def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Find the transaction
    db_transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id, Transaction.user_id == current_user.id
        )
        .first()
    )

    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Validate category if provided
    if transaction_update.category_id is not None:
        category = (
            db.query(Category)
            .filter(Category.id == transaction_update.category_id)
            .first()
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        # If transaction type is being updated, check against the new type
        transaction_type = (
            transaction_update.type
            if transaction_update.type is not None
            else db_transaction.type
        )
        if category.type != transaction_type:
            raise HTTPException(
                status_code=400,
                detail=f"Category type '{category.type}' does not match transaction type '{transaction_type}'",
            )

    # Update transaction fields
    update_data = transaction_update.model_dump(exclude_unset=True)

    # Handle date conversion if it's a string
    if "date" in update_data and update_data["date"] is not None:
        try:
            # Convert string date to date object
            update_data["date"] = date.fromisoformat(update_data["date"])
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid date format. Use YYYY-MM-DD"
            )

    for field, value in update_data.items():
        setattr(db_transaction, field, value)

    db.commit()
    db.refresh(db_transaction)

    # Clear user's transaction cache
    redis_service.clear_user_cache(current_user.id)

    return db_transaction


@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # Find the transaction
    db_transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id, Transaction.user_id == current_user.id
        )
        .first()
    )

    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Store transaction type before deleting
    transaction_type = db_transaction.type

    # Delete the transaction
    db.delete(db_transaction)
    db.commit()

    # Clear user's transaction cache
    redis_service.clear_user_cache(current_user.id)

    return {"success": True, "message": "Transaction deleted successfully"}


# Test endpoints for deletion have been removed for security reasons


# Define a separate route for transaction summary to avoid conflicts with the transaction_id route
@router.get("/transactions-summary/")
async def get_transaction_summary(
    response: Response,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)

    transactions = query.all()

    income = sum(t.amount for t in transactions if t.type == TransactionType.income)
    expenses = sum(t.amount for t in transactions if t.type == TransactionType.expense)

    result = {
        "total_income": income,
        "total_expenses": expenses,
        "net_income": income - expenses,
        "transaction_count": len(transactions),
    }

    return result


# Keep the old route for backward compatibility
@router.get("/transactions/summary/")
async def get_transaction_summary_legacy(
    response: Response,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_transaction_summary(
        response=response,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        db=db,
        current_user=current_user,
    )


@router.get("/transactions/has-income-and-expense/", response_model=Dict[str, Any])
async def has_income_and_expense_transactions(
    response: Response,
    time_period: str = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check if the user has at least one income and one expense transaction for the specified time period.
    This is used to determine if the user can generate AI insights.

    Args:
        time_period: Time period for analysis ("month", "prev_month", "year", "prev_year", "all")

    Returns:
        Dict with has_income, has_expense, can_generate_insights flags, and time_period
    """
    # Create cache key
    cache_key = f"user_{current_user.id}_has_income_expense_{time_period}"

    # Try to get from Redis cache first
    cached_result = redis_service.get(cache_key)
    if cached_result is not None:
        return cached_result

    # Base query for transactions from this user
    income_query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.income,
    )

    expense_query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.expense,
    )

    # Apply time period filter
    today = datetime.now().date()
    current_year = today.year
    current_month = today.month

    if time_period == "month":
        # Current month
        start_date = date(current_year, current_month, 1)
        income_query = income_query.filter(Transaction.date >= start_date)
        expense_query = expense_query.filter(Transaction.date >= start_date)

    elif time_period == "prev_month":
        # Previous month
        if current_month == 1:
            # If January, previous month is December of previous year
            prev_month = 12
            prev_year = current_year - 1
        else:
            prev_month = current_month - 1
            prev_year = current_year

        start_date = date(prev_year, prev_month, 1)

        # Calculate end date (last day of previous month)
        if prev_month == 12:
            end_date = date(prev_year, 12, 31)
        else:
            end_date = date(prev_year, prev_month + 1, 1) - timedelta(days=1)

        income_query = income_query.filter(
            Transaction.date >= start_date, Transaction.date <= end_date
        )
        expense_query = expense_query.filter(
            Transaction.date >= start_date, Transaction.date <= end_date
        )

    elif time_period == "year":
        # Current year
        start_date = date(current_year, 1, 1)
        income_query = income_query.filter(Transaction.date >= start_date)
        expense_query = expense_query.filter(Transaction.date >= start_date)

    elif time_period == "prev_year":
        # Previous year
        prev_year = current_year - 1
        start_date = date(prev_year, 1, 1)
        end_date = date(prev_year, 12, 31)
        income_query = income_query.filter(
            Transaction.date >= start_date, Transaction.date <= end_date
        )
        expense_query = expense_query.filter(
            Transaction.date >= start_date, Transaction.date <= end_date
        )

    # Check for income and expense transactions with the applied filters
    # Use exists() for better performance than count()
    has_income = db.query(income_query.exists()).scalar()
    has_expense = db.query(expense_query.exists()).scalar()

    # User can generate insights if they have at least one income and one expense transaction
    can_generate_insights = has_income and has_expense

    result = {
        "has_income": has_income,
        "has_expense": has_expense,
        "can_generate_insights": can_generate_insights,
        "time_period": time_period,
    }

    # Cache the result for 1 hour
    redis_service.set(cache_key, result, ttl_seconds=3600)

    return result
