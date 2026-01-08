-- Fix: Allow authenticated users to view groups so invite code feature works
-- The current policy only allows members to view groups, breaking the join-by-code feature

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;

-- Create a new policy that allows authenticated users to view groups
-- This is necessary for the invite code feature to work
-- Security: Groups are designed to be discoverable via invite codes (12-char hex = high entropy)
-- Users still need membership to view activities and participants
CREATE POLICY "Authenticated users can view groups"
ON public.groups FOR SELECT
USING (auth.role() = 'authenticated');