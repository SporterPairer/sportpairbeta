import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, UserPlus, UserMinus } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  level: string;
  age: number | null;
  bio: string | null;
}

export const DiscoverTab = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchFollowing();
  }, [profile]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', profile?.id || '')
      .order('name');

    if (data) {
      setUsers(data);
    }
  };

  const fetchFollowing = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', profile.id);

    if (data) {
      setFollowingIds(data.map(f => f.following_id));
    }
  };

  const handleFollow = async (userId: string) => {
    if (!profile) return;
    setLoading(userId);

    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: profile.id, following_id: userId });

    if (error) {
      toast.error('Kon niet volgen');
    } else {
      toast.success('Nu aan het volgen!');
      setFollowingIds([...followingIds, userId]);
    }
    setLoading(null);
  };

  const handleUnfollow = async (userId: string) => {
    if (!profile) return;
    setLoading(userId);

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', profile.id)
      .eq('following_id', userId);

    if (error) {
      toast.error('Kon niet ontvolgen');
    } else {
      toast.success('Niet meer aan het volgen');
      setFollowingIds(followingIds.filter(id => id !== userId));
    }
    setLoading(null);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24 space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Ontdek Mensen</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek gebruikers..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Geen gebruikers gevonden</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="shadow-card">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {user.level}
                        </Badge>
                        {user.age && (
                          <span className="text-sm text-muted-foreground">{user.age} jaar</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {followingIds.includes(user.id) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnfollow(user.id)}
                      disabled={loading === user.id}
                    >
                      <UserMinus className="w-4 h-4 mr-1" />
                      Ontvolgen
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleFollow(user.id)}
                      disabled={loading === user.id}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Volgen
                    </Button>
                  )}
                </div>
                {user.bio && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
