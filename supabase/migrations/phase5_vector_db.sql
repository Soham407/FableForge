-- Phase 5: Vector Database for Memory Jar RAG
-- Enables semantic search across memories for personalized narrative generation
-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;
-- Memory embeddings table for RAG
CREATE TABLE IF NOT EXISTS public.memory_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE,
    embedding vector(384),
    -- 384-dimensional embedding
    content TEXT NOT NULL,
    tags TEXT [] DEFAULT '{}',
    month INTEGER,
    year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add PDF URL columns to books table
ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS pdf_interior_url TEXT,
    ADD COLUMN IF NOT EXISTS pdf_foil_mask_url TEXT,
    ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;
-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_vector ON public.memory_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- Create index for user filtering
CREATE INDEX IF NOT EXISTS idx_memory_embeddings_user ON public.memory_embeddings(user_id);
-- Enable RLS
ALTER TABLE public.memory_embeddings ENABLE ROW LEVEL SECURITY;
-- RLS policies for memory_embeddings
CREATE POLICY "Users can view own embeddings" ON public.memory_embeddings FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own embeddings" ON public.memory_embeddings FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own embeddings" ON public.memory_embeddings FOR DELETE USING (auth.uid() = user_id);
-- Function to search similar memories using vector similarity
CREATE OR REPLACE FUNCTION match_memories(
        query_embedding vector(384),
        match_threshold FLOAT,
        match_count INT,
        user_id_filter UUID
    ) RETURNS TABLE (
        memory_id UUID,
        caption TEXT,
        image_url TEXT,
        similarity FLOAT,
        month INTEGER,
        year INTEGER
    ) LANGUAGE plpgsql AS $$ BEGIN RETURN QUERY
SELECT me.memory_id,
    me.content AS caption,
    m.image_url,
    1 - (me.embedding <=> query_embedding) AS similarity,
    me.month,
    me.year
FROM public.memory_embeddings me
    LEFT JOIN public.memories m ON m.id = me.memory_id
WHERE me.user_id = user_id_filter
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
ORDER BY me.embedding <=> query_embedding
LIMIT match_count;
END;
$$;
-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION match_memories TO authenticated;
-- Create storage bucket for book PDFs
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'book-pdfs',
        'book-pdfs',
        false,
        52428800,
        -- 50MB limit
        ARRAY ['application/pdf']::text []
    ) ON CONFLICT (id) DO NOTHING;
-- Storage policies for book-pdfs bucket
CREATE POLICY "Users can upload own book PDFs" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'book-pdfs'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Users can view own book PDFs" ON storage.objects FOR
SELECT USING (
        bucket_id = 'book-pdfs'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Service role can manage all PDFs" ON storage.objects FOR ALL USING (
    bucket_id = 'book-pdfs'
    AND auth.role() = 'service_role'
);