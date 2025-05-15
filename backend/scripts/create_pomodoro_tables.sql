-- SQL script to create Pomodoro tables
-- This script can be used as a last resort if the Python script doesn't work
-- Run this script directly in the PostgreSQL database

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

-- Verify tables were created
SELECT 'Tables created successfully!' AS result;
