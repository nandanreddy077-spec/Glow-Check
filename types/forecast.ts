export type TimeframeType = "1week" | "2weeks" | "1month" | "3months";

export type GlowMetric = {
  name: string;
  currentScore: number;
  predictedScore: number;
  improvement: number;
  confidence: number;
  color: string;
  icon: string;
};

export type MilestoneType = {
  id: string;
  title: string;
  description: string;
  date: Date;
  achieved: boolean;
  metric: string;
  targetScore: number;
};

export type PredictionInsight = {
  id: string;
  category: string;
  insight: string;
  impact: "high" | "medium" | "low";
  actionable: boolean;
};

export type GlowForecast = {
  id: string;
  userId: string;
  generatedAt: Date;
  timeframe: TimeframeType;
  
  overallGlowScore: {
    current: number;
    predicted: number;
    change: number;
  };
  
  metrics: GlowMetric[];
  milestones: MilestoneType[];
  insights: PredictionInsight[];
  
  confidence: number;
  basedOnPhotos: number;
  basedOnDays: number;
};

export type ForecastHistory = {
  date: Date;
  overallScore: number;
  skinScore: number;
  makeupScore: number;
  hairScore: number;
};
