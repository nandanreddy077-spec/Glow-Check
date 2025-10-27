export type RoutineType = 'morning' | 'evening';

export type RoutineStep = {
  id: string;
  title: string;
  description: string;
  duration?: number;
  completed: boolean;
  order: number;
};

export type DailyRoutine = {
  id: string;
  type: RoutineType;
  steps: RoutineStep[];
  completedAt?: string;
  date: string;
};

export type RoutineTemplate = {
  id: string;
  name: string;
  type: RoutineType;
  steps: Omit<RoutineStep, 'completed'>[];
  recommendedTime: string;
};

export type DailyTip = {
  id: string;
  title: string;
  content: string;
  category: 'skincare' | 'makeup' | 'wellness' | 'nutrition' | 'lifestyle';
  isPremium: boolean;
  date: string;
  icon?: string;
};

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
  totalCompletedDays: number;
};
