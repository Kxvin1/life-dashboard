from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List


class PomodoroSessionBase(BaseModel):
    task_name: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    status: str  # 'completed' or 'interrupted'
    notes: Optional[str] = None


class PomodoroSessionCreate(PomodoroSessionBase):
    pass


class PomodoroSession(PomodoroSessionBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PomodoroAIUsageBase(BaseModel):
    user_id: int
    date: datetime
    count: int = 1


class PomodoroAIUsageCreate(PomodoroAIUsageBase):
    pass


class PomodoroAIUsage(PomodoroAIUsageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PomodoroAIHistoryBase(BaseModel):
    user_id: int
    summary: str
    insights: List[str]
    recommendations: List[str]
    charts_data: Dict[str, Any]


class PomodoroAIHistoryCreate(PomodoroAIHistoryBase):
    pass


class PomodoroAIHistory(PomodoroAIHistoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PomodoroAIResponse(BaseModel):
    summary: str
    insights: List[str]
    recommendations: List[str]
    charts: Dict[str, Any]
    remaining_uses: int
    total_uses_allowed: int
    history_id: Optional[int] = None


class PomodoroAIRemainingResponse(BaseModel):
    remaining_uses: int
    total_uses_allowed: int
    reset_time: str


class PomodoroSessionResponse(BaseModel):
    sessions: List[PomodoroSession]
    total_count: int
    streak_count: int


class PomodoroSessionsPage(BaseModel):
    items: List[PomodoroSession]
    total: int
    page: int
    size: int
    has_more: bool


class PomodoroStreakResponse(BaseModel):
    streak_count: int
    has_completed_today: bool
