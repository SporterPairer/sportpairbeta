import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Building2, Users, ChevronRight, Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Association {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  join_code: string;
  owner_id: string;
  price_per_member: number;
  is_active: boolean;
  member_count?: number;
}

interface AssociationMember {
  id: string;
  profile_id: string;
  role: string;
  profiles?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export function AssociationsTab() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [myAssociations, setMyAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedAssociation, setSelectedAssociation] = useState<Association | null>(null);
  const [associationMembers, setAssociationMembers] = useState<AssociationMember[]>([]);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      fetchAssociations();
    }
  }, [profile]);

  const fetchAssociations = async () => {
    if (!profile) return;
    
    try {
      // Fetch associations user owns
      const { data: ownedData } = await supabase
        .from('sport_associations')
        .select('*')
        .eq('owner_id', profile.id);

      if (ownedData) {
        setMyAssociations(ownedData);
      }

      // Fetch associations user is member of
      const { data: memberData } = await supabase
        .from('association_members')
        .select('association_id')
        .eq('profile_id', profile.id);

      if (memberData && memberData.length > 0) {
        const assocIds = memberData.map(m => m.association_id);
        const { data: assocData } = await supabase
          .from('sport_associations')
          .select('*')
          .in('id', assocIds)
          .eq('is_active', true);

        if (assocData) {
          const assocsWithCounts = await Promise.all(
            assocData.map(async (assoc) => {
              const { count } = await supabase
                .from('association_members')
                .select('*', { count: 'exact', head: true })
                .eq('association_id', assoc.id);
              return { ...assoc, member_count: count || 0 };
            })
          );
          setAssociations(assocsWithCounts);
        }
      } else {
        setAssociations([]);
      }
    } catch (error) {
      console.error('Error fetching associations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssociation = async () => {
    if (!profile || !newName.trim()) return;
    
    setIsSubmitting(true);
    try {
      // Create association (inactive until payment)
      const { data: newAssoc, error: assocError } = await supabase
        .from('sport_associations')
        .insert({
          name: newName.trim(),
          description: newDescription.trim() || null,
          owner_id: profile.id,
          is_active: false, // Will be activated after Stripe payment
        })
        .select()
        .single();

      if (assocError) throw assocError;

      toast({
        title: "Vereniging aangemaakt",
        description: "Activeer je vereniging door een betaalmethode toe te voegen.",
      });

      setNewName('');
      setNewDescription('');
      setCreateDialogOpen(false);
      fetchAssociations();
    } catch (error) {
      console.error('Error creating association:', error);
      toast({
        title: "Fout",
        description: "Kon vereniging niet aanmaken",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinAssociation = async () => {
    if (!profile || !joinCode.trim()) return;

    setIsSubmitting(true);
    try {
      // Find association by join code
      const { data: assoc, error: findError } = await supabase
        .from('sport_associations')
        .select('*')
        .eq('join_code', joinCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (findError || !assoc) {
        toast({
          title: "Vereniging niet gevonden",
          description: "Controleer de code of de vereniging is nog niet actief",
          variant: "destructive",
        });
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('association_members')
        .select('id')
        .eq('association_id', assoc.id)
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: "Al lid",
          description: "Je bent al lid van deze vereniging",
        });
        return;
      }

      // Join association
      const { error: joinError } = await supabase
        .from('association_members')
        .insert({
          association_id: assoc.id,
          profile_id: profile.id,
          role: 'member',
        });

      if (joinError) throw joinError;

      toast({
        title: "Welkom!",
        description: `Je bent nu lid van ${assoc.name}`,
      });

      setJoinCode('');
      setJoinDialogOpen(false);
      fetchAssociations();
    } catch (error) {
      console.error('Error joining association:', error);
      toast({
        title: "Fout",
        description: "Kon niet toetreden tot vereniging",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssociationDetails = async (assoc: Association) => {
    setSelectedAssociation(assoc);
    
    const { data: members } = await supabase
      .from('association_members')
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
      .eq('association_id', assoc.id);

    if (members) {
      setAssociationMembers(members as unknown as AssociationMember[]);
    }
  };

  const activateAssociation = (assocId: string) => {
    // TODO: Integrate with Stripe when API key is available
    toast({
      title: "Stripe niet geconfigureerd",
      description: "Voeg een Stripe API key toe om betalingen te activeren.",
      variant: "destructive",
    });
  };

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
          <h1 className="text-2xl font-bold">Verenigingen</h1>
          <p className="text-muted-foreground">{associations.length} lidmaatschappen</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="icon" className="rounded-full">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vereniging Registreren</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span className="font-semibold">€0,75 per lid / maand</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Na registratie ontvang je een unieke code die leden kunnen gebruiken om toe te treden.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Naam vereniging</Label>
                <Input
                  placeholder="Naam van je vereniging..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Beschrijving (optioneel)</Label>
                <Textarea
                  placeholder="Beschrijf je vereniging..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <Button 
                variant="gradient" 
                className="w-full"
                onClick={handleCreateAssociation}
                disabled={!newName.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Registreren
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* My Owned Associations */}
      {myAssociations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Mijn Verenigingen</h2>
          {myAssociations.map((assoc) => (
            <Card 
              key={assoc.id} 
              className={`transition-all cursor-pointer ${!assoc.is_active ? 'opacity-60' : 'hover:shadow-lg'}`}
              onClick={() => openAssociationDetails(assoc)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{assoc.name}</h3>
                      {!assoc.is_active && (
                        <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                          Inactief
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Code: {assoc.join_code}</p>
                  </div>
                  {!assoc.is_active ? (
                    <Button 
                      variant="gradient" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        activateAssociation(assoc.id);
                      }}
                    >
                      Activeren
                    </Button>
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Member Associations */}
      {associations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Lidmaatschappen</h2>
          {associations.map((assoc, index) => (
            <Card 
              key={assoc.id} 
              className="hover:shadow-lg transition-all cursor-pointer animate-slide-up"
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
              onClick={() => openAssociationDetails(assoc)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold">{assoc.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{assoc.member_count || 0} leden</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {associations.length === 0 && myAssociations.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Nog geen verenigingen</h3>
              <p className="text-sm text-muted-foreground">
                Registreer een nieuwe vereniging of voeg een code in om toe te treden
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Join Association Card */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Lid Worden</h3>
            <p className="text-sm text-muted-foreground">
              Voeg de code van je vereniging in
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
                <DialogTitle>Lid Worden</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Verenigingscode</Label>
                  <Input
                    placeholder="Voer code in (bijv. ABC123)..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                </div>
                <Button 
                  variant="gradient" 
                  className="w-full"
                  onClick={handleJoinAssociation}
                  disabled={!joinCode.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Toetreden
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Association Details Dialog */}
      <Dialog open={!!selectedAssociation} onOpenChange={(open) => !open && setSelectedAssociation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              {selectedAssociation?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedAssociation && (
            <div className="space-y-4">
              {selectedAssociation.description && (
                <p className="text-muted-foreground">{selectedAssociation.description}</p>
              )}

              {/* Members */}
              <div>
                <h4 className="font-semibold mb-2">Leden ({associationMembers.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {associationMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary">
                      <img
                        src={member.profiles?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.profile_id}`}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                      <span className="flex-1">{member.profiles?.name || 'Onbekend'}</span>
                      {member.role === 'admin' && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Beheerder
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
