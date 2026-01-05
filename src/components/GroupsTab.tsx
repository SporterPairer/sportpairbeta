import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, ChevronRight, Copy, Calendar, Trophy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Group {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  invite_code: string;
  owner_id: string;
  max_members: number;
  member_count?: number;
}

interface GroupMember {
  id: string;
  profile_id: string;
  role: string;
  profiles?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export function GroupsTab() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupEmoji, setNewGroupEmoji] = useState('🏃');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

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
          .select('*')
          .in('id', groupIds);

        if (groupsData) {
          // Get member counts
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
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!profile || !newGroupName.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Create group
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName.trim(),
          emoji: newGroupEmoji,
          description: newGroupDescription.trim() || null,
          owner_id: profile.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as member with 'owner' role
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          profile_id: profile.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      toast({
        title: "Groep aangemaakt!",
        description: `${newGroupName} is succesvol aangemaakt.`,
      });

      setNewGroupName('');
      setNewGroupEmoji('🏃');
      setNewGroupDescription('');
      setDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Fout",
        description: "Kon groep niet aanmaken",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!profile || !joinCode.trim()) return;

    setIsSubmitting(true);
    try {
      // Find group by invite code
      const { data: group, error: findError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', joinCode.trim().toLowerCase())
        .maybeSingle();

      if (findError || !group) {
        toast({
          title: "Groep niet gevonden",
          description: "Controleer de uitnodigingscode",
          variant: "destructive",
        });
        return;
      }

      // Check if group is full
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      if ((count || 0) >= group.max_members) {
        toast({
          title: "Groep is vol",
          description: "Deze groep heeft het maximum aantal leden bereikt",
          variant: "destructive",
        });
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: "Al lid",
          description: "Je bent al lid van deze groep",
        });
        return;
      }

      // Join group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          profile_id: profile.id,
          role: 'member',
        });

      if (joinError) throw joinError;

      toast({
        title: "Groep toegetreden!",
        description: `Je bent nu lid van ${group.name}`,
      });

      setJoinCode('');
      setJoinDialogOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Fout",
        description: "Kon niet toetreden tot groep",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGroupDetails = async (group: Group) => {
    setSelectedGroup(group);
    
    // Fetch members
    const { data: members } = await supabase
      .from('group_members')
      .select(`
        id,
        profile_id,
        role,
        profiles:profile_id (
          id,
          name,
          avatar
        )
      `)
      .eq('group_id', group.id);

    if (members) {
      setGroupMembers(members as unknown as GroupMember[]);
    }
  };

  const copyInviteLink = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Gekopieerd!",
      description: "Uitnodigingscode gekopieerd naar klembord",
    });
  };

  const emojis = ['🏃', '⚽', '🎾', '🏀', '🚴', '🏊', '🏐', '💪', '🏆', '🎯'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold">Mijn Groepen</h1>
          <p className="text-muted-foreground">{groups.length} groepen</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="icon" className="rounded-full">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Groep Aanmaken</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Emoji</Label>
                <div className="flex flex-wrap gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewGroupEmoji(emoji)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        newGroupEmoji === emoji 
                          ? 'bg-primary/20 ring-2 ring-primary' 
                          : 'hover:bg-secondary'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Naam</Label>
                <Input
                  placeholder="Groepsnaam..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Beschrijving (optioneel)</Label>
                <Textarea
                  placeholder="Waar gaat deze groep over?"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </div>
              <Button 
                variant="gradient" 
                className="w-full"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Aanmaken
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      {groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group, index) => (
            <Card 
              key={group.id} 
              className="hover:shadow-lg transition-all cursor-pointer animate-slide-up"
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              onClick={() => openGroupDetails(group)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-3xl">
                    {group.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{group.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{group.member_count || 0}/{group.max_members} leden</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Nog geen groepen</h3>
              <p className="text-sm text-muted-foreground">
                Maak een groep aan of voeg een uitnodigingscode in
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join Group Card */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Groep Joinen</h3>
            <p className="text-sm text-muted-foreground">
              Voeg een uitnodigingscode in
            </p>
          </div>
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient" size="sm">
                Code invoeren
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Groep Joinen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Uitnodigingscode</Label>
                  <Input
                    placeholder="Voer code in..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                  />
                </div>
                <Button 
                  variant="gradient" 
                  className="w-full"
                  onClick={handleJoinGroup}
                  disabled={!joinCode.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Joinen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Group Details Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-3xl">{selectedGroup?.emoji}</span>
              {selectedGroup?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              {selectedGroup.description && (
                <p className="text-muted-foreground">{selectedGroup.description}</p>
              )}

              {/* Invite Code */}
              <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Uitnodigingscode</p>
                  <p className="font-mono font-bold">{selectedGroup.invite_code}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => copyInviteLink(selectedGroup.invite_code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Activiteit
                </Button>
                <Button variant="outline" className="w-full">
                  <Trophy className="h-4 w-4 mr-2" />
                  Resultaten
                </Button>
              </div>

              {/* Members */}
              <div>
                <h4 className="font-semibold mb-2">Leden ({groupMembers.length}/{selectedGroup.max_members})</h4>
                <div className="space-y-2">
                  {groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary">
                      <img
                        src={member.profiles?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.profile_id}`}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                      <span className="flex-1">{member.profiles?.name || 'Onbekend'}</span>
                      {member.role === 'owner' && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Eigenaar
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
