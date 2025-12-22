import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatDialog } from '@/components/ChatDialog';
import { MessageCircle } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  level: string;
  age: number | null;
  bio: string | null;
}

interface Conversation {
  otherUser: Profile;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export function MessagesTab() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchConversations();
    }
  }, [profile]);

  const fetchConversations = async () => {
    if (!profile) return;

    try {
      // Get all messages involving the current user
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, { messages: any[]; otherUserId: string }>();

      messages?.forEach((msg) => {
        const otherUserId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id;
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, { messages: [], otherUserId });
        }
        conversationMap.get(otherUserId)!.messages.push(msg);
      });

      // Fetch profiles for all conversation partners
      const otherUserIds = Array.from(conversationMap.keys());
      
      if (otherUserIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherUserIds);

      const conversationList: Conversation[] = [];

      conversationMap.forEach((conv, odtherUserId) => {
        const otherProfile = profiles?.find((p) => p.id === odtherUserId);
        if (otherProfile) {
          const lastMsg = conv.messages[0];
          const unread = conv.messages.filter(
            (m) => m.receiver_id === profile.id && !m.read
          ).length;

          conversationList.push({
            otherUser: otherProfile,
            lastMessage: lastMsg.content,
            lastMessageTime: lastMsg.created_at,
            unreadCount: unread,
          });
        }
      });

      // Sort by last message time
      conversationList.sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      setConversations(conversationList);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (user: Profile) => {
    setSelectedUser(user);
    setChatOpen(true);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Gisteren';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('nl-NL', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
          <MessageCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Berichten</h1>
      </div>

      {conversations.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Nog geen berichten</h3>
          <p className="text-muted-foreground">
            Start een gesprek met iemand vanuit het Ontdek tabblad!
          </p>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Card
                key={conv.otherUser.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => openChat(conv.otherUser)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.otherUser.avatar || undefined} />
                      <AvatarFallback>{conv.otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">{conv.otherUser.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {selectedUser && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          otherUser={selectedUser}
        />
      )}
    </div>
  );
}
