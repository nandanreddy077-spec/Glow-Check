export interface ProgressPhoto {
  id: string;
  uri: string;
  timestamp: number;
  analysisScore?: number;
  concerns: string[];
  notes?: string;
  weather?: string;
  mood?: 'great' | 'good' | 'okay' | 'bad';
  skinCondition?: {
    hydration: number;
    texture: number;
    brightness: number;
    acne: number;
  };
}

export interface ProgressComparison {
  before: ProgressPhoto;
  after: ProgressPhoto;
  daysBetween: number;
  improvements: {
    category: string;
    percentageChange: number;
    description: string;
  }[];
  overallTrend: 'improving' | 'stable' | 'declining';
}

export interface WeeklyInsight {
  id: string;
  week: number;
  startDate: Date;
  endDate: Date;
  summary: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
  progressScore: number;
  photosCount: number;
  routineCompletionRate: number;
}

export interface SkinJournalEntry {
  id: string;
  date: Date;
  mood: 'great' | 'good' | 'okay' | 'bad';
  skinCondition: 1 | 2 | 3 | 4 | 5;
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'cold' | 'hot' | 'humid';
  sleep?: number;
  water?: number;
  stress?: 1 | 2 | 3 | 4 | 5;
  diet?: 'healthy' | 'normal' | 'unhealthy';
  exercise?: boolean;
  notes?: string;
  photos?: string[];
  productsUsed?: string[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'daily';
  goal: string;
  reward: number;
  startDate: Date;
  endDate: Date;
  progress: number;
  target: number;
  completed: boolean;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SeasonalRecommendation {
  id: string;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  title: string;
  description: string;
  products: string[];
  tips: string[];
  concerns: string[];
  priority: 'high' | 'medium' | 'low';
}
