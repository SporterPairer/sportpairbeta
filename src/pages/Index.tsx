import { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { HomeTab } from '@/components/HomeTab';
import { ClubsTab } from '@/components/ClubsTab';
import { LeaderboardTab } from '@/components/LeaderboardTab';
import { FeedTab } from '@/components/FeedTab';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-lg mx-auto px-4 pt-6">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'clubs' && <ClubsTab />}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
        {activeTab === 'feed' && <FeedTab />}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
