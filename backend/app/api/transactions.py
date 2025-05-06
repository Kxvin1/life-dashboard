from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
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
    return db_transaction


@router.get("/transactions/", response_model=List[TransactionSchema])
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    type: Optional[TransactionType] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if type:
        query = query.filter(Transaction.type == type)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)

    transactions = query.offset(skip).limit(limit).all()
    return transactions


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
    return db_transaction


@router.delete("/transactions/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Log the transaction ID and user for debugging
    print(
        f"DELETE request for transaction_id: {transaction_id}, user_id: {current_user.id}"
    )

    # Find the transaction
    db_transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id, Transaction.user_id == current_user.id
        )
        .first()
    )

    if db_transaction is None:
        print(f"Transaction not found: {transaction_id}")
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Log the transaction details before deletion
    print(
        f"Deleting transaction: {db_transaction.id}, {db_transaction.description}, {db_transaction.amount}"
    )

    # Delete the transaction
    db.delete(db_transaction)
    db.commit()

    print(f"Transaction {transaction_id} deleted successfully")

    return {"success": True, "message": "Transaction deleted successfully"}


# Add a test endpoint for deletion that doesn't require authentication and can be accessed via GET
@router.get("/test-delete-transaction/{transaction_id}")
async def test_delete_transaction_get(
    transaction_id: int,
    db: Session = Depends(get_db),
    response: Response = None,
):
    # Find the transaction
    db_transaction = (
        db.query(Transaction).filter(Transaction.id == transaction_id).first()
    )

    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Log the transaction details
    print(
        f"Test deleting transaction (GET): {db_transaction.id}, {db_transaction.description}, {db_transaction.amount}"
    )

    # Delete the transaction
    db.delete(db_transaction)
    db.commit()

    # Return HTML with a success message
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Transaction Deleted</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #1e1e2e;
                color: #cdd6f4;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                text-align: center;
            }
            .success-icon {
                color: #a6e3a1;
                font-size: 48px;
                margin-bottom: 20px;
            }
            h1 {
                margin-bottom: 10px;
            }
            p {
                margin-top: 0;
                color: #bac2de;
            }
            .container {
                background-color: #313244;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                max-width: 500px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✓</div>
            <h1>Transaction Deleted Successfully</h1>
            <p>You can now close this tab and return to the dashboard.</p>
        </div>
    </body>
    </html>
    """

    # Set the content type to HTML
    if response:
        response.headers["Content-Type"] = "text/html"

    return HTMLResponse(content=html_content)


# Keep the DELETE version for compatibility
@router.delete("/test-delete-transaction/{transaction_id}")
async def test_delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    response: Response = None,
):
    # Find the transaction
    db_transaction = (
        db.query(Transaction).filter(Transaction.id == transaction_id).first()
    )

    if db_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Log the transaction details
    print(
        f"Test deleting transaction (DELETE): {db_transaction.id}, {db_transaction.description}, {db_transaction.amount}"
    )

    # Delete the transaction
    db.delete(db_transaction)
    db.commit()

    # Return HTML with a success message (same as GET version)
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Transaction Deleted</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #1e1e2e;
                color: #cdd6f4;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
                text-align: center;
            }
            .success-icon {
                color: #a6e3a1;
                font-size: 48px;
                margin-bottom: 20px;
            }
            h1 {
                margin-bottom: 10px;
            }
            p {
                margin-top: 0;
                color: #bac2de;
            }
            .container {
                background-color: #313244;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                max-width: 500px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✓</div>
            <h1>Transaction Deleted Successfully</h1>
            <p>You can now close this tab and return to the dashboard.</p>
        </div>
    </body>
    </html>
    """

    # Set the content type to HTML
    if response:
        response.headers["Content-Type"] = "text/html"

    return HTMLResponse(content=html_content)


# Define a separate route for transaction summary to avoid conflicts with the transaction_id route
@router.get("/transactions-summary/")
async def get_transaction_summary(
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

    return {
        "total_income": income,
        "total_expenses": expenses,
        "net_income": income - expenses,
        "transaction_count": len(transactions),
    }


# Keep the old route for backward compatibility
@router.get("/transactions/summary/")
async def get_transaction_summary_legacy(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_transaction_summary(
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        db=db,
        current_user=current_user,
    )
