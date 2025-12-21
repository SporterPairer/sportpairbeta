import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  level: string;
  age: number | null;
  bio: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUser: Profile;
}

export const ChatDialog = ({ open, onOpenChange, otherUser }: ChatDialogProps) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && profile) {
      fetchMessages();
      
      // Subscribe to new messages
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            const newMsg = payload.new as Message;
            if (
              (newMsg.sender_id === profile.id && newMsg.receiver_id === otherUser.id) ||
              (newMsg.sender_id === otherUser.id && newMsg.receiver_id === profile.id)
            ) {
              setMessages((prev) => [...prev, newMsg]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, profile, otherUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
    }
  };

  const MAX_MESSAGE_LENGTH = 1000;

  const sendMessage = async () => {
    if (!profile) return;
    
    const trimmedMessage = newMessage.trim();
    
    // Validate message content
    if (!trimmedMessage) {
      toast.error('Bericht mag niet leeg zijn');
      return;
    }
    
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Bericht mag maximaal ${MAX_MESSAGE_LENGTH} tekens bevatten`);
      return;
    }
    
    setSending(true);

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: profile.id,
        receiver_id: otherUser.id,
        content: trimmedMessage
      });

    if (error) {
      toast.error('Kon bericht niet versturen');
    } else {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={otherUser.avatar || undefined} />
              <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <DialogTitle>{otherUser.name}</DialogTitle>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nog geen berichten. Start het gesprek!
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      message.sender_id === profile?.id
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-secondary rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === profile?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              onKeyPress={handleKeyPress}
              placeholder="Schrijf een bericht..."
              disabled={sending}
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {newMessage.length > MAX_MESSAGE_LENGTH * 0.9 && (
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {newMessage.length}/{MAX_MESSAGE_LENGTH}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
