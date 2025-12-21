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
import { Settings, LogOut, Users, MessageCircle } from 'lucide-react';
import { UserListDialog } from './UserListDialog';
import { ChatDialog } from './ChatDialog';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  level: string;
  age: number | null;
  bio: string | null;
}

export const ProfileTab = () => {
  const { profile, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [mutualFollowers, setMutualFollowers] = useState<Profile[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState<Profile | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio || '');
      setAge(profile.age);
      fetchFollowData();
    }
  }, [profile]);

  const fetchFollowData = async () => {
    if (!profile) return;

    // Fetch followers
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

    // Fetch following
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

        // Calculate mutual followers
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
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mijn Profiel</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setEditing(!editing)}>
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 ring-4 ring-primary/20">
              <AvatarImage src={profile.avatar || undefined} />
              <AvatarFallback className="text-xl">{profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {editing ? (
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mb-2" />
              ) : (
                <h2 className="text-xl font-bold">{profile.name}</h2>
              )}
              <Badge variant="secondary" className="capitalize">{profile.level}</Badge>
            </div>
          </div>

          <div className="flex justify-around mt-6 py-4 border-t border-b border-border">
            <button onClick={() => setShowFollowers(true)} className="text-center">
              <p className="text-2xl font-bold">{followers.length}</p>
              <p className="text-sm text-muted-foreground">Volgers</p>
            </button>
            <button onClick={() => setShowFollowing(true)} className="text-center">
              <p className="text-2xl font-bold">{following.length}</p>
              <p className="text-sm text-muted-foreground">Volgend</p>
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold">{mutualFollowers.length}</p>
              <p className="text-sm text-muted-foreground">Vrienden</p>
            </div>
          </div>

          {editing ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Leeftijd</label>
                <Input
                  type="number"
                  value={age || ''}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Bio</label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Vertel iets over jezelf..."
                />
              </div>
              <Button onClick={handleSave} className="w-full gradient-primary">
                Opslaan
              </Button>
            </div>
          ) : (
            profile.bio && <p className="mt-4 text-muted-foreground">{profile.bio}</p>
          )}
        </CardContent>
      </Card>

      {/* Mutual followers (friends) - can chat */}
      {mutualFollowers.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Vrienden (chatten mogelijk)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mutualFollowers.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={friend.avatar || undefined} />
                      <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{friend.name}</span>
                  </div>
                  <Button size="sm" onClick={() => handleStartChat(friend)}>
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chat
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
