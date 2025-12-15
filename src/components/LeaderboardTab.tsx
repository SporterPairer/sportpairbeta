import { Card, CardContent } from '@/components/ui/card';
import { mockLeaderboard, currentUser } from '@/data/mockData';
import { Trophy, Medal, Activity, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LeaderboardTab() {
  const topThree = mockLeaderboard.slice(0, 3);
  const restOfLeaderboard = mockLeaderboard.slice(3);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold">Ranglijst</h1>
        <p className="text-muted-foreground">Wie sport er het meest?</p>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-2 py-4 animate-slide-up stagger-1 opacity-0">
        {/* Second Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <img
              src={topThree[1]?.user.avatar}
              alt={topThree[1]?.user.name}
              className="h-16 w-16 rounded-full border-4 border-muted bg-secondary"
            />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm font-bold">
              2
            </div>
          </div>
          <p className="text-sm font-medium text-center max-w-[80px] truncate">
            {topThree[1]?.user.name.split(' ')[0]}
          </p>
          <div className="mt-1 flex h-20 w-20 items-end justify-center rounded-t-xl bg-muted">
            <Medal className="mb-2 h-6 w-6 text-muted-foreground" />
          </div>
        </div>

        {/* First Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <div className="absolute -inset-2 rounded-full gradient-primary opacity-30 blur-md animate-pulse" />
            <img
              src={topThree[0]?.user.avatar}
              alt={topThree[0]?.user.name}
              className="relative h-20 w-20 rounded-full border-4 border-primary bg-secondary shadow-glow"
            />
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full gradient-accent text-sm font-bold text-accent-foreground">
              1
            </div>
          </div>
          <p className="text-sm font-bold text-center max-w-[90px] truncate">
            {topThree[0]?.user.name.split(' ')[0]}
          </p>
          <div className="mt-1 flex h-28 w-24 items-end justify-center rounded-t-xl gradient-primary">
            <Trophy className="mb-3 h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        {/* Third Place */}
        <div className="flex flex-col items-center">
          <div className="relative mb-2">
            <img
              src={topThree[2]?.user.avatar}
              alt={topThree[2]?.user.name}
              className="h-14 w-14 rounded-full border-4 border-accent/50 bg-secondary"
            />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-sm font-bold">
              3
            </div>
          </div>
          <p className="text-sm font-medium text-center max-w-[70px] truncate">
            {topThree[2]?.user.name.split(' ')[0]}
          </p>
          <div className="mt-1 flex h-14 w-16 items-end justify-center rounded-t-xl bg-accent/20">
            <Medal className="mb-2 h-5 w-5 text-accent" />
          </div>
        </div>
      </div>

      {/* Stats Legend */}
      <div className="flex justify-center gap-6 text-sm text-muted-foreground animate-slide-up stagger-2 opacity-0">
        <div className="flex items-center gap-1">
          <Activity className="h-4 w-4" />
          <span>Activiteiten</span>
        </div>
        <div className="flex items-center gap-1">
          <Flame className="h-4 w-4 text-accent" />
          <span>Gewonnen</span>
        </div>
      </div>

      {/* Rest of Leaderboard */}
      <div className="space-y-2 animate-slide-up stagger-3 opacity-0">
        {restOfLeaderboard.map((entry) => {
          const isCurrentUser = entry.user.id === currentUser.id;
          
          return (
            <Card 
              key={entry.user.id}
              className={cn(
                "transition-all",
                isCurrentUser && "ring-2 ring-primary shadow-glow"
              )}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-bold">
                  {entry.rank}
                </div>
                <img
                  src={entry.user.avatar}
                  alt={entry.user.name}
                  className="h-12 w-12 rounded-full bg-secondary"
                />
                <div className="flex-1">
                  <p className="font-semibold">
                    {entry.user.name}
                    {isCurrentUser && <span className="ml-2 text-primary">(Jij)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.user.level === 'advanced' ? 'Gevorderd' : 
                     entry.user.level === 'intermediate' ? 'Gemiddeld' : 'Beginner'}
                  </p>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="font-bold">{entry.totalActivities}</p>
                    <p className="text-xs text-muted-foreground">act.</p>
                  </div>
                  <div>
                    <p className="font-bold text-accent">{entry.totalWins}</p>
                    <p className="text-xs text-muted-foreground">wins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
