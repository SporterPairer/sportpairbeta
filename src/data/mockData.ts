import { User, Club, Activity, LeaderboardEntry } from '@/types';

export const mockUsers: User[] = [
  { id: '1', name: 'Thomas de Vries', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas', level: 'advanced', age: 28 },
  { id: '2', name: 'Lisa Jansen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa', level: 'intermediate', age: 25 },
  { id: '3', name: 'Mark Bakker', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark', level: 'advanced', age: 32 },
  { id: '4', name: 'Sophie Visser', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie', level: 'beginner', age: 24 },
  { id: '5', name: 'Daan Mulder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daan', level: 'intermediate', age: 29 },
  { id: '6', name: 'Emma de Jong', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', level: 'advanced', age: 27 },
  { id: '7', name: 'Bram Peters', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bram', level: 'beginner', age: 31 },
  { id: '8', name: 'Anna Willems', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna', level: 'intermediate', age: 26 },
];

export const mockClubs: Club[] = [
  {
    id: '1',
    name: 'Vriendengroep Amsterdam',
    emoji: '🏆',
    memberCount: 8,
    members: mockUsers.slice(0, 5),
  },
  {
    id: '2',
    name: 'FC Sportief',
    emoji: '⚽',
    memberCount: 15,
    members: mockUsers.slice(2, 8),
  },
  {
    id: '3',
    name: 'Tennis Club Noord',
    emoji: '🎾',
    memberCount: 12,
    members: mockUsers.slice(1, 6),
  },
  {
    id: '4',
    name: 'Running Crew',
    emoji: '🏃',
    memberCount: 20,
    members: mockUsers,
  },
];

export const mockActivities: Activity[] = [
  {
    id: '1',
    user: mockUsers[0],
    sport: 'tennis',
    date: new Date(Date.now() - 1000 * 60 * 30),
    duration: 60,
    won: true,
    opponent: mockUsers[1],
  },
  {
    id: '2',
    user: mockUsers[2],
    sport: 'running',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
    duration: 45,
  },
  {
    id: '3',
    user: mockUsers[1],
    sport: 'football',
    date: new Date(Date.now() - 1000 * 60 * 60 * 4),
    duration: 90,
    won: false,
    opponent: mockUsers[3],
  },
  {
    id: '4',
    user: mockUsers[4],
    sport: 'padel',
    date: new Date(Date.now() - 1000 * 60 * 60 * 6),
    duration: 60,
    won: true,
    opponent: mockUsers[5],
  },
  {
    id: '5',
    user: mockUsers[3],
    sport: 'cycling',
    date: new Date(Date.now() - 1000 * 60 * 60 * 8),
    duration: 120,
  },
  {
    id: '6',
    user: mockUsers[5],
    sport: 'swimming',
    date: new Date(Date.now() - 1000 * 60 * 60 * 12),
    duration: 30,
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { user: mockUsers[0], totalActivities: 28, totalWins: 18, rank: 1 },
  { user: mockUsers[2], totalActivities: 25, totalWins: 15, rank: 2 },
  { user: mockUsers[5], totalActivities: 22, totalWins: 12, rank: 3 },
  { user: mockUsers[1], totalActivities: 20, totalWins: 10, rank: 4 },
  { user: mockUsers[4], totalActivities: 18, totalWins: 8, rank: 5 },
  { user: mockUsers[3], totalActivities: 15, totalWins: 5, rank: 6 },
  { user: mockUsers[6], totalActivities: 12, totalWins: 4, rank: 7 },
  { user: mockUsers[7], totalActivities: 10, totalWins: 3, rank: 8 },
];

export const currentUser = mockUsers[0];
