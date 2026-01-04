import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings, LogOut, Users, MessageCircle, AlertTriangle, Shield, Edit3, X, Check } from 'lucide-react';
import { UserListDialog } from './UserListDialog';
import { ChatDialog } from './ChatDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useNavigate } from 'react-router-dom';
import { SportHoursCard } from './SportHoursCard';
import { SportGoalsCard } from './SportGoalsCard';

interface Violation {
  id: string;
  violation_reason: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  level: string;
  age: number | null;
  bio: string | null;
  sport_hours?: number;
}

export const ProfileTab = () => {
  const { profile, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [sportHours, setSportHours] = useState(0);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [mutualFollowers, setMutualFollowers] = useState<Profile[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [showViolations, setShowViolations] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<Profile | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio || '');
      setAge(profile.age);
      setSportHours((profile as any).sport_hours || 0);
      fetchFollowData();
      fetchViolations();
    }
  }, [profile]);

  const fetchFollowData = async () => {
    if (!profile) return;

    const { data: followersData } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', profile.id);

    if (followersData) {
      const followerIds = followersData.map(f => f.follower_id);
      if (followerIds.length > 0) {
        const { data: followerProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', followerIds);
        setFollowers(followerProfiles || []);
      }
    }

    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', profile.id);

    if (followingData) {
      const followingIds = followingData.map(f => f.following_id);
      if (followingIds.length > 0) {
        const { data: followingProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', followingIds);
        setFollowing(followingProfiles || []);

        const { data: mutualData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', profile.id)
          .in('follower_id', followingIds);

        if (mutualData) {
          const mutualIds = mutualData.map(m => m.follower_id);
          const mutuals = (followingProfiles || []).filter(p => mutualIds.includes(p.id));
          setMutualFollowers(mutuals);
        }
      }
    }
  };

  const fetchViolations = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('user_violations')
      .select('id, violation_reason, created_at')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false });

    if (data) {
      setViolations(data);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ name, bio, age })
      .eq('id', profile.id);

    if (error) {
      toast.error('Kon profiel niet opslaan');
    } else {
      toast.success('Profiel opgeslagen');
      setEditing(false);
    }
  };

  const handleStartChat = (user: Profile) => {
    setSelectedChatUser(user);
    setShowChat(true);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mijn Profiel</h1>
        <div className="flex gap-1">
          {isAdmin && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="rounded-xl">
              <Shield className="w-5 h-5 text-primary" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="shadow-card overflow-hidden">
        <div className="h-20 gradient-primary relative">
          <div className="absolute -bottom-10 left-6">
            <Avatar className="w-20 h-20 ring-4 ring-background shadow-lg">
              <AvatarImage src={profile.avatar || undefined} />
              <AvatarFallback className="text-xl font-bold bg-secondary">
                {profile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setEditing(!editing)}
            className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl"
          >
            {editing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
          </Button>
        </div>

        <CardContent className="pt-14 pb-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Naam</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Leeftijd</label>
                <Input
                  type="number"
                  value={age || ''}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bio</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Vertel iets over jezelf..."
                  rows={3}
                />
              </div>
              <Button onClick={handleSave} className="w-full gradient-primary text-white">
                <Check className="w-4 h-4 mr-2" />
                Opslaan
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="capitalize bg-primary/10 text-primary hover:bg-primary/20">
                    {profile.level}
                  </Badge>
                  {profile.age && (
                    <span className="text-sm text-muted-foreground">{profile.age} jaar</span>
                  )}
                </div>
              </div>
              {profile.bio && (
                <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
              )}
            </>
          )}

          {/* Stats */}
          <div className="flex justify-around mt-6 py-4 border-t border-border">
            <button onClick={() => setShowFollowers(true)} className="text-center group">
              <p className="text-2xl font-bold group-hover:text-primary transition-colors">{followers.length}</p>
              <p className="text-xs text-muted-foreground">Volgers</p>
            </button>
            <button onClick={() => setShowFollowing(true)} className="text-center group">
              <p className="text-2xl font-bold group-hover:text-primary transition-colors">{following.length}</p>
              <p className="text-xs text-muted-foreground">Volgend</p>
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{mutualFollowers.length}</p>
              <p className="text-xs text-muted-foreground">Vrienden</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sport Hours */}
      <SportHoursCard 
        profileId={profile.id} 
        currentHours={sportHours} 
        onUpdate={setSportHours} 
      />

      {/* Sport Goals */}
      <SportGoalsCard profileId={profile.id} />

      {/* Friends (Chat) */}
      {mutualFollowers.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Vrienden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mutualFollowers.map((friend) => (
              <div 
                key={friend.id} 
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={friend.avatar || undefined} />
                    <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{friend.name}</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleStartChat(friend)}
                  className="rounded-xl"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Chat
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Violations */}
      {violations.length > 0 && (
        <Collapsible open={showViolations} onOpenChange={setShowViolations}>
          <Card className="shadow-card border-destructive/20">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Waarschuwingen ({violations.length}/3)
                  <Badge variant="destructive" className="ml-auto">
                    {3 - violations.length} over
                  </Badge>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Na 3 waarschuwingen wordt je account geblokkeerd.
                </p>
                {violations.map((violation) => (
                  <div key={violation.id} className="p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                    <p className="text-sm font-medium text-destructive">{violation.violation_reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(violation.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      <UserListDialog
        open={showFollowers}
        onOpenChange={setShowFollowers}
        title="Volgers"
        users={followers}
      />

      <UserListDialog
        open={showFollowing}
        onOpenChange={setShowFollowing}
        title="Volgend"
        users={following}
      />

      {selectedChatUser && (
        <ChatDialog
          open={showChat}
          onOpenChange={setShowChat}
          otherUser={selectedChatUser}
        />
      )}
    </div>
  );
};
