import { Card, CardContent } from '@/components/ui/card';
import { mockActivities } from '@/data/mockData';
import { SPORTS } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Trophy, Clock, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FeedTab() {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold">Activiteiten Feed</h1>
        <p className="text-muted-foreground">Wat heeft iedereen gedaan?</p>
      </div>

      {/* Activity Feed */}
      <div className="space-y-4">
        {mockActivities.map((activity, index) => {
          const sport = SPORTS.find(s => s.value === activity.sport);
          const isMatch = activity.opponent !== undefined;
          
          return (
            <Card 
              key={activity.id}
              className={cn(
                "animate-slide-up opacity-0 overflow-hidden",
                activity.won && "border-l-4 border-l-primary"
              )}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={activity.user.avatar}
                      alt={activity.user.name}
                      className="h-12 w-12 rounded-full bg-secondary"
                    />
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-card border-2 border-border text-sm">
                      {sport?.emoji}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{activity.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(activity.date, { addSuffix: true, locale: nl })}
                        </p>
                      </div>
                      {activity.won !== undefined && (
                        <div className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                          activity.won 
                            ? "bg-primary/10 text-primary" 
                            : "bg-destructive/10 text-destructive"
                        )}>
                          <Trophy className="h-3 w-3" />
                          {activity.won ? 'Gewonnen' : 'Verloren'}
                        </div>
                      )}
                    </div>

                    {/* Activity Details */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
                        <span className="text-lg">{sport?.emoji}</span>
                        <span className="text-sm font-medium">{sport?.label}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{activity.duration} min</span>
                      </div>

                      {isMatch && activity.opponent && (
                        <div className="flex items-center gap-2">
                          <Swords className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">vs</span>
                            <img
                              src={activity.opponent.avatar}
                              alt={activity.opponent.name}
                              className="h-6 w-6 rounded-full bg-secondary"
                            />
                            <span className="text-sm font-medium">{activity.opponent.name.split(' ')[0]}</span>
                          </div>
                        </div>
                      )}
                    </div>
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
