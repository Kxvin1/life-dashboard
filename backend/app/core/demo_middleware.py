from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.core.security import get_current_user
import logging
from typing import Optional, Dict, Any, List
import json


class DemoUserMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle demo user requests.

    This middleware intercepts requests from demo users and:
    1. Allows GET requests (read-only operations)
    2. Simulates success for POST/PUT/DELETE requests without actually modifying the database
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)
        # Endpoints that should be allowed for demo users (read-only)
        self.allowed_endpoints = [
            "/api/v1/auth/me",
            "/api/v1/auth/logout",
            "/api/v1/categories",
            "/api/v1/transactions",
            "/api/v1/summaries",
            "/api/v1/subscriptions",
        ]

        # Endpoints that should be simulated for demo users (write operations)
        self.simulated_endpoints = [
            "/api/v1/transactions/",
            "/api/v1/subscriptions/",
        ]

        # Endpoints that should be blocked for demo users
        self.blocked_endpoints = [
            "/api/v1/insights/transactions",  # Block AI insights for demo users
        ]

    async def dispatch(self, request: Request, call_next):
        # Only intercept API requests
        if not request.url.path.startswith("/api/v1/"):
            return await call_next(request)

        # Check if the user is a demo user
        user = await self._get_current_user(request)
        if not user or not user.is_demo_user:
            return await call_next(request)

        # Handle based on request method and path
        if request.method == "GET":
            # Special handling for transactions endpoint
            if request.url.path.startswith("/api/v1/transactions/"):
                try:
                    # Parse query parameters to get year if present
                    query_params = dict(request.query_params)
                    year = None
                    if "year" in query_params:
                        try:
                            year = int(query_params["year"])
                        except (ValueError, TypeError):
                            # If year is not a valid integer, ignore it
                            pass

                    # Call the next middleware to get the response
                    response = await call_next(request)

                    # If the response is successful, return it
                    if response.status_code == 200:
                        return response

                    # If there's an error, provide a mock response with demo data
                    logging.warning(
                        f"Error in demo user transaction request: {response.status_code}"
                    )

                    # Create mock transaction data with year filter if provided
                    mock_transactions = self._create_mock_transactions(user.id, year)

                    # No need to validate is_recurring here as it's already set correctly in _create_mock_transactions

                    # Return the mock data
                    return Response(
                        content=json.dumps(mock_transactions),
                        status_code=200,
                        media_type="application/json",
                        headers={
                            "Access-Control-Allow-Origin": "http://localhost:3000",
                            "Access-Control-Allow-Credentials": "true",
                        },
                    )
                except Exception as e:
                    logging.error(f"Error handling demo user transaction request: {e}")
                    # Create mock transaction data as fallback
                    try:
                        # Parse query parameters to get year if present
                        query_params = dict(request.query_params)
                        year = None
                        if "year" in query_params:
                            try:
                                year = int(query_params["year"])
                            except (ValueError, TypeError):
                                # If year is not a valid integer, ignore it
                                pass

                        mock_transactions = self._create_mock_transactions(
                            user.id, year
                        )
                    except Exception as inner_e:
                        logging.error(f"Error creating mock transactions: {inner_e}")
                        # Fallback to creating transactions without year filter
                        mock_transactions = self._create_mock_transactions(user.id)

                    # No need to validate is_recurring here as it's already set correctly in _create_mock_transactions

                    # Return the mock data
                    return Response(
                        content=json.dumps(mock_transactions),
                        status_code=200,
                        media_type="application/json",
                        headers={
                            "Access-Control-Allow-Origin": "http://localhost:3000",
                            "Access-Control-Allow-Credentials": "true",
                        },
                    )

            # Special handling for summaries endpoint
            elif request.url.path.startswith("/api/v1/summaries/"):
                try:
                    # Call the next middleware to get the response
                    response = await call_next(request)

                    # If the response is successful, return it
                    if response.status_code == 200:
                        return response

                    # If there's an error, provide a mock response with demo data
                    logging.warning(
                        f"Error in demo user summary request: {response.status_code}"
                    )

                    # Create mock summary data based on the endpoint
                    if "monthly" in request.url.path:
                        mock_data = self._create_mock_monthly_summary()
                    else:
                        mock_data = self._create_mock_yearly_summary()

                    # Return the mock data
                    return Response(
                        content=json.dumps(mock_data),
                        status_code=200,
                        media_type="application/json",
                        headers={
                            "Access-Control-Allow-Origin": "http://localhost:3000",
                            "Access-Control-Allow-Credentials": "true",
                        },
                    )
                except Exception as e:
                    logging.error(f"Error handling demo user summary request: {e}")
                    # Create mock summary data as fallback
                    if "monthly" in request.url.path:
                        mock_data = self._create_mock_monthly_summary()
                    else:
                        mock_data = self._create_mock_yearly_summary()

                    # Return the mock data
                    return Response(
                        content=json.dumps(mock_data),
                        status_code=200,
                        media_type="application/json",
                        headers={
                            "Access-Control-Allow-Origin": "http://localhost:3000",
                            "Access-Control-Allow-Credentials": "true",
                        },
                    )

            # For all other GET requests
            return await call_next(request)

        # Block specific endpoints for demo users
        for endpoint in self.blocked_endpoints:
            if request.url.path.startswith(endpoint):
                return Response(
                    content=json.dumps(
                        {"detail": "This feature is not available in demo mode."}
                    ),
                    status_code=403,
                    media_type="application/json",
                )

        # Simulate success for write operations
        for endpoint in self.simulated_endpoints:
            if request.url.path.startswith(endpoint):
                # For POST requests (creating new items)
                if request.method == "POST":
                    # Read the request body
                    body = await request.body()
                    body_dict = json.loads(body)

                    # Add a demo ID to the response
                    body_dict["id"] = 9999  # Demo ID
                    body_dict["user_id"] = user.id

                    # Return a success response without actually writing to the database
                    return Response(
                        content=json.dumps(body_dict),
                        status_code=200,
                        media_type="application/json",
                    )

                # For PUT/PATCH requests (updating items)
                elif request.method in ["PUT", "PATCH"]:
                    # Read the request body
                    body = await request.body()
                    body_dict = json.loads(body)

                    # Return a success response without actually writing to the database
                    return Response(
                        content=json.dumps(body_dict),
                        status_code=200,
                        media_type="application/json",
                    )

                # For DELETE requests
                elif request.method == "DELETE":
                    # Return a success response without actually deleting from the database
                    return Response(
                        content=json.dumps(
                            {"detail": "Item deleted successfully (demo mode)"}
                        ),
                        status_code=200,
                        media_type="application/json",
                    )

        # For any other requests, proceed normally
        return await call_next(request)

    async def _get_current_user(self, request: Request) -> Optional[User]:
        """
        Get the current user from the request.
        """
        try:
            # Extract token from Authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return None

            token = auth_header.replace("Bearer ", "")

            # Get DB session
            db = next(get_db())

            # Get user from token
            user = await get_current_user(token=token, db=db)
            return user
        except Exception as e:
            logging.error(f"Error getting current user in demo middleware: {e}")
            return None

    def _create_mock_transactions(
        self, user_id: int, year: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Create mock transaction data for demo user.
        This is used as a fallback when there's an error with the actual transaction data.

        Args:
            user_id: The user ID to associate with the transactions
            year: Optional year to filter transactions by
        """
        from datetime import date, timedelta
        import random
        from urllib.parse import parse_qs

        today = date.today()

        # Create transactions for the past 8 months
        transactions = []

        # Payment methods
        payment_methods = ["cash", "credit_card", "debit_card", "bank_transfer"]

        # Define categories based on the seed_categories.py file
        # Income categories (IDs 1-5)
        income_categories = {
            1: {
                "name": "Employment",
                "descriptions": ["Monthly Salary", "Paycheck", "Bonus"],
            },
            2: {
                "name": "Business",
                "descriptions": ["Freelance Project", "Consulting", "Client Payment"],
            },
            3: {
                "name": "Investment",
                "descriptions": ["Dividend", "Stock Sale", "Interest"],
            },
            4: {
                "name": "Rental",
                "descriptions": ["Rental Income", "Airbnb", "Property Income"],
            },
            5: {
                "name": "Other",
                "descriptions": ["Gift", "Refund", "Miscellaneous Income"],
            },
        }

        # Expense categories (IDs 6-12)
        expense_categories = {
            6: {
                "name": "Housing",
                "descriptions": ["Rent", "Mortgage", "Property Tax", "Home Insurance"],
            },
            7: {
                "name": "Transportation",
                "descriptions": ["Gas", "Car Payment", "Public Transit", "Uber/Lyft"],
            },
            8: {
                "name": "Food",
                "descriptions": ["Groceries", "Restaurant", "Fast Food", "Coffee Shop"],
            },
            9: {
                "name": "Utilities",
                "descriptions": ["Electricity", "Water", "Internet", "Phone"],
            },
            10: {
                "name": "Health",
                "descriptions": [
                    "Doctor Visit",
                    "Medication",
                    "Gym Membership",
                    "Health Insurance",
                ],
            },
            11: {
                "name": "Entertainment",
                "descriptions": ["Movies", "Concerts", "Streaming Services", "Games"],
            },
            12: {
                "name": "Shopping",
                "descriptions": [
                    "Clothing",
                    "Electronics",
                    "Home Goods",
                    "Online Shopping",
                ],
            },
        }

        # Create transactions for multiple years if needed
        # Default to current year if no year is specified
        target_year = year if year is not None else today.year

        # Create income transactions (2-3 per month)
        for month_offset in range(8):
            # Calculate the date based on the target year
            month_date = date(target_year, today.month, 1) - timedelta(
                days=month_offset * 30
            )

            # Skip if not in the target year
            if month_date.year != target_year:
                continue

            # Regular salary (around the 1st of each month)
            salary_date = (month_date.replace(day=random.randint(1, 5))).isoformat()
            salary_amount = round(random.uniform(3000, 4000), 2)

            # Use Employment category (ID 1)
            category_id = 1
            description = random.choice(income_categories[category_id]["descriptions"])

            transactions.append(
                {
                    "id": 1000 + len(transactions),
                    "user_id": user_id,
                    "amount": salary_amount,
                    "description": description,
                    "date": salary_date,
                    "type": "income",
                    "payment_method": "bank_transfer",
                    "category_id": category_id,
                    "is_recurring": False,  # Explicitly set to boolean False
                    "notes": None,
                    "recurring_frequency": None,
                    "category": {
                        "id": category_id,
                        "name": income_categories[category_id]["name"],
                        "type": "income",
                    },
                }
            )

            # Occasional freelance income
            if random.random() > 0.3:  # 70% chance of freelance income
                freelance_date = (
                    month_date.replace(day=random.randint(10, 25))
                ).isoformat()
                freelance_amount = round(random.uniform(500, 1500), 2)

                # Use Business category (ID 2)
                category_id = 2
                description = random.choice(
                    income_categories[category_id]["descriptions"]
                )

                transactions.append(
                    {
                        "id": 1000 + len(transactions),
                        "user_id": user_id,
                        "amount": freelance_amount,
                        "description": description,
                        "date": freelance_date,
                        "type": "income",
                        "payment_method": random.choice(payment_methods),
                        "category_id": category_id,
                        "is_recurring": False,  # Explicitly set to boolean False
                        "notes": None,
                        "recurring_frequency": None,
                        "category": {
                            "id": category_id,
                            "name": income_categories[category_id]["name"],
                            "type": "income",
                        },
                    }
                )

        # Create expense transactions (15-25 per month)
        for month_offset in range(8):
            # Calculate the date based on the target year
            month_date = date(target_year, today.month, 1) - timedelta(
                days=month_offset * 30
            )

            # Skip if not in the target year
            if month_date.year != target_year:
                continue

            month_days = 30  # Simplified

            # Number of expenses this month
            num_expenses = random.randint(15, 25)

            for _ in range(num_expenses):
                expense_date = (
                    month_date.replace(day=random.randint(1, month_days))
                ).isoformat()
                expense_amount = round(random.uniform(10, 500), 2)

                # Assign a category (6-12 are expense categories)
                category_id = random.randint(6, 12)

                # Get description based on category
                description = random.choice(
                    expense_categories[category_id]["descriptions"]
                )

                transactions.append(
                    {
                        "id": 1000 + len(transactions),
                        "user_id": user_id,
                        "amount": expense_amount,
                        "description": description,
                        "date": expense_date,
                        "type": "expense",
                        "payment_method": random.choice(payment_methods),
                        "category_id": category_id,
                        "is_recurring": False,  # Explicitly set to boolean False
                        "notes": None,
                        "recurring_frequency": None,
                        "category": {
                            "id": category_id,
                            "name": expense_categories[category_id]["name"],
                            "type": "expense",
                        },
                    }
                )

        # If no transactions were created (e.g., for a future year), create some default ones
        if not transactions and year is not None:
            # Create some transactions for the specified year
            for month in range(1, 13):
                # Create one income transaction per month
                income_date = date(target_year, month, 15).isoformat()
                income_amount = round(random.uniform(3000, 4000), 2)
                category_id = random.randint(1, 5)

                transactions.append(
                    {
                        "id": 1000 + len(transactions),
                        "user_id": user_id,
                        "amount": income_amount,
                        "description": f"Income for {target_year}-{month:02d}",
                        "date": income_date,
                        "type": "income",
                        "payment_method": "bank_transfer",
                        "category_id": category_id,
                        "is_recurring": False,  # Explicitly set to boolean False
                        "notes": None,
                        "recurring_frequency": None,
                        "category": {
                            "id": category_id,
                            "name": income_categories[category_id]["name"],
                            "type": "income",
                        },
                    }
                )

                # Create two expense transactions per month
                for _ in range(2):
                    expense_date = date(
                        target_year, month, random.randint(1, 28)
                    ).isoformat()
                    expense_amount = round(random.uniform(100, 1000), 2)
                    category_id = random.randint(6, 12)

                    transactions.append(
                        {
                            "id": 1000 + len(transactions),
                            "user_id": user_id,
                            "amount": expense_amount,
                            "description": f"Expense for {target_year}-{month:02d}",
                            "date": expense_date,
                            "type": "expense",
                            "payment_method": random.choice(payment_methods),
                            "category_id": category_id,
                            "is_recurring": False,  # Explicitly set to boolean False
                            "notes": None,
                            "recurring_frequency": None,
                            "category": {
                                "id": category_id,
                                "name": expense_categories[category_id]["name"],
                                "type": "expense",
                            },
                        }
                    )

        return transactions

    def _create_mock_monthly_summary(self) -> Dict[str, Any]:
        """
        Create mock monthly summary data.
        This is used as a fallback when there's an error with the actual summary data.
        """
        import random

        # Create summary for 12 months
        summary = {}

        for month in range(1, 13):
            # Generate random but realistic income and expense values
            income = round(random.uniform(3000, 5000), 2)
            expense = round(random.uniform(2000, 4000), 2)
            net = income - expense

            summary[month] = {"income": income, "expense": expense, "net": net}

        return {"summary": summary}

    def _create_mock_yearly_summary(self) -> Dict[str, Any]:
        """
        Create mock yearly summary data.
        This is used as a fallback when there's an error with the actual summary data.
        """
        import random
        from datetime import date

        current_year = date.today().year

        # Generate random but realistic yearly totals
        total_income = round(random.uniform(40000, 60000), 2)
        total_expense = round(random.uniform(30000, 50000), 2)
        net_income = total_income - total_expense

        return {
            "year": current_year,
            "total_income": total_income,
            "total_expense": total_expense,
            "net_income": net_income,
        }

    def _create_mock_subscriptions(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Create mock subscription data for demo user.
        This is used as a fallback when there's an error with the actual subscription data.
        """
        from datetime import date, timedelta
        import random

        today = date.today()

        # Create mock subscriptions
        subscriptions = [
            # Active subscriptions
            {
                "id": 1001,
                "user_id": user_id,
                "name": "Netflix",
                "amount": 15.99,
                "billing_frequency": "monthly",
                "start_date": (
                    today - timedelta(days=random.randint(30, 200))
                ).isoformat(),
                "status": "active",
                "next_payment_date": (
                    today + timedelta(days=random.randint(1, 15))
                ).isoformat(),
                "last_active_date": None,
                "notes": "Standard plan",
            },
            {
                "id": 1002,
                "user_id": user_id,
                "name": "Spotify",
                "amount": 9.99,
                "billing_frequency": "monthly",
                "start_date": (
                    today - timedelta(days=random.randint(30, 200))
                ).isoformat(),
                "status": "active",
                "next_payment_date": (
                    today + timedelta(days=random.randint(1, 15))
                ).isoformat(),
                "last_active_date": None,
                "notes": "Premium plan",
            },
            {
                "id": 1003,
                "user_id": user_id,
                "name": "Amazon Prime",
                "amount": 139.00,
                "billing_frequency": "yearly",
                "start_date": (
                    today - timedelta(days=random.randint(30, 200))
                ).isoformat(),
                "status": "active",
                "next_payment_date": (
                    today + timedelta(days=random.randint(60, 300))
                ).isoformat(),
                "last_active_date": None,
                "notes": "Annual subscription",
            },
            # Inactive subscription
            {
                "id": 1004,
                "user_id": user_id,
                "name": "HBO Max",
                "amount": 14.99,
                "billing_frequency": "monthly",
                "start_date": (
                    today - timedelta(days=random.randint(100, 300))
                ).isoformat(),
                "status": "inactive",
                "next_payment_date": None,
                "last_active_date": (
                    today - timedelta(days=random.randint(10, 90))
                ).isoformat(),
                "notes": "Cancelled",
            },
            # Future subscription
            {
                "id": 1005,
                "user_id": user_id,
                "name": "Future Tech Pro",
                "amount": 99.99,
                "billing_frequency": "monthly",
                "start_date": date(2030, 1, 1).isoformat(),
                "status": "active",
                "next_payment_date": date(2030, 1, 1).isoformat(),
                "last_active_date": None,
                "notes": "Future technology subscription",
            },
        ]

        return subscriptions
