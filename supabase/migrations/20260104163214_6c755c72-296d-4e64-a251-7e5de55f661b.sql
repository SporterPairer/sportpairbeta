-- Add sport_hours column to profiles
ALTER TABLE public.profiles ADD COLUMN sport_hours numeric DEFAULT 0;

-- Create sport_goals (bucketlist) table
CREATE TABLE public.sport_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.sport_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own goals"
ON public.sport_goals FOR SELECT
USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = sport_goals.user_id));

CREATE POLICY "Users can create their own goals"
ON public.sport_goals FOR INSERT
WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = sport_goals.user_id));

CREATE POLICY "Users can update their own goals"
ON public.sport_goals FOR UPDATE
USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = sport_goals.user_id));

CREATE POLICY "Users can delete their own goals"
ON public.sport_goals FOR DELETE
USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = sport_goals.user_id));