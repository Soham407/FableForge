-- FableForge Phase 3 Migration: Memory Jar
-- Adds memories table for year-round photo collection
-- MEMORIES: Store monthly photo memories for the Memory Jar feature
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    month INTEGER NOT NULL CHECK (
        month >= 0
        AND month <= 11
    ),
    year INTEGER NOT NULL,
    prompt TEXT,
    -- The monthly prompt they were responding to
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable Row Level Security
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
-- Policies: Users can only see and manage their own memories
CREATE POLICY "Users can view own memories" ON public.memories FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memories" ON public.memories FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories" ON public.memories FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories" ON public.memories FOR DELETE USING (auth.uid() = user_id);
-- Index for efficient queries by user and date
CREATE INDEX IF NOT EXISTS idx_memories_user_date ON public.memories (user_id, year, month);