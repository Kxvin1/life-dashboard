# Pomodoro Tables Fix

This document provides instructions for fixing the missing Pomodoro tables in the production database.

## Issue

The production database is missing the Pomodoro tables (`pomodoro_sessions`, `pomodoro_ai_usage`, and `pomodoro_ai_history`), which is causing 500 errors when trying to use the Pomodoro feature.

Error message:

```
Error querying pomodoro_sessions table: (psycopg2.errors.UndefinedTable) relation "pomodoro_sessions" does not exist
```

## Solution

We need to create the missing Pomodoro tables in the production database.

## Steps

### Option 1: Using the Fix Script (Recommended)

1. SSH into the Railway server or use the Railway CLI:

```bash
railway login
railway shell
```

2. Navigate to the backend directory:

```bash
cd backend
```

3. Run the fix script:

```bash
python -m scripts.fix_pomodoro_tables
```

This script will:

- Check if the Pomodoro tables exist
- Create any missing tables
- Verify that the tables were created successfully
- Update the alembic_version table to include the Pomodoro migration

### Option 2: Using Alembic

If Option 1 doesn't work, you can try using Alembic:

1. SSH into the Railway server or use the Railway CLI:

```bash
railway login
railway shell
```

2. Navigate to the backend directory:

```bash
cd backend
```

3. Run the Alembic migration:

```bash
alembic upgrade head
```

### Option 3: Manual SQL (Last Resort)

If both Option 1 and Option 2 don't work, you can execute the SQL directly:

1. Connect to the Railway PostgreSQL database:

```bash
railway connect postgresql
```

2. You can either:

   a. Run the SQL script directly:

   ```bash
   \i /app/backend/scripts/create_pomodoro_tables.sql
   ```

   b. Or copy and paste the following SQL commands:

```sql
-- Create pomodoro_sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    task_name VARCHAR NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS ix_pomodoro_sessions_user_id ON pomodoro_sessions (user_id);

-- Create pomodoro_ai_usage table
CREATE TABLE IF NOT EXISTS pomodoro_ai_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    count INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for pomodoro_ai_usage
CREATE INDEX IF NOT EXISTS ix_pomodoro_ai_usage_user_id ON pomodoro_ai_usage (user_id);
CREATE INDEX IF NOT EXISTS ix_pomodoro_ai_usage_date ON pomodoro_ai_usage (date);

-- Create pomodoro_ai_history table
CREATE TABLE IF NOT EXISTS pomodoro_ai_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    summary TEXT NOT NULL,
    insights JSONB NOT NULL,
    recommendations JSONB NOT NULL,
    charts_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for pomodoro_ai_history
CREATE INDEX IF NOT EXISTS ix_pomodoro_ai_history_user_id ON pomodoro_ai_history (user_id);

-- Update alembic_version table
INSERT INTO alembic_version (version_num)
SELECT 'add_pomodoro_tables'
WHERE NOT EXISTS (
    SELECT 1 FROM alembic_version WHERE version_num = 'add_pomodoro_tables'
);
```

## Verification

After applying the fix, you can verify that it was successful by running:

```bash
python -m scripts.check_pomodoro_schema
```

This script will:

- Check if the Pomodoro tables exist
- Check if the migration is in the alembic_version table
- Show the columns for each table

You can also use the general schema check script:

```bash
python -m scripts.utils.check_schema
```

This should show that the Pomodoro tables exist in the database.

Finally, you should test if the Pomodoro feature works correctly by visiting the Pomodoro page in the application.

## Troubleshooting

If you encounter any issues, check the Railway logs for error messages:

```bash
railway logs
```

If the tables are created but you still see errors, make sure that the alembic_version table includes the 'add_pomodoro_tables' migration:

```bash
railway connect postgresql
SELECT * FROM alembic_version;
```

If the migration is missing, you can add it manually:

```sql
INSERT INTO alembic_version (version_num) VALUES ('add_pomodoro_tables');
```
