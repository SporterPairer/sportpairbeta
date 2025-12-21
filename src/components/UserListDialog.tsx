import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UserPlus, UserMinus } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  level: string;
  age: number | null;
  bio: string | null;
}

interface UserListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  users: Profile[];
}

export const UserListDialog = ({ open, onOpenChange, title, users }: UserListDialogProps) => {
  const { profile } = useAuth();
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const checkFollowing = async () => {
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

  useState(() => {
    if (open) {
      checkFollowing();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Geen gebruikers</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{user.level}</p>
                  </div>
                </div>
                {user.id !== profile?.id && (
                  followingIds.includes(user.id) ? (
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
                  )
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
