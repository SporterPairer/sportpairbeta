import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MatchDialog } from '@/components/MatchDialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Play, Users, Trophy, Activity, ChevronRight } from 'lucide-react';
import sportpairLogo from '@/assets/sportpair-logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HomeTabProps {
  onNavigateToMessages?: () => void;
  onNavigateToGroups?: () => void;
}

interface Group {
  id: string;
  name: string;
  emoji: string;
  member_count?: number;
}

export function HomeTab({ onNavigateToMessages, onNavigateToGroups }: HomeTabProps) {
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const { profile } = useAuth();

  const displayName = profile?.name?.split(' ')[0] || 'Gebruiker';

  useEffect(() => {
    if (profile) {
      fetchGroups();
    }
  }, [profile]);

  const fetchGroups = async () => {
    if (!profile) return;
    
    try {
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('profile_id', profile.id);

      if (memberData && memberData.length > 0) {
        const groupIds = memberData.map(m => m.group_id);
        const { data: groupsData } = await supabase
          .from('groups')
          .select('id, name, emoji')
          .in('id', groupIds)
          .limit(3);

        if (groupsData) {
          const groupsWithCounts = await Promise.all(
            groupsData.map(async (group) => {
              const { count } = await supabase
                .from('group_members')
                .select('*', { count: 'exact', head: true })
                .eq('group_id', group.id);
              return { ...group, member_count: count || 0 };
            })
          );
          setGroups(groupsWithCounts);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

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
            <p className="text-2xl font-bold">{groups.length}</p>
            <p className="text-xs text-muted-foreground">Groepen</p>
          </CardContent>
        </Card>
      </div>

      {/* My Groups */}
      <div className="animate-slide-up stagger-3 opacity-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Mijn Groepen</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary text-sm"
            onClick={onNavigateToGroups}
          >
            Alle bekijken
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-card transition-all duration-200 border-0 shadow-soft">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-xl">
                    {group.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{group.name}</p>
                    <p className="text-sm text-muted-foreground">{group.member_count} leden</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Je hebt nog geen groepen
              </p>
              <Button variant="outline" size="sm" onClick={onNavigateToGroups}>
                Groep maken
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <MatchDialog 
        open={matchDialogOpen} 
        onOpenChange={setMatchDialogOpen} 
        onNavigateToMessages={onNavigateToMessages}
      />
    </div>
  );
}
