-- Migration 002: Add agent_searches table for tracking AI searches
-- This table will store all AI agent searches for analytics and debugging

CREATE TABLE IF NOT EXISTS agent_searches (
  id TEXT PRIMARY KEY,            -- UUID
  user_id TEXT NOT NULL,          -- UUID owner
  agent_type TEXT NOT NULL,       -- 'claude_haiku' | 'claude_sonnet' | etc.
  search_type TEXT NOT NULL,      -- 'bible_verse' | 'sermon_help' | etc.
  query TEXT NOT NULL,            -- The search query sent to the agent
  response TEXT,                  -- The response from the agent
  metadata TEXT,                  -- JSON object with additional context
  success INTEGER NOT NULL DEFAULT 1, -- 0|1 - whether the search was successful
  error_message TEXT,             -- Error message if search failed
  response_time_ms INTEGER,       -- Response time in milliseconds
  tokens_used INTEGER,            -- Number of tokens used (if available)
  cost_usd REAL,                  -- Cost in USD (if available)
  -- sync/meta
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  synced_at TEXT,
  dirty INTEGER NOT NULL DEFAULT 1,
  op TEXT NOT NULL DEFAULT 'upsert',
  version INTEGER NOT NULL DEFAULT 0
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_searches_user_created ON agent_searches (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_searches_user_agent ON agent_searches (user_id, agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_searches_user_type ON agent_searches (user_id, search_type);
CREATE INDEX IF NOT EXISTS idx_agent_searches_user_success ON agent_searches (user_id, success);
CREATE INDEX IF NOT EXISTS idx_agent_searches_created ON agent_searches (created_at);
