from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from app.models.task import TaskStatus, TaskPriority, EnergyLevel, RecurringFrequency

# Task Category Schemas
class TaskCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False

class TaskCategoryCreate(TaskCategoryBase):
    pass

class TaskCategory(TaskCategoryBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: TaskStatus = TaskStatus.not_started
    priority: TaskPriority = TaskPriority.medium
    energy_level: Optional[EnergyLevel] = None
    category_id: Optional[int] = None
    estimated_time_minutes: Optional[int] = None
    is_recurring: bool = False
    recurring_frequency: Optional[RecurringFrequency] = None
    parent_task_id: Optional[int] = None
    is_long_term: bool = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    energy_level: Optional[EnergyLevel] = None
    category_id: Optional[int] = None
    estimated_time_minutes: Optional[int] = None
    is_recurring: Optional[bool] = None
    recurring_frequency: Optional[RecurringFrequency] = None
    parent_task_id: Optional[int] = None
    is_long_term: Optional[bool] = None

class Task(TaskBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[TaskCategory] = None
    
    class Config:
        from_attributes = True

class TaskWithChildren(Task):
    child_tasks: List['TaskWithChildren'] = []
    
    class Config:
        from_attributes = True

# Recursive reference for TaskWithChildren
TaskWithChildren.update_forward_refs()

# AI Usage Schemas
class TaskAIUsageBase(BaseModel):
    user_id: int
    date: date
    count: int = 1

class TaskAIUsageCreate(TaskAIUsageBase):
    pass

class TaskAIUsage(TaskAIUsageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TaskAIHistoryBase(BaseModel):
    user_id: int
    input_text: str
    output_text: str

class TaskAIHistoryCreate(TaskAIHistoryBase):
    pass

class TaskAIHistory(TaskAIHistoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Request and Response Schemas
class TaskListResponse(BaseModel):
    tasks: List[Task]
    total_count: int

class TaskAIRequest(BaseModel):
    text: str  # The text to analyze or the goal to break down

class TaskAIResponse(BaseModel):
    tasks: List[Task]  # Generated tasks
    summary: str  # Summary of the breakdown
    remaining_uses: int
    total_uses_allowed: int

class TaskAIRemainingResponse(BaseModel):
    remaining_uses: int
    total_uses_allowed: int
    reset_time: str

class TaskReorderRequest(BaseModel):
    task_id: int
    new_position: int  # New position in the list (0-based index)

class TaskBatchActionRequest(BaseModel):
    task_ids: List[int]
    action: str  # "complete", "delete", "change_status", etc.
    value: Optional[Any] = None  # Value for the action, if needed
