-- Drop existing message select policy and create a new one that excludes banned users
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;

CREATE POLICY "Users can view their own messages (excluding banned)"
ON public.messages
FOR SELECT
USING (
  (
    (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = messages.sender_id))
    OR 
    (auth.uid() = (SELECT profiles.user_id FROM profiles WHERE profiles.id = messages.receiver_id))
  )
  AND NOT is_user_banned((SELECT profiles.user_id FROM profiles WHERE profiles.id = messages.sender_id))
);

-- Drop existing profiles select policy for authenticated users and recreate to exclude banned
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users (excluding banned)"
ON public.profiles
FOR SELECT
USING (
  auth.role() = 'authenticated'::text
  AND NOT is_user_banned(user_id)
);

-- Also update basic profiles for anon users
DROP POLICY IF EXISTS "Basic profiles viewable by everyone" ON public.profiles;

CREATE POLICY "Basic profiles viewable by everyone (excluding banned)"
ON public.profiles
FOR SELECT
USING (
  auth.role() = 'anon'::text
  AND NOT is_user_banned(user_id)
);