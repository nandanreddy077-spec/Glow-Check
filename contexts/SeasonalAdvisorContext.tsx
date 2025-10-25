import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import {
  Season,
  SeasonalRecommendation,
  SeasonalAdjustment,
  SkinSeasonProfile,
} from '@/types/seasonal';
import { useAuth } from './AuthContext';

const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  }
};

interface SeasonalAdvisorContextType {
  currentSeason: Season;
  seasonalProfile: SkinSeasonProfile | null;
  recommendations: SeasonalRecommendation[];
  seasonalAdjustment: SeasonalAdjustment | null;
  isTransitionPeriod: boolean;
  transitionMessage: string | null;
  generateSeasonalRecommendations: () => Promise<void>;
  updateSeasonalProfile: (skinCondition: {
    hydration: number;
    oiliness: number;
    sensitivity: number;
    issues: string[];
  }) => Promise<void>;
  dismissRecommendation: (id: string) => Promise<void>;
  getSeasonalTip: () => string;
}

const STORAGE_KEYS = {
  SEASONAL_PROFILE: 'glowcheck_seasonal_profile',
  RECOMMENDATIONS: 'glowcheck_seasonal_recommendations',
};

const getCurrentSeason = (): Season => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
};

const SEASONAL_TIPS: Record<Season, string[]> = {
  spring: [
    'Spring allergies can affect your skin. Keep antihistamines handy!',
    'Lighter moisturizers work better as humidity increases',
    'Start ramping up SPF as UV index rises',
    'Watch for sudden breakouts from seasonal changes',
  ],
  summer: [
    'Double cleanse in the evening to remove sunscreen and sweat',
    'Keep a facial mist in your bag for midday refresh',
    'Night is the best time for heavy treatments',
    'Your skin needs MORE hydration when using AC',
  ],
  fall: [
    'Time to switch to richer moisturizers',
    'Add a gentle exfoliant to remove summer damage',
    'Perfect season to try retinol if you haven\'t',
    'Don\'t forget SPF - UV rays are still strong!',
  ],
  winter: [
    'Layer your skincare: essence → serum → moisturizer → oil',
    'Use a humidifier while sleeping',
    'Switch to cream-based cleansers',
    'Lips and hands need as much care as your face',
  ],
};

const SEASONAL_CONCERNS: Record<Season, string[]> = {
  spring: ['Allergic reactions', 'Increased breakouts', 'Uneven texture'],
  summer: ['Excess oil', 'Sun damage', 'Clogged pores', 'Melasma'],
  fall: ['Dryness', 'Dullness', 'Fine lines becoming visible'],
  winter: ['Severe dryness', 'Flakiness', 'Redness', 'Sensitivity'],
};

export const [SeasonalAdvisorProvider, useSeasonalAdvisor] = createContextHook<SeasonalAdvisorContextType>(() => {
  const { user } = useAuth();
  const [seasonalProfile, setSeasonalProfile] = useState<SkinSeasonProfile | null>(null);
  const [recommendations, setRecommendations] = useState<SeasonalRecommendation[]>([]);
  const currentSeason = getCurrentSeason();

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    try {
      const [profileData, recsData] = await Promise.all([
        storage.getItem(STORAGE_KEYS.SEASONAL_PROFILE),
        storage.getItem(STORAGE_KEYS.RECOMMENDATIONS),
      ]);

      if (profileData) {
        const profile = JSON.parse(profileData);
        setSeasonalProfile({
          ...profile,
          lastUpdate: new Date(profile.lastUpdate),
        });
        
        if (profile.currentSeason !== currentSeason) {
          await generateSeasonalRecommendations();
        }
      } else if (user?.id) {
        const newProfile: SkinSeasonProfile = {
          userId: user.id,
          currentSeason,
          lastUpdate: new Date(),
          seasonalHistory: [],
        };
        setSeasonalProfile(newProfile);
        await storage.setItem(STORAGE_KEYS.SEASONAL_PROFILE, JSON.stringify(newProfile));
      }

      if (recsData) {
        setRecommendations(JSON.parse(recsData));
      }
    } catch (error) {
      console.error('Error loading seasonal data:', error);
    }
  };

  const isTransitionPeriod = useMemo(() => {
    const month = new Date().getMonth();
    return month === 2 || month === 5 || month === 8 || month === 11;
  }, []);

  const transitionMessage = useMemo(() => {
    if (!isTransitionPeriod) return null;
    
    const nextSeason = getCurrentSeason();
    return `Your skin is transitioning to ${nextSeason}. Time to adjust your routine!`;
  }, [isTransitionPeriod]);

  const updateSeasonalProfile = useCallback(async (skinCondition: {
    hydration: number;
    oiliness: number;
    sensitivity: number;
    issues: string[];
  }) => {
    if (!user?.id) return;

    const updatedProfile: SkinSeasonProfile = seasonalProfile ? {
      ...seasonalProfile,
      currentSeason,
      lastUpdate: new Date(),
      seasonalHistory: [
        {
          season: currentSeason,
          skinCondition,
          effectiveProducts: [],
          concerns: SEASONAL_CONCERNS[currentSeason],
        },
        ...seasonalProfile.seasonalHistory.slice(0, 3),
      ],
    } : {
      userId: user.id,
      currentSeason,
      lastUpdate: new Date(),
      seasonalHistory: [{
        season: currentSeason,
        skinCondition,
        effectiveProducts: [],
        concerns: SEASONAL_CONCERNS[currentSeason],
      }],
    };

    setSeasonalProfile(updatedProfile);
    await storage.setItem(STORAGE_KEYS.SEASONAL_PROFILE, JSON.stringify(updatedProfile));
    await generateSeasonalRecommendations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, seasonalProfile, currentSeason]);

  const generateSeasonalRecommendations = useCallback(async () => {
    const newRecommendations: SeasonalRecommendation[] = [];

    if (isTransitionPeriod) {
      newRecommendations.push({
        id: `transition_${Date.now()}`,
        season: currentSeason,
        category: 'alert',
        title: `${currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} is Here!`,
        description: transitionMessage || '',
        priority: 'high',
        actionable: true,
        action: 'Adjust your routine',
      });
    }

    if (currentSeason === 'summer' || currentSeason === 'spring') {
      newRecommendations.push({
        id: `spf_${Date.now()}`,
        season: currentSeason,
        category: 'routine',
        title: 'SPF is Non-Negotiable',
        description: 'UV index is high. Reapply every 2 hours if outdoors.',
        priority: 'high',
        actionable: true,
        action: 'Check your SPF stock',
      });
    }

    if (currentSeason === 'winter' || currentSeason === 'fall') {
      newRecommendations.push({
        id: `hydration_${Date.now()}`,
        season: currentSeason,
        category: 'product',
        title: 'Boost Your Moisture Barrier',
        description: 'Cold weather strips moisture. Time for richer creams.',
        priority: 'high',
        actionable: true,
        action: 'Upgrade moisturizer',
      });
    }

    if (seasonalProfile && seasonalProfile.seasonalHistory.length > 0) {
      const lastSeason = seasonalProfile.seasonalHistory[0];
      if (lastSeason.skinCondition.hydration < 50) {
        newRecommendations.push({
          id: `hydration_alert_${Date.now()}`,
          season: currentSeason,
          category: 'alert',
          title: 'Your Skin Needs More Hydration',
          description: 'Based on your last scan, hydration is low for this season.',
          priority: 'medium',
          actionable: true,
          action: 'Add hydrating serum',
        });
      }
    }

    newRecommendations.push({
      id: `lifestyle_${Date.now()}`,
      season: currentSeason,
      category: 'lifestyle',
      title: SEASONAL_TIPS[currentSeason][0],
      description: 'Seasonal lifestyle tip for optimal skin health',
      priority: 'low',
      actionable: false,
    });

    setRecommendations(newRecommendations);
    await storage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(newRecommendations));
  }, [currentSeason, seasonalProfile, isTransitionPeriod, transitionMessage]);

  const dismissRecommendation = useCallback(async (id: string) => {
    const updated = recommendations.filter(r => r.id !== id);
    setRecommendations(updated);
    await storage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(updated));
  }, [recommendations]);

  const getSeasonalTip = useCallback(() => {
    const tips = SEASONAL_TIPS[currentSeason];
    return tips[Math.floor(Math.random() * tips.length)];
  }, [currentSeason]);

  const seasonalAdjustment = useMemo<SeasonalAdjustment | null>(() => {
    if (!seasonalProfile) return null;

    const adjustments: SeasonalAdjustment = {
      season: currentSeason,
      concerns: SEASONAL_CONCERNS[currentSeason],
      routineChanges: {
        morning: [],
        evening: [],
      },
      productRecommendations: {
        add: [],
        remove: [],
        swap: [],
      },
      lifestyleAdvice: SEASONAL_TIPS[currentSeason],
    };

    switch (currentSeason) {
      case 'summer':
        adjustments.routineChanges.morning = [
          'Lightweight gel cleanser',
          'Vitamin C serum',
          'Oil-free moisturizer',
          'SPF 50+ (reapply every 2hrs)',
        ];
        adjustments.routineChanges.evening = [
          'Double cleanse to remove sunscreen',
          'Niacinamide for oil control',
          'Lightweight night cream',
        ];
        adjustments.productRecommendations.add = ['Mattifying primer', 'Oil-absorbing sheets'];
        adjustments.productRecommendations.swap = [
          { from: 'Heavy cream', to: 'Gel moisturizer', reason: 'Better for hot weather' },
        ];
        break;

      case 'winter':
        adjustments.routineChanges.morning = [
          'Cream cleanser',
          'Hydrating toner/essence',
          'Rich moisturizer',
          'Facial oil (optional)',
          'SPF 30+',
        ];
        adjustments.routineChanges.evening = [
          'Gentle cleanse',
          'Hydrating serum',
          'Night cream',
          'Sleeping mask (2x/week)',
        ];
        adjustments.productRecommendations.add = ['Humidifier', 'Lip balm', 'Hand cream'];
        adjustments.productRecommendations.swap = [
          { from: 'Gel moisturizer', to: 'Rich cream', reason: 'Combat dryness' },
          { from: 'Foaming cleanser', to: 'Cream cleanser', reason: 'Less stripping' },
        ];
        break;

      case 'spring':
      case 'fall':
        adjustments.routineChanges.morning = [
          'Balanced cleanser',
          'Vitamin C or niacinamide',
          'Medium-weight moisturizer',
          'SPF 30+',
        ];
        adjustments.routineChanges.evening = [
          'Gentle cleanse',
          'Treatment serum',
          'Night moisturizer',
        ];
        adjustments.productRecommendations.add = ['Gentle exfoliant (1-2x/week)'];
        break;
    }

    return adjustments;
  }, [currentSeason, seasonalProfile]);

  return useMemo(() => ({
    currentSeason,
    seasonalProfile,
    recommendations,
    seasonalAdjustment,
    isTransitionPeriod,
    transitionMessage,
    generateSeasonalRecommendations,
    updateSeasonalProfile,
    dismissRecommendation,
    getSeasonalTip,
  }), [
    currentSeason,
    seasonalProfile,
    recommendations,
    seasonalAdjustment,
    isTransitionPeriod,
    transitionMessage,
    generateSeasonalRecommendations,
    updateSeasonalProfile,
    dismissRecommendation,
    getSeasonalTip,
  ]);
});
