import { Home, Trophy, Users, User, Compass, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Ontdek', icon: Compass },
  { id: 'messages', label: 'Berichten', icon: MessageCircle },
  { id: 'leaderboard', label: 'Rang', icon: Trophy },
  { id: 'profile', label: 'Profiel', icon: User },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 glass-strong safe-area-pb">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition-all duration-300",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300",
                isActive && "gradient-primary shadow-glow scale-105"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive ? "text-primary-foreground" : ""
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-semibold transition-all duration-300",
                isActive && "text-gradient"
              )}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
