import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockClubs } from '@/data/mockData';
import { SPORTS, LEVELS, AGE_GROUPS, Sport, Level, AgeGroup, Club } from '@/types';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, Loader2, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'sport' | 'level' | 'age' | 'club' | 'searching';

export function MatchDialog({ open, onOpenChange }: MatchDialogProps) {
  const [step, setStep] = useState<Step>('sport');
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const reset = () => {
    setStep('sport');
    setSelectedSport(null);
    setSelectedLevel(null);
    setSelectedAge(null);
    setSelectedClub(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const handleNext = async () => {
    if (step === 'sport' && selectedSport) setStep('level');
    else if (step === 'level' && selectedLevel) setStep('age');
    else if (step === 'age' && selectedAge) setStep('club');
    else if (step === 'club' && selectedClub) {
      await createMatchRequest();
    }
  };

  const createMatchRequest = async () => {
    if (!profile || !selectedSport || !selectedLevel || !selectedAge) {
      toast({
        title: "Fout",
        description: "Je moet ingelogd zijn om te matchen",
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
        // Cancel the existing request first
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
          age_group: selectedAge,
          club_name: selectedClub?.name || null,
          status: 'searching'
        });

      if (error) throw error;

      setStep('searching');
      toast({
        title: "Zoekverzoek aangemaakt! 🔍",
        description: "Andere sporters krijgen nu een melding dat je wilt sporten.",
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

  const canProceed = () => {
    if (step === 'sport') return !!selectedSport;
    if (step === 'level') return !!selectedLevel;
    if (step === 'age') return !!selectedAge;
    if (step === 'club') return !!selectedClub;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 gradient-primary">
          <DialogTitle className="text-xl text-primary-foreground">
            {step === 'sport' && 'Kies een sport'}
            {step === 'level' && 'Kies je niveau'}
            {step === 'age' && 'Leeftijdsgroep'}
            {step === 'club' && 'Kies een club'}
            {step === 'searching' && 'Zoeken naar match...'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Sport Selection */}
          {step === 'sport' && (
            <div className="grid grid-cols-2 gap-3">
              {SPORTS.map((sport) => (
                <Card
                  key={sport.value}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    selectedSport === sport.value && "ring-2 ring-primary shadow-glow"
                  )}
                  onClick={() => setSelectedSport(sport.value)}
                >
                  <CardContent className="flex flex-col items-center gap-2 p-4">
                    <span className="text-3xl">{sport.emoji}</span>
                    <span className="text-sm font-medium">{sport.label}</span>
                    {selectedSport === sport.value && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Level Selection */}
          {step === 'level' && (
            <div className="space-y-3">
              {LEVELS.map((level) => (
                <Card
                  key={level.value}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    selectedLevel === level.value && "ring-2 ring-primary shadow-glow"
                  )}
                  onClick={() => setSelectedLevel(level.value)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="font-medium">{level.label}</span>
                    {selectedLevel === level.value && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Age Selection */}
          {step === 'age' && (
            <div className="space-y-3">
              {AGE_GROUPS.map((age) => (
                <Card
                  key={age.value}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    selectedAge === age.value && "ring-2 ring-primary shadow-glow"
                  )}
                  onClick={() => setSelectedAge(age.value)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="font-medium">{age.label}</span>
                    {selectedAge === age.value && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Club Selection */}
          {step === 'club' && (
            <div className="space-y-3">
              {mockClubs.map((club) => (
                <Card
                  key={club.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    selectedClub?.id === club.id && "ring-2 ring-primary shadow-glow"
                  )}
                  onClick={() => setSelectedClub(club)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">
                      {club.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{club.name}</p>
                      <p className="text-sm text-muted-foreground">{club.memberCount} leden</p>
                    </div>
                    {selectedClub?.id === club.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Searching State */}
          {step === 'searching' && (
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
                  Ze kunnen je uitnodigen!
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

        {step !== 'searching' && (
          <div className="border-t border-border p-4">
            <Button 
              variant="gradient" 
              className="w-full" 
              disabled={!canProceed() || isSubmitting}
              onClick={handleNext}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig...
                </>
              ) : (
                <>
                  {step === 'club' ? 'Start zoeken' : 'Volgende'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
