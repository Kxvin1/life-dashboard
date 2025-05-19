-- Create enum types if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taskstatus') THEN
        CREATE TYPE taskstatus AS ENUM ('not_started', 'in_progress', 'completed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taskpriority') THEN
        CREATE TYPE taskpriority AS ENUM ('low', 'medium', 'high');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'energylevel') THEN
        CREATE TYPE energylevel AS ENUM ('low', 'medium', 'high');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurringfrequency') THEN
        CREATE TYPE recurringfrequency AS ENUM ('daily', 'weekly', 'monthly', 'custom');
    END IF;
END
$$;

-- Create task_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on task_categories if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_task_categories_id') THEN
        CREATE INDEX ix_task_categories_id ON task_categories (id);
    END IF;
END
$$;

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    due_date DATE,
    status taskstatus NOT NULL DEFAULT 'not_started',
    priority taskpriority NOT NULL DEFAULT 'medium',
    energy_level energylevel,
    category_id INTEGER,
    estimated_time_minutes INTEGER,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_frequency recurringfrequency,
    parent_task_id INTEGER,
    is_long_term BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create index on tasks if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_tasks_id') THEN
        CREATE INDEX ix_tasks_id ON tasks (id);
    END IF;
END
$$;

-- Create task_ai_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_ai_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on task_ai_usage if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_task_ai_usage_id') THEN
        CREATE INDEX ix_task_ai_usage_id ON task_ai_usage (id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_task_ai_usage_date') THEN
        CREATE INDEX ix_task_ai_usage_date ON task_ai_usage (date);
    END IF;
END
$$;

-- Create task_ai_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS task_ai_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    input_text TEXT NOT NULL,
    output_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on task_ai_history if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ix_task_ai_history_id') THEN
        CREATE INDEX ix_task_ai_history_id ON task_ai_history (id);
    END IF;
END
$$;
