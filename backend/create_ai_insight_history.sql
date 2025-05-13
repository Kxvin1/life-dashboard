-- Create ai_insight_history table
CREATE TABLE IF NOT EXISTS ai_insight_history (
    id SERIAL NOT NULL, 
    user_id INTEGER NOT NULL, 
    time_period VARCHAR NOT NULL,
    summary TEXT NOT NULL,
    insights JSONB NOT NULL,
    recommendations JSONB NOT NULL,
    charts_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id),
    FOREIGN KEY(user_id) REFERENCES users (id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_ai_insight_history_id ON ai_insight_history (id);
CREATE INDEX IF NOT EXISTS ix_ai_insight_history_user_id ON ai_insight_history (user_id);
