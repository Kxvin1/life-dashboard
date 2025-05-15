from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta, date
from typing import Dict, Any, List, Tuple, Optional
import pytz
import json
import logging
from app.models.user import User
from app.models.pomodoro import PomodoroSession, PomodoroAIUsage, PomodoroAIHistory
from app.models.ai_insight import SystemSetting
from app.services.openai_service import OpenAIService

logger = logging.getLogger(__name__)


class PomodoroService:
    """Service for handling Pomodoro sessions and AI visualizations"""

    def __init__(self, db: Session):
        self.db = db
        self.openai_service = OpenAIService()
        self.super_user_email = "kevinzy17@gmail.com"  # Same super user as AI insights

    def _get_pst_date(self) -> date:
        """Get the current date in PST timezone"""
        pst = pytz.timezone("America/Los_Angeles")
        return datetime.now(pst).date()

    def _get_midnight_pst(self) -> datetime:
        """Get midnight PST for the next day"""
        pst = pytz.timezone("America/Los_Angeles")
        now = datetime.now(pst)
        midnight = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(
            days=1
        )
        return midnight

    def _get_usage_limit(self) -> int:
        """Get the default usage limit for AI visualizations"""
        # Check if there's a system setting for this
        setting = (
            self.db.query(SystemSetting)
            .filter(SystemSetting.key == "pomodoro_ai_usage_limit")
            .first()
        )

        if setting:
            return int(setting.value)

        # Default limit if no setting exists
        return 3  # Default to 3 uses per day

    def _get_super_user_limit(self) -> int:
        """Get the usage limit for the super user"""
        # Check if there's a system setting for this
        setting = (
            self.db.query(SystemSetting)
            .filter(SystemSetting.key == "pomodoro_ai_super_user_limit")
            .first()
        )

        if setting:
            return int(setting.value)

        # Default limit if no setting exists
        return 50  # Default to 50 uses per day for super user

    def get_remaining_uses(self, user: User) -> Tuple[int, int]:
        """
        Get the number of remaining AI visualization uses for a user

        Returns:
            Tuple of (remaining_uses, total_allowed_uses)
        """
        # Get today's date in PST
        today = self._get_pst_date()

        # Check if user is super user
        if user.email == self.super_user_email:
            # Super user has higher limit but still tracked
            usage_limit = self._get_super_user_limit()

            # Check if super user has used AI visualizations today
            usage = (
                self.db.query(PomodoroAIUsage)
                .filter(
                    PomodoroAIUsage.user_id == user.id,
                    func.date(PomodoroAIUsage.date) == today,
                )
                .first()
            )

            if not usage:
                return (usage_limit, usage_limit)

            remaining = max(0, usage_limit - usage.count)
            return (remaining, usage_limit)

        # Regular user
        usage_limit = self._get_usage_limit()

        # Check if user has used AI visualizations today
        usage = (
            self.db.query(PomodoroAIUsage)
            .filter(
                PomodoroAIUsage.user_id == user.id,
                func.date(PomodoroAIUsage.date) == today,
            )
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

        # Check if user has used AI visualizations today
        usage = (
            self.db.query(PomodoroAIUsage)
            .filter(
                PomodoroAIUsage.user_id == user.id,
                func.date(PomodoroAIUsage.date) == today,
            )
            .first()
        )

        if not usage:
            # Create new usage record
            usage = PomodoroAIUsage(
                user_id=user.id,
                date=datetime.now(pytz.timezone("America/Los_Angeles")),
                count=1,
            )
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

    def get_streak_count(self, user_id: int) -> int:
        """
        Calculate the current streak count for a user.
        A streak is defined as completing at least one Pomodoro session per day.

        Returns:
            int: The current streak count
        """
        try:
            # Get all completed sessions for the user, ordered by date
            try:
                sessions = (
                    self.db.query(
                        func.date(PomodoroSession.end_time).label("session_date"),
                        func.count().label("count"),
                    )
                    .filter(
                        PomodoroSession.user_id == user_id,
                        PomodoroSession.status == "completed",
                    )
                    .group_by(func.date(PomodoroSession.end_time))
                    .order_by(desc("session_date"))
                    .all()
                )
            except Exception as e:
                logger.error(f"Error querying pomodoro_sessions for streak: {str(e)}")
                return 0

            if not sessions:
                return 0

            # Get today's date in PST
            today = self._get_pst_date()

            # Check if the most recent session was today or yesterday
            most_recent_date = sessions[0].session_date

            # If the most recent session wasn't today or yesterday, streak is broken
            if most_recent_date != today and most_recent_date != (
                today - timedelta(days=1)
            ):
                # Check if there was a session today
                if most_recent_date == today:
                    return 1  # Streak is just today
                return 0  # Streak is broken

            # Count consecutive days
            streak = 1  # Start with 1 for the most recent day

            for i in range(1, len(sessions)):
                # Check if this date is consecutive with the previous one
                if (
                    sessions[i - 1].session_date - timedelta(days=1)
                    == sessions[i].session_date
                ):
                    streak += 1
                else:
                    break

            return streak
        except Exception as e:
            logger.error(f"Error calculating streak count: {str(e)}")
            return 0

    def _prepare_chart_data(self, sessions: List[PomodoroSession]) -> Dict[str, Any]:
        """
        Prepare chart data for visualization

        Args:
            sessions: List of Pomodoro sessions

        Returns:
            Dictionary containing chart data
        """
        # Group sessions by day
        daily_sessions = {}
        for session in sessions:
            day = session.end_time.strftime("%Y-%m-%d")
            if day not in daily_sessions:
                daily_sessions[day] = []
            daily_sessions[day].append(session)

        # Calculate daily totals
        daily_totals = {}
        for day, day_sessions in daily_sessions.items():
            total_minutes = sum(s.duration_minutes for s in day_sessions)
            completed_count = sum(1 for s in day_sessions if s.status == "completed")
            interrupted_count = sum(
                1 for s in day_sessions if s.status == "interrupted"
            )
            daily_totals[day] = {
                "total_minutes": total_minutes,
                "completed_count": completed_count,
                "interrupted_count": interrupted_count,
                "total_count": len(day_sessions),
            }

        # Sort days
        sorted_days = sorted(daily_totals.keys())

        # Prepare data for charts
        daily_chart = {
            "labels": sorted_days,
            "datasets": [
                {
                    "label": "Minutes",
                    "data": [daily_totals[day]["total_minutes"] for day in sorted_days],
                    "backgroundColor": "rgba(75, 192, 192, 0.2)",
                    "borderColor": "rgba(75, 192, 192, 1)",
                    "borderWidth": 1,
                }
            ],
        }

        completion_chart = {
            "labels": sorted_days,
            "datasets": [
                {
                    "label": "Completed",
                    "data": [
                        daily_totals[day]["completed_count"] for day in sorted_days
                    ],
                    "backgroundColor": "rgba(54, 162, 235, 0.2)",
                    "borderColor": "rgba(54, 162, 235, 1)",
                    "borderWidth": 1,
                },
                {
                    "label": "Interrupted",
                    "data": [
                        daily_totals[day]["interrupted_count"] for day in sorted_days
                    ],
                    "backgroundColor": "rgba(255, 99, 132, 0.2)",
                    "borderColor": "rgba(255, 99, 132, 1)",
                    "borderWidth": 1,
                },
            ],
        }

        # Calculate time of day distribution
        hour_distribution = {h: 0 for h in range(24)}
        for session in sessions:
            hour = session.start_time.hour
            hour_distribution[hour] += 1

        time_of_day_chart = {
            "labels": list(range(24)),
            "datasets": [
                {
                    "label": "Sessions",
                    "data": [hour_distribution[h] for h in range(24)],
                    "backgroundColor": "rgba(153, 102, 255, 0.2)",
                    "borderColor": "rgba(153, 102, 255, 1)",
                    "borderWidth": 1,
                }
            ],
        }

        return {
            "daily_chart": daily_chart,
            "completion_chart": completion_chart,
            "time_of_day_chart": time_of_day_chart,
        }

    async def analyze_pomodoro_sessions(self, user: User) -> Dict[str, Any]:
        """
        Analyze Pomodoro sessions for a user and return insights

        Args:
            user: User object

        Returns:
            Dictionary containing analysis results
        """
        # Check if user has remaining uses
        remaining_uses, total_uses = self.get_remaining_uses(user)

        if remaining_uses <= 0:
            return {
                "error": "You have reached your daily limit for Pomodoro AI visualizations",
                "remaining_uses": 0,
                "total_uses_allowed": total_uses,
            }

        # Get all sessions for the user
        sessions = (
            self.db.query(PomodoroSession)
            .filter(PomodoroSession.user_id == user.id)
            .order_by(desc(PomodoroSession.end_time))
            .all()
        )

        if not sessions:
            return {
                "error": "No Pomodoro sessions found. Complete some sessions first.",
                "remaining_uses": remaining_uses,
                "total_uses_allowed": total_uses,
            }

        # Increment usage count
        if not self.increment_usage(user):
            return {
                "error": "You have reached your daily limit for Pomodoro AI visualizations",
                "remaining_uses": 0,
                "total_uses_allowed": total_uses,
            }

        # Calculate streak
        streak_count = self.get_streak_count(user.id)

        # Prepare data for OpenAI
        total_sessions = len(sessions)
        completed_sessions = sum(1 for s in sessions if s.status == "completed")
        interrupted_sessions = sum(1 for s in sessions if s.status == "interrupted")
        total_minutes = sum(s.duration_minutes for s in sessions)
        avg_duration = total_minutes / total_sessions if total_sessions > 0 else 0

        # Group sessions by task
        task_sessions = {}
        for session in sessions:
            if session.task_name not in task_sessions:
                task_sessions[session.task_name] = []
            task_sessions[session.task_name].append(session)

        # Calculate task statistics
        task_stats = []
        for task, task_sessions_list in task_sessions.items():
            task_minutes = sum(s.duration_minutes for s in task_sessions_list)
            task_completed = sum(
                1 for s in task_sessions_list if s.status == "completed"
            )
            task_stats.append(
                {
                    "task": task,
                    "sessions": len(task_sessions_list),
                    "minutes": task_minutes,
                    "completed": task_completed,
                }
            )

        # Sort tasks by minutes spent
        task_stats.sort(key=lambda x: x["minutes"], reverse=True)

        # Calculate weekly statistics
        weekly_stats = {}

        # Get current date in PST
        pst = pytz.timezone("America/Los_Angeles")
        today = datetime.now(pst).date()

        # Calculate start of week (Monday)
        start_of_week = today - timedelta(days=today.weekday())

        # Initialize days of the week
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            day_name = day.strftime("%A")
            weekly_stats[day_name] = {
                "date": day.isoformat(),
                "sessions": 0,
                "minutes": 0,
            }

        # Populate weekly stats
        for session in sessions:
            session_date = session.end_time.astimezone(pst).date()
            # Only include sessions from current week
            if session_date >= start_of_week and session_date <= today:
                day_name = session_date.strftime("%A")
                if day_name in weekly_stats:
                    weekly_stats[day_name]["sessions"] += 1
                    weekly_stats[day_name]["minutes"] += session.duration_minutes

        # Prepare aggregated data for OpenAI
        aggregated_data = {
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "interrupted_sessions": interrupted_sessions,
            "total_minutes": total_minutes,
            "avg_duration": avg_duration,
            "streak_count": streak_count,
            "task_stats": task_stats[:5],  # Top 5 tasks
        }

        # Pre-generate chart data
        charts = self._prepare_chart_data(sessions)

        # Create prompt for OpenAI - simplified for better performance
        prompt = f"""
        Analyze Pomodoro productivity data:

        Summary Statistics:
        - Total Sessions: {total_sessions}
        - Completed Sessions: {completed_sessions}
        - Interrupted Sessions: {interrupted_sessions}
        - Total Minutes: {total_minutes}
        - Average Duration: {avg_duration:.2f} minutes
        - Current Streak: {streak_count} days

        Top Tasks:
        {json.dumps(task_stats[:5], indent=2)}

        Weekly Breakdown:
        {json.dumps(weekly_stats, indent=2)}

        Provide a simple JSON with only:
        1. summary: A brief 1-2 sentence overview of productivity
        2. insights: 2-3 short, specific observations about productivity patterns
        3. recommendations: 2-3 actionable, specific suggestions to improve productivity

        Keep all responses very concise and focused on the data provided.
        """

        try:
            # Call OpenAI API
            if self.openai_service.client is None:
                # Use the fallback method to raise a proper error
                self.openai_service._generate_fallback_response(
                    "OpenAI API is not available. Please check your API key."
                )

            # Call OpenAI API
            response = self.openai_service.client.chat.completions.create(
                model=self.openai_service.model,
                messages=[
                    {
                        "role": "system",
                        "content": "Productivity analyst. Use pre-calculated metrics. Format as JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
                max_tokens=1000,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content

            # Parse the JSON response
            try:
                result = json.loads(content)
            except json.JSONDecodeError:
                # If the response is not valid JSON, try to extract JSON from the text
                logger.warning(
                    "Failed to parse OpenAI response as JSON, attempting to extract JSON"
                )

                # Look for JSON-like content between curly braces
                start_idx = content.find("{")
                end_idx = content.rfind("}") + 1

                if start_idx >= 0 and end_idx > start_idx:
                    json_str = content[start_idx:end_idx]
                    try:
                        result = json.loads(json_str)
                    except json.JSONDecodeError:
                        logger.error("Failed to extract JSON from OpenAI response")
                        self.openai_service._generate_fallback_response(
                            "Unable to analyze Pomodoro sessions due to a processing error."
                        )
                else:
                    self.openai_service._generate_fallback_response(
                        "Unable to analyze Pomodoro sessions due to a processing error."
                    )

            # Add charts to the result
            result["charts"] = charts

            # Update remaining uses after successful call
            remaining_uses -= 1

            # Add remaining uses to the result
            result["remaining_uses"] = remaining_uses
            result["total_uses_allowed"] = total_uses

            # Save the insight to history
            history_id = self._save_insight_to_history(
                user=user,
                summary=result["summary"],
                insights=result["insights"],
                recommendations=result["recommendations"],
                charts_data=result["charts"],
            )

            result["history_id"] = history_id

            return result

        except Exception as e:
            # Handle errors
            logger.error(f"Error analyzing Pomodoro sessions: {str(e)}")

            # Check for specific OpenAI errors
            error_message = str(e)
            if "AI Insights Error:" in error_message:
                # Re-raise the error to be caught by the API endpoint
                raise e
            elif (
                "quota" in error_message.lower()
                or "insufficient_quota" in error_message
            ):
                self.openai_service._generate_fallback_response(
                    "OpenAI API quota exceeded. Please check your API key and billing details."
                )
            elif "rate limit" in error_message.lower() or "rate_limit" in error_message:
                self.openai_service._generate_fallback_response(
                    "OpenAI API rate limit reached. Please try again later."
                )
            else:
                return {
                    "error": f"Error analyzing Pomodoro sessions: {str(e)}",
                    "remaining_uses": remaining_uses,
                    "total_uses_allowed": total_uses,
                }

    def _save_insight_to_history(
        self,
        user: User,
        summary: str,
        insights: List[str],
        recommendations: List[str],
        charts_data: Dict[str, Any],
    ) -> int:
        """
        Save a Pomodoro AI insight to the history

        Args:
            user: User object
            summary: Summary text
            insights: List of insights
            recommendations: List of recommendations
            charts_data: Chart data

        Returns:
            ID of the created history record
        """
        # Create new history record
        history = PomodoroAIHistory(
            user_id=user.id,
            summary=summary,
            insights=insights,
            recommendations=recommendations,
            charts_data=charts_data,
        )

        self.db.add(history)
        self.db.commit()
        self.db.refresh(history)

        return history.id

    def get_pomodoro_sessions(
        self, user_id: int, skip: int = 0, limit: int = 10
    ) -> Dict[str, Any]:
        """
        Get paginated Pomodoro sessions for a user

        Args:
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            Dictionary containing sessions, total count, and streak count
        """
        try:
            # First check if the table exists
            try:
                # Get total count first to check if table exists
                total_count = (
                    self.db.query(func.count(PomodoroSession.id))
                    .filter(PomodoroSession.user_id == user_id)
                    .scalar()
                )
            except Exception as e:
                logger.error(f"Error querying pomodoro_sessions table: {str(e)}")
                # If there's an error, return empty result
                return {
                    "items": [],
                    "total": 0,
                    "page": 1,
                    "size": limit,
                    "has_more": False,
                    "streak_count": 0,
                }

            # Get sessions with pagination
            sessions = (
                self.db.query(PomodoroSession)
                .filter(PomodoroSession.user_id == user_id)
                .order_by(desc(PomodoroSession.end_time))
                .offset(skip)
                .limit(limit)
                .all()
            )

            # Get streak count
            streak_count = self.get_streak_count(user_id)

            return {
                "items": sessions,
                "total": total_count,
                "page": skip // limit + 1,
                "size": limit,
                "has_more": total_count > skip + limit,
                "streak_count": streak_count,
            }
        except Exception as e:
            logger.error(f"Error getting Pomodoro sessions: {str(e)}")
            # If there's an error, return empty result
            return {
                "items": [],
                "total": 0,
                "page": 1,
                "size": limit,
                "has_more": False,
                "streak_count": 0,
            }

    def create_pomodoro_session(
        self, user_id: int, session_data: Dict[str, Any]
    ) -> PomodoroSession:
        """
        Create a new Pomodoro session

        Args:
            user_id: User ID
            session_data: Session data

        Returns:
            Created PomodoroSession object
        """
        # Create new session
        session = PomodoroSession(
            user_id=user_id,
            task_name=session_data["task_name"],
            start_time=session_data["start_time"],
            end_time=session_data["end_time"],
            duration_minutes=session_data["duration_minutes"],
            status=session_data["status"],
            notes=session_data.get("notes"),
        )

        self.db.add(session)

        # Check if we need to delete old sessions
        self._enforce_session_limit(user_id)

        self.db.commit()
        self.db.refresh(session)

        return session

    def _enforce_session_limit(self, user_id: int, limit: int = 50) -> None:
        """
        Enforce the session limit by deleting the oldest sessions if needed

        Args:
            user_id: User ID
            limit: Maximum number of sessions to keep
        """
        # Count user's sessions
        count = (
            self.db.query(func.count(PomodoroSession.id))
            .filter(PomodoroSession.user_id == user_id)
            .scalar()
        )

        # If over the limit, delete the oldest sessions
        if count > limit:
            # Get IDs of oldest sessions to delete
            oldest_sessions = (
                self.db.query(PomodoroSession.id)
                .filter(PomodoroSession.user_id == user_id)
                .order_by(PomodoroSession.end_time)
                .limit(count - limit)
                .all()
            )

            oldest_ids = [s.id for s in oldest_sessions]

            # Delete the oldest sessions
            self.db.query(PomodoroSession).filter(
                PomodoroSession.id.in_(oldest_ids)
            ).delete(synchronize_session=False)

            self.db.commit()

    def get_pomodoro_ai_history(
        self, user_id: int, skip: int = 0, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get paginated Pomodoro AI history for a user

        Args:
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of history entries
        """
        # Get history entries with pagination
        history_entries = (
            self.db.query(PomodoroAIHistory)
            .filter(PomodoroAIHistory.user_id == user_id)
            .order_by(desc(PomodoroAIHistory.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

        # Convert to dictionaries
        result = []
        for entry in history_entries:
            result.append(
                {
                    "id": entry.id,
                    "user_id": entry.user_id,
                    "summary": entry.summary,
                    "insights": entry.insights,
                    "recommendations": entry.recommendations,
                    "charts_data": entry.charts_data,
                    "created_at": entry.created_at.isoformat(),
                }
            )

        return result

    def get_pomodoro_ai_history_by_id(
        self, user_id: int, history_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific Pomodoro AI history entry by ID

        Args:
            user_id: User ID
            history_id: History entry ID

        Returns:
            History entry or None if not found
        """
        # Get history entry
        entry = (
            self.db.query(PomodoroAIHistory)
            .filter(
                PomodoroAIHistory.id == history_id, PomodoroAIHistory.user_id == user_id
            )
            .first()
        )

        if not entry:
            return None

        # Convert to dictionary
        return {
            "id": entry.id,
            "user_id": entry.user_id,
            "summary": entry.summary,
            "insights": entry.insights,
            "recommendations": entry.recommendations,
            "charts_data": entry.charts_data,
            "created_at": entry.created_at.isoformat(),
        }

    def get_pomodoro_counts(self, user_id: int) -> Tuple[int, int, int]:
        """
        Get Pomodoro session counts (today, this week, all time)

        Args:
            user_id: User ID

        Returns:
            Tuple of (today_count, week_count, total_count)
        """
        try:
            # Get timezone
            pst = pytz.timezone("America/Los_Angeles")

            # Get current date in PST
            now = datetime.now(pst)
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

            # Get start of week (Monday) in PST
            week_start = today_start - timedelta(days=today_start.weekday())

            # First check if the table exists
            try:
                # Get total count first to check if table exists
                total_count = (
                    self.db.query(func.count(PomodoroSession.id))
                    .filter(PomodoroSession.user_id == user_id)
                    .scalar()
                )
            except Exception as e:
                logger.error(f"Error querying pomodoro_sessions table: {str(e)}")
                # If there's an error, return zeros
                return 0, 0, 0

            # Get today's count using datetime objects instead of strings
            today_count = (
                self.db.query(func.count(PomodoroSession.id))
                .filter(
                    PomodoroSession.user_id == user_id,
                    func.date(PomodoroSession.end_time) >= func.date(today_start),
                )
                .scalar()
            )

            # Get week's count
            week_count = (
                self.db.query(func.count(PomodoroSession.id))
                .filter(
                    PomodoroSession.user_id == user_id,
                    func.date(PomodoroSession.end_time) >= func.date(week_start),
                )
                .scalar()
            )

            # Log the counts for debugging
            logger.info(
                f"Pomodoro counts for user {user_id}: today={today_count}, week={week_count}, total={total_count}"
            )

            return today_count, week_count, total_count
        except Exception as e:
            logger.error(f"Error getting Pomodoro counts: {str(e)}")
            # If there's an error, return zeros
            return 0, 0, 0
