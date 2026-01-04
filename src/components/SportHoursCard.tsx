import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Timer, Plus, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SportHoursCardProps {
  profileId: string;
  currentHours: number;
  onUpdate: (newHours: number) => void;
}

export function SportHoursCard({ profileId, currentHours, onUpdate }: SportHoursCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [hoursToAdd, setHoursToAdd] = useState('');

  const handleAddHours = async () => {
    const hours = parseFloat(hoursToAdd);
    if (isNaN(hours) || hours <= 0) {
      toast.error('Voer een geldig aantal uren in');
      return;
    }

    const newTotal = currentHours + hours;

    const { error } = await supabase
      .from('profiles')
      .update({ sport_hours: newTotal })
      .eq('id', profileId);

    if (error) {
      toast.error('Kon uren niet opslaan');
      return;
    }

    toast.success(`${hours} uur toegevoegd!`);
    onUpdate(newTotal);
    setHoursToAdd('');
    setIsAdding(false);
  };

  return (
    <Card className="shadow-card overflow-hidden">
      <div className="gradient-primary p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Totaal gesport</p>
              <p className="text-3xl font-bold text-white">{currentHours.toFixed(1)} <span className="text-lg font-normal">uur</span></p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-white/80">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Keep going!</span>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        {isAdding ? (
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.5"
              min="0"
              placeholder="Aantal uren..."
              value={hoursToAdd}
              onChange={(e) => setHoursToAdd(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddHours} size="sm">Toevoegen</Button>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Annuleer</Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Uren toevoegen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
