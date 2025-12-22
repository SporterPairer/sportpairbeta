import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, MessageCircle, Trophy, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: 'message' | 'follow' | 'ranking' | 'invitation';
  title: string;
  description: string;
  time: string;
  read: boolean;
  avatar?: string;
  userName?: string;
}

interface NotificationsButtonProps {
  onNavigateToMessages?: () => void;
}

export function NotificationsButton({ onNavigateToMessages }: NotificationsButtonProps) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchNotifications();
      
      // Subscribe to new messages
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${profile.id}`
          },
          () => {
            fetchNotifications();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'follows',
            filter: `following_id=eq.${profile.id}`
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile]);

  const fetchNotifications = async () => {
    if (!profile) return;

    const notificationsList: Notification[] = [];

    // Fetch unread messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', profile.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch sender profiles separately
    if (messages && messages.length > 0) {
      const senderIds = [...new Set(messages.map((m) => m.sender_id))];
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', senderIds);

      const profileMap = new Map(senderProfiles?.map((p) => [p.id, p]) || []);

      messages.forEach((msg) => {
        const sender = profileMap.get(msg.sender_id);
        notificationsList.push({
          id: `msg-${msg.id}`,
          type: 'message',
          title: 'Nieuw bericht',
          description: `${sender?.name || 'Iemand'}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`,
          time: msg.created_at,
          read: false,
          avatar: sender?.avatar || undefined,
          userName: sender?.name,
        });
      });
    }

    // Fetch recent follows
    const { data: follows } = await supabase
      .from('follows')
      .select('*')
      .eq('following_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (follows && follows.length > 0) {
      const followerIds = [...new Set(follows.map((f) => f.follower_id))];
      const { data: followerProfiles } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', followerIds);

      const profileMap = new Map(followerProfiles?.map((p) => [p.id, p]) || []);

      follows.forEach((follow) => {
        const follower = profileMap.get(follow.follower_id);
        const isRecent = new Date(follow.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000;
        notificationsList.push({
          id: `follow-${follow.id}`,
          type: 'follow',
          title: 'Nieuwe volger',
          description: `${follower?.name || 'Iemand'} volgt je nu`,
          time: follow.created_at,
          read: !isRecent,
          avatar: follower?.avatar || undefined,
          userName: follower?.name,
        });
      });
    }

    // Sort by time
    notificationsList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    setNotifications(notificationsList.slice(0, 15));
    setUnreadCount(notificationsList.filter((n) => !n.read).length);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Nu';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}u`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-4 w-4 text-primary" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'ranking':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'invitation':
        return <Users className="h-4 w-4 text-blue-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'message' && onNavigateToMessages) {
      setOpen(false);
      onNavigateToMessages();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold"
              variant="default"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Meldingen</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} ongelezen</p>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Geen meldingen</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-accent/50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.avatar} />
                        <AvatarFallback>
                          {notification.userName?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center">
                        {getIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.time)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.description}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
