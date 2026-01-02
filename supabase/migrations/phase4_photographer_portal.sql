-- Phase 4: Photographer Portal Schema
-- Add tables for B2B photographer sessions and orders
-- Photographer sessions table
CREATE TABLE IF NOT EXISTS public.photographer_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    photo_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'ready', 'ordered', 'delivered')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add Lemon Squeezy order ID to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS lemonsqueezy_order_id TEXT,
    ADD COLUMN IF NOT EXISTS customer_email TEXT;
-- Photographer commissions table
CREATE TABLE IF NOT EXISTS public.photographer_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE
    SET NULL,
        session_id UUID REFERENCES public.photographer_sessions(id) ON DELETE
    SET NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add is_photographer flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_photographer BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS photographer_commission_rate DECIMAL(5, 2) DEFAULT 20.00;
-- Enable RLS
ALTER TABLE public.photographer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photographer_commissions ENABLE ROW LEVEL SECURITY;
-- RLS policies for photographer_sessions
CREATE POLICY "Photographers can view own sessions" ON public.photographer_sessions FOR
SELECT USING (auth.uid() = photographer_id);
CREATE POLICY "Photographers can insert own sessions" ON public.photographer_sessions FOR
INSERT WITH CHECK (auth.uid() = photographer_id);
CREATE POLICY "Photographers can update own sessions" ON public.photographer_sessions FOR
UPDATE USING (auth.uid() = photographer_id);
-- RLS policies for photographer_commissions
CREATE POLICY "Photographers can view own commissions" ON public.photographer_commissions FOR
SELECT USING (auth.uid() = photographer_id);
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_photographer_sessions_photographer ON public.photographer_sessions(photographer_id);
CREATE INDEX IF NOT EXISTS idx_photographer_sessions_status ON public.photographer_sessions(status);
CREATE INDEX IF NOT EXISTS idx_photographer_commissions_photographer ON public.photographer_commissions(photographer_id);
CREATE INDEX IF NOT EXISTS idx_orders_lemonsqueezy ON public.orders(lemonsqueezy_order_id);