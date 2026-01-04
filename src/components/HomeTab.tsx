import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MatchDialog } from '@/components/MatchDialog';
import { mockClubs } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Play, Users, Trophy, Activity, ChevronRight } from 'lucide-react';
import sportpairLogo from '@/assets/sportpair-logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';

export function HomeTab() {
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const { profile } = useAuth();

  const displayName = profile?.name?.split(' ')[0] || 'Gebruiker';

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="animate-slide-up flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">Goedemorgen,</p>
          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <img 
            src={sportpairLogo} 
            alt="SportPair" 
            className="w-11 h-11 rounded-xl shadow-card"
          />
        </div>
      </div>

      {/* Quick Match CTA */}
      <div className="animate-slide-up stagger-1 opacity-0">
        <Card className="overflow-hidden border-0 shadow-card gradient-primary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Start een match</h2>
                <p className="text-sm text-white/80">
                  Vind nu een sportmaatje
                </p>
              </div>
              <Button 
                onClick={() => setMatchDialogOpen(true)}
                size="lg"
                className="h-14 w-14 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur border-0 shadow-lg"
              >
                <Play className="h-6 w-6 text-white fill-white" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up stagger-2 opacity-0">
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">18</p>
            <p className="text-xs text-muted-foreground">Gewonnen</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">28</p>
            <p className="text-xs text-muted-foreground">Activiteiten</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card">
          <CardContent className="p-4 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{mockClubs.length}</p>
            <p className="text-xs text-muted-foreground">Clubs</p>
          </CardContent>
        </Card>
      </div>

      {/* My Clubs */}
      <div className="animate-slide-up stagger-3 opacity-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Mijn Clubs</h3>
          <Button variant="ghost" size="sm" className="text-primary text-sm">
            Alle bekijken
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="space-y-3">
          {mockClubs.slice(0, 3).map((club) => (
            <Card key={club.id} className="hover:shadow-card transition-all duration-200 border-0 shadow-soft">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-xl">
                  {club.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{club.name}</p>
                  <p className="text-sm text-muted-foreground">{club.memberCount} leden</p>
                </div>
                <div className="flex -space-x-2">
                  {club.members.slice(0, 3).map((member) => (
                    <img
                      key={member.id}
                      src={member.avatar}
                      alt={member.name}
                      className="h-8 w-8 rounded-full border-2 border-background bg-muted object-cover"
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
