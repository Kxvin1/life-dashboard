from datetime import timedelta, datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_user,
)
from app.db.database import get_db
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, PaymentMethod
from app.models.subscription import Subscription, SubscriptionStatus, BillingFrequency
from app.models.category import Category
from app.schemas.auth import UserCreate, Token, User as UserSchema
import logging
import random

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


@router.post("/register", response_model=Token)
async def register(
    request: Request,
    user_data: UserCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    # Log the request body
    body = await request.body()
    logging.info(f"Received registration request with body: {body.decode()}")

    # Log the parsed user data
    logging.info(f"Parsed user data: {user_data.dict()}")

    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        logging.warning(f"Registration attempt with existing email: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data.email}, expires_delta=access_token_expires
    )

    response.headers["Access-Control-Allow-Credentials"] = "true"
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    response.headers["Access-Control-Allow-Credentials"] = "true"
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/demo", response_model=Token)
async def login_as_demo(response: Response, db: Session = Depends(get_db)):
    """
    Login as a demo user. If the demo user doesn't exist, create one with sample data.
    """
    # Check if demo user exists
    demo_user = db.query(User).filter(User.email == "demo_user@example.com").first()

    if not demo_user:
        # Create demo user
        hashed_password = get_password_hash("demo_password")
        demo_user = User(
            email="demo_user@example.com",
            hashed_password=hashed_password,
            full_name="Demo User",
            is_demo_user=True,
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

        # Create sample data for demo user
        try:
            create_demo_user_data(db, demo_user)
        except Exception as e:
            logging.error(f"Error creating demo user data: {e}")
            # Continue even if data creation fails

    # Generate token for demo user
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": demo_user.email}, expires_delta=access_token_expires
    )

    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    return {"access_token": access_token, "token_type": "bearer"}


def create_demo_user_data(db: Session, demo_user: User):
    """
    Create sample data for the demo user:
    - Multiple income and expense transactions with varied categories, dates, and amounts
    - Several active and inactive subscriptions with different billing frequencies
    - Sample financial history spanning at least 8 months for meaningful trends
    """
    # Get all categories
    categories = db.query(Category).all()
    income_categories = [c for c in categories if c.type == TransactionType.income]
    expense_categories = [c for c in categories if c.type == TransactionType.expense]

    # If no categories exist, create default ones
    if not income_categories:
        income_categories = [
            Category(name="Salary", type=TransactionType.income),
            Category(name="Freelance", type=TransactionType.income),
            Category(name="Investment", type=TransactionType.income),
            Category(name="Other", type=TransactionType.income),
        ]
        db.add_all(income_categories)
        db.commit()

    if not expense_categories:
        expense_categories = [
            Category(name="Housing", type=TransactionType.expense),
            Category(name="Food", type=TransactionType.expense),
            Category(name="Transportation", type=TransactionType.expense),
            Category(name="Utilities", type=TransactionType.expense),
            Category(name="Entertainment", type=TransactionType.expense),
            Category(name="Shopping", type=TransactionType.expense),
            Category(name="Health", type=TransactionType.expense),
        ]
        db.add_all(expense_categories)
        db.commit()

    # Create transactions for the past 8 months
    today = date.today()
    transactions = []

    # Payment methods
    payment_methods = [
        PaymentMethod.cash,
        PaymentMethod.credit_card,
        PaymentMethod.debit_card,
        PaymentMethod.bank_transfer,
    ]

    # Create income transactions (2-3 per month)
    for month_offset in range(8):
        month_date = today.replace(day=1) - timedelta(days=month_offset * 30)

        # Regular salary (around the 1st of each month)
        salary_date = month_date.replace(day=random.randint(1, 5))
        salary_amount = random.uniform(3000, 4000)
        transactions.append(
            Transaction(
                user_id=demo_user.id,
                amount=salary_amount,
                description="Monthly Salary",
                date=salary_date,
                type=TransactionType.income,
                payment_method=PaymentMethod.bank_transfer,
                category_id=random.choice(
                    [
                        c.id
                        for c in income_categories
                        if c.name == "Salary" or c.name == "Employment"
                    ]
                ),
            )
        )

        # Occasional freelance income
        if random.random() > 0.3:  # 70% chance of freelance income
            freelance_date = month_date.replace(day=random.randint(10, 25))
            freelance_amount = random.uniform(500, 1500)
            transactions.append(
                Transaction(
                    user_id=demo_user.id,
                    amount=freelance_amount,
                    description="Freelance Project",
                    date=freelance_date,
                    type=TransactionType.income,
                    payment_method=random.choice(payment_methods),
                    category_id=random.choice(
                        [
                            c.id
                            for c in income_categories
                            if c.name == "Freelance" or c.name == "Business"
                        ]
                    ),
                )
            )

    # Create expense transactions (15-25 per month)
    for month_offset in range(8):
        month_date = today.replace(day=1) - timedelta(days=month_offset * 30)
        month_days = 30  # Simplified

        # Number of expenses this month
        num_expenses = random.randint(15, 25)

        for _ in range(num_expenses):
            expense_date = month_date.replace(day=random.randint(1, month_days))
            expense_amount = random.uniform(10, 500)
            category = random.choice(expense_categories)

            # Generate description based on category
            description = ""
            if category.name == "Housing":
                description = random.choice(
                    ["Rent", "Mortgage", "Utilities", "Home Insurance"]
                )
            elif category.name == "Food":
                description = random.choice(
                    ["Grocery Shopping", "Restaurant", "Coffee Shop", "Food Delivery"]
                )
            elif category.name == "Transportation":
                description = random.choice(
                    ["Gas", "Public Transit", "Uber/Lyft", "Car Maintenance"]
                )
            elif category.name == "Utilities":
                description = random.choice(
                    ["Electricity", "Water", "Internet", "Phone Bill"]
                )
            elif category.name == "Entertainment":
                description = random.choice(
                    ["Movie Tickets", "Concert", "Streaming Service", "Video Games"]
                )
            elif category.name == "Shopping":
                description = random.choice(
                    ["Clothing", "Electronics", "Home Goods", "Online Shopping"]
                )
            elif category.name == "Health":
                description = random.choice(
                    ["Doctor Visit", "Medication", "Gym Membership", "Health Insurance"]
                )
            else:
                description = "Miscellaneous Expense"

            transactions.append(
                Transaction(
                    user_id=demo_user.id,
                    amount=expense_amount,
                    description=description,
                    date=expense_date,
                    type=TransactionType.expense,
                    payment_method=random.choice(payment_methods),
                    category_id=category.id,
                )
            )

    # Add all transactions
    db.add_all(transactions)
    db.commit()

    # Create subscriptions
    subscriptions = [
        # Active subscriptions
        Subscription(
            user_id=demo_user.id,
            name="Netflix",
            amount=15.99,
            billing_frequency="monthly",
            start_date=today - timedelta(days=random.randint(30, 200)),
            status="active",
            next_payment_date=today + timedelta(days=random.randint(1, 15)),
            notes="Standard plan",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Spotify",
            amount=9.99,
            billing_frequency="monthly",
            start_date=today - timedelta(days=random.randint(30, 200)),
            status="active",
            next_payment_date=today + timedelta(days=random.randint(1, 15)),
            notes="Premium plan",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Amazon Prime",
            amount=139.00,
            billing_frequency="yearly",
            start_date=today - timedelta(days=random.randint(30, 200)),
            status="active",
            next_payment_date=today + timedelta(days=random.randint(60, 300)),
            notes="Annual subscription",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Gym Membership",
            amount=49.99,
            billing_frequency="monthly",
            start_date=today - timedelta(days=random.randint(30, 200)),
            status="active",
            next_payment_date=today + timedelta(days=random.randint(1, 15)),
            notes="Fitness Plus",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Disney+",
            amount=7.99,
            billing_frequency="monthly",
            start_date=today - timedelta(days=random.randint(30, 200)),
            status="active",
            next_payment_date=today + timedelta(days=random.randint(16, 28)),
            notes="Basic plan",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Adobe Creative Cloud",
            amount=52.99,
            billing_frequency="monthly",
            start_date=today - timedelta(days=random.randint(30, 200)),
            status="active",
            next_payment_date=today + timedelta(days=random.randint(16, 28)),
            notes="All apps",
        ),
        # Inactive subscriptions
        Subscription(
            user_id=demo_user.id,
            name="HBO Max",
            amount=14.99,
            billing_frequency="monthly",
            start_date=today - timedelta(days=random.randint(100, 300)),
            status="inactive",
            last_active_date=today - timedelta(days=random.randint(10, 90)),
            notes="Cancelled",
        ),
        Subscription(
            user_id=demo_user.id,
            name="YouTube Premium",
            amount=11.99,
            billing_frequency="monthly",
            start_date=today - timedelta(days=random.randint(100, 300)),
            status="inactive",
            last_active_date=today - timedelta(days=random.randint(10, 90)),
            notes="Free trial ended",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Hulu",
            amount=12.99,
            billing_frequency="monthly",
            start_date=today - timedelta(days=random.randint(100, 300)),
            status="inactive",
            last_active_date=today - timedelta(days=random.randint(10, 90)),
            notes="Switched to bundle",
        ),
        # Future subscriptions (starting in 2030)
        Subscription(
            user_id=demo_user.id,
            name="Future Tech Pro",
            amount=99.99,
            billing_frequency="monthly",
            start_date=date(2030, 1, 1),
            status="active",
            next_payment_date=date(2030, 1, 1),
            notes="Future technology subscription",
        ),
        Subscription(
            user_id=demo_user.id,
            name="AI Assistant Premium",
            amount=29.99,
            billing_frequency="monthly",
            start_date=date(2030, 2, 15),
            status="active",
            next_payment_date=date(2030, 2, 15),
            notes="Advanced AI features",
        ),
    ]

    db.add_all(subscriptions)
    db.commit()


@router.post("/demo/refresh", status_code=status.HTTP_200_OK)
async def refresh_demo_data(db: Session = Depends(get_db)):
    """
    Refresh demo user data. This is useful for testing and development.
    """
    # Check if demo user exists
    demo_user = db.query(User).filter(User.email == "demo_user@example.com").first()

    if not demo_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Demo user not found"
        )

    # Delete existing data
    db.query(Transaction).filter(Transaction.user_id == demo_user.id).delete()
    db.query(Subscription).filter(Subscription.user_id == demo_user.id).delete()
    db.commit()

    # Create new data
    create_demo_user_data(db, demo_user)

    return {"message": "Demo user data refreshed successfully"}
