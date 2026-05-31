-- Migration: Create missing_address_requests table
-- Date: 2026-05-28

CREATE TABLE IF NOT EXISTS public.missing_address_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_type TEXT NOT NULL, -- 'city' або 'rural'
    okrug TEXT,
    village TEXT,
    street TEXT NOT NULL,
    house TEXT NOT NULL,
    subgroup TEXT, -- підчерга, вказана громадянином при подачі (опціонально)
    assigned_subgroup TEXT, -- підчерга, призначена адміном при верифікації
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'added', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) -- NULL, якщо гість відправляє анонімно
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.missing_address_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent errors on multiple runs
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.missing_address_requests;
DROP POLICY IF EXISTS "Allow admin select and update" ON public.missing_address_requests;

-- 1. Allow any user (even anonymous guest) to submit address requests
CREATE POLICY "Allow anonymous insert" ON public.missing_address_requests
    FOR INSERT WITH CHECK (true);

-- 2. Allow only administrators to view or update these requests
CREATE POLICY "Allow admin select and update" ON public.missing_address_requests
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );
