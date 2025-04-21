from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.api import deps
from app.models.category import TransactionType

router = APIRouter()

@router.get("/", response_model=List[schemas.Category])
def read_categories(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    type: Optional[TransactionType] = None,
    current_user: models.User = Depends(deps.get_current_user)
):
    categories = crud.category.get_categories(db, skip=skip, limit=limit, type=type)
    return categories

@router.post("/", response_model=schemas.Category)
def create_category(
    *,
    db: Session = Depends(deps.get_db),
    category_in: schemas.CategoryCreate,
    current_user: models.User = Depends(deps.get_current_user)
):
    category = crud.category.create_category(db=db, category=category_in)
    return category

@router.put("/{category_id}", response_model=schemas.Category)
def update_category(
    *,
    db: Session = Depends(deps.get_db),
    category_id: int,
    category_in: schemas.CategoryUpdate,
    current_user: models.User = Depends(deps.get_current_user)
):
    category = crud.category.get_category(db, category_id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category = crud.category.update_category(db=db, category_id=category_id, category=category_in)
    return category

@router.delete("/{category_id}", response_model=bool)
def delete_category(
    *,
    db: Session = Depends(deps.get_db),
    category_id: int,
    current_user: models.User = Depends(deps.get_current_user)
):
    category = crud.category.get_category(db, category_id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return crud.category.delete_category(db=db, category_id=category_id) 