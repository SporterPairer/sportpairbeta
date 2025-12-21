import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MatchDialog } from '@/components/MatchDialog';
import { mockClubs } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Zap, Users, Trophy, TrendingUp } from 'lucide-react';

export function HomeTab() {
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const { profile } = useAuth();

  const displayName = profile?.name?.split(' ')[0] || 'Gebruiker';

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="animate-slide-up">
        <p className="text-muted-foreground">Welkom terug,</p>
        <h1 className="text-3xl font-bold">{displayName} 👋</h1>
      </div>

      {/* Quick Match Button */}
      <div className="animate-slide-up stagger-1 opacity-0">
        <Card className="overflow-hidden border-0 gradient-primary p-[2px]">
          <CardContent className="flex flex-col items-center gap-4 rounded-2xl bg-card p-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-accent shadow-accent">
              <Zap className="h-10 w-10 text-accent-foreground" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold">Klaar om te matchen?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Vind een sportmaatje uit je clubs
              </p>
            </div>
            <Button 
              variant="match" 
              size="xl"
              onClick={() => setMatchDialogOpen(true)}
              className="w-full"
            >
              Match Nu! 🎯
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up stagger-2 opacity-0">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold">18</p>
            <p className="text-xs text-muted-foreground">Gewonnen</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold">28</p>
            <p className="text-xs text-muted-foreground">Activiteiten</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold">{mockClubs.length}</p>
            <p className="text-xs text-muted-foreground">Clubs</p>
          </CardContent>
        </Card>
      </div>

      {/* My Clubs Preview */}
      <div className="animate-slide-up stagger-3 opacity-0">
        <h3 className="mb-3 font-semibold">Mijn Clubs</h3>
        <div className="space-y-2">
          {mockClubs.slice(0, 3).map((club) => (
            <Card key={club.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">
                  {club.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{club.name}</p>
                  <p className="text-sm text-muted-foreground">{club.memberCount} leden</p>
                </div>
                <div className="flex -space-x-2">
                  {club.members.slice(0, 3).map((member) => (
                    <img
                      key={member.id}
                      src={member.avatar}
                      alt={member.name}
                      className="h-8 w-8 rounded-full border-2 border-card bg-secondary"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <MatchDialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen} />
    </div>
  );
}
