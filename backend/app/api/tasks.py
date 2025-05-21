from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session, selectinload, joinedload
from typing import List, Optional
from datetime import date, datetime, timedelta
import pytz
import logging

logger = logging.getLogger(__name__)

from app.db.database import get_db
from app.models.user import User
from app.models.task import Task, TaskCategory, TaskStatus, TaskPriority, EnergyLevel
from app.services.task_service import TaskService
from app.services.cache_service import (
    cached,
    invalidate_cache_pattern,
    invalidate_user_cache,
    set_cache,
    get_cache,
)
from app.api.auth import get_current_user
from app.schemas.task import (
    Task as TaskSchema,
    TaskCreate,
    TaskUpdate,
    TaskCategory as TaskCategorySchema,
    TaskListResponse,
    TaskWithChildren,
    TaskAIRequest,
    TaskAIResponse,
    TaskAIRemainingResponse,
    TaskReorderRequest,
    TaskBatchActionRequest,
)

router = APIRouter()


# Task Categories Endpoints
@router.get("/categories", response_model=List[TaskCategorySchema])
async def get_task_categories(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all task categories (system defaults and user-created)
    """
    from app.services.cache_service import get_cache

    # Create a user-specific cache key
    user_cache_key = f"user_{current_user.id}_categories"

    # Try to get categories from cache first
    cached_categories = get_cache(user_cache_key)
    if cached_categories is not None:
        logger.info(f"Cache hit for user categories: {user_cache_key}")
        categories = cached_categories
    else:
        logger.info(f"Cache miss for user categories: {user_cache_key}")
        # Get all categories in one query
        categories = (
            db.query(TaskCategory)
            .filter(
                (TaskCategory.is_default == True)
                | (TaskCategory.user_id == current_user.id)
            )
            .all()
        )

        # Cache the result for 24 hours (categories rarely change)
        set_cache(user_cache_key, categories, ttl_seconds=86400)

    # Set cache control headers for client-side caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    # Add cache validators
    response.headers["Vary"] = "Authorization"  # Cache varies by user

    return categories


@router.post("/categories", response_model=TaskCategorySchema)
async def create_task_category(
    category: TaskCategorySchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new task category
    """
    db_category = TaskCategory(
        name=category.name,
        description=category.description,
        user_id=current_user.id,
        is_default=False,  # User-created categories are never defaults
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)

    # Invalidate only task-related cache entries for this user
    invalidate_user_cache(current_user.id, feature="tasks")

    return db_category


# Task Endpoints
@router.get("/", response_model=TaskListResponse)
async def get_tasks(
    response: Response,
    is_long_term: Optional[bool] = None,
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    priority: Optional[str] = None,
    due_date_start: Optional[str] = None,
    due_date_end: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get tasks with optional filtering
    """
    # Create a cache key that includes all filter parameters
    cache_key = f"user_{current_user.id}_tasks_{is_long_term}_{status}_{category_id}_{priority}_{due_date_start}_{due_date_end}_{skip}_{limit}"

    # Try to get from cache first
    cached_result = get_cache(cache_key)
    if cached_result is not None:
        logger.info(f"Cache hit for tasks: {cache_key}")
        result = cached_result
    else:
        logger.info(f"Cache miss for tasks: {cache_key}")

        # Build base query with all filters
        base_query = db.query(Task).filter(Task.user_id == current_user.id)

        # Apply filters
        if is_long_term is not None:
            base_query = base_query.filter(Task.is_long_term == is_long_term)

        if status:
            base_query = base_query.filter(Task.status == status)

        if category_id:
            base_query = base_query.filter(Task.category_id == category_id)

        if priority:
            base_query = base_query.filter(Task.priority == priority)

        if due_date_start:
            start_date = datetime.strptime(due_date_start, "%Y-%m-%d").date()
            base_query = base_query.filter(Task.due_date >= start_date)

        if due_date_end:
            end_date = datetime.strptime(due_date_end, "%Y-%m-%d").date()
            base_query = base_query.filter(Task.due_date <= end_date)

        # Get total count using SQL COUNT(*) for better performance
        total_count = base_query.count()

        # Get paginated results with eager loading of category
        tasks = (
            base_query.options(
                joinedload(Task.category)
            )  # Use joinedload for small result sets
            .order_by(Task.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        result = {"tasks": tasks, "total_count": total_count}

        # Cache the result for 5 minutes (300 seconds)
        set_cache(cache_key, result, ttl_seconds=300)

    # Set cache control headers to prevent browser caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    # Add cache validators
    response.headers["Vary"] = "Authorization"  # Cache varies by user

    return result


@router.get("/hierarchy", response_model=List[TaskWithChildren])
async def get_task_hierarchy(
    is_long_term: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get tasks in a hierarchical structure (parent tasks with their children)
    """
    # Get all top-level tasks (tasks with no parent)
    query = db.query(Task).filter(
        Task.user_id == current_user.id, Task.parent_task_id == None
    )

    if is_long_term is not None:
        query = query.filter(Task.is_long_term == is_long_term)

    top_level_tasks = query.all()

    # The TaskWithChildren schema will automatically include child tasks
    return top_level_tasks


@router.post("/", response_model=TaskSchema)
async def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new task
    """
    # Check if parent task exists and belongs to user
    if task.parent_task_id:
        parent_task = (
            db.query(Task)
            .filter(Task.id == task.parent_task_id, Task.user_id == current_user.id)
            .first()
        )

        if not parent_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent task not found or does not belong to user",
            )

    # Check if category exists
    if task.category_id:
        category = (
            db.query(TaskCategory).filter(TaskCategory.id == task.category_id).first()
        )
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
            )

    # Create task
    db_task = Task(
        user_id=current_user.id,
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        status=task.status,
        priority=task.priority,
        energy_level=task.energy_level,
        category_id=task.category_id,
        estimated_time_minutes=task.estimated_time_minutes,
        is_recurring=task.is_recurring,
        recurring_frequency=task.recurring_frequency,
        parent_task_id=task.parent_task_id,
        is_long_term=task.is_long_term,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    # Invalidate only task-related cache entries for this user
    invalidate_user_cache(current_user.id, feature="tasks")

    return db_task


@router.get("/{task_id}", response_model=TaskSchema)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific task by ID
    """
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    return task


@router.put("/{task_id}", response_model=TaskSchema)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a task
    """
    # Get the task
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Check if parent task exists and belongs to user
    if task_update.parent_task_id is not None:
        if task_update.parent_task_id > 0:  # Only check if it's a valid ID
            parent_task = (
                db.query(Task)
                .filter(
                    Task.id == task_update.parent_task_id,
                    Task.user_id == current_user.id,
                )
                .first()
            )

            if not parent_task:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent task not found or does not belong to user",
                )

    # Check if category exists
    if task_update.category_id is not None and task_update.category_id > 0:
        category = (
            db.query(TaskCategory)
            .filter(TaskCategory.id == task_update.category_id)
            .first()
        )
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
            )

    # Update task fields
    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)

    # Invalidate only task-related cache entries for this user
    invalidate_user_cache(current_user.id, feature="tasks")

    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a task
    """
    # Get the task
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Delete the task
    db.delete(task)
    db.commit()

    # Invalidate only task-related cache entries for this user
    invalidate_user_cache(current_user.id, feature="tasks")

    return None


@router.post("/reorder", status_code=status.HTTP_200_OK)
async def reorder_task(
    reorder_request: TaskReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reorder a task in the list

    This is a simplified implementation. In a real application, you might want to
    use a position field in the Task model to maintain order.
    """
    # Get the task to reorder
    task = (
        db.query(Task)
        .filter(Task.id == reorder_request.task_id, Task.user_id == current_user.id)
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    # Invalidate only task-related cache entries for this user
    invalidate_user_cache(current_user.id, feature="tasks")

    # For this simplified implementation, we'll just return success
    # In a real implementation, you would update position fields
    return {"message": "Task reordered successfully"}


@router.post("/batch", status_code=status.HTTP_200_OK)
async def batch_action(
    batch_request: TaskBatchActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Perform a batch action on multiple tasks
    """
    # Verify all tasks exist and belong to user
    tasks = (
        db.query(Task)
        .filter(Task.id.in_(batch_request.task_ids), Task.user_id == current_user.id)
        .all()
    )

    if len(tasks) != len(batch_request.task_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more tasks not found or do not belong to user",
        )

    # Perform the requested action
    if batch_request.action == "complete":
        for task in tasks:
            task.status = TaskStatus.completed
    elif batch_request.action == "delete":
        for task in tasks:
            db.delete(task)
    elif batch_request.action == "change_status" and batch_request.value:
        status_value = batch_request.value
        if status_value not in [s.value for s in TaskStatus]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status value: {status_value}",
            )
        for task in tasks:
            task.status = status_value
    elif batch_request.action == "change_priority" and batch_request.value:
        priority_value = batch_request.value
        if priority_value not in [p.value for p in TaskPriority]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid priority value: {priority_value}",
            )
        for task in tasks:
            task.priority = priority_value
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid action: {batch_request.action}",
        )

    db.commit()

    # Invalidate only task-related cache entries for this user
    invalidate_user_cache(current_user.id, feature="tasks")

    return {"message": f"Batch {batch_request.action} completed successfully"}


# AI-related endpoints
@router.get("/ai/remaining", response_model=TaskAIRemainingResponse)
async def get_remaining_ai_uses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the number of remaining AI task uses for the current user
    """
    # Check if user is a demo user
    if current_user.is_demo_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Task features are not available in demo mode",
        )

    service = TaskService(db)
    remaining_uses, total_uses = service.get_remaining_uses(current_user)

    # Get reset time (midnight PST)
    pst = pytz.timezone("America/Los_Angeles")
    now = datetime.now(pst)
    reset_time = datetime(now.year, now.month, now.day, 0, 0, 0, 0, pst) + timedelta(
        days=1
    )

    return {
        "remaining_uses": remaining_uses,
        "total_uses_allowed": total_uses,
        "reset_time": reset_time.isoformat(),
    }


@router.post("/ai/breakdown", response_model=TaskAIResponse)
async def break_down_goal(
    request: TaskAIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Break down a goal into actionable tasks using AI
    """
    # Check if user is a demo user
    if current_user.is_demo_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI Task features are not available in demo mode",
        )

    service = TaskService(db)

    try:
        result = await service.break_down_goal(current_user, request.text)

        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=result["error"],
            )

        return result
    except Exception as e:
        # Handle the error from the service
        error_message = str(e)
        if "AI Task Error:" in error_message:
            # This is a known error from our service
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error_message,
            )
        else:
            # This is an unexpected error
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred while breaking down the goal: {error_message}",
            )
