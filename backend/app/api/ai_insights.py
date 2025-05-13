from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import pytz
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.ai_insight import (
    AIInsightRequest,
    AIInsightResponse,
    AIInsightRemainingResponse,
    AIInsightHistoryResponse,
)
from app.services.ai_insight_service import AIInsightService

router = APIRouter()


@router.get("/insights/public-test")
async def public_test(request: Request):
    """
    Public test endpoint that doesn't require authentication.
    This is used to test if CORS is working correctly.
    """
    # Get the origin from the request
    origin = request.headers.get("Origin", "Unknown")

    return {
        "message": "CORS is working correctly!",
        "status": "success",
        "timestamp": str(datetime.now()),
        "origin": origin,
        "headers": {k: v for k, v in request.headers.items()},
    }


@router.post("/insights/transactions", response_model=AIInsightResponse)
async def analyze_transactions(
    request: AIInsightRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze transactions and provide AI-generated insights

    This endpoint:
    1. Checks if the user has remaining uses for the day
    2. Retrieves transaction data for the specified time period
    3. Calls OpenAI to analyze the transactions
    4. Returns insights, recommendations, and visualization data
    """
    service = AIInsightService(db)

    # Check if user has remaining uses
    remaining_uses, total_uses = service.get_remaining_uses(current_user)

    if remaining_uses <= 0 and current_user.email != "kevinzy17@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You have reached your daily limit for AI insights",
        )

    try:
        # Analyze transactions
        result = await service.analyze_transactions(
            current_user, time_period=request.time_period
        )

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
                detail=f"An error occurred while analyzing transactions: {error_message}",
            )


@router.get("/insights/remaining", response_model=AIInsightRemainingResponse)
async def get_remaining_insights(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Get the number of remaining AI insight uses for the current day

    This endpoint:
    1. Checks how many times the user has used AI insights today
    2. Returns the remaining uses and when the count will reset
    """
    service = AIInsightService(db)

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


@router.get("/insights/test", response_model=dict)
async def test_openai_connection(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Test the connection to OpenAI API

    This endpoint is only accessible to the super user for testing purposes
    """
    if current_user.email != "kevinzy17@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only accessible to the super user",
        )

    try:
        service = AIInsightService(db)
        openai_service = service.openai_service

        # Simple test call to OpenAI
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


@router.get("/insights/history", response_model=List[AIInsightHistoryResponse])
async def get_insight_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a user's AI insight history

    This endpoint:
    1. Retrieves the user's AI insight history
    2. Returns a list of insights, sorted by creation date (newest first)
    """
    service = AIInsightService(db)

    # Get user's insight history
    history = service.get_user_insight_history(
        user=current_user, limit=limit, skip=skip
    )

    return history


@router.get("/insights/history/{insight_id}", response_model=AIInsightHistoryResponse)
async def get_insight_by_id(
    insight_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific AI insight by ID

    This endpoint:
    1. Retrieves a specific AI insight by ID
    2. Verifies that the insight belongs to the current user
    3. Returns the insight details
    """
    service = AIInsightService(db)

    # Get insight by ID
    insight = service.get_insight_by_id(insight_id=insight_id, user_id=current_user.id)

    if not insight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Insight not found"
        )

    return insight
