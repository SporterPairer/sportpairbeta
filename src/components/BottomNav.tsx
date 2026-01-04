import { Home, Trophy, Users, User, Compass, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Ontdek', icon: Compass },
  { id: 'clubs', label: 'Clubs', icon: Users },
  { id: 'messages', label: 'Berichten', icon: MessageCircle },
  { id: 'leaderboard', label: 'Rang', icon: Trophy },
  { id: 'profile', label: 'Profiel', icon: User },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-1.5 transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  isActive && "text-primary"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "text-primary"
              )}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
