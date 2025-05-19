from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta, date
from typing import Dict, Any, List, Tuple, Optional
import pytz
import json
import logging
from app.models.user import User
from app.models.task import Task, TaskCategory, TaskAIUsage, TaskAIHistory, TaskStatus
from app.models.ai_insight import SystemSetting
from app.services.openai_service import OpenAIService

logger = logging.getLogger(__name__)

class TaskService:
    """Service for handling task operations"""

    def __init__(self, db: Session):
        self.db = db
        self.openai_service = OpenAIService()
        self.default_usage_limit = 3  # Default daily limit for regular users
        self.super_user_email = "kevinzy17@gmail.com"  # Email of super user with higher limits

    def _get_pst_date(self) -> date:
        """Get current date in PST timezone"""
        pst = pytz.timezone("America/Los_Angeles")
        return datetime.now(pst).date()

    def _get_usage_limit(self) -> int:
        """Get the usage limit from system settings or use default"""
        setting = (
            self.db.query(SystemSetting)
            .filter(SystemSetting.key == "default_task_ai_usage_limit")
            .first()
        )

        if setting:
            try:
                return int(setting.value)
            except (ValueError, TypeError):
                return self.default_usage_limit

        # If setting doesn't exist, create it with the default value
        new_setting = SystemSetting(
            key="default_task_ai_usage_limit",
            value=str(self.default_usage_limit),
            description="Default daily limit for task AI usage",
        )
        self.db.add(new_setting)
        self.db.commit()

        return self.default_usage_limit

    def _get_super_user_limit(self) -> int:
        """Get the usage limit for super users"""
        return 50

    def get_remaining_uses(self, user: User) -> Tuple[int, int]:
        """
        Get the number of remaining AI task uses for a user

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
                self.db.query(TaskAIUsage)
                .filter(TaskAIUsage.user_id == user.id, TaskAIUsage.date == today)
                .first()
            )

            if not usage:
                return (usage_limit, usage_limit)

            remaining = max(0, usage_limit - usage.count)
            return (remaining, usage_limit)

        # Regular user
        usage_limit = self._get_usage_limit()

        # Check if user has used AI insights today
        usage = (
            self.db.query(TaskAIUsage)
            .filter(TaskAIUsage.user_id == user.id, TaskAIUsage.date == today)
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

        # Check if user has used AI task features today
        usage = (
            self.db.query(TaskAIUsage)
            .filter(TaskAIUsage.user_id == user.id, TaskAIUsage.date == today)
            .first()
        )

        if not usage:
            # Create new usage record
            usage = TaskAIUsage(user_id=user.id, date=today, count=1)
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

    def save_ai_history(self, user: User, input_text: str, output_text: str) -> int:
        """
        Save AI interaction history

        Args:
            user: User object
            input_text: User input text
            output_text: AI output text

        Returns:
            ID of the created history record
        """
        history = TaskAIHistory(
            user_id=user.id,
            input_text=input_text,
            output_text=output_text,
        )
        self.db.add(history)
        self.db.commit()
        self.db.refresh(history)
        return history.id

    async def break_down_goal(self, user: User, goal_text: str) -> Dict[str, Any]:
        """
        Break down a long-term goal into actionable tasks using AI

        Args:
            user: User object
            goal_text: The goal to break down

        Returns:
            Dictionary containing the breakdown results
        """
        # Check if user has remaining uses
        remaining_uses, total_uses = self.get_remaining_uses(user)

        if remaining_uses <= 0:
            return {
                "error": "You have reached your daily limit for AI task features",
                "remaining_uses": 0,
                "total_uses_allowed": total_uses,
            }

        # Increment usage count
        if not self.increment_usage(user):
            return {
                "error": "You have reached your daily limit for AI task features",
                "remaining_uses": 0,
                "total_uses_allowed": total_uses,
            }

        # Get task categories for context
        categories = self.db.query(TaskCategory).all()
        category_dicts = [
            {"id": cat.id, "name": cat.name, "description": cat.description}
            for cat in categories
        ]

        try:
            # Call OpenAI service to break down the goal
            result = await self._generate_tasks_from_goal(goal_text, category_dicts)

            # Save the interaction to history
            history_id = self.save_ai_history(
                user=user,
                input_text=goal_text,
                output_text=json.dumps(result),
            )

            # Get updated remaining uses
            remaining_uses, total_uses = self.get_remaining_uses(user)

            # Create tasks in the database
            created_tasks = []
            for task_data in result["tasks"]:
                task = Task(
                    user_id=user.id,
                    title=task_data["title"],
                    description=task_data.get("description"),
                    due_date=datetime.strptime(task_data["due_date"], "%Y-%m-%d").date() if task_data.get("due_date") else None,
                    status=TaskStatus.not_started,
                    priority=task_data.get("priority", "medium"),
                    category_id=task_data.get("category_id"),
                    estimated_time_minutes=task_data.get("estimated_time_minutes"),
                    is_long_term=task_data.get("is_long_term", False),
                )
                self.db.add(task)
                self.db.commit()
                self.db.refresh(task)
                created_tasks.append(task)

            return {
                "tasks": created_tasks,
                "summary": result["summary"],
                "remaining_uses": remaining_uses,
                "total_uses_allowed": total_uses,
            }

        except Exception as e:
            logger.error(f"Error breaking down goal: {str(e)}")
            # Get updated remaining uses after the error
            remaining_uses, total_uses = self.get_remaining_uses(user)
            return {
                "error": f"An error occurred while breaking down the goal: {str(e)}",
                "remaining_uses": remaining_uses,
                "total_uses_allowed": total_uses,
            }

    async def _generate_tasks_from_goal(
        self, goal_text: str, categories: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate tasks from a goal using OpenAI

        Args:
            goal_text: The goal to break down
            categories: List of category objects

        Returns:
            Dictionary containing the generated tasks and summary
        """
        # Prepare the prompt for OpenAI
        prompt = f"""
        Break down the following goal into actionable tasks:

        GOAL: {goal_text}

        Available categories:
        {json.dumps(categories, indent=2)}

        Analyze the goal and create a structured breakdown of tasks that would help achieve this goal.
        For each task, provide:
        1. A clear, concise title
        2. A brief description
        3. A suggested due date (YYYY-MM-DD format)
        4. A priority level (low, medium, high)
        5. A category ID from the available categories that best matches the task
        6. Estimated time in minutes to complete the task
        7. Whether this is a long-term task (true/false)

        Also provide a brief summary of your approach to breaking down this goal.

        Format your response as a JSON object with the following structure:
        {
          "tasks": [
            {
              "title": "Task title",
              "description": "Task description",
              "due_date": "YYYY-MM-DD",
              "priority": "medium",
              "category_id": 1,
              "estimated_time_minutes": 60,
              "is_long_term": false
            }
          ],
          "summary": "Brief summary of the approach"
        }
        """

        try:
            # Check if client is initialized
            if self.openai_service.client is None:
                logger.error("OpenAI client is not initialized")
                return self._generate_fallback_response(
                    "OpenAI API key is missing or invalid. Please check your API key."
                )

            # Call OpenAI API
            response = self.openai_service.client.chat.completions.create(
                model=self.openai_service.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Task breakdown specialist. Format as JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
                max_tokens=1000,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            return json.loads(content)

        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            raise Exception(f"Error generating tasks: {str(e)}")

    def _generate_fallback_response(self, error_message: str) -> Dict[str, Any]:
        """Generate an error response when OpenAI API fails"""
        raise Exception(f"AI Task Error: {error_message}")
