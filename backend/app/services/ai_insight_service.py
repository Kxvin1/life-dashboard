from datetime import datetime, date, time, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
import pytz
import json
from collections import defaultdict
from app.models.ai_insight import AIInsightUsage, SystemSetting, AIInsightHistory
from app.models.user import User
from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
from app.services.openai_service import OpenAIService


class AIInsightService:
    """Service for managing AI insights"""

    def __init__(self, db: Session):
        self.db = db
        self.openai_service = OpenAIService()
        self.super_user_email = "kevinzy17@gmail.com"
        self.default_usage_limit = 3

    def _get_pst_date(self) -> date:
        """Get the current date in PST timezone"""
        pst = pytz.timezone("America/Los_Angeles")
        return datetime.now(pst).date()

    def _get_midnight_pst(self) -> datetime:
        """Get the next midnight in PST timezone"""
        pst = pytz.timezone("America/Los_Angeles")
        now = datetime.now(pst)
        tomorrow = now.date() + timedelta(days=1)
        midnight = datetime.combine(tomorrow, time.min)
        return pst.localize(midnight)

    def _get_usage_limit(self) -> int:
        """Get the usage limit from system settings or use default"""
        setting = (
            self.db.query(SystemSetting)
            .filter(SystemSetting.key == "default_ai_usage_limit")
            .first()
        )

        if setting:
            try:
                return int(setting.value)
            except (ValueError, TypeError):
                return self.default_usage_limit

        # If setting doesn't exist, create it with the default value
        new_setting = SystemSetting(
            key="default_ai_usage_limit",
            value=str(self.default_usage_limit),
            description="Default daily limit for AI insights usage",
        )
        self.db.add(new_setting)
        self.db.commit()

        return self.default_usage_limit

    def _get_super_user_limit(self) -> int:
        """Get the usage limit for super users"""
        return 50

    def get_remaining_uses(self, user: User) -> Tuple[int, int]:
        """
        Get the number of remaining AI insight uses for a user

        Returns:
            Tuple of (remaining_uses, total_allowed_uses)
        """
        # Get today's date in PST
        today = self._get_pst_date()

        # Check if user is super user
        if user.email == self.super_user_email:
            # Super user has higher limit but still tracked
            usage_limit = self._get_super_user_limit()

            # Check if super user has used AI insights today
            usage = (
                self.db.query(AIInsightUsage)
                .filter(AIInsightUsage.user_id == user.id, AIInsightUsage.date == today)
                .first()
            )

            if not usage:
                return (usage_limit, usage_limit)

            remaining = max(0, usage_limit - usage.count)
            return (remaining, usage_limit)

        # Regular user logic
        usage_limit = self._get_usage_limit()

        # Check if user has used AI insights today
        usage = (
            self.db.query(AIInsightUsage)
            .filter(AIInsightUsage.user_id == user.id, AIInsightUsage.date == today)
            .first()
        )

        if not usage:
            return (usage_limit, usage_limit)

        remaining = max(0, usage_limit - usage.count)
        return (remaining, usage_limit)

    def increment_usage(self, user: User) -> bool:
        """
        Increment the usage count for a user

        Returns:
            True if successful, False if user has reached their limit
        """
        # Get today's date in PST
        today = self._get_pst_date()

        # Check if user has used AI insights today
        usage = (
            self.db.query(AIInsightUsage)
            .filter(AIInsightUsage.user_id == user.id, AIInsightUsage.date == today)
            .first()
        )

        if not usage:
            # Create new usage record
            usage = AIInsightUsage(user_id=user.id, date=today, count=1)
            self.db.add(usage)
            self.db.commit()
            return True

        # Check if user has reached their limit
        # Use super user limit if the user is a super user
        usage_limit = (
            self._get_super_user_limit()
            if user.email == self.super_user_email
            else self._get_usage_limit()
        )
        if usage.count >= usage_limit:
            return False

        # Increment usage count
        usage.count += 1
        self.db.commit()
        return True

    async def analyze_transactions(
        self, user: User, time_period: str = "all"
    ) -> Dict[str, Any]:
        """
        Analyze transactions for a user and return insights

        Args:
            user: User object
            time_period: Time period for analysis ("month", "quarter", "year", "all")

        Returns:
            Dictionary containing analysis results
        """
        # Check if user has remaining uses
        remaining_uses, total_uses = self.get_remaining_uses(user)

        if remaining_uses <= 0:
            return {
                "error": "You have reached your daily limit for AI insights",
                "remaining_uses": 0,
                "total_uses_allowed": total_uses,
            }

        # Get ALL transactions for the user (no pagination limit)
        query = self.db.query(Transaction).filter(Transaction.user_id == user.id)

        # Apply time period filter
        today = self._get_pst_date()

        if time_period == "month":
            # Current month
            start_date = date(today.year, today.month, 1)
            query = query.filter(Transaction.date >= start_date)

        elif time_period == "prev_month":
            # Previous month
            if today.month == 1:
                # If current month is January, previous month is December of last year
                prev_month = 12
                prev_year = today.year - 1
            else:
                prev_month = today.month - 1
                prev_year = today.year

            start_date = date(prev_year, prev_month, 1)

            # Calculate end date (last day of previous month)
            if prev_month == 12:
                end_date = date(prev_year, 12, 31)
            else:
                end_date = date(prev_year, prev_month + 1, 1) - timedelta(days=1)

            query = query.filter(
                Transaction.date >= start_date, Transaction.date <= end_date
            )

        elif time_period == "quarter":
            quarter_start_month = ((today.month - 1) // 3) * 3 + 1
            start_date = date(today.year, quarter_start_month, 1)
            query = query.filter(Transaction.date >= start_date)

        elif time_period == "year":
            # Current year
            start_date = date(today.year, 1, 1)
            query = query.filter(Transaction.date >= start_date)

        elif time_period == "prev_year":
            # Previous year
            prev_year = today.year - 1
            start_date = date(prev_year, 1, 1)
            end_date = date(prev_year, 12, 31)
            query = query.filter(
                Transaction.date >= start_date, Transaction.date <= end_date
            )

        # Get ALL transactions without pagination limit
        transactions = query.all()

        # Get categories
        categories = self.db.query(Category).all()

        # Convert to dictionaries with minimal data for our aggregation
        transaction_dicts = [
            {
                "amount": t.amount,
                "date": t.date.isoformat(),
                "type": t.type.value,
                "category_name": t.category.name if t.category else None,
            }
            for t in transactions
        ]

        # Simplify category data
        category_dicts = [{"name": c.name, "type": c.type.value} for c in categories]

        # Calculate financial metrics
        metrics = self._calculate_financial_metrics(transaction_dicts)

        # Aggregate transactions by category
        category_aggregation = self._aggregate_transactions_by_category(
            transaction_dicts
        )

        # Aggregate transactions by time
        time_aggregation = self._aggregate_transactions_by_time(
            transaction_dicts, time_period
        )

        # Prepare aggregated data for OpenAI
        aggregated_data = {
            "metrics": metrics,
            "category_aggregation": category_aggregation,
            "time_aggregation": time_aggregation,
            "transaction_count": len(transaction_dicts),
            "time_period": time_period,
        }

        # Pre-generate chart data on the backend
        charts = self._prepare_chart_data(
            category_aggregation, time_aggregation, metrics
        )

        # Call OpenAI service with aggregated data instead of raw transactions
        result = await self.openai_service.analyze_transactions(
            aggregated_data, category_dicts, time_period
        )

        # Add our pre-generated charts to the result
        # Since we're not asking OpenAI to generate charts anymore, we need to add them ourselves
        result["charts"] = charts

        # Save the insight to history
        history_id = self.save_insight_to_history(
            user=user,
            time_period=time_period,
            summary=result["summary"],
            insights=result["insights"],
            recommendations=result["recommendations"],
            charts_data=result["charts"],
        )

        # Increment usage count for all users
        self.increment_usage(user)

        # Recalculate remaining uses
        remaining_uses, total_uses = self.get_remaining_uses(user)

        # Add remaining uses, history ID, and time period to result
        result["remaining_uses"] = remaining_uses
        result["total_uses_allowed"] = total_uses
        result["history_id"] = history_id
        result["time_period"] = time_period  # Include the time period in the response

        return result

    def save_insight_to_history(
        self,
        user: User,
        time_period: str,
        summary: str,
        insights: List[str],
        recommendations: List[str],
        charts_data: Dict[str, Any],
    ) -> int:
        """
        Save an AI insight to the history

        Args:
            user: User object
            time_period: Time period for analysis
            summary: Summary text
            insights: List of insights
            recommendations: List of recommendations
            charts_data: Chart data

        Returns:
            ID of the created history record
        """
        # Create new history record
        history = AIInsightHistory(
            user_id=user.id,
            time_period=time_period,
            summary=summary,
            insights=insights,
            recommendations=recommendations,
            charts_data=charts_data,
        )

        self.db.add(history)
        self.db.commit()
        self.db.refresh(history)

        return history.id

    def get_user_insight_history(
        self, user: User, limit: int = 10, skip: int = 0
    ) -> List[AIInsightHistory]:
        """
        Get a user's AI insight history

        Args:
            user: User object
            limit: Maximum number of records to return
            skip: Number of records to skip

        Returns:
            List of AIInsightHistory objects
        """
        return (
            self.db.query(AIInsightHistory)
            .filter(AIInsightHistory.user_id == user.id)
            .order_by(desc(AIInsightHistory.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_insight_by_id(
        self, insight_id: int, user_id: int
    ) -> Optional[AIInsightHistory]:
        """
        Get an AI insight by ID

        Args:
            insight_id: ID of the insight
            user_id: ID of the user

        Returns:
            AIInsightHistory object if found, None otherwise
        """
        return (
            self.db.query(AIInsightHistory)
            .filter(
                AIInsightHistory.id == insight_id, AIInsightHistory.user_id == user_id
            )
            .first()
        )

    def _aggregate_transactions_by_category(
        self, transactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Aggregate transactions by category

        Args:
            transactions: List of transaction dictionaries

        Returns:
            Dictionary with aggregated category data
        """
        # Separate transactions by type
        income_transactions = [t for t in transactions if t["type"] == "income"]
        expense_transactions = [t for t in transactions if t["type"] == "expense"]

        # Aggregate income by category
        income_by_category = defaultdict(float)
        for transaction in income_transactions:
            category = transaction["category_name"] or "Uncategorized"
            income_by_category[category] += transaction["amount"]

        # Aggregate expenses by category
        expenses_by_category = defaultdict(float)
        for transaction in expense_transactions:
            category = transaction["category_name"] or "Uncategorized"
            expenses_by_category[category] += transaction["amount"]

        # Convert to lists of dictionaries for easier consumption
        income_categories = [
            {"name": category, "amount": amount}
            for category, amount in income_by_category.items()
        ]
        expense_categories = [
            {"name": category, "amount": amount}
            for category, amount in expenses_by_category.items()
        ]

        # Sort by amount (descending)
        income_categories.sort(key=lambda x: x["amount"], reverse=True)
        expense_categories.sort(key=lambda x: x["amount"], reverse=True)

        # Get top categories (limit to 10 for visualization)
        top_income_categories = income_categories[:10]
        top_expense_categories = expense_categories[:10]

        return {
            "income_by_category": income_by_category,
            "expenses_by_category": expenses_by_category,
            "top_income_categories": top_income_categories,
            "top_expense_categories": top_expense_categories,
        }

    def _aggregate_transactions_by_time(
        self, transactions: List[Dict[str, Any]], time_period: str
    ) -> Dict[str, Any]:
        """
        Aggregate transactions by time periods

        Args:
            transactions: List of transaction dictionaries
            time_period: Time period for analysis ("month", "quarter", "year", "all")

        Returns:
            Dictionary with aggregated time-series data
        """
        # Separate transactions by type
        income_transactions = [t for t in transactions if t["type"] == "income"]
        expense_transactions = [t for t in transactions if t["type"] == "expense"]

        # Determine the appropriate time grouping based on the time period
        if time_period == "month" or time_period == "prev_month":
            # Group by day for monthly view
            format_str = "%Y-%m-%d"
            label_format = "%d"  # Day of month
        elif time_period == "quarter":
            # Group by week for quarterly view
            format_str = "%Y-%W"  # Year and week number
            label_format = "Week %W"
        elif time_period == "year" or time_period == "prev_year":
            # Group by month for yearly view
            format_str = "%Y-%m"
            label_format = "%b"  # Month abbreviation
        else:
            # Group by month for all-time view
            format_str = "%Y-%m"
            label_format = "%b %Y"  # Month and year

        # Initialize data structures for aggregation
        income_by_period = defaultdict(float)
        expenses_by_period = defaultdict(float)

        # Aggregate income by period
        for transaction in income_transactions:
            # Parse the date from ISO format
            transaction_date = datetime.fromisoformat(transaction["date"])
            period_key = transaction_date.strftime(format_str)
            income_by_period[period_key] += transaction["amount"]

        # Aggregate expenses by period
        for transaction in expense_transactions:
            transaction_date = datetime.fromisoformat(transaction["date"])
            period_key = transaction_date.strftime(format_str)
            expenses_by_period[period_key] += transaction["amount"]

        # Combine all period keys and sort chronologically
        all_periods = sorted(
            set(list(income_by_period.keys()) + list(expenses_by_period.keys()))
        )

        # Create labels based on the time period
        labels = []
        for period_key in all_periods:
            if time_period == "quarter":
                # For quarterly view, extract year and week
                year, week = period_key.split("-")
                # Create a datetime for the first day of that week
                first_day = datetime.strptime(f"{year}-{week}-1", "%Y-%W-%w")
                label = first_day.strftime(label_format)
            else:
                # For other views, parse the date and format according to label_format
                if "-" in period_key:
                    if len(period_key.split("-")) == 2:  # Year-month format
                        year, month = period_key.split("-")
                        # Create a datetime for the first day of that month
                        first_day = datetime(int(year), int(month), 1)
                    else:  # Year-month-day format
                        first_day = datetime.strptime(period_key, "%Y-%m-%d")
                    label = first_day.strftime(label_format)
                else:
                    label = period_key  # Fallback if format is unexpected

            labels.append(label)

        # Create data arrays aligned with labels
        income_data = [income_by_period.get(period, 0) for period in all_periods]
        expense_data = [expenses_by_period.get(period, 0) for period in all_periods]

        return {
            "labels": labels,
            "income_data": income_data,
            "expense_data": expense_data,
            "periods": all_periods,
        }

    def _calculate_financial_metrics(
        self, transactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate key financial metrics from transactions

        Args:
            transactions: List of transaction dictionaries

        Returns:
            Dictionary with calculated financial metrics
        """
        # Calculate total income and expenses
        total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
        total_expenses = sum(
            t["amount"] for t in transactions if t["type"] == "expense"
        )
        net = total_income - total_expenses

        # Calculate savings rate (if income > 0)
        savings_rate = (net / total_income * 100) if total_income > 0 else 0

        # Calculate expense-to-income ratio (if income > 0)
        expense_ratio = (total_expenses / total_income) if total_income > 0 else 0

        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net": net,
            "savings_rate": round(savings_rate, 2),
            "expense_ratio": round(expense_ratio, 2),
        }

    def _prepare_chart_data(
        self,
        category_aggregation: Dict[str, Any],
        time_aggregation: Dict[str, Any],
        metrics: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Prepare chart data from aggregated metrics

        Args:
            category_aggregation: Aggregated category data
            time_aggregation: Aggregated time-series data
            metrics: Financial metrics

        Returns:
            Dictionary with chart data ready for frontend
        """
        # Prepare category distribution chart data
        category_labels = [
            cat["name"] for cat in category_aggregation["top_expense_categories"]
        ]
        category_values = [
            cat["amount"] for cat in category_aggregation["top_expense_categories"]
        ]

        # Generate colors for the chart (simplified version)
        background_colors = ["#4ade80", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6"]
        # Extend colors if we have more than 5 categories
        while len(background_colors) < len(category_labels):
            background_colors.append("#6b7280")

        # Prepare income vs expenses chart
        time_labels = time_aggregation["labels"]
        income_data = time_aggregation["income_data"]
        expense_data = time_aggregation["expense_data"]

        # Create the charts object
        charts = {
            "categoryDistribution": {
                "labels": category_labels,
                "datasets": [
                    {
                        "data": category_values,
                        "backgroundColor": background_colors[: len(category_labels)],
                    }
                ],
            },
            "incomeVsExpenses": {
                "labels": time_labels,
                "datasets": [
                    {
                        "label": "Income",
                        "data": income_data,
                        "backgroundColor": "#4ade80",
                    },
                    {
                        "label": "Expenses",
                        "data": expense_data,
                        "backgroundColor": "#ef4444",
                    },
                ],
            },
        }

        return charts
