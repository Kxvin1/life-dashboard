# Import all the models, so that Base has them before being imported by Alembic
from app.db.database import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.subscription import Subscription
from app.models.ai_insight import AIInsightUsage, SystemSetting
from app.models.pomodoro import PomodoroSession, PomodoroAIUsage, PomodoroAIHistory
from app.models.task import Task, TaskCategory, TaskAIUsage, TaskAIHistory
