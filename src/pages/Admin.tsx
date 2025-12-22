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
import { 
  ArrowLeft, AlertTriangle, Ban, UserCheck, Trash2, 
  MessageSquare, Shield, CheckCircle, XCircle, Eye,
  Search, Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import sportpairLogo from '@/assets/sportpair-logo.png';

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

interface ModerationLog {
  id: string;
  message_id: string | null;
  sender_id: string;
  message_content: string;
  is_approved: boolean;
  ai_reasoning: string | null;
  violation_type: string | null;
  created_at: string;
  profile?: {
    name: string;
    avatar: string | null;
  };
}

interface MessageWithProfile {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender_profile?: {
    name: string;
    avatar: string | null;
  };
  receiver_profile?: {
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
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);
  const [allMessages, setAllMessages] = useState<MessageWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'approved' | 'rejected'>('all');

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
    await Promise.all([
      fetchViolations(), 
      fetchBannedUsers(), 
      fetchModerationLogs(),
      fetchAllMessages()
    ]);
    setLoading(false);
  };

  const fetchViolations = async () => {
    const { data: violationsData } = await supabase
      .from('user_violations')
      .select('*')
      .order('created_at', { ascending: false });

    if (violationsData) {
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

  const fetchModerationLogs = async () => {
    const { data: logsData } = await supabase
      .from('moderation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (logsData) {
      const userIds = [...new Set(logsData.map(l => l.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      setModerationLogs(logsData.map(l => ({
        ...l,
        profile: profileMap.get(l.sender_id)
      })));
    }
  };

  const fetchAllMessages = async () => {
    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (messagesData) {
      const allUserIds = [...new Set([
        ...messagesData.map(m => m.sender_id),
        ...messagesData.map(m => m.receiver_id)
      ])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, name, avatar');

      const profileMapById = new Map(profiles?.map(p => [p.id, p]) || []);
      
      setAllMessages(messagesData.map(m => ({
        ...m,
        sender_profile: profileMapById.get(m.sender_id),
        receiver_profile: profileMapById.get(m.receiver_id)
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

  const getViolationTypeBadge = (type: string | null) => {
    if (!type) return null;
    const colors: Record<string, string> = {
      'HATE_SPEECH': 'bg-red-500/20 text-red-500',
      'SEXUAL_CONTENT': 'bg-pink-500/20 text-pink-500',
      'THREATS': 'bg-orange-500/20 text-orange-500',
      'SPAM': 'bg-yellow-500/20 text-yellow-500',
      'PERSONAL_INFO': 'bg-blue-500/20 text-blue-500',
      'BULLYING': 'bg-purple-500/20 text-purple-500',
      'OFF_TOPIC': 'bg-gray-500/20 text-gray-500',
      'AUTO_BAN': 'bg-red-600/20 text-red-600',
      'BANNED_USER': 'bg-red-700/20 text-red-700',
    };
    return (
      <Badge className={`${colors[type] || 'bg-muted text-muted-foreground'} text-xs`}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredLogs = moderationLogs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.message_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ai_reasoning?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'approved' && log.is_approved) ||
      (filterType === 'rejected' && !log.is_approved);
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    totalMessages: allMessages.length,
    totalModerated: moderationLogs.length,
    approved: moderationLogs.filter(l => l.is_approved).length,
    rejected: moderationLogs.filter(l => !l.is_approved).length,
    violations: violations.length,
    banned: bannedUsers.length,
  };

  if (adminLoading || authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <img src={sportpairLogo} alt="SportPair" className="w-16 h-16 mx-auto mb-4 rounded-xl animate-bounce-soft" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Moderatie Control Center</h1>
              <p className="text-sm text-muted-foreground">Transparant overzicht van alle AI beslissingen</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xl font-bold">{stats.totalMessages}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Berichten</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold">{stats.totalModerated}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Gemodereerd</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xl font-bold">{stats.approved}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Goedgekeurd</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-xl font-bold">{stats.rejected}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Afgewezen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-xl font-bold">{stats.violations}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Waarschuwingen</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-xl font-bold">{stats.banned}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Geblokkeerd</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="moderation" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4 h-12">
            <TabsTrigger value="moderation" className="text-xs md:text-sm">
              <Eye className="w-4 h-4 mr-1 hidden md:block" />
              AI Beslissingen
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs md:text-sm">
              <MessageSquare className="w-4 h-4 mr-1 hidden md:block" />
              Alle Berichten
            </TabsTrigger>
            <TabsTrigger value="violations" className="text-xs md:text-sm">
              <AlertTriangle className="w-4 h-4 mr-1 hidden md:block" />
              Waarschuwingen
            </TabsTrigger>
            <TabsTrigger value="banned" className="text-xs md:text-sm">
              <Ban className="w-4 h-4 mr-1 hidden md:block" />
              Geblokkeerd
            </TabsTrigger>
          </TabsList>

          {/* AI Moderation Logs */}
          <TabsContent value="moderation" className="space-y-4">
            <Card className="border-0 shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  AI Moderatie Logboek
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Bekijk elke beslissing die de AI heeft genomen en waarom
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Zoek in berichten of redenen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 rounded-xl"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={filterType === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterType('all')}
                      className="rounded-xl"
                    >
                      Alle
                    </Button>
                    <Button
                      size="sm"
                      variant={filterType === 'approved' ? 'default' : 'outline'}
                      onClick={() => setFilterType('approved')}
                      className="rounded-xl"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={filterType === 'rejected' ? 'default' : 'outline'}
                      onClick={() => setFilterType('rejected')}
                      className="rounded-xl"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {filteredLogs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Geen moderatie logs gevonden
                      </div>
                    ) : (
                      filteredLogs.map((log) => (
                        <Card 
                          key={log.id} 
                          className={`border-l-4 ${log.is_approved ? 'border-l-green-500' : 'border-l-red-500'} shadow-soft`}
                        >
                          <CardContent className="pt-4 pb-3">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={log.profile?.avatar || undefined} />
                                <AvatarFallback className="text-xs">
                                  {log.profile?.name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm">
                                    {log.profile?.name || 'Onbekend'}
                                  </span>
                                  <Badge variant={log.is_approved ? "secondary" : "destructive"} className="text-xs">
                                    {log.is_approved ? 'Goedgekeurd' : 'Afgewezen'}
                                  </Badge>
                                  {getViolationTypeBadge(log.violation_type)}
                                </div>
                                
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <p className="text-sm font-medium mb-1">Bericht:</p>
                                  <p className="text-sm text-muted-foreground break-words">
                                    "{log.message_content}"
                                  </p>
                                </div>
                                
                                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                                  <p className="text-sm font-medium mb-1 flex items-center gap-1">
                                    <Shield className="w-3 h-3 text-primary" />
                                    AI Redenering:
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {log.ai_reasoning || 'Geen redenering beschikbaar'}
                                  </p>
                                </div>
                                
                                <p className="text-xs text-muted-foreground">
                                  {new Date(log.created_at).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              
                              {!log.is_approved && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleBanUser(log.sender_id, log.profile?.name || 'Gebruiker')}
                                  className="shrink-0"
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Messages */}
          <TabsContent value="messages" className="space-y-4">
            <Card className="border-0 shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Alle Berichten
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Overzicht van alle berichten in de app
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2 pr-4">
                    {allMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Geen berichten gevonden
                      </div>
                    ) : (
                      allMessages.map((message) => (
                        <Card key={message.id} className="shadow-soft">
                          <CardContent className="py-3 px-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={message.sender_profile?.avatar || undefined} />
                                <AvatarFallback className="text-xs">
                                  {message.sender_profile?.name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {message.sender_profile?.name || 'Onbekend'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">→</span>
                                  <span className="text-sm text-muted-foreground">
                                    {message.receiver_profile?.name || 'Onbekend'}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{message.content}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(message.created_at).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Violations */}
          <TabsContent value="violations" className="space-y-3">
            {violations.length === 0 ? (
              <Card className="border-0 shadow-soft">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Geen waarschuwingen gevonden
                </CardContent>
              </Card>
            ) : (
              violations.map((violation) => (
                <Card key={violation.id} className="border-0 shadow-soft">
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
                          className="rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleBanUser(violation.user_id, violation.profile?.name || 'Gebruiker')}
                          className="rounded-xl"
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

          {/* Banned Users */}
          <TabsContent value="banned" className="space-y-3">
            {bannedUsers.length === 0 ? (
              <Card className="border-0 shadow-soft">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Geen geblokkeerde gebruikers
                </CardContent>
              </Card>
            ) : (
              bannedUsers.map((banned) => (
                <Card key={banned.id} className="border-0 shadow-soft">
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
                        className="rounded-xl"
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
