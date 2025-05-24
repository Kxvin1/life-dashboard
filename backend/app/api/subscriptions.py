from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, desc, case
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
import logging
import math
from app.db.database import get_db
from app.models.subscription import Subscription, SubscriptionStatus, BillingFrequency
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    Subscription as SubscriptionSchema,
)
from app.services.redis_service import redis_service
from app.core.security import get_current_user
from app.models.user import User


logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/subscriptions/", response_model=SubscriptionSchema)
async def create_subscription(
    subscription: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    print(f"🔵 CREATE subscription called for user {current_user.id}")
    try:
        # Create a new subscription
        db_subscription = Subscription(
            **subscription.model_dump(),
            user_id=current_user.id,
        )

        # Calculate next payment date based on billing frequency and start date
        db_subscription.next_payment_date = calculate_next_payment_date(
            subscription.start_date, subscription.billing_frequency
        )

        db.add(db_subscription)
        db.commit()
        db.refresh(db_subscription)

        # Clear user's subscription cache
        redis_service.clear_user_cache(current_user.id)

        print(f"✅ CREATE subscription success for user {current_user.id}")

        # Return as dictionary to match GET endpoint format
        return {
            "id": db_subscription.id,
            "user_id": db_subscription.user_id,
            "name": db_subscription.name,
            "amount": float(db_subscription.amount) if db_subscription.amount else None,
            "billing_frequency": (
                db_subscription.billing_frequency.value
                if db_subscription.billing_frequency
                else None
            ),
            "start_date": (
                db_subscription.start_date.isoformat()
                if db_subscription.start_date
                else None
            ),
            "next_payment_date": (
                db_subscription.next_payment_date.isoformat()
                if db_subscription.next_payment_date
                else None
            ),
            "status": db_subscription.status.value if db_subscription.status else None,
            "last_active_date": (
                db_subscription.last_active_date.isoformat()
                if db_subscription.last_active_date
                else None
            ),
            "notes": db_subscription.notes,
        }

    except Exception as e:
        print(f"❌ CREATE subscription error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to create subscription: {str(e)}"
        )


@router.get("/subscriptions/", response_model=List[SubscriptionSchema])
async def get_subscriptions(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    status: Optional[SubscriptionStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get subscriptions with optional filtering by status.
    """
    import time

    start_time = time.time()

    # Create cache key using string value of status to avoid enum serialization issues
    status_str = status.value if status else "all"
    cache_key = f"user_{current_user.id}_subscriptions_{status_str}_{skip}_{limit}"
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
        print(
            f"🔍 Cached result type: {type(cached_result)}, length: {len(cached_result) if isinstance(cached_result, list) else 'N/A'}"
        )

        # Return cached data directly (already serialized as dictionaries)
        return cached_result

    print(f"💾 CACHE MISS - Redis: {cache_time*1000:.1f}ms, querying database...")

    query = db.query(Subscription).filter(Subscription.user_id == current_user.id)

    if status:
        query = query.filter(Subscription.status == status)

    # Order by status (active first) and then by name
    # Create a case statement to order active status first
    status_order = case((Subscription.status == SubscriptionStatus.active, 1), else_=2)

    query = query.order_by(
        status_order, Subscription.name  # Active first (1 comes before 2)
    )

    subscriptions = query.offset(skip).limit(limit).all()

    # Convert to clean dictionaries for caching and response
    print(f"🔄 Converting to dictionaries for caching")
    serialize_start = time.time()

    subscription_dicts = []
    for sub in subscriptions:
        sub_dict = {
            "id": sub.id,
            "user_id": sub.user_id,
            "name": sub.name,
            "amount": float(sub.amount) if sub.amount else None,
            "billing_frequency": (
                sub.billing_frequency.value if sub.billing_frequency else None
            ),
            "start_date": sub.start_date.isoformat() if sub.start_date else None,
            "next_payment_date": (
                sub.next_payment_date.isoformat() if sub.next_payment_date else None
            ),
            "status": sub.status.value if sub.status else None,
            "last_active_date": (
                sub.last_active_date.isoformat() if sub.last_active_date else None
            ),
            "notes": sub.notes,
        }
        subscription_dicts.append(sub_dict)

    # Cache the clean dictionaries (not SQLAlchemy objects)
    redis_service.set(cache_key, subscription_dicts, ttl_seconds=3600)

    serialize_time = time.time() - serialize_start
    total_time = time.time() - start_time
    print(
        f"💾 DATABASE QUERY - Serialization: {serialize_time*1000:.1f}ms, Total: {total_time*1000:.1f}ms"
    )

    return subscription_dicts


@router.get("/subscriptions/{subscription_id}", response_model=SubscriptionSchema)
async def get_subscription(
    response: Response,
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific subscription by ID.
    """
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.user_id == current_user.id,
        )
        .first()
    )

    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Return as dictionary to match other endpoints
    return {
        "id": subscription.id,
        "user_id": subscription.user_id,
        "name": subscription.name,
        "amount": float(subscription.amount) if subscription.amount else None,
        "billing_frequency": (
            subscription.billing_frequency.value
            if subscription.billing_frequency
            else None
        ),
        "start_date": (
            subscription.start_date.isoformat() if subscription.start_date else None
        ),
        "next_payment_date": (
            subscription.next_payment_date.isoformat()
            if subscription.next_payment_date
            else None
        ),
        "status": subscription.status.value if subscription.status else None,
        "last_active_date": (
            subscription.last_active_date.isoformat()
            if subscription.last_active_date
            else None
        ),
        "notes": subscription.notes,
    }


@router.put("/subscriptions/{subscription_id}", response_model=SubscriptionSchema)
async def update_subscription(
    subscription_id: int,
    subscription: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id, Subscription.user_id == current_user.id
        )
        .first()
    )
    if db_subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    try:
        # Update subscription fields
        update_data = subscription.model_dump(exclude_unset=True)

        # Log the update data for debugging
        logger.info(f"Updating subscription {subscription_id} with data: {update_data}")

        # If status is being updated to inactive and last_active_date is not provided,
        # set it to today's date
        if (
            "status" in update_data
            and update_data["status"] == SubscriptionStatus.inactive
            and "last_active_date" not in update_data
        ):
            update_data["last_active_date"] = date.today()

        # If billing_frequency or start_date is updated, recalculate next_payment_date
        if "billing_frequency" in update_data or "start_date" in update_data:
            # Get the updated values or use the existing ones
            billing_frequency = update_data.get(
                "billing_frequency", db_subscription.billing_frequency
            )
            start_date = update_data.get("start_date", db_subscription.start_date)

            # Calculate the new next_payment_date
            update_data["next_payment_date"] = calculate_next_payment_date(
                start_date, billing_frequency
            )

        for key, value in update_data.items():
            setattr(db_subscription, key, value)

        db.commit()
        db.refresh(db_subscription)

        # Clear user's subscription cache
        redis_service.clear_user_cache(current_user.id)
    except Exception as e:
        # Log the error and rollback the transaction
        logger.error(f"Error updating subscription {subscription_id}: {str(e)}")
        db.rollback()

        # Re-raise the exception with a more helpful message
        raise HTTPException(
            status_code=500, detail=f"Failed to update subscription: {str(e)}"
        )

    # Return as dictionary to match other endpoints
    return {
        "id": db_subscription.id,
        "user_id": db_subscription.user_id,
        "name": db_subscription.name,
        "amount": float(db_subscription.amount) if db_subscription.amount else None,
        "billing_frequency": (
            db_subscription.billing_frequency.value
            if db_subscription.billing_frequency
            else None
        ),
        "start_date": (
            db_subscription.start_date.isoformat()
            if db_subscription.start_date
            else None
        ),
        "next_payment_date": (
            db_subscription.next_payment_date.isoformat()
            if db_subscription.next_payment_date
            else None
        ),
        "status": db_subscription.status.value if db_subscription.status else None,
        "last_active_date": (
            db_subscription.last_active_date.isoformat()
            if db_subscription.last_active_date
            else None
        ),
        "notes": db_subscription.notes,
    }


@router.delete("/subscriptions/{subscription_id}", response_model=bool)
async def delete_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id, Subscription.user_id == current_user.id
        )
        .first()
    )
    if db_subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")

    db.delete(db_subscription)
    db.commit()

    # Clear user's subscription cache
    redis_service.clear_user_cache(current_user.id)

    return True


@router.get("/subscriptions-summary/")
async def get_subscriptions_summary(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get summary of user's subscriptions including total costs and counts.
    """
    # Create cache key
    cache_key = f"user_{current_user.id}_subscription_summary"

    # Try to get from Redis cache first
    cached_result = redis_service.get(cache_key)
    if cached_result is not None:
        return cached_result

    # Get total monthly cost of active subscriptions
    monthly_cost = 0
    future_monthly_cost = 0
    today = date.today()

    # Get all active subscriptions - use a more efficient query
    active_subscriptions = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id,
            Subscription.status == SubscriptionStatus.active,
        )
        .all()
    )

    # Count current and future subscriptions separately
    current_active_count = 0
    future_active_count = 0

    for subscription in active_subscriptions:
        # Skip subscriptions with no amount
        if not subscription.amount or subscription.amount <= 0:
            print(
                f"⚠️ Skipping subscription {subscription.name} - invalid amount: {subscription.amount}"
            )
            continue

        # Determine if this is a future subscription
        is_future = subscription.start_date > today

        # Calculate the monthly cost based on billing frequency
        subscription_monthly_cost = 0
        try:
            if subscription.billing_frequency == BillingFrequency.monthly:
                subscription_monthly_cost = float(subscription.amount)
            elif subscription.billing_frequency == BillingFrequency.yearly:
                subscription_monthly_cost = float(subscription.amount) / 12
            elif subscription.billing_frequency == BillingFrequency.quarterly:
                subscription_monthly_cost = float(subscription.amount) / 3
            elif subscription.billing_frequency == BillingFrequency.weekly:
                subscription_monthly_cost = (
                    float(subscription.amount) * 4.33
                )  # Average weeks in a month
            else:
                print(
                    f"⚠️ Unknown billing frequency for {subscription.name}: {subscription.billing_frequency}"
                )
                continue

            print(
                f"💰 {subscription.name}: ${subscription.amount} {subscription.billing_frequency.value} = ${subscription_monthly_cost:.2f}/mo"
            )
        except (ValueError, TypeError) as e:
            print(f"❌ Error calculating cost for {subscription.name}: {e}")
            continue

        # Add to the appropriate total
        if is_future:
            future_monthly_cost += subscription_monthly_cost
            future_active_count += 1
        else:
            monthly_cost += subscription_monthly_cost
            current_active_count += 1

    # Ensure we have valid numbers (not NaN or None)
    monthly_cost = monthly_cost if monthly_cost and not math.isnan(monthly_cost) else 0
    future_monthly_cost = (
        future_monthly_cost
        if future_monthly_cost and not math.isnan(future_monthly_cost)
        else 0
    )

    result = {
        "total_monthly_cost": round(monthly_cost, 2),
        "future_monthly_cost": round(future_monthly_cost, 2),
        "total_combined_monthly_cost": round(monthly_cost + future_monthly_cost, 2),
        "active_subscriptions_count": current_active_count,
        "future_subscriptions_count": future_active_count,
        "total_subscriptions_count": len(active_subscriptions),
    }

    print(f"📊 Subscription summary: {result}")

    # Cache the result for 30 minutes
    redis_service.set(cache_key, result, ttl_seconds=1800)

    return result


def calculate_next_payment_date(
    start_date: date, billing_frequency: BillingFrequency
) -> date:
    """Calculate the next payment date based on the start date and billing frequency."""
    today = date.today()

    # If the start date is in the future, the first payment date is the start date
    if start_date > today:
        return start_date

    if billing_frequency == BillingFrequency.monthly:
        # Find the next occurrence of the same day of the month
        next_date = date(today.year, today.month, start_date.day)
        if next_date < today:
            # If the day has already passed this month, move to next month
            if today.month == 12:
                next_date = date(today.year + 1, 1, start_date.day)
            else:
                next_date = date(today.year, today.month + 1, start_date.day)
        return next_date

    elif billing_frequency == BillingFrequency.yearly:
        # Find the next occurrence of the same day and month
        next_date = date(today.year, start_date.month, start_date.day)
        if next_date < today:
            # If the day has already passed this year, move to next year
            next_date = date(today.year + 1, start_date.month, start_date.day)
        return next_date

    elif billing_frequency == BillingFrequency.quarterly:
        # Calculate the month offset (0, 3, 6, 9) based on the start date
        month_offset = (start_date.month - 1) % 3

        # Find the current quarter's month with the same offset
        current_quarter = (today.month - 1) // 3
        current_quarter_month = (current_quarter * 3) + month_offset + 1

        # Create the date for this quarter
        next_date = date(today.year, current_quarter_month, start_date.day)

        # If the date has passed, move to the next quarter
        if next_date < today:
            if current_quarter_month >= 10:  # Last quarter of the year
                next_date = date(today.year + 1, month_offset + 1, start_date.day)
            else:
                next_date = date(today.year, current_quarter_month + 3, start_date.day)

        return next_date

    else:  # Weekly frequency
        # Find the next occurrence of the same day of the week
        days_ahead = start_date.weekday() - today.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        return today + timedelta(days=days_ahead)
