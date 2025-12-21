-- Update the handle_new_user function to include age from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_age INTEGER;
BEGIN
  -- Validate and sanitize name
  user_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''),
    split_part(NEW.email, '@', 1)
  );
  user_name := substring(user_name, 1, 100);
  
  -- Get age from metadata (already validated on client-side to be 16+)
  user_age := (NEW.raw_user_meta_data ->> 'age')::INTEGER;
  
  INSERT INTO public.profiles (user_id, name, avatar, age)
  VALUES (
    NEW.id,
    user_name,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id,
    user_age
  );
  RETURN NEW;
END;
$$;