-- Create a secure function to get age-appropriate matches for users
-- Minors (16-17) can only see users within 4 years of their age
CREATE OR REPLACE FUNCTION public.get_safe_age_range(_user_age INTEGER)
RETURNS TABLE(min_age INTEGER, max_age INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN _user_age IS NULL THEN 16
      WHEN _user_age < 18 THEN GREATEST(_user_age - 4, 16)
      ELSE 16
    END AS min_age,
    CASE 
      WHEN _user_age IS NULL THEN 150
      WHEN _user_age < 18 THEN _user_age + 4
      ELSE 150
    END AS max_age;
$$;

-- Update the profiles RLS policy to hide age from unauthenticated users
-- First, drop the existing policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create new policy for public profile info (excluding age for unauthenticated users)
-- Since RLS can't selectively hide columns, we'll keep the policy but handle age visibility in the application
CREATE POLICY "Profiles are viewable by authenticated users"
ON profiles FOR SELECT
USING (auth.role() = 'authenticated');

-- Add policy for unauthenticated users to see basic profile info (will filter age in app)
CREATE POLICY "Basic profiles viewable by everyone"
ON profiles FOR SELECT
USING (auth.role() = 'anon');

-- Add a check constraint to ensure age is at least 16 if provided
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_age_minimum;
ALTER TABLE profiles ADD CONSTRAINT profiles_age_minimum CHECK (age IS NULL OR age >= 16);