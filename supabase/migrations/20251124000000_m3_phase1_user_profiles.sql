-- Migration: M3 Phase 1 - User Profiles
-- Description: Adds user_profiles table for storing personal context and memory_category enum for future use.

-- Create memory_category enum (for future M3 sprints)
CREATE TYPE memory_category AS ENUM (
  'personal',        -- Name, location, personal facts
  'preferences',     -- Communication style, work preferences
  'technical',       -- Languages, frameworks, tools
  'work_style',      -- How user likes to work
  'context'          -- Other context (timezone, etc.)
);

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,                    -- Short bio (e.g., "Software engineer at X")
  background TEXT,             -- Professional background and expertise
  preferences TEXT,            -- Work style, communication preferences
  technical_context TEXT,      -- Languages, frameworks, tools user knows
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Enforce one profile per user
  CONSTRAINT user_profiles_user_id_key UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies (assuming single-user MVP for now, but good practice)
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
