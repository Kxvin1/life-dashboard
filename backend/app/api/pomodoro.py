from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import pytz
from app.db.database import get_db
from app.models.user import User
from app.services.pomodoro_service import PomodoroService
from app.api.auth import get_current_user
from app.schemas.pomodoro import (
    PomodoroSession,
    PomodoroSessionCreate,
    PomodoroSessionResponse,
    PomodoroSessionsPage,
    PomodoroAIResponse,
    PomodoroAIRemainingResponse,
)

router = APIRouter()


@router.get("/pomodoro/test", response_model=Dict[str, Any])
async def test_pomodoro_openai(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Test the OpenAI connection for Pomodoro AI analysis
    """
    # Check if user is a demo user
    if current_user.is_demo_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Pomodoro Analysis is not available in demo mode",
        )

    service = PomodoroService(db)
    openai_service = service.openai_service

    try:
        # Simple test call to OpenAI
        if openai_service.client is None:
            return {
                "status": "error",
                "message": "OpenAI client is not initialized. Check your API key.",
            }

        response = openai_service.client.chat.completions.create(
            model=openai_service.model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {
                    "role": "user",
                    "content": "Hello, this is a test message. Please respond with 'OpenAI connection successful!'",
                },
            ],
            max_tokens=20,
        )

        return {
            "status": "success",
            "message": "OpenAI connection successful",
            "response": response.choices[0].message.content,
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to connect to OpenAI: {str(e)}"}


@router.post("/pomodoro/sessions", response_model=PomodoroSession)
async def create_pomodoro_session(
    session: PomodoroSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new Pomodoro session
    """
    # Check if user is a demo user
    if current_user.is_demo_user:
        # For demo users, return a mock response without saving to database
        return {
            "id": 0,
            "user_id": current_user.id,
            "task_name": session.task_name,
            "start_time": session.start_time,
            "end_time": session.end_time,
            "duration_minutes": session.duration_minutes,
            "status": session.status,
            "notes": session.notes,
            "created_at": datetime.now(pytz.timezone("America/Los_Angeles")),
        }

    service = PomodoroService(db)

    # Convert Pydantic model to dict
    session_data = session.dict()

    # Create session
    created_session = service.create_pomodoro_session(
        user_id=current_user.id, session_data=session_data
    )

    return created_session


@router.get("/pomodoro/sessions", response_model=PomodoroSessionsPage)
async def get_pomodoro_sessions(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get paginated Pomodoro sessions for the current user
    """
    service = PomodoroService(db)

    # Get sessions
    result = service.get_pomodoro_sessions(
        user_id=current_user.id, skip=skip, limit=limit
    )

    return result


@router.post("/pomodoro/analyze", response_model=PomodoroAIResponse)
async def analyze_pomodoro_sessions(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Analyze Pomodoro sessions and provide AI-generated insights

    This endpoint:
    1. Checks if the user has remaining uses for the day
    2. Retrieves Pomodoro session data
    3. Calls OpenAI to analyze the sessions
    4. Returns insights, recommendations, and visualization data
    """
    # Check if user is a demo user
    if current_user.is_demo_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Pomodoro Analysis is not available in demo mode",
        )

    service = PomodoroService(db)

    try:
        # Analyze sessions
        result = await service.analyze_pomodoro_sessions(current_user)

        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail=result["error"]
            )

        return result
    except Exception as e:
        # Handle the error from the OpenAI service
        error_message = str(e)
        if "AI Insights Error:" in error_message:
            # This is a known error from our service
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=error_message
            )
        else:
            # This is an unexpected error
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred while analyzing Pomodoro sessions: {error_message}",
            )


@router.get("/pomodoro/remaining", response_model=PomodoroAIRemainingResponse)
async def get_remaining_pomodoro_ai_uses(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Get the number of remaining Pomodoro AI visualization uses for the current day

    This endpoint:
    1. Checks how many times the user has used Pomodoro AI visualizations today
    2. Returns the remaining uses and when the count will reset
    """
    # Check if user is a demo user
    if current_user.is_demo_user:
        # Return 0 uses for demo users
        pst = pytz.timezone("America/Los_Angeles")
        reset_time = datetime.now(pst).replace(
            hour=0, minute=0, second=0, microsecond=0
        ) + timedelta(days=1)

        return {
            "remaining_uses": 0,
            "total_uses_allowed": 0,
            "reset_time": reset_time.isoformat(),
        }

    service = PomodoroService(db)

    # Get remaining uses
    remaining_uses, total_uses = service.get_remaining_uses(current_user)

    # Get reset time (midnight PST)
    pst = pytz.timezone("America/Los_Angeles")
    reset_time = service._get_midnight_pst()

    return {
        "remaining_uses": remaining_uses,
        "total_uses_allowed": total_uses,
        "reset_time": reset_time.isoformat(),
    }


@router.get("/pomodoro/history", response_model=List[Dict[str, Any]])
async def get_pomodoro_ai_history(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get paginated Pomodoro AI history for the current user
    """
    # Check if user is a demo user
    if current_user.is_demo_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Pomodoro Analysis history is not available in demo mode",
        )

    service = PomodoroService(db)

    # Get history
    history = service.get_pomodoro_ai_history(
        user_id=current_user.id, skip=skip, limit=limit
    )

    return history


@router.get("/pomodoro/history/{history_id}", response_model=Dict[str, Any])
async def get_pomodoro_ai_history_by_id(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific Pomodoro AI history entry by ID
    """
    # Check if user is a demo user
    if current_user.is_demo_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Pomodoro Analysis history is not available in demo mode",
        )

    service = PomodoroService(db)

    # Get history entry
    history_entry = service.get_pomodoro_ai_history_by_id(
        user_id=current_user.id, history_id=history_id
    )

    if not history_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pomodoro AI history entry with ID {history_id} not found",
        )

    return history_entry


@router.get("/pomodoro/counts", response_model=Dict[str, int])
async def get_pomodoro_counts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get Pomodoro session counts (today, this week, all time)
    """
    # Check if user is a demo user
    if current_user.is_demo_user:
        # Return mock counts for demo users
        return {
            "today": 3,
            "week": 12,
            "total": 42,
        }

    service = PomodoroService(db)

    # Get counts
    today_count, week_count, total_count = service.get_pomodoro_counts(
        user_id=current_user.id
    )

    # Log the counts for debugging
    print(
        f"API: Pomodoro counts for user {current_user.id}: today={today_count}, week={week_count}, total={total_count}"
    )

    return {
        "today": today_count,
        "week": week_count,
        "total": total_count,
        "user_id": current_user.id,  # Include user ID for debugging
    }
