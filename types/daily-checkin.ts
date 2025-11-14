export interface DailyCheckIn {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  timestamp: number;
  ritualType: 'morning' | 'evening' | 'full';
  
  // Quick checklist items (completed yes/no)
  checklist: {
    skincare?: boolean;
    water?: boolean;
    sunscreen?: boolean; // morning
    makeup_removal?: boolean; // evening
    sleep?: boolean; // evening
    vitamins?: boolean; // morning
  };
  
  // Ratings (1-5 scale)
  ratings: {
    mood: number;
    energy: number;
    skin_feeling: number;
    confidence: number;
  };
  
  // Optional fields
  selfieUri?: string;
  notes?: string;
  
  // Automatically calculated
  completeness: number; // 0-100
  rewardPoints: number;
}

export interface DailyHabit {
  id: string;
  title: string;
  description: string;
  icon: string;
  ritualTime: 'morning' | 'evening' | 'both';
  streak: number;
  lastCompletedDate?: string;
  totalCompletions: number;
  createdAt: string;
  isActive: boolean;
}

export interface CheckInStreak {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckInDate: string;
  streakHistory: {
    date: string;
    ritualType: 'morning' | 'evening' | 'full';
  }[];
}

export interface DailyReward {
  id: string;
  date: string;
  type: 'streak' | 'consistency' | 'milestone' | 'perfect_week' | 'comeback';
  title: string;
  description: string;
  points: number;
  badge?: {
    icon: string;
    color: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
  claimed: boolean;
  claimedAt?: string;
}

export interface WeeklyProgress {
  weekStartDate: string;
  weekEndDate: string;
  checkInsCompleted: number;
  targetCheckIns: number; // 14 for full week (2 per day)
  averageMood: number;
  averageEnergy: number;
  averageSkinFeeling: number;
  averageConfidence: number;
  totalPoints: number;
  perfectDays: number; // Days with both morning and evening
  insights: string[];
}

export interface CheckInPrompt {
  id: string;
  question: string;
  ritualTime: 'morning' | 'evening' | 'both';
  type: 'rating' | 'checklist' | 'reflection';
  icon: string;
}

export const MORNING_PROMPTS: CheckInPrompt[] = [
  {
    id: 'mood_morning',
    question: 'How are you feeling this morning?',
    ritualTime: 'morning',
    type: 'rating',
    icon: '☀️',
  },
  {
    id: 'energy_morning',
    question: 'What\'s your energy level?',
    ritualTime: 'morning',
    type: 'rating',
    icon: '⚡',
  },
  {
    id: 'skin_morning',
    question: 'How does your skin feel today?',
    ritualTime: 'morning',
    type: 'rating',
    icon: '✨',
  },
  {
    id: 'skincare_morning',
    question: 'Morning skincare routine?',
    ritualTime: 'morning',
    type: 'checklist',
    icon: '🧴',
  },
  {
    id: 'sunscreen_morning',
    question: 'Applied SPF protection?',
    ritualTime: 'morning',
    type: 'checklist',
    icon: '☀️',
  },
];

export const EVENING_PROMPTS: CheckInPrompt[] = [
  {
    id: 'mood_evening',
    question: 'How was your day overall?',
    ritualTime: 'evening',
    type: 'rating',
    icon: '🌙',
  },
  {
    id: 'skin_evening',
    question: 'How does your skin feel tonight?',
    ritualTime: 'evening',
    type: 'rating',
    icon: '💫',
  },
  {
    id: 'confidence_evening',
    question: 'How confident did you feel today?',
    ritualTime: 'evening',
    type: 'rating',
    icon: '👑',
  },
  {
    id: 'makeup_removal',
    question: 'Removed makeup & cleansed?',
    ritualTime: 'evening',
    type: 'checklist',
    icon: '🧼',
  },
  {
    id: 'skincare_evening',
    question: 'Evening skincare routine?',
    ritualTime: 'evening',
    type: 'checklist',
    icon: '🌸',
  },
];

export interface DailyCheckInContextType {
  checkIns: DailyCheckIn[];
  streak: CheckInStreak;
  weeklyProgress: WeeklyProgress | null;
  unclaimedRewards: DailyReward[];
  habits: DailyHabit[];
  
  // Check-in operations
  getTodaysCheckIn: () => DailyCheckIn | null;
  hasMorningCheckIn: () => boolean;
  hasEveningCheckIn: () => boolean;
  createCheckIn: (checkIn: Omit<DailyCheckIn, 'id' | 'timestamp' | 'rewardPoints' | 'completeness'>) => Promise<DailyReward[]>;
  
  // Rewards & streaks
  calculateStreak: () => CheckInStreak;
  claimReward: (rewardId: string) => Promise<void>;
  
  // Weekly insights
  generateWeeklyProgress: () => Promise<WeeklyProgress | null>;
  
  // Habits
  addHabit: (habit: Omit<DailyHabit, 'id' | 'streak' | 'totalCompletions' | 'createdAt'>) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  getActiveHabits: (ritualTime: 'morning' | 'evening') => DailyHabit[];
  
  // Analytics
  getCheckInHistory: (days: number) => DailyCheckIn[];
  getMoodTrend: (days: number) => { dates: string[]; moods: number[]; energy: number[] };
  getSkinTrend: (days: number) => { dates: string[]; ratings: number[] };
}
