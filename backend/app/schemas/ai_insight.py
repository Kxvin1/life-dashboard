from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, Dict, Any, List


class AIInsightUsageBase(BaseModel):
    user_id: int
    date: date
    count: int = 1


class AIInsightUsageCreate(AIInsightUsageBase):
    pass


class AIInsightUsage(AIInsightUsageBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AIInsightHistoryBase(BaseModel):
    user_id: int
    time_period: str
    summary: str
    insights: List[str]
    recommendations: List[str]
    charts_data: Dict[str, Any]


class AIInsightHistoryCreate(AIInsightHistoryBase):
    pass


class AIInsightHistory(AIInsightHistoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AIInsightHistoryResponse(BaseModel):
    id: int
    time_period: str
    summary: str
    insights: List[str]
    recommendations: List[str]
    charts_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class SystemSettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class SystemSettingCreate(SystemSettingBase):
    pass


class SystemSettingUpdate(BaseModel):
    value: str
    description: Optional[str] = None


class SystemSetting(SystemSettingBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AIInsightRequest(BaseModel):
    time_period: Optional[str] = "all"  # "month", "quarter", "year", "all"


class ChartData(BaseModel):
    labels: List[str]
    datasets: List[Dict[str, Any]]


class AIInsightResponse(BaseModel):
    summary: str
    insights: List[str]
    recommendations: List[str]
    charts: Dict[str, ChartData]
    remaining_uses: int
    total_uses_allowed: int
    history_id: Optional[int] = None  # ID of the saved history record


class AIInsightRemainingResponse(BaseModel):
    remaining_uses: int
    total_uses_allowed: int
    reset_time: str
