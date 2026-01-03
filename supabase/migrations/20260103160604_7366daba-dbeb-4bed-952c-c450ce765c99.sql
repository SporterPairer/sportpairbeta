-- Create match_requests table to store active match searches
CREATE TABLE public.match_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  level TEXT NOT NULL,
  age_group TEXT NOT NULL,
  club_name TEXT,
  status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  matched_with_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  matched_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;

-- Users can view all active match requests (to find potential matches)
CREATE POLICY "Users can view active match requests"
ON public.match_requests
FOR SELECT
USING (auth.role() = 'authenticated');

-- Users can create their own match requests
CREATE POLICY "Users can create their own match requests"
ON public.match_requests
FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = match_requests.user_id)
);

-- Users can update their own match requests (cancel, mark as matched)
CREATE POLICY "Users can update their own match requests"
ON public.match_requests
FOR UPDATE
USING (
  auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = match_requests.user_id)
);

-- Users can delete their own match requests
CREATE POLICY "Users can delete their own match requests"
ON public.match_requests
FOR DELETE
USING (
  auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = match_requests.user_id)
);

-- Create index for faster queries on active requests
CREATE INDEX idx_match_requests_status ON public.match_requests(status) WHERE status = 'searching';
CREATE INDEX idx_match_requests_sport_level ON public.match_requests(sport, level);

-- Enable realtime for match requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_requests;