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
from app.models.task import Task, TaskCategory, TaskStatus, TaskPriority, EnergyLevel
from app.models.pomodoro import PomodoroSession
from app.schemas.auth import UserCreate, Token, User as UserSchema
from app.services.redis_service import redis_service
import logging
import random
import pytz
import asyncio

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

    # Store demo user token for instant middleware lookup
    from app.middleware.demo_cache import store_demo_user_token

    await store_demo_user_token(demo_user.id, access_token)

    # Pre-warm cache in background (don't wait for it to complete)
    asyncio.create_task(prewarm_demo_user_cache(db, demo_user))

    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    return {"access_token": access_token, "token_type": "bearer"}


def create_demo_user_data(db: Session, demo_user: User):
    """
    Create sample data for the demo user:
    - Multiple income and expense transactions with varied categories, dates, and amounts
    - Several active and inactive subscriptions with different billing frequencies
    - Sample financial history spanning at least 8 months for meaningful trends
    - Sample tasks (both short-term and long-term) with various priorities and statuses
    - Sample pomodoro sessions for historical data and counts alignment
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

        # High salary to make demo user wealthy (around the 1st of each month)
        salary_date = month_date.replace(day=random.randint(1, 5))
        salary_amount = random.uniform(50000, 75000)  # Much higher salary
        transactions.append(
            Transaction(
                user_id=demo_user.id,
                amount=salary_amount,
                description="Executive Salary",
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

        # High-value investment income
        investment_date = month_date.replace(day=random.randint(15, 25))
        investment_amount = random.uniform(25000, 50000)  # Investment returns
        transactions.append(
            Transaction(
                user_id=demo_user.id,
                amount=investment_amount,
                description="Investment Returns",
                date=investment_date,
                type=TransactionType.income,
                payment_method=PaymentMethod.bank_transfer,
                category_id=random.choice(
                    [
                        c.id
                        for c in income_categories
                        if c.name == "Investment" or c.name == "Other"
                    ]
                ),
            )
        )

        # High-value freelance/consulting income
        if random.random() > 0.2:  # 80% chance of consulting income
            freelance_date = month_date.replace(day=random.randint(10, 20))
            freelance_amount = random.uniform(15000, 30000)  # High-end consulting
            transactions.append(
                Transaction(
                    user_id=demo_user.id,
                    amount=freelance_amount,
                    description="Consulting Project",
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
            billing_frequency=BillingFrequency.monthly,
            start_date=today - timedelta(days=random.randint(30, 200)),
            status=SubscriptionStatus.active,
            next_payment_date=today + timedelta(days=random.randint(1, 15)),
            notes="Standard plan",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Spotify",
            amount=9.99,
            billing_frequency=BillingFrequency.monthly,
            start_date=today - timedelta(days=random.randint(30, 200)),
            status=SubscriptionStatus.active,
            next_payment_date=today + timedelta(days=random.randint(1, 15)),
            notes="Premium plan",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Amazon Prime",
            amount=139.00,
            billing_frequency=BillingFrequency.yearly,
            start_date=today - timedelta(days=random.randint(30, 200)),
            status=SubscriptionStatus.active,
            next_payment_date=today + timedelta(days=random.randint(60, 300)),
            notes="Annual subscription",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Gym Membership",
            amount=49.99,
            billing_frequency=BillingFrequency.monthly,
            start_date=today - timedelta(days=random.randint(30, 200)),
            status=SubscriptionStatus.active,
            next_payment_date=today + timedelta(days=random.randint(1, 15)),
            notes="Fitness Plus",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Disney+",
            amount=7.99,
            billing_frequency=BillingFrequency.monthly,
            start_date=today - timedelta(days=random.randint(30, 200)),
            status=SubscriptionStatus.active,
            next_payment_date=today + timedelta(days=random.randint(16, 28)),
            notes="Basic plan",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Adobe Creative Cloud",
            amount=52.99,
            billing_frequency=BillingFrequency.monthly,
            start_date=today - timedelta(days=random.randint(30, 200)),
            status=SubscriptionStatus.active,
            next_payment_date=today + timedelta(days=random.randint(16, 28)),
            notes="All apps",
        ),
        # Inactive subscriptions
        Subscription(
            user_id=demo_user.id,
            name="HBO Max",
            amount=14.99,
            billing_frequency=BillingFrequency.monthly,
            start_date=today - timedelta(days=random.randint(100, 300)),
            status=SubscriptionStatus.inactive,
            last_active_date=today - timedelta(days=random.randint(10, 90)),
            notes="Cancelled",
        ),
        Subscription(
            user_id=demo_user.id,
            name="YouTube Premium",
            amount=11.99,
            billing_frequency=BillingFrequency.monthly,
            start_date=today - timedelta(days=random.randint(100, 300)),
            status=SubscriptionStatus.inactive,
            last_active_date=today - timedelta(days=random.randint(10, 90)),
            notes="Free trial ended",
        ),
        Subscription(
            user_id=demo_user.id,
            name="Hulu",
            amount=12.99,
            billing_frequency=BillingFrequency.monthly,
            start_date=today - timedelta(days=random.randint(100, 300)),
            status=SubscriptionStatus.inactive,
            last_active_date=today - timedelta(days=random.randint(10, 90)),
            notes="Switched to bundle",
        ),
        # Future subscriptions (starting in 2030)
        Subscription(
            user_id=demo_user.id,
            name="Future Tech Pro",
            amount=99.99,
            billing_frequency=BillingFrequency.monthly,
            start_date=date(2030, 1, 1),
            status=SubscriptionStatus.active,
            next_payment_date=date(2030, 1, 1),
            notes="Future technology subscription",
        ),
        Subscription(
            user_id=demo_user.id,
            name="AI Assistant Premium",
            amount=29.99,
            billing_frequency=BillingFrequency.monthly,
            start_date=date(2030, 2, 15),
            status=SubscriptionStatus.active,
            next_payment_date=date(2030, 2, 15),
            notes="Advanced AI features",
        ),
    ]

    # Add subscriptions one by one and commit each individually to avoid bulk insert enum issues
    print(f"📱 Creating {len(subscriptions)} demo subscriptions...")
    for i, subscription in enumerate(subscriptions):
        try:
            db.add(subscription)
            db.commit()
            print(
                f"✅ Created subscription {i+1}/{len(subscriptions)}: {subscription.name}"
            )
        except Exception as e:
            print(f"❌ Failed to create subscription {subscription.name}: {str(e)}")
            db.rollback()
            # Continue with other subscriptions

    # Create sample tasks
    # First, get or create task categories
    task_categories = (
        db.query(TaskCategory).filter(TaskCategory.is_default == True).all()
    )

    # If no default task categories exist, create some basic ones
    if not task_categories:
        default_categories = [
            TaskCategory(
                name="Work", description="Work-related tasks", is_default=True
            ),
            TaskCategory(
                name="Personal", description="Personal tasks", is_default=True
            ),
            TaskCategory(
                name="Health", description="Health and fitness tasks", is_default=True
            ),
            TaskCategory(
                name="Learning", description="Learning and development", is_default=True
            ),
            TaskCategory(
                name="Home", description="Home and household tasks", is_default=True
            ),
        ]
        db.add_all(default_categories)
        db.commit()
        task_categories = default_categories

    # Create sample short-term tasks
    short_term_tasks = [
        Task(
            user_id=demo_user.id,
            title="Complete project proposal",
            description="Finish the Q1 project proposal for the marketing campaign",
            due_date=today + timedelta(days=2),
            status=TaskStatus.in_progress,
            priority=TaskPriority.high,
            energy_level=EnergyLevel.high,
            category_id=next(
                (c.id for c in task_categories if c.name == "Work"),
                task_categories[0].id,
            ),
            estimated_time_minutes=120,
            is_long_term=False,
        ),
        Task(
            user_id=demo_user.id,
            title="Buy groceries",
            description="Weekly grocery shopping - milk, bread, vegetables",
            due_date=today + timedelta(days=1),
            status=TaskStatus.not_started,
            priority=TaskPriority.medium,
            energy_level=EnergyLevel.low,
            category_id=next(
                (c.id for c in task_categories if c.name == "Personal"),
                task_categories[0].id,
            ),
            estimated_time_minutes=60,
            is_long_term=False,
        ),
        Task(
            user_id=demo_user.id,
            title="Schedule dentist appointment",
            description="Annual dental checkup and cleaning",
            due_date=today + timedelta(days=7),
            status=TaskStatus.not_started,
            priority=TaskPriority.medium,
            energy_level=EnergyLevel.low,
            category_id=next(
                (c.id for c in task_categories if c.name == "Health"),
                task_categories[0].id,
            ),
            estimated_time_minutes=15,
            is_long_term=False,
        ),
        Task(
            user_id=demo_user.id,
            title="Review team feedback",
            description="Go through team feedback from last sprint retrospective",
            due_date=today + timedelta(days=3),
            status=TaskStatus.completed,
            priority=TaskPriority.medium,
            energy_level=EnergyLevel.medium,
            category_id=next(
                (c.id for c in task_categories if c.name == "Work"),
                task_categories[0].id,
            ),
            estimated_time_minutes=45,
            is_long_term=False,
        ),
        Task(
            user_id=demo_user.id,
            title="Fix kitchen faucet",
            description="The kitchen faucet has been dripping, need to replace the washer",
            due_date=today + timedelta(days=5),
            status=TaskStatus.not_started,
            priority=TaskPriority.low,
            energy_level=EnergyLevel.medium,
            category_id=next(
                (c.id for c in task_categories if c.name == "Home"),
                task_categories[0].id,
            ),
            estimated_time_minutes=90,
            is_long_term=False,
        ),
    ]

    # Create sample long-term tasks
    long_term_tasks = [
        Task(
            user_id=demo_user.id,
            title="Learn Python programming",
            description="Complete online Python course and build a personal project",
            due_date=today + timedelta(days=90),
            status=TaskStatus.in_progress,
            priority=TaskPriority.high,
            energy_level=EnergyLevel.high,
            category_id=next(
                (c.id for c in task_categories if c.name == "Learning"),
                task_categories[0].id,
            ),
            estimated_time_minutes=3600,  # 60 hours
            is_long_term=True,
        ),
        Task(
            user_id=demo_user.id,
            title="Home office renovation",
            description="Redesign and renovate the home office space for better productivity",
            due_date=today + timedelta(days=120),
            status=TaskStatus.not_started,
            priority=TaskPriority.medium,
            energy_level=EnergyLevel.high,
            category_id=next(
                (c.id for c in task_categories if c.name == "Home"),
                task_categories[0].id,
            ),
            estimated_time_minutes=2400,  # 40 hours
            is_long_term=True,
        ),
        Task(
            user_id=demo_user.id,
            title="Marathon training",
            description="Train for the city marathon - build endurance and strength",
            due_date=today + timedelta(days=180),
            status=TaskStatus.in_progress,
            priority=TaskPriority.medium,
            energy_level=EnergyLevel.high,
            category_id=next(
                (c.id for c in task_categories if c.name == "Health"),
                task_categories[0].id,
            ),
            estimated_time_minutes=7200,  # 120 hours
            is_long_term=True,
        ),
        Task(
            user_id=demo_user.id,
            title="Write a book",
            description="Write and publish a book about productivity and time management",
            due_date=today + timedelta(days=365),
            status=TaskStatus.not_started,
            priority=TaskPriority.low,
            energy_level=EnergyLevel.high,
            category_id=next(
                (c.id for c in task_categories if c.name == "Personal"),
                task_categories[0].id,
            ),
            estimated_time_minutes=14400,  # 240 hours
            is_long_term=True,
        ),
    ]

    # Add all tasks
    all_tasks = short_term_tasks + long_term_tasks
    db.add_all(all_tasks)
    db.commit()

    # Create sample pomodoro sessions
    # Create sessions for the past 30 days to align with the hardcoded counts
    pst = pytz.timezone("America/Los_Angeles")
    pomodoro_sessions = []

    # Task names for variety
    task_names = [
        "Complete project proposal",
        "Review team feedback",
        "Learn Python programming",
        "Write documentation",
        "Code review",
        "Research new technologies",
        "Plan sprint activities",
        "Design system architecture",
        "Bug fixes",
        "Feature development",
    ]

    # Create sessions for the past 30 days
    for day_offset in range(30):
        session_date = today - timedelta(days=day_offset)

        # Create 1-3 sessions per day (some days might have 0)
        if random.random() > 0.2:  # 80% chance of having sessions on any given day
            num_sessions = random.randint(1, 3)

            for session_num in range(num_sessions):
                # Random time during the day
                hour = random.randint(9, 17)  # Work hours
                minute = random.randint(0, 59)

                start_time = datetime.combine(
                    session_date, datetime.min.time().replace(hour=hour, minute=minute)
                )
                start_time = pst.localize(start_time)

                # Most sessions are 25 minutes (completed), some are shorter (interrupted)
                if random.random() > 0.15:  # 85% completion rate
                    duration = 25
                    status = "completed"
                    end_time = start_time + timedelta(minutes=25)
                else:
                    duration = random.randint(5, 20)  # Interrupted sessions
                    status = "interrupted"
                    end_time = start_time + timedelta(minutes=duration)

                session = PomodoroSession(
                    user_id=demo_user.id,
                    task_name=random.choice(task_names),
                    start_time=start_time,
                    end_time=end_time,
                    duration_minutes=duration,
                    status=status,
                    notes="Demo session" if random.random() > 0.5 else None,
                )
                pomodoro_sessions.append(session)

    # Add all pomodoro sessions
    db.add_all(pomodoro_sessions)
    db.commit()


async def prewarm_demo_user_cache(db: Session, demo_user: User):
    """
    REAL Pre-warming: Precompute and store fully rendered API responses for demo user.
    This creates exactly what the frontend needs, stored in Redis for instant serving.
    """
    try:
        print(
            f"🔥 REAL PRE-WARMING: Precomputing all API responses for demo user {demo_user.id}"
        )

        from datetime import datetime
        from app.services.task_service import TaskService
        from app.services.pomodoro_service import PomodoroService

        # Initialize services that exist
        task_service = TaskService(db)
        pomodoro_service = PomodoroService(db)

        current_year = datetime.now().year

        # Pre-warm transaction categories
        from app.models.category import Category

        categories = db.query(Category).all()
        category_dicts = []
        for category in categories:
            category_dict = {
                "id": category.id,
                "name": category.name,
                "type": category.type.value if category.type else None,
            }
            category_dicts.append(category_dict)

        cache_key = f"categories"
        redis_service.set(cache_key, category_dicts, ttl_seconds=86400)

        # Pre-warm transactions (main endpoint)
        from app.models.transaction import Transaction
        from sqlalchemy.orm import joinedload

        transactions_query = db.query(Transaction).filter(
            Transaction.user_id == demo_user.id
        )
        total_transactions = transactions_query.count()
        transactions = (
            transactions_query.options(joinedload(Transaction.category))
            .order_by(Transaction.date.desc())
            .offset(0)
            .limit(100)
            .all()
        )

        # Convert to dictionaries for caching (match real API format exactly)
        transaction_dicts = []
        for transaction in transactions:
            # Ensure all transactions have valid is_recurring values
            if transaction.is_recurring is None:
                transaction.is_recurring = False

            transaction_dict = {
                "id": transaction.id,
                "user_id": transaction.user_id,
                "amount": (
                    float(transaction.amount)
                    if transaction.amount is not None
                    else None
                ),
                "description": transaction.description,
                "date": transaction.date.isoformat() if transaction.date else None,
                "type": transaction.type.value if transaction.type else None,
                "payment_method": (
                    transaction.payment_method.value
                    if transaction.payment_method
                    else None
                ),
                "is_recurring": transaction.is_recurring,
                "recurring_frequency": transaction.recurring_frequency,
                "notes": transaction.notes,
                "category_id": transaction.category_id,
                "category": (
                    {
                        "id": transaction.category.id,
                        "name": transaction.category.name,
                        "type": transaction.category.type.value,
                        "color": getattr(
                            transaction.category, "color", "#6B7280"
                        ),  # Default color
                    }
                    if transaction.category
                    else None
                ),
            }
            transaction_dicts.append(transaction_dict)

        cache_key = (
            f"user_{demo_user.id}_transactions_None_None_None_None_None_None_0_100"
        )
        redis_service.set(cache_key, transaction_dicts, ttl_seconds=3600)

        # Pre-warm monthly summary
        from sqlalchemy import func, extract

        monthly_query = (
            db.query(
                extract("month", Transaction.date).label("month"),
                Transaction.type,
                func.sum(Transaction.amount).label("total_amount"),
            )
            .filter(
                Transaction.user_id == demo_user.id,
                extract("year", Transaction.date) == current_year,
            )
            .group_by(extract("month", Transaction.date), Transaction.type)
            .all()
        )

        # Format monthly summary
        monthly_summary = {}
        for result in monthly_query:
            month_num = int(result.month)
            if month_num not in monthly_summary:
                monthly_summary[month_num] = {"income": 0, "expense": 0, "net": 0}

            if result.type.value == "income":
                monthly_summary[month_num]["income"] = float(result.total_amount)
            else:
                monthly_summary[month_num]["expense"] = float(result.total_amount)

            monthly_summary[month_num]["net"] = (
                monthly_summary[month_num]["income"]
                - monthly_summary[month_num]["expense"]
            )

        cache_key = f"user_{demo_user.id}_monthly_summary_{current_year}_None_None"
        redis_service.set(cache_key, {"summary": monthly_summary}, ttl_seconds=1800)

        # Pre-warm yearly summary
        yearly_query = (
            db.query(
                Transaction.type, func.sum(Transaction.amount).label("total_amount")
            )
            .filter(
                Transaction.user_id == demo_user.id,
                extract("year", Transaction.date) == current_year,
            )
            .group_by(Transaction.type)
            .all()
        )

        total_income = 0
        total_expense = 0
        for result in yearly_query:
            amount = float(result.total_amount)
            if result.type.value == "income":
                total_income = amount
            else:
                total_expense = amount

        yearly_summary = {
            "year": current_year,
            "total_income": total_income,
            "total_expense": total_expense,
            "net_income": total_income - total_expense,
        }

        cache_key = f"yearly_summary:{demo_user.id}:{current_year}:None"
        redis_service.set(cache_key, yearly_summary, ttl_seconds=1800)

        # Pre-warm subscriptions
        from app.models.subscription import Subscription

        subscriptions_query = db.query(Subscription).filter(
            Subscription.user_id == demo_user.id, Subscription.status == "active"
        )
        total_subscriptions = subscriptions_query.count()
        subscriptions = (
            subscriptions_query.order_by(Subscription.id.desc())
            .offset(0)
            .limit(100)
            .all()
        )

        # Convert to dictionaries for caching
        subscription_dicts = []
        for subscription in subscriptions:
            subscription_dict = {
                "id": subscription.id,
                "user_id": subscription.user_id,
                "name": subscription.name,
                "amount": float(subscription.amount),
                "billing_frequency": (
                    subscription.billing_frequency.value
                    if subscription.billing_frequency
                    else None
                ),
                "start_date": (
                    subscription.start_date.isoformat()
                    if subscription.start_date
                    else None
                ),
                "status": subscription.status.value if subscription.status else None,
                "next_payment_date": (
                    subscription.next_payment_date.isoformat()
                    if subscription.next_payment_date
                    else None
                ),
                "last_active_date": (
                    subscription.last_active_date.isoformat()
                    if subscription.last_active_date
                    else None
                ),
                "notes": subscription.notes,
                "created_at": (
                    subscription.created_at.isoformat()
                    if hasattr(subscription, "created_at") and subscription.created_at
                    else None
                ),
            }
            subscription_dicts.append(subscription_dict)

        cache_key = f"user_{demo_user.id}_subscriptions_active_0_100"
        redis_service.set(cache_key, subscription_dicts, ttl_seconds=3600)

        # Pre-warm inactive subscriptions
        inactive_subscriptions_query = db.query(Subscription).filter(
            Subscription.user_id == demo_user.id, Subscription.status == "inactive"
        )
        inactive_subscriptions = (
            inactive_subscriptions_query.order_by(Subscription.id.desc())
            .offset(0)
            .limit(100)
            .all()
        )

        # Convert to dictionaries for caching
        inactive_subscription_dicts = []
        for subscription in inactive_subscriptions:
            subscription_dict = {
                "id": subscription.id,
                "user_id": subscription.user_id,
                "name": subscription.name,
                "amount": float(subscription.amount),
                "billing_frequency": (
                    subscription.billing_frequency.value
                    if subscription.billing_frequency
                    else None
                ),
                "start_date": (
                    subscription.start_date.isoformat()
                    if subscription.start_date
                    else None
                ),
                "status": subscription.status.value if subscription.status else None,
                "next_payment_date": (
                    subscription.next_payment_date.isoformat()
                    if subscription.next_payment_date
                    else None
                ),
                "last_active_date": (
                    subscription.last_active_date.isoformat()
                    if subscription.last_active_date
                    else None
                ),
                "notes": subscription.notes,
                "created_at": (
                    subscription.created_at.isoformat()
                    if hasattr(subscription, "created_at") and subscription.created_at
                    else None
                ),
            }
            inactive_subscription_dicts.append(subscription_dict)

        cache_key = f"user_{demo_user.id}_subscriptions_inactive_0_100"
        redis_service.set(cache_key, inactive_subscription_dicts, ttl_seconds=3600)

        # Pre-warm subscription summary using the actual API endpoint logic
        from app.api.subscriptions import get_subscriptions_summary
        from app.models.user import User as UserModel

        # Create a mock user object for the API call
        mock_user = UserModel()
        mock_user.id = demo_user.id

        # This will calculate and cache the subscription summary properly
        try:
            subscription_summary = await get_subscriptions_summary(
                response=None, db=db, current_user=mock_user
            )
            print(f"📊 Pre-warmed subscription summary: {subscription_summary}")
        except Exception as e:
            print(f"⚠️ Failed to pre-warm subscription summary: {e}")
            # Fallback to empty summary
            subscription_summary = {
                "total_monthly_cost": 0.0,
                "future_monthly_cost": 0.0,
                "total_combined_monthly_cost": 0.0,
                "active_subscriptions_count": 0,
                "future_subscriptions_count": 0,
                "total_subscriptions_count": 0,
            }
            cache_key = f"user_{demo_user.id}_subscription_summary"
            redis_service.set(cache_key, subscription_summary, ttl_seconds=1800)

        # Pre-warm task categories
        categories = (
            db.query(TaskCategory)
            .filter(
                (TaskCategory.is_default == True)
                | (TaskCategory.user_id == demo_user.id)
            )
            .all()
        )
        category_dicts = []
        for category in categories:
            category_dict = {
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "is_default": category.is_default,
                "user_id": category.user_id,
                "created_at": (
                    category.created_at.isoformat() if category.created_at else None
                ),
            }
            category_dicts.append(category_dict)

        cache_key = f"user_{demo_user.id}_task_categories"
        redis_service.set(cache_key, category_dicts, ttl_seconds=86400)

        # Pre-warm task data (both short-term and long-term)
        from sqlalchemy import case
        from sqlalchemy.orm import joinedload

        # Short-term tasks
        short_term_query = db.query(Task).filter(
            Task.user_id == demo_user.id, Task.is_long_term == False
        )
        total_short_term = short_term_query.count()
        short_term_tasks = (
            short_term_query.options(joinedload(Task.category))
            .order_by(
                Task.due_date.asc().nullslast(),
                case(
                    (Task.priority == "high", 3),
                    (Task.priority == "medium", 2),
                    (Task.priority == "low", 1),
                    else_=0,
                ).desc(),
                Task.created_at.desc(),
            )
            .offset(0)
            .limit(10)
            .all()
        )
        short_term_result = {"tasks": short_term_tasks, "total_count": total_short_term}
        cache_key = f"user_{demo_user.id}_tasks_False_None_None_None_None_None_0_10"
        redis_service.set(cache_key, short_term_result, ttl_seconds=600)

        # Long-term tasks
        long_term_query = db.query(Task).filter(
            Task.user_id == demo_user.id, Task.is_long_term == True
        )
        total_long_term = long_term_query.count()
        long_term_tasks = (
            long_term_query.options(joinedload(Task.category))
            .order_by(
                Task.due_date.asc().nullslast(),
                case(
                    (Task.priority == "high", 3),
                    (Task.priority == "medium", 2),
                    (Task.priority == "low", 1),
                    else_=0,
                ).desc(),
                Task.created_at.desc(),
            )
            .offset(0)
            .limit(10)
            .all()
        )
        long_term_result = {"tasks": long_term_tasks, "total_count": total_long_term}
        cache_key = f"user_{demo_user.id}_tasks_True_None_None_None_None_None_0_10"
        redis_service.set(cache_key, long_term_result, ttl_seconds=600)

        # Pre-warm pomodoro sessions
        pomodoro_sessions = pomodoro_service.get_pomodoro_sessions(
            user_id=demo_user.id, skip=0, limit=10
        )
        cache_key = f"user_{demo_user.id}_pomodoro_sessions_0_10"
        redis_service.set(cache_key, pomodoro_sessions, ttl_seconds=600)

        # Pre-warm pomodoro counts
        today_count, week_count, total_count = pomodoro_service.get_pomodoro_counts(
            user_id=demo_user.id
        )
        counts_result = {
            "today": today_count,
            "week": week_count,
            "total": total_count,
            "user_id": demo_user.id,
        }
        cache_key = f"user_{demo_user.id}_pomodoro_counts"
        redis_service.set(cache_key, counts_result, ttl_seconds=1800)

        print(f"Cache pre-warming completed for demo user {demo_user.id}")

    except Exception as e:
        print(f"Error during cache pre-warming: {str(e)}")
        # Don't raise the error - pre-warming failure shouldn't break demo login


@router.post("/demo/refresh", status_code=status.HTTP_200_OK)
async def refresh_demo_data(db: Session = Depends(get_db)):
    """
    Refresh demo user data with wealthy profile and comprehensive cache pre-warming.
    """
    # Check if demo user exists
    demo_user = db.query(User).filter(User.email == "demo_user@example.com").first()

    if not demo_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Demo user not found"
        )

    print(f"🔄 Refreshing demo data for user {demo_user.id}")

    # Delete existing data
    db.query(Transaction).filter(Transaction.user_id == demo_user.id).delete()
    db.query(Subscription).filter(Subscription.user_id == demo_user.id).delete()
    db.query(Task).filter(Task.user_id == demo_user.id).delete()
    db.query(PomodoroSession).filter(PomodoroSession.user_id == demo_user.id).delete()
    db.commit()

    print(f"🗑️ Deleted existing demo data for user {demo_user.id}")

    # Clear Redis cache for demo user
    redis_service.clear_user_cache(demo_user.id)
    print(f"🧹 Cleared cache for user {demo_user.id}")

    # Create new wealthy demo data
    try:
        create_demo_user_data(db, demo_user)
        print(f"✅ Created new wealthy demo data for user {demo_user.id}")

        # Verify data was created
        transaction_count = (
            db.query(Transaction).filter(Transaction.user_id == demo_user.id).count()
        )
        subscription_count = (
            db.query(Subscription).filter(Subscription.user_id == demo_user.id).count()
        )
        task_count = db.query(Task).filter(Task.user_id == demo_user.id).count()
        pomodoro_count = (
            db.query(PomodoroSession)
            .filter(PomodoroSession.user_id == demo_user.id)
            .count()
        )

        print(
            f"📊 Demo data created: {transaction_count} transactions, {subscription_count} subscriptions, {task_count} tasks, {pomodoro_count} pomodoro sessions"
        )

    except Exception as e:
        print(f"❌ Error creating demo data: {str(e)}")
        raise

    # REAL Pre-warming: Precompute all API responses for instant serving
    from app.middleware.demo_cache import precompute_demo_responses

    asyncio.create_task(precompute_demo_responses(db, demo_user))
    print(
        f"🚀 Started REAL pre-warming: precomputing all API responses for instant serving"
    )

    return {
        "message": "Demo user data refreshed successfully with wealthy profile and REAL pre-warming"
    }
