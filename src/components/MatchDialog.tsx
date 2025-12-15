import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockClubs, mockUsers } from '@/data/mockData';
import { SPORTS, LEVELS, AGE_GROUPS, Sport, Level, AgeGroup, Club, User } from '@/types';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, Sparkles, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'sport' | 'level' | 'age' | 'club' | 'result';

export function MatchDialog({ open, onOpenChange }: MatchDialogProps) {
  const [step, setStep] = useState<Step>('sport');
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const { toast } = useToast();

  const reset = () => {
    setStep('sport');
    setSelectedSport(null);
    setSelectedLevel(null);
    setSelectedAge(null);
    setSelectedClub(null);
    setMatchedUser(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const handleNext = () => {
    if (step === 'sport' && selectedSport) setStep('level');
    else if (step === 'level' && selectedLevel) setStep('age');
    else if (step === 'age' && selectedAge) setStep('club');
    else if (step === 'club' && selectedClub) {
      // Find a random match
      const availableMembers = selectedClub.members.filter(m => m.id !== '1');
      const randomMatch = availableMembers[Math.floor(Math.random() * availableMembers.length)];
      setMatchedUser(randomMatch);
      setStep('result');
    }
  };

  const handleAcceptMatch = () => {
    toast({
      title: "Match geaccepteerd! 🎉",
      description: `Je gaat ${SPORTS.find(s => s.value === selectedSport)?.label.toLowerCase()} met ${matchedUser?.name}!`,
    });
    handleClose();
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
            {step === 'result' && 'Match gevonden!'}
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

          {/* Match Result */}
          {step === 'result' && matchedUser && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full gradient-primary opacity-20 blur-xl animate-pulse" />
                <img
                  src={matchedUser.avatar}
                  alt={matchedUser.name}
                  className="relative h-28 w-28 rounded-full border-4 border-primary shadow-glow"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full gradient-accent">
                  <Sparkles className="h-4 w-4 text-accent-foreground" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold">{matchedUser.name}</h3>
                <p className="text-muted-foreground">
                  {LEVELS.find(l => l.value === matchedUser.level)?.label} • {matchedUser.age} jaar
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
              <div className="flex w-full gap-3">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  <X className="mr-2 h-4 w-4" />
                  Afwijzen
                </Button>
                <Button variant="gradient" className="flex-1" onClick={handleAcceptMatch}>
                  <Check className="mr-2 h-4 w-4" />
                  Accepteren
                </Button>
              </div>
            </div>
          )}
        </div>

        {step !== 'result' && (
          <div className="border-t border-border p-4">
            <Button 
              variant="gradient" 
              className="w-full" 
              disabled={!canProceed()}
              onClick={handleNext}
            >
              Volgende
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
