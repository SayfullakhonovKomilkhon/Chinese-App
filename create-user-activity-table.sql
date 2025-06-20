-- Create user_activity table
-- This table tracks user activity statistics using the int8 user ID from the users table

CREATE TABLE IF NOT EXISTS public.user_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    total_questions_viewed INTEGER DEFAULT 0 NOT NULL,
    questions_viewed_today INTEGER DEFAULT 0 NOT NULL,
    total_minutes INTEGER DEFAULT 0 NOT NULL,
    total_sessions INTEGER DEFAULT 0 NOT NULL,
    total_days_active INTEGER DEFAULT 0 NOT NULL,
    streak_days INTEGER DEFAULT 0 NOT NULL,
    last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraint to users.id (int8/bigint)
    CONSTRAINT fk_user_activity_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint to ensure one activity record per user
    CONSTRAINT unique_user_activity_user_id 
        UNIQUE (user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_activity_date ON public.user_activity(last_activity_date);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Allow users to see and modify only their own activity data
CREATE POLICY "Users can view own activity" ON public.user_activity
    FOR SELECT USING (user_id = (
        SELECT id FROM public.users 
        WHERE email = auth.email()
    ));

CREATE POLICY "Users can update own activity" ON public.user_activity
    FOR UPDATE USING (user_id = (
        SELECT id FROM public.users 
        WHERE email = auth.email()
    ));

CREATE POLICY "Users can insert own activity" ON public.user_activity
    FOR INSERT WITH CHECK (user_id = (
        SELECT id FROM public.users 
        WHERE email = auth.email()
    ));

-- Grant necessary permissions
GRANT ALL ON public.user_activity TO authenticated;
GRANT USAGE ON SEQUENCE user_activity_id_seq TO authenticated;

-- Optional: Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_user_activity_updated_at
    BEFORE UPDATE ON public.user_activity
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_activity_updated_at(); 