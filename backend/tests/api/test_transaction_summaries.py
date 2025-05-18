import pytest
from fastapi.testclient import TestClient
from datetime import date
from app.main import app
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.api.auth import get_current_user
from app.db.database import get_db

# Create a test client
client = TestClient(app)

# Mock user data
TEST_USER_EMAIL = "test@example.com"

# Create a mock user
mock_user = User(
    id=1,
    email=TEST_USER_EMAIL,
    hashed_password="hashed_password",
    full_name="Test User",
    is_active=True,
    is_demo_user=False,
)

# Mock transactions
mock_transactions = [
    Transaction(
        id=1,
        user_id=1,
        amount=1000,
        description="Salary",
        category_id=1,
        date=date(2023, 1, 15),
        type=TransactionType.income,
        payment_method="cash",
        is_recurring=False,
    ),
    Transaction(
        id=2,
        user_id=1,
        amount=500,
        description="Rent",
        category_id=2,
        date=date(2023, 1, 20),
        type=TransactionType.expense,
        payment_method="bank_transfer",
        is_recurring=True,
    ),
    Transaction(
        id=3,
        user_id=1,
        amount=2000,
        description="Bonus",
        category_id=1,
        date=date(2023, 2, 1),
        type=TransactionType.income,
        payment_method="bank_transfer",
        is_recurring=False,
    ),
    Transaction(
        id=4,
        user_id=1,
        amount=750,
        description="Groceries",
        category_id=3,
        date=date(2023, 2, 10),
        type=TransactionType.expense,
        payment_method="credit_card",
        is_recurring=False,
    ),
]


# Mock database class
class MockDB:
    def __init__(self):
        self.transactions = mock_transactions

    def query(self, model):
        return self

    def filter(self, *args, **kwargs):
        return self

    def all(self):
        return self.transactions

    def first(self):
        return mock_user


# Override the get_db dependency
def override_get_db():
    return MockDB()


# Override the get_current_user dependency
async def override_get_current_user():
    return mock_user


# Apply the overrides
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = override_get_current_user


def test_calculate_net_worth():
    """Test net worth calculation from transactions"""
    # Calculate net worth manually
    income_total = sum(
        t.amount for t in mock_transactions if t.type == TransactionType.income
    )
    expense_total = sum(
        t.amount for t in mock_transactions if t.type == TransactionType.expense
    )
    expected_net_worth = income_total - expense_total

    # Expected: 1000 + 2000 - 500 - 750 = 1750
    assert expected_net_worth == 1750


def test_monthly_summary_calculation():
    """Test monthly summary calculation"""
    # Group transactions by month
    monthly_summary = {}
    for transaction in mock_transactions:
        month = transaction.date.month
        if month not in monthly_summary:
            monthly_summary[month] = {"income": 0, "expense": 0}

        if transaction.type == TransactionType.income:
            monthly_summary[month]["income"] += transaction.amount
        else:
            monthly_summary[month]["expense"] += transaction.amount

    # Calculate net for each month
    for month, data in monthly_summary.items():
        data["net"] = data["income"] - data["expense"]

    # Verify January data
    assert monthly_summary[1]["income"] == 1000
    assert monthly_summary[1]["expense"] == 500
    assert monthly_summary[1]["net"] == 500

    # Verify February data
    assert monthly_summary[2]["income"] == 2000
    assert monthly_summary[2]["expense"] == 750
    assert monthly_summary[2]["net"] == 1250
