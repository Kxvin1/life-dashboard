from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, desc, case
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
import logging
from app.db.database import get_db
from app.models.subscription import Subscription, SubscriptionStatus, BillingFrequency
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionUpdate,
    Subscription as SubscriptionSchema,
)
from app.core.security import get_current_user
from app.models.user import User
from app.services.cache_service import (
    cached,
    invalidate_cache,
    invalidate_cache_pattern,
    invalidate_user_cache,
    invalidate_subscription_cache,
    get_cache,
    set_cache,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/subscriptions/", response_model=SubscriptionSchema)
async def create_subscription(
    subscription: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    # Use targeted invalidation for better performance
    invalidate_subscription_cache(current_user.id)

    # Also invalidate all user cache to ensure UI updates
    # This is less targeted but ensures the UI always shows the latest data
    invalidate_user_cache(current_user.id, feature="subscriptions")

    return db_subscription


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
    Uses caching to improve performance.
    """
    # Create a cache key based on the parameters
    cache_key = f"user_{current_user.id}_subscriptions_{status}_{skip}_{limit}"

    # Try to get from cache first
    cached_subscriptions = get_cache(cache_key)
    if cached_subscriptions is not None:
        logger.info(f"Cache hit for subscriptions: {cache_key}")
        subscriptions = cached_subscriptions
    else:
        logger.info(f"Cache miss for subscriptions: {cache_key}")

        query = db.query(Subscription).filter(Subscription.user_id == current_user.id)

        if status:
            query = query.filter(Subscription.status == status)

        # Order by status (active first) and then by name
        # Create a case statement to order active status first
        status_order = case(
            (Subscription.status == SubscriptionStatus.active, 1), else_=2
        )

        query = query.order_by(
            status_order, Subscription.name  # Active first (1 comes before 2)
        )

        subscriptions = query.offset(skip).limit(limit).all()

        # Cache the result for 24 hours (subscriptions rarely change)
        set_cache(cache_key, subscriptions, ttl_seconds=86400)

    # Set cache control headers to prevent browser caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["Vary"] = "Authorization"  # Cache varies by user

    return subscriptions


@router.get("/subscriptions/{subscription_id}", response_model=SubscriptionSchema)
async def get_subscription(
    response: Response,
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific subscription by ID.
    Uses caching to improve performance.
    """
    # Create a cache key based on the parameters
    cache_key = f"user_{current_user.id}_subscription_{subscription_id}"

    # Try to get from cache first
    cached_subscription = get_cache(cache_key)
    if cached_subscription is not None:
        logger.info(f"Cache hit for subscription: {cache_key}")
        subscription = cached_subscription
    else:
        logger.info(f"Cache miss for subscription: {cache_key}")

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

        # Cache the result for 24 hours (subscriptions rarely change)
        set_cache(cache_key, subscription, ttl_seconds=86400)

    # Set cache control headers to prevent browser caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["Vary"] = "Authorization"  # Cache varies by user

    return subscription


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
    except Exception as e:
        # Log the error and rollback the transaction
        logger.error(f"Error updating subscription {subscription_id}: {str(e)}")
        db.rollback()

        # Re-raise the exception with a more helpful message
        raise HTTPException(
            status_code=500, detail=f"Failed to update subscription: {str(e)}"
        )

    # Use targeted invalidation for better performance
    invalidate_subscription_cache(current_user.id, subscription_id=subscription_id)

    # Also invalidate all user cache to ensure UI updates
    # This is less targeted but ensures the UI always shows the latest data
    invalidate_user_cache(current_user.id, feature="subscriptions")

    return db_subscription


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

    # Use targeted invalidation for better performance
    invalidate_subscription_cache(current_user.id, subscription_id=subscription_id)

    # Also invalidate all user cache to ensure UI updates
    # This is less targeted but ensures the UI always shows the latest data
    invalidate_user_cache(current_user.id, feature="subscriptions")

    return True


@router.get("/subscriptions-summary/")
async def get_subscriptions_summary(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get summary of user's subscriptions including total costs and counts.
    Uses caching to improve performance.
    """
    # Create a cache key based on the user
    cache_key = f"user_{current_user.id}_subscription_summary"

    # Try to get from cache first
    cached_summary = get_cache(cache_key)
    if cached_summary is not None:
        logger.info(f"Cache hit for subscription summary: {cache_key}")
        result = cached_summary
    else:
        logger.info(f"Cache miss for subscription summary: {cache_key}")

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
            # Determine if this is a future subscription
            is_future = subscription.start_date > today

            # Calculate the monthly cost based on billing frequency
            subscription_monthly_cost = 0
            if subscription.billing_frequency == BillingFrequency.monthly:
                subscription_monthly_cost = subscription.amount
            elif subscription.billing_frequency == BillingFrequency.yearly:
                subscription_monthly_cost = subscription.amount / 12
            elif subscription.billing_frequency == BillingFrequency.quarterly:
                subscription_monthly_cost = subscription.amount / 3
            elif subscription.billing_frequency == BillingFrequency.weekly:
                subscription_monthly_cost = (
                    subscription.amount * 4.33
                )  # Average weeks in a month

            # Add to the appropriate total
            if is_future:
                future_monthly_cost += subscription_monthly_cost
                future_active_count += 1
            else:
                monthly_cost += subscription_monthly_cost
                current_active_count += 1

        result = {
            "total_monthly_cost": round(monthly_cost, 2),
            "future_monthly_cost": round(future_monthly_cost, 2),
            "total_combined_monthly_cost": round(monthly_cost + future_monthly_cost, 2),
            "active_subscriptions_count": current_active_count,
            "future_subscriptions_count": future_active_count,
            "total_subscriptions_count": len(active_subscriptions),
        }

        # Cache the result for 1 hour (3600 seconds) for better performance
        # This is a good balance between performance and freshness for subscription summary
        set_cache(cache_key, result, ttl_seconds=3600)

    # Set cache control headers to prevent browser caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["Vary"] = "Authorization"  # Cache varies by user

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
