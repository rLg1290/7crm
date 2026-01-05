-- Create table for Kanban logs
CREATE TABLE IF NOT EXISTS public.kanban_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID, -- Can be null if lead is deleted, but good to keep reference if possible or just store lead name in details
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'MOVE'
    details JSONB, -- Store old/new values or other info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.kanban_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all logs" ON public.kanban_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Authenticated users can insert logs (trigger or manual)
CREATE POLICY "Users can insert logs" ON public.kanban_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_kanban_logs_created_at ON public.kanban_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kanban_logs_lead_id ON public.kanban_logs(lead_id);
