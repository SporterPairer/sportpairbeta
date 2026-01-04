import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockClubs } from '@/data/mockData';
import { SPORTS, LEVELS, Sport, Level, Club } from '@/types';
import { cn } from '@/lib/utils';
import { Check, Loader2, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';

interface MatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MatchDialog({ open, onOpenChange }: MatchDialogProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const reset = () => {
    setIsSearching(false);
    setSelectedSport(null);
    setSelectedLevel(null);
    setSelectedClub(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

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

      // Create new match request
      const { error } = await supabase
        .from('match_requests')
        .insert({
          user_id: profile.id,
          sport: selectedSport,
          level: selectedLevel,
          age_group: 'all',
          club_name: selectedClub?.name || null,
          status: 'searching'
        });

      if (error) throw error;

      setIsSearching(true);
      toast({
        title: "Zoekverzoek aangemaakt! 🔍",
        description: "Andere sporters krijgen nu een melding.",
      });
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

  const canSubmit = !!selectedSport && !!selectedLevel;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 gradient-primary">
          <DialogTitle className="text-xl text-primary-foreground">
            {isSearching ? 'Zoeken naar match...' : 'Zoek een sportmaatje'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {!isSearching ? (
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

              {/* Club Selection (Optional) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Club (optioneel)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {mockClubs.slice(0, 4).map((club) => (
                    <Card
                      key={club.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedClub?.id === club.id && "ring-2 ring-primary shadow-glow"
                      )}
                      onClick={() => setSelectedClub(selectedClub?.id === club.id ? null : club)}
                    >
                      <CardContent className="flex items-center gap-2 p-3">
                        <span className="text-xl">{club.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{club.name}</p>
                        </div>
                        {selectedClub?.id === club.id && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
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

        {!isSearching && (
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
