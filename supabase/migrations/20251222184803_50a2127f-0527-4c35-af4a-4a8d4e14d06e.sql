-- Create moderation_logs table to track all AI decisions
CREATE TABLE public.moderation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL,
  message_content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL,
  ai_reasoning TEXT,
  violation_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view moderation logs
CREATE POLICY "Admins can view all moderation logs"
ON public.moderation_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert (from edge function)
CREATE POLICY "Service role can insert moderation logs"
ON public.moderation_logs
FOR INSERT
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_moderation_logs_sender ON public.moderation_logs(sender_id);
CREATE INDEX idx_moderation_logs_created ON public.moderation_logs(created_at DESC);
CREATE INDEX idx_moderation_logs_approved ON public.moderation_logs(is_approved);