import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle, Ban, UserCheck, Trash2 } from 'lucide-react';

interface ViolationWithProfile {
  id: string;
  user_id: string;
  message_content: string;
  violation_reason: string;
  created_at: string;
  profile?: {
    name: string;
    avatar: string | null;
  };
}

interface BannedUserWithProfile {
  id: string;
  user_id: string;
  reason: string;
  banned_at: string;
  profile?: {
    name: string;
    avatar: string | null;
  };
}

export const Admin = () => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [violations, setViolations] = useState<ViolationWithProfile[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !authLoading) {
      if (!isAdmin) {
        navigate('/');
        return;
      }
      fetchData();
    }
  }, [isAdmin, adminLoading, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchViolations(), fetchBannedUsers()]);
    setLoading(false);
  };

  const fetchViolations = async () => {
    const { data: violationsData } = await supabase
      .from('user_violations')
      .select('*')
      .order('created_at', { ascending: false });

    if (violationsData) {
      // Fetch profiles for each violation
      const userIds = [...new Set(violationsData.map(v => v.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      setViolations(violationsData.map(v => ({
        ...v,
        profile: profileMap.get(v.user_id)
      })));
    }
  };

  const fetchBannedUsers = async () => {
    const { data: bannedData } = await supabase
      .from('banned_users')
      .select('*')
      .order('banned_at', { ascending: false });

    if (bannedData) {
      const userIds = [...new Set(bannedData.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      setBannedUsers(bannedData.map(b => ({
        ...b,
        profile: profileMap.get(b.user_id)
      })));
    }
  };

  const handleUnban = async (banId: string, userName: string) => {
    const { error } = await supabase
      .from('banned_users')
      .delete()
      .eq('id', banId);

    if (error) {
      toast.error('Kon gebruiker niet deblokkeren');
    } else {
      toast.success(`${userName} is gedeblokkeerd`);
      fetchBannedUsers();
    }
  };

  const handleDeleteViolation = async (violationId: string) => {
    const { error } = await supabase
      .from('user_violations')
      .delete()
      .eq('id', violationId);

    if (error) {
      toast.error('Kon waarschuwing niet verwijderen');
    } else {
      toast.success('Waarschuwing verwijderd');
      fetchViolations();
    }
  };

  const handleBanUser = async (userId: string, userName: string) => {
    const { error } = await supabase
      .from('banned_users')
      .insert({
        user_id: userId,
        reason: 'Handmatig geblokkeerd door admin'
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('Gebruiker is al geblokkeerd');
      } else {
        toast.error('Kon gebruiker niet blokkeren');
      }
    } else {
      toast.success(`${userName} is geblokkeerd`);
      fetchBannedUsers();
    }
  };

  if (adminLoading || authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{violations.length}</p>
                  <p className="text-sm text-muted-foreground">Waarschuwingen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Ban className="w-8 h-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{bannedUsers.length}</p>
                  <p className="text-sm text-muted-foreground">Geblokkeerd</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="violations">
          <TabsList className="w-full">
            <TabsTrigger value="violations" className="flex-1">
              Waarschuwingen ({violations.length})
            </TabsTrigger>
            <TabsTrigger value="banned" className="flex-1">
              Geblokkeerd ({bannedUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="violations" className="mt-4 space-y-3">
            {violations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Geen waarschuwingen gevonden
                </CardContent>
              </Card>
            ) : (
              violations.map((violation) => (
                <Card key={violation.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Avatar>
                          <AvatarImage src={violation.profile?.avatar || undefined} />
                          <AvatarFallback>
                            {violation.profile?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{violation.profile?.name || 'Onbekend'}</p>
                          <p className="text-sm text-destructive">{violation.violation_reason}</p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            "{violation.message_content}"
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(violation.created_at).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteViolation(violation.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleBanUser(violation.user_id, violation.profile?.name || 'Gebruiker')}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="banned" className="mt-4 space-y-3">
            {bannedUsers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Geen geblokkeerde gebruikers
                </CardContent>
              </Card>
            ) : (
              bannedUsers.map((banned) => (
                <Card key={banned.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={banned.profile?.avatar || undefined} />
                          <AvatarFallback>
                            {banned.profile?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{banned.profile?.name || 'Onbekend'}</p>
                          <p className="text-sm text-muted-foreground">{banned.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            Geblokkeerd op {new Date(banned.banned_at).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnban(banned.id, banned.profile?.name || 'Gebruiker')}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Deblokkeren
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
