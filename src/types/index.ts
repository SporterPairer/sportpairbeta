export interface User {
  id: string;
  name: string;
  avatar: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  age: number;
}

export interface Club {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  members: User[];
}

export interface Activity {
  id: string;
  user: User;
  sport: Sport;
  date: Date;
  duration: number; // in minutes
  won?: boolean;
  opponent?: User;
}

export interface Match {
  id: string;
  user1: User;
  user2: User;
  sport: Sport;
  date: Date;
  status: 'pending' | 'accepted' | 'completed';
  winner?: User;
}

export interface LeaderboardEntry {
  user: User;
  totalActivities: number;
  totalWins: number;
  rank: number;
}

export type Sport = 'football' | 'tennis' | 'basketball' | 'running' | 'cycling' | 'swimming' | 'padel' | 'volleyball';

export type Level = 'beginner' | 'intermediate' | 'advanced';

export type AgeGroup = '18-25' | '26-35' | '36-45' | '46+';

export const SPORTS: { value: Sport; label: string; emoji: string }[] = [
  { value: 'football', label: 'Voetbal', emoji: '⚽' },
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'basketball', label: 'Basketbal', emoji: '🏀' },
  { value: 'running', label: 'Hardlopen', emoji: '🏃' },
  { value: 'cycling', label: 'Fietsen', emoji: '🚴' },
  { value: 'swimming', label: 'Zwemmen', emoji: '🏊' },
  { value: 'padel', label: 'Padel', emoji: '🎾' },
  { value: 'volleyball', label: 'Volleybal', emoji: '🏐' },
];

export const LEVELS: { value: Level; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Gemiddeld' },
  { value: 'advanced', label: 'Gevorderd' },
];

export const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: '18-25', label: '18-25 jaar' },
  { value: '26-35', label: '26-35 jaar' },
  { value: '36-45', label: '36-45 jaar' },
  { value: '46+', label: '46+ jaar' },
];
