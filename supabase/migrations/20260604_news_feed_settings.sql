-- Migration: Create news_feed_settings table
-- Date: 2026-06-04

CREATE TABLE IF NOT EXISTS public.news_feed_settings (
    active_date DATE PRIMARY KEY,
    mode TEXT NOT NULL DEFAULT 'append' CHECK (mode IN ('append', 'override')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.news_feed_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow anonymous select" ON public.news_feed_settings;
DROP POLICY IF EXISTS "Allow admin modify" ON public.news_feed_settings;

-- 1. Anyone can read settings
CREATE POLICY "Allow anonymous select" ON public.news_feed_settings
    FOR SELECT USING (true);

-- 2. Only admins can insert/update/delete
CREATE POLICY "Allow admin modify" ON public.news_feed_settings
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );
