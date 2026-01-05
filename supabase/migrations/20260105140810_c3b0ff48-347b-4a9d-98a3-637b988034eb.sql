-- Create private groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏃',
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  owner_id UUID NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, profile_id)
);

-- Create group activities/results table
CREATE TABLE public.group_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  sport TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group activity participants
CREATE TABLE public.group_activity_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.group_activities(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  score TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_id, profile_id)
);

-- Create sport associations table
CREATE TABLE public.sport_associations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  join_code TEXT NOT NULL UNIQUE DEFAULT upper(encode(gen_random_bytes(4), 'hex')),
  owner_id UUID NOT NULL,
  price_per_member NUMERIC NOT NULL DEFAULT 0.75,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create association members table
CREATE TABLE public.association_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  association_id UUID NOT NULL REFERENCES public.sport_associations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(association_id, profile_id)
);

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_members ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Users can view groups they are members of"
ON public.groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    JOIN public.profiles p ON p.id = gm.profile_id
    WHERE gm.group_id = groups.id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create groups"
ON public.groups FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id)
);

CREATE POLICY "Owners can update their groups"
ON public.groups FOR UPDATE
USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id)
);

CREATE POLICY "Owners can delete their groups"
ON public.groups FOR DELETE
USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id)
);

-- Group members policies
CREATE POLICY "Members can view group members"
ON public.group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm2
    JOIN public.profiles p ON p.id = gm2.profile_id
    WHERE gm2.group_id = group_members.group_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join groups via invite"
ON public.group_members FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

CREATE POLICY "Users can leave groups"
ON public.group_members FOR DELETE
USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id)
  OR auth.uid() = (
    SELECT p.user_id FROM public.groups g
    JOIN public.profiles p ON p.id = g.owner_id
    WHERE g.id = group_members.group_id
  )
);

-- Group activities policies
CREATE POLICY "Members can view group activities"
ON public.group_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    JOIN public.profiles p ON p.id = gm.profile_id
    WHERE gm.group_id = group_activities.group_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Members can create activities"
ON public.group_activities FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    JOIN public.profiles p ON p.id = gm.profile_id
    WHERE gm.group_id = group_activities.group_id AND p.user_id = auth.uid()
  )
  AND auth.uid() = (SELECT user_id FROM public.profiles WHERE id = created_by)
);

CREATE POLICY "Creators can update their activities"
ON public.group_activities FOR UPDATE
USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = created_by)
);

CREATE POLICY "Creators can delete their activities"
ON public.group_activities FOR DELETE
USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = created_by)
);

-- Group activity participants policies
CREATE POLICY "Members can view activity participants"
ON public.group_activity_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_activities ga
    JOIN public.group_members gm ON gm.group_id = ga.group_id
    JOIN public.profiles p ON p.id = gm.profile_id
    WHERE ga.id = group_activity_participants.activity_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Members can join activities"
ON public.group_activity_participants FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

CREATE POLICY "Participants can update their participation"
ON public.group_activity_participants FOR UPDATE
USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

CREATE POLICY "Participants can leave activities"
ON public.group_activity_participants FOR DELETE
USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

-- Sport associations policies
CREATE POLICY "Anyone can view active associations"
ON public.sport_associations FOR SELECT
USING (is_active = true OR auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id));

CREATE POLICY "Users can create associations"
ON public.sport_associations FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id)
);

CREATE POLICY "Owners can update their associations"
ON public.sport_associations FOR UPDATE
USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id)
);

CREATE POLICY "Owners can delete their associations"
ON public.sport_associations FOR DELETE
USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id)
);

-- Association members policies
CREATE POLICY "Members can view association members"
ON public.association_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.association_members am2
    JOIN public.profiles p ON p.id = am2.profile_id
    WHERE am2.association_id = association_members.association_id AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.sport_associations sa
    JOIN public.profiles p ON p.id = sa.owner_id
    WHERE sa.id = association_members.association_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join associations via code"
ON public.association_members FOR INSERT
WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

CREATE POLICY "Users can leave associations"
ON public.association_members FOR DELETE
USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = profile_id)
  OR auth.uid() = (
    SELECT p.user_id FROM public.sport_associations sa
    JOIN public.profiles p ON p.id = sa.owner_id
    WHERE sa.id = association_members.association_id
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_associations_updated_at
BEFORE UPDATE ON public.sport_associations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_activities;