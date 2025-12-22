import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/BottomNav';
import { HomeTab } from '@/components/HomeTab';
import { ClubsTab } from '@/components/ClubsTab';
import { LeaderboardTab } from '@/components/LeaderboardTab';
import { FeedTab } from '@/components/FeedTab';
import { ProfileTab } from '@/components/ProfileTab';
import { DiscoverTab } from '@/components/DiscoverTab';
import { MessagesTab } from '@/components/MessagesTab';
import { NotificationsButton } from '@/components/NotificationsButton';
import sportpairLogo from '@/assets/sportpair-logo.png';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gradient-warm">
        <div className="text-center">
          <img 
            src={sportpairLogo} 
            alt="SportPair" 
            className="w-24 h-24 mx-auto mb-6 animate-bounce-soft rounded-3xl shadow-glow"
          />
          <p className="text-muted-foreground font-medium">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with notifications */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={sportpairLogo} alt="SportPair" className="w-8 h-8 rounded-lg" />
            <span className="font-bold text-lg">SportPair</span>
          </div>
          <NotificationsButton onNavigateToMessages={() => setActiveTab('messages')} />
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-4 pb-28">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
