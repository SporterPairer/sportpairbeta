import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { mockClubs } from '@/data/mockData';
import { Plus, Users, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ClubsTab() {
  const [newClubName, setNewClubName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleCreateClub = () => {
    if (newClubName.trim()) {
      toast({
        title: "Club aangemaakt! 🎉",
        description: `${newClubName} is succesvol aangemaakt.`,
      });
      setNewClubName('');
      setDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold">Mijn Clubs</h1>
          <p className="text-muted-foreground">{mockClubs.length} clubs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="icon" className="rounded-full">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Club Aanmaken</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Club naam..."
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
              />
              <Button 
                variant="gradient" 
                className="w-full"
                onClick={handleCreateClub}
                disabled={!newClubName.trim()}
              >
                Aanmaken
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Clubs List */}
      <div className="space-y-3">
        {mockClubs.map((club, index) => (
          <Card 
            key={club.id} 
            className={`hover:shadow-lg transition-all cursor-pointer animate-slide-up opacity-0`}
            style={{ animationDelay: `${0.1 + index * 0.1}s` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-3xl">
                  {club.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{club.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{club.memberCount} leden</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
              
              {/* Member Avatars */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {club.members.slice(0, 5).map((member) => (
                    <img
                      key={member.id}
                      src={member.avatar}
                      alt={member.name}
                      className="h-8 w-8 rounded-full border-2 border-card bg-secondary"
                    />
                  ))}
                  {club.members.length > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs font-medium">
                      +{club.members.length - 5}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm">
                  Bekijk
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Join Club Card */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Club Joinen</h3>
            <p className="text-sm text-muted-foreground">
              Voeg een uitnodigingscode in
            </p>
          </div>
          <Input placeholder="Uitnodigingscode..." className="max-w-xs" />
          <Button variant="gradient" size="sm">
            Joinen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
