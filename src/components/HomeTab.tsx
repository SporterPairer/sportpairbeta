import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MatchDialog } from '@/components/MatchDialog';
import { mockClubs } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { Zap, Users, Trophy, TrendingUp } from 'lucide-react';
import sportpairLogo from '@/assets/sportpair-logo.png';

export function HomeTab() {
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const { profile } = useAuth();

  const displayName = profile?.name?.split(' ')[0] || 'Gebruiker';

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="animate-slide-up flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">Welkom terug,</p>
          <h1 className="text-2xl font-bold">{displayName} 👋</h1>
        </div>
        <img 
          src={sportpairLogo} 
          alt="SportPair" 
          className="w-12 h-12 rounded-xl shadow-soft"
        />
      </div>

      {/* Quick Match Button */}
      <div className="animate-slide-up stagger-1 opacity-0">
        <Card className="overflow-hidden border-0 shadow-card">
          <div className="gradient-primary p-[1px] rounded-2xl">
            <CardContent className="flex flex-col items-center gap-5 rounded-2xl bg-card p-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full gradient-accent shadow-accent animate-pulse-glow">
                <Zap className="h-10 w-10 text-accent-foreground" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold">Klaar om te matchen?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vind een sportmaatje uit je clubs
                </p>
              </div>
              <Button 
                onClick={() => setMatchDialogOpen(true)}
                className="w-full h-14 rounded-xl gradient-primary shadow-accent font-bold text-base hover:scale-[1.02] transition-transform"
              >
                Match Nu! 🎯
              </Button>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up stagger-2 opacity-0">
        <Card className="text-center border-0 shadow-soft overflow-hidden">
          <CardContent className="p-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="flex justify-center mb-2 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold relative">18</p>
            <p className="text-[10px] text-muted-foreground font-medium relative">Gewonnen</p>
          </CardContent>
        </Card>
        <Card className="text-center border-0 shadow-soft overflow-hidden">
          <CardContent className="p-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
            <div className="flex justify-center mb-2 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold relative">28</p>
            <p className="text-[10px] text-muted-foreground font-medium relative">Activiteiten</p>
          </CardContent>
        </Card>
        <Card className="text-center border-0 shadow-soft overflow-hidden">
          <CardContent className="p-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary to-transparent pointer-events-none" />
            <div className="flex justify-center mb-2 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold relative">{mockClubs.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium relative">Clubs</p>
          </CardContent>
        </Card>
      </div>

      {/* My Clubs Preview */}
      <div className="animate-slide-up stagger-3 opacity-0">
        <h3 className="mb-3 font-semibold text-sm text-muted-foreground uppercase tracking-wider">Mijn Clubs</h3>
        <div className="space-y-3">
          {mockClubs.slice(0, 3).map((club) => (
            <Card key={club.id} className="hover:shadow-card hover:scale-[1.01] transition-all duration-300 border-0 shadow-soft overflow-hidden">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-muted text-2xl shadow-soft">
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
                      className="h-9 w-9 rounded-full border-2 border-card bg-secondary object-cover"
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
