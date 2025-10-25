export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface SeasonalRecommendation {
  id: string;
  season: Season;
  category: 'routine' | 'product' | 'lifestyle' | 'alert';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: string;
}

export interface SeasonalAdjustment {
  season: Season;
  concerns: string[];
  routineChanges: {
    morning: string[];
    evening: string[];
  };
  productRecommendations: {
    add: string[];
    remove: string[];
    swap: { from: string; to: string; reason: string }[];
  };
  lifestyleAdvice: string[];
}

export interface ClimateData {
  humidity: number;
  temperature: number;
  uvIndex: number;
  season: Season;
  location?: string;
}

export interface SkinSeasonProfile {
  userId: string;
  currentSeason: Season;
  lastUpdate: Date;
  seasonalHistory: {
    season: Season;
    skinCondition: {
      hydration: number;
      oiliness: number;
      sensitivity: number;
      issues: string[];
    };
    effectiveProducts: string[];
    concerns: string[];
  }[];
}
