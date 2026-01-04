import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Target, Plus, Trash2, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SPORTS } from '@/types';
import { cn } from '@/lib/utils';

interface SportGoal {
  id: string;
  sport: string;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
}

interface SportGoalsCardProps {
  profileId: string;
}

export function SportGoalsCard({ profileId }: SportGoalsCardProps) {
  const [goals, setGoals] = useState<SportGoal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSport, setNewSport] = useState('');

  useEffect(() => {
    fetchGoals();
  }, [profileId]);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('sport_goals')
      .select('*')
      .eq('user_id', profileId)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false });

    if (data) {
      setGoals(data);
    }
  };

  const handleAddGoal = async () => {
    if (!newSport.trim()) {
      toast.error('Voer een sport in');
      return;
    }

    const { error } = await supabase
      .from('sport_goals')
      .insert({
        user_id: profileId,
        sport: newSport.trim()
      });

    if (error) {
      toast.error('Kon doel niet toevoegen');
      return;
    }

    toast.success('Nieuw sportdoel toegevoegd!');
    setNewSport('');
    setIsAdding(false);
    fetchGoals();
  };

  const handleToggleComplete = async (goal: SportGoal) => {
    const { error } = await supabase
      .from('sport_goals')
      .update({ 
        completed: !goal.completed,
        completed_at: !goal.completed ? new Date().toISOString() : null
      })
      .eq('id', goal.id);

    if (error) {
      toast.error('Kon status niet updaten');
      return;
    }

    if (!goal.completed) {
      toast.success('🎉 Gefeliciteerd! Doel behaald!');
    }
    fetchGoals();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('sport_goals')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Kon doel niet verwijderen');
      return;
    }

    fetchGoals();
  };

  const completedCount = goals.filter(g => g.completed).length;
  const sportInfo = (sport: string) => SPORTS.find(s => s.value === sport || s.label.toLowerCase() === sport.toLowerCase());

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Sport Bucketlist
          </CardTitle>
          {goals.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4 text-amber-500" />
              {completedCount}/{goals.length}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Voeg sporten toe die je nog wilt proberen!
          </p>
        )}

        {goals.map((goal) => (
          <div 
            key={goal.id} 
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all",
              goal.completed 
                ? "bg-primary/10 border border-primary/20" 
                : "bg-secondary/50 hover:bg-secondary"
            )}
          >
            <Checkbox
              checked={goal.completed}
              onCheckedChange={() => handleToggleComplete(goal)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-xl">{sportInfo(goal.sport)?.emoji || '🏃'}</span>
            <span className={cn(
              "flex-1 font-medium",
              goal.completed && "line-through text-muted-foreground"
            )}>
              {goal.sport}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(goal.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {isAdding ? (
          <div className="flex gap-2">
            <Input
              placeholder="Bijv. Padel, Golf, Klimmen..."
              value={newSport}
              onChange={(e) => setNewSport(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              className="flex-1"
            />
            <Button onClick={handleAddGoal} size="sm">Toevoegen</Button>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>×</Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Sport toevoegen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
