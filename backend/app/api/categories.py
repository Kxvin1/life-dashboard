from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.category import Category, TransactionType
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    Category as CategorySchema,
)
from app.core.security import get_current_user
from app.models.user import User
from app.services.cache_service import (
    cached,
    invalidate_cache_pattern,
    get_cache,
    set_cache,
)

router = APIRouter()


@router.get("/", response_model=List[CategorySchema])
async def get_categories(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    type: Optional[TransactionType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get transaction categories with optional filtering by type.
    Categories are static and rarely change, so we use aggressive caching.
    """
    # Create a cache key based on the parameters
    cache_key = f"transaction_categories:{type}"

    # Try to get categories from application-level cache first
    categories = get_cache(cache_key)

    if categories is None:
        # If not in cache, fetch from database with a long TTL
        @cached(ttl_seconds=604800)  # Cache for 7 days
        def get_categories_from_db(category_type):
            query = db.query(Category)
            if category_type:
                query = query.filter(Category.type == category_type)
            return query.all()

        # Get categories from database and cache them
        categories = get_categories_from_db(type)

    # Set aggressive cache control headers for client-side caching
    response.headers["Cache-Control"] = (
        "private, max-age=86400"  # 24 hours client-side cache
    )
    response.headers["ETag"] = f'W/"categories-{len(categories)}"'
    response.headers["Vary"] = "Authorization"  # Cache varies by user

    return categories


@router.post("/", response_model=CategorySchema)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    # Invalidate the categories cache when a new category is created
    invalidate_cache_pattern("transaction_categories")

    return db_category


@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: int,
    category: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = category.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)

    db.commit()
    db.refresh(db_category)

    # Invalidate the categories cache when a category is updated
    invalidate_cache_pattern("transaction_categories")

    return db_category


@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if category is being used by any transactions
    if db_category.transactions:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category that is being used by transactions",
        )

    db.delete(db_category)
    db.commit()

    # Invalidate the categories cache when a category is deleted
    invalidate_cache_pattern("transaction_categories")

    return {"ok": True}
