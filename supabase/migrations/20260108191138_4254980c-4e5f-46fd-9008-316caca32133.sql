-- Remove the anonymous SELECT policy that exposes user personal information
DROP POLICY IF EXISTS "Basic profiles viewable by everyone (excluding banned)" ON public.profiles;