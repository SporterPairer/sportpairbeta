import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SPORTS, LEVELS, Sport, Level } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Loader2, Search, X, MessageCircle, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';

interface MatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToMessages?: () => void;
}

interface MatchedUser {
  id: string;
  name: string;
  avatar: string | null;
  level: string | null;
}

export function MatchDialog({ open, onOpenChange, onNavigateToMessages }: MatchDialogProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const reset = () => {
    setIsSearching(false);
    setIsMatched(false);
    setMatchedUser(null);
    setSelectedSport(null);
    setSelectedLevel(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  // Listen for match updates
  useEffect(() => {
    if (!profile || !isSearching) return;

    const channel = supabase
      .channel('match-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'match_requests',
          filter: `user_id=eq.${profile.id}`,
        },
        async (payload) => {
          const updatedRequest = payload.new as any;
          if (updatedRequest.status === 'matched' && updatedRequest.matched_with_id) {
            // Fetch matched user profile
            const { data: matchedProfile } = await supabase
              .from('profiles')
              .select('id, name, avatar, level')
              .eq('id', updatedRequest.matched_with_id)
              .single();

            if (matchedProfile) {
              setMatchedUser(matchedProfile);
              setIsMatched(true);
              setIsSearching(false);
              toast({
                title: "Match gevonden! 🎉",
                description: `Je bent gematcht met ${matchedProfile.name}`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, isSearching, toast]);

  const createMatchRequest = async () => {
    if (!profile || !selectedSport || !selectedLevel) {
      toast({
        title: "Fout",
        description: "Selecteer een sport en niveau",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user already has an active match request
      const { data: existingRequest } = await supabase
        .from('match_requests')
        .select('id')
        .eq('user_id', profile.id)
        .eq('status', 'searching')
        .maybeSingle();

      if (existingRequest) {
        await supabase
          .from('match_requests')
          .update({ status: 'cancelled' })
          .eq('id', existingRequest.id);
      }

      // Check for existing compatible match requests
      const { data: compatibleRequests } = await supabase
        .from('match_requests')
        .select(`
          id,
          user_id,
          profiles:user_id (
            id,
            name,
            avatar,
            level
          )
        `)
        .eq('sport', selectedSport)
        .eq('level', selectedLevel)
        .eq('status', 'searching')
        .neq('user_id', profile.id)
        .limit(1);

      if (compatibleRequests && compatibleRequests.length > 0) {
        const matchedRequest = compatibleRequests[0];
        const matchedProfile = matchedRequest.profiles as unknown as MatchedUser;

        // Update both requests to matched
        await supabase
          .from('match_requests')
          .update({ 
            status: 'matched', 
            matched_with_id: profile.id,
            matched_at: new Date().toISOString()
          })
          .eq('id', matchedRequest.id);

        // Create our request as already matched
        await supabase
          .from('match_requests')
          .insert({
            user_id: profile.id,
            sport: selectedSport,
            level: selectedLevel,
            age_group: 'all',
            status: 'matched',
            matched_with_id: matchedRequest.user_id,
            matched_at: new Date().toISOString()
          });

        // Create mutual follows so they can message each other
        await supabase
          .from('follows')
          .upsert([
            { follower_id: profile.id, following_id: matchedRequest.user_id },
            { follower_id: matchedRequest.user_id, following_id: profile.id }
          ], { onConflict: 'follower_id,following_id' });

        setMatchedUser(matchedProfile);
        setIsMatched(true);
        toast({
          title: "Match gevonden! 🎉",
          description: `Je bent gematcht met ${matchedProfile.name}`,
        });
      } else {
        // Create new match request
        await supabase
          .from('match_requests')
          .insert({
            user_id: profile.id,
            sport: selectedSport,
            level: selectedLevel,
            age_group: 'all',
            status: 'searching'
          });

        setIsSearching(true);
        toast({
          title: "Zoekverzoek aangemaakt! 🔍",
          description: "Andere sporters krijgen nu een melding.",
        });
      }
    } catch (error) {
      console.error('Error creating match request:', error);
      toast({
        title: "Fout",
        description: "Kon zoekverzoek niet aanmaken",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSearch = async () => {
    if (!profile) return;

    try {
      await supabase
        .from('match_requests')
        .update({ status: 'cancelled' })
        .eq('user_id', profile.id)
        .eq('status', 'searching');

      toast({
        title: "Zoekactie gestopt",
        description: "Je zoekverzoek is geannuleerd.",
      });
      handleClose();
    } catch (error) {
      console.error('Error cancelling match request:', error);
    }
  };

  const handleMessageMatch = () => {
    handleClose();
    if (onNavigateToMessages) {
      onNavigateToMessages();
    }
  };

  const canSubmit = !!selectedSport && !!selectedLevel;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 gradient-primary">
          <DialogTitle className="text-xl text-primary-foreground">
            {isMatched ? 'Match gevonden!' : isSearching ? 'Zoeken naar match...' : 'Zoek een sportmaatje'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {isMatched && matchedUser ? (
            /* Match Found State */
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-primary/20 blur-xl animate-pulse" />
                <img
                  src={matchedUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${matchedUser.id}`}
                  alt={matchedUser.name}
                  className="relative h-24 w-24 rounded-full border-4 border-primary shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-1">{matchedUser.name}</h3>
                <p className="text-muted-foreground">
                  {LEVELS.find(l => l.value === matchedUser.level)?.label || 'Onbekend niveau'}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
                <span className="text-lg">
                  {SPORTS.find(s => s.value === selectedSport)?.emoji}
                </span>
                <span className="font-medium">
                  {SPORTS.find(s => s.value === selectedSport)?.label}
                </span>
              </div>

              <div className="w-full space-y-2">
                <Button 
                  variant="gradient" 
                  className="w-full" 
                  onClick={handleMessageMatch}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Stuur een bericht
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleClose}
                >
                  Sluiten
                </Button>
              </div>
            </div>
          ) : !isSearching ? (
            <div className="space-y-6">
              {/* Sport Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Sport *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {SPORTS.map((sport) => (
                    <Card
                      key={sport.value}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedSport === sport.value && "ring-2 ring-primary shadow-glow"
                      )}
                      onClick={() => setSelectedSport(sport.value)}
                    >
                      <CardContent className="flex flex-col items-center gap-1 p-3">
                        <span className="text-2xl">{sport.emoji}</span>
                        <span className="text-xs font-medium text-center">{sport.label}</span>
                        {selectedSport === sport.value && (
                          <Check className="h-3 w-3 text-primary" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Level Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Niveau *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map((level) => (
                    <Card
                      key={level.value}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedLevel === level.value && "ring-2 ring-primary shadow-glow"
                      )}
                      onClick={() => setSelectedLevel(level.value)}
                    >
                      <CardContent className="flex items-center justify-center p-3">
                        <span className="text-sm font-medium">{level.label}</span>
                        {selectedLevel === level.value && (
                          <Check className="ml-2 h-4 w-4 text-primary" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Searching State */
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full gradient-primary opacity-20 blur-xl animate-pulse" />
                <div className="relative h-24 w-24 rounded-full gradient-primary flex items-center justify-center">
                  <Search className="h-10 w-10 text-primary-foreground animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Zoeken naar sporters...</h3>
                <p className="text-muted-foreground max-w-xs">
                  Andere sporters krijgen een melding dat je wilt{' '}
                  {SPORTS.find(s => s.value === selectedSport)?.label.toLowerCase()}.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
                <span className="text-lg">
                  {SPORTS.find(s => s.value === selectedSport)?.emoji}
                </span>
                <span className="font-medium">
                  {SPORTS.find(s => s.value === selectedSport)?.label}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {LEVELS.find(l => l.value === selectedLevel)?.label}
                </span>
              </div>
              <Button variant="outline" onClick={handleCancelSearch} className="mt-4">
                <X className="mr-2 h-4 w-4" />
                Zoeken stoppen
              </Button>
            </div>
          )}
        </div>

        {!isSearching && !isMatched && (
          <div className="border-t border-border p-4">
            <Button 
              variant="gradient" 
              className="w-full" 
              disabled={!canSubmit || isSubmitting}
              onClick={createMatchRequest}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Start zoeken
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
