from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import case
from typing import List, Optional
from datetime import date, datetime, timedelta
import pytz
import logging

logger = logging.getLogger(__name__)

from app.db.database import get_db
from app.models.user import User
from app.models.task import Task, TaskCategory, TaskStatus, TaskPriority, EnergyLevel
from app.services.task_service import TaskService
from app.services.redis_service import redis_service


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
    import time

    start_time = time.time()

    # Create cache key
    cache_key = f"user_{current_user.id}_task_categories"

    # Try to get from Redis cache first
    cache_start = time.time()
    cached_result = redis_service.get(cache_key)
    cache_time = time.time() - cache_start

    if cached_result is not None:
        total_time = time.time() - start_time
        print(
            f"⚡ CACHE HIT - Redis: {cache_time*1000:.1f}ms, Total: {total_time*1000:.1f}ms"
        )
        return cached_result

    print(f"💾 CACHE MISS - Redis: {cache_time*1000:.1f}ms, querying database...")

    # Get all categories in one query
    categories = (
        db.query(TaskCategory)
        .filter(
            (TaskCategory.is_default == True)
            | (TaskCategory.user_id == current_user.id)
        )
        .all()
    )

    # Convert to dictionaries for caching
    category_dicts = []
    for category in categories:
        category_dict = {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "is_default": category.is_default,
            "user_id": category.user_id,
            "created_at": (
                category.created_at.isoformat() if category.created_at else None
            ),
        }
        category_dicts.append(category_dict)

    # Cache the result for 24 hours (categories change rarely)
    redis_service.set(cache_key, category_dicts, ttl_seconds=86400)

    total_time = time.time() - start_time
    print(f"💾 DATABASE QUERY - Total: {total_time*1000:.1f}ms")

    return category_dicts


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
    # Create cache key
    cache_key = f"user_{current_user.id}_tasks_{is_long_term}_{status}_{category_id}_{priority}_{due_date_start}_{due_date_end}_{skip}_{limit}"

    # Try to get from Redis cache first
    cached_result = redis_service.get(cache_key)
    if cached_result is not None:
        return cached_result

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
    # Sort by due date (closest first), then by priority within same date, then by creation date
    tasks = (
        base_query.options(
            joinedload(Task.category)
        )  # Use joinedload for small result sets
        .order_by(
            Task.due_date.asc().nullslast(),  # Due date ascending (closest first), nulls last
            # For same due date: priority desc (high to low)
            case(
                (Task.priority == "high", 3),
                (Task.priority == "medium", 2),
                (Task.priority == "low", 1),
                else_=0,
            ).desc(),
            Task.created_at.desc(),  # Newest first for same due date/priority
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = {"tasks": tasks, "total_count": total_count}

    # Cache the result for 10 minutes
    redis_service.set(cache_key, result, ttl_seconds=600)

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
    import time

    start_time = time.time()

    # Create cache key
    cache_key = f"user_{current_user.id}_task_hierarchy_{is_long_term}"

    # Try to get from Redis cache first
    cache_start = time.time()
    cached_result = redis_service.get(cache_key)
    cache_time = time.time() - cache_start

    if cached_result is not None:
        total_time = time.time() - start_time
        print(
            f"⚡ CACHE HIT - Redis: {cache_time*1000:.1f}ms, Total: {total_time*1000:.1f}ms"
        )
        return cached_result

    print(f"💾 CACHE MISS - Redis: {cache_time*1000:.1f}ms, querying database...")

    # Get all top-level tasks (tasks with no parent)
    query = db.query(Task).filter(
        Task.user_id == current_user.id, Task.parent_task_id == None
    )

    if is_long_term is not None:
        query = query.filter(Task.is_long_term == is_long_term)

    top_level_tasks = query.all()

    # Convert to dictionaries for caching (TaskWithChildren schema handles serialization)
    from app.schemas.task import TaskWithChildren as TaskWithChildrenSchema

    # Use Pydantic to serialize the data properly
    serialized_tasks = []
    for task in top_level_tasks:
        task_dict = TaskWithChildrenSchema.model_validate(task).model_dump()
        serialized_tasks.append(task_dict)

    # Cache the result for 1 hour
    redis_service.set(cache_key, serialized_tasks, ttl_seconds=3600)

    total_time = time.time() - start_time
    print(f"💾 DATABASE QUERY - Total: {total_time*1000:.1f}ms")

    return serialized_tasks


@router.post("/", response_model=TaskSchema)
async def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new task
    """
    try:
        print(f"📝 CREATE TASK - Starting creation for user_id: {current_user.id}")
        print(f"📝 CREATE TASK - Task data: {task.title}")

        # Check if parent task exists and belongs to user
        if task.parent_task_id:
            print(f"📝 CREATE TASK - Checking parent task: {task.parent_task_id}")
            parent_task = (
                db.query(Task)
                .filter(Task.id == task.parent_task_id, Task.user_id == current_user.id)
                .first()
            )

            if not parent_task:
                print(f"❌ CREATE TASK - Parent task {task.parent_task_id} not found")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent task not found or does not belong to user",
                )
            print(f"✅ CREATE TASK - Parent task found: {parent_task.title}")

        # Check if category exists
        if task.category_id:
            print(f"📝 CREATE TASK - Checking category: {task.category_id}")
            category = (
                db.query(TaskCategory)
                .filter(TaskCategory.id == task.category_id)
                .first()
            )
            if not category:
                print(f"❌ CREATE TASK - Category {task.category_id} not found")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
                )
            print(f"✅ CREATE TASK - Category found: {category.name}")

        # Create task
        print(f"📝 CREATE TASK - Creating database record...")
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
        print(f"✅ CREATE TASK - Database creation successful, task_id: {db_task.id}")

        # Clear user's task cache (with error handling)
        try:
            print(f"🧹 CREATE TASK - Clearing cache for user {current_user.id}")
            redis_service.clear_user_cache(current_user.id)
            print(f"✅ CREATE TASK - Cache cleared successfully")
        except Exception as cache_error:
            print(f"⚠️ CREATE TASK - Cache clear failed (non-critical): {cache_error}")
            # Don't fail the request if cache clearing fails

        print(f"🎉 CREATE TASK - Task created successfully: {db_task.id}")
        return db_task

    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        print(f"❌ CREATE TASK - Unexpected error: {str(e)}")
        print(f"❌ CREATE TASK - Error type: {type(e).__name__}")

        # Rollback transaction if it's still active
        try:
            db.rollback()
        except:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create task: {str(e)}",
        )


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

    # Clear user's task cache
    redis_service.clear_user_cache(current_user.id)

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
    try:
        print(
            f"🗑️ DELETE TASK - Starting deletion for task_id: {task_id}, user_id: {current_user.id}"
        )

        # Get the task
        task = (
            db.query(Task)
            .filter(Task.id == task_id, Task.user_id == current_user.id)
            .first()
        )

        if not task:
            print(
                f"❌ DELETE TASK - Task {task_id} not found for user {current_user.id}"
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
            )

        print(f"✅ DELETE TASK - Found task: {task.title}")

        # Store is_long_term before deleting the task
        is_long_term = task.is_long_term

        # Delete the task
        print(f"🗑️ DELETE TASK - Deleting from database...")
        db.delete(task)
        db.commit()
        print(f"✅ DELETE TASK - Database deletion successful")

        # Clear user's task cache (with error handling)
        try:
            print(f"🧹 DELETE TASK - Clearing cache for user {current_user.id}")
            redis_service.clear_user_cache(current_user.id)
            print(f"✅ DELETE TASK - Cache cleared successfully")
        except Exception as cache_error:
            print(f"⚠️ DELETE TASK - Cache clear failed (non-critical): {cache_error}")
            # Don't fail the request if cache clearing fails

        print(f"🎉 DELETE TASK - Task {task_id} deleted successfully")
        return None

    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        print(f"❌ DELETE TASK - Unexpected error: {str(e)}")
        print(f"❌ DELETE TASK - Error type: {type(e).__name__}")

        # Rollback transaction if it's still active
        try:
            db.rollback()
        except:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete task: {str(e)}",
        )


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

    # For this simplified implementation, we'll just return success
    # In a real implementation, you would update position fields

    # Clear user's task cache
    redis_service.clear_user_cache(current_user.id)

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

    # Clear user's task cache
    redis_service.clear_user_cache(current_user.id)

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
