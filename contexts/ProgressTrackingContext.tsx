import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { ProgressPhoto, ProgressComparison, WeeklyInsight, SkinJournalEntry } from '@/types/progress';
import { Platform } from 'react-native';

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

interface ProgressTrackingContextType {
  progressPhotos: ProgressPhoto[];
  journalEntries: SkinJournalEntry[];
  weeklyInsights: WeeklyInsight[];
  addProgressPhoto: (photo: Omit<ProgressPhoto, 'id'>) => Promise<void>;
  addJournalEntry: (entry: Omit<SkinJournalEntry, 'id'>) => Promise<void>;
  getProgressComparison: (days: number) => ProgressComparison | null;
  getCurrentWeekInsight: () => WeeklyInsight | null;
  generateWeeklyInsight: () => Promise<WeeklyInsight | null>;
  getTrendData: () => {
    hydration: number[];
    texture: number[];
    brightness: number[];
    acne: number[];
    labels: string[];
  };
  getJournalStats: () => {
    averageSleep: number;
    averageWater: number;
    averageStress: number;
    moodDistribution: Record<string, number>;
  };
  deleteProgressPhoto: (id: string) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
}

const STORAGE_KEYS = {
  PHOTOS: 'glowcheck_progress_photos',
  JOURNAL: 'glowcheck_journal_entries',
  INSIGHTS: 'glowcheck_weekly_insights',
};

export const [ProgressTrackingProvider, useProgressTracking] = createContextHook<ProgressTrackingContextType>(() => {
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [journalEntries, setJournalEntries] = useState<SkinJournalEntry[]>([]);
  const [weeklyInsights, setWeeklyInsights] = useState<WeeklyInsight[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [photosData, journalData, insightsData] = await Promise.all([
        storage.getItem(STORAGE_KEYS.PHOTOS),
        storage.getItem(STORAGE_KEYS.JOURNAL),
        storage.getItem(STORAGE_KEYS.INSIGHTS),
      ]);

      if (photosData) {
        setProgressPhotos(JSON.parse(photosData));
      }
      if (journalData) {
        setJournalEntries(JSON.parse(journalData));
      }
      if (insightsData) {
        setWeeklyInsights(JSON.parse(insightsData));
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const addProgressPhoto = useCallback(async (photo: Omit<ProgressPhoto, 'id'>) => {
    try {
      const newPhoto: ProgressPhoto = {
        ...photo,
        id: `photo_${Date.now()}`,
      };

      const updated = [newPhoto, ...progressPhotos].slice(0, 50);
      setProgressPhotos(updated);
      await storage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding progress photo:', error);
    }
  }, [progressPhotos]);

  const addJournalEntry = useCallback(async (entry: Omit<SkinJournalEntry, 'id'>) => {
    try {
      const newEntry: SkinJournalEntry = {
        ...entry,
        id: `journal_${Date.now()}`,
      };

      const updated = [newEntry, ...journalEntries].slice(0, 90);
      setJournalEntries(updated);
      await storage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding journal entry:', error);
    }
  }, [journalEntries]);

  const deleteProgressPhoto = useCallback(async (id: string) => {
    try {
      const updated = progressPhotos.filter(photo => photo.id !== id);
      setProgressPhotos(updated);
      await storage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting progress photo:', error);
    }
  }, [progressPhotos]);

  const deleteJournalEntry = useCallback(async (id: string) => {
    try {
      const updated = journalEntries.filter(entry => entry.id !== id);
      setJournalEntries(updated);
      await storage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  }, [journalEntries]);

  const getProgressComparison = useCallback((days: number = 30): ProgressComparison | null => {
    if (progressPhotos.length < 2) return null;

    const sorted = [...progressPhotos].sort((a, b) => a.timestamp - b.timestamp);
    const latest = sorted[sorted.length - 1];
    
    const targetTime = latest.timestamp - (days * 24 * 60 * 60 * 1000);
    const before = sorted.find(photo => photo.timestamp <= targetTime) || sorted[0];

    if (before.id === latest.id) return null;

    const improvements: { category: string; percentageChange: number; description: string }[] = [];

    if (before.skinCondition && latest.skinCondition) {
      const categories = ['hydration', 'texture', 'brightness', 'acne'];
      categories.forEach(category => {
        const beforeVal = before.skinCondition![category as keyof typeof before.skinCondition];
        const afterVal = latest.skinCondition![category as keyof typeof latest.skinCondition];
        const change = ((afterVal - beforeVal) / beforeVal) * 100;
        
        if (Math.abs(change) > 5) {
          improvements.push({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            percentageChange: change,
            description: change > 0 ? `${Math.abs(change).toFixed(0)}% improvement` : `${Math.abs(change).toFixed(0)}% decline`,
          });
        }
      });
    }

    const avgChange = improvements.length > 0 
      ? improvements.reduce((sum, i) => sum + i.percentageChange, 0) / improvements.length 
      : 0;

    return {
      before,
      after: latest,
      daysBetween: Math.floor((latest.timestamp - before.timestamp) / (24 * 60 * 60 * 1000)),
      improvements,
      overallTrend: avgChange > 5 ? 'improving' : avgChange < -5 ? 'declining' : 'stable',
    };
  }, [progressPhotos]);

  const getTrendData = useCallback(() => {
    const sorted = [...progressPhotos]
      .filter(p => p.skinCondition)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10);

    return {
      hydration: sorted.map(p => p.skinCondition?.hydration || 0),
      texture: sorted.map(p => p.skinCondition?.texture || 0),
      brightness: sorted.map(p => p.skinCondition?.brightness || 0),
      acne: sorted.map(p => p.skinCondition?.acne || 0),
      labels: sorted.map(p => new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    };
  }, [progressPhotos]);

  const getJournalStats = useCallback(() => {
    const recentEntries = journalEntries.slice(0, 30);

    const sleepEntries = recentEntries.filter(e => e.sleep !== undefined);
    const waterEntries = recentEntries.filter(e => e.water !== undefined);
    const stressEntries = recentEntries.filter(e => e.stress !== undefined);

    const moodDistribution = recentEntries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      averageSleep: sleepEntries.length > 0 
        ? sleepEntries.reduce((sum, e) => sum + (e.sleep || 0), 0) / sleepEntries.length 
        : 0,
      averageWater: waterEntries.length > 0 
        ? waterEntries.reduce((sum, e) => sum + (e.water || 0), 0) / waterEntries.length 
        : 0,
      averageStress: stressEntries.length > 0 
        ? stressEntries.reduce((sum, e) => sum + (e.stress || 0), 0) / stressEntries.length 
        : 0,
      moodDistribution,
    };
  }, [journalEntries]);

  const getCurrentWeekInsight = useCallback(() => {
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    
    return weeklyInsights.find(insight => {
      const insightStart = new Date(insight.startDate);
      return insightStart.toDateString() === weekStart.toDateString();
    }) || null;
  }, [weeklyInsights]);

  const generateWeeklyInsight = useCallback(async (): Promise<WeeklyInsight | null> => {
    try {
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekPhotos = progressPhotos.filter(p => {
        const photoDate = new Date(p.timestamp);
        return photoDate >= weekStart && photoDate <= weekEnd;
      });

      const weekJournal = journalEntries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });

      if (weekPhotos.length === 0 && weekJournal.length === 0) {
        return null;
      }

      const highlights: string[] = [];
      const concerns: string[] = [];
      const recommendations: string[] = [];

      const stats = getJournalStats();
      if (stats.averageWater < 6) {
        concerns.push('Low hydration intake this week');
        recommendations.push('Try to drink at least 8 glasses of water daily');
      }
      if (stats.averageSleep < 7) {
        concerns.push('Insufficient sleep affecting skin recovery');
        recommendations.push('Aim for 7-8 hours of sleep for optimal skin health');
      }
      if (stats.moodDistribution.great && stats.moodDistribution.great > 3) {
        highlights.push('Great mood consistency this week!');
      }

      const comparison = getProgressComparison(7);
      if (comparison && comparison.overallTrend === 'improving') {
        highlights.push('Visible improvement in skin condition');
      }

      if (weekPhotos.length > 0) {
        highlights.push(`${weekPhotos.length} progress photos captured`);
      }

      const completionRate = weekJournal.length / 7;
      if (completionRate > 0.8) {
        highlights.push('Excellent journaling consistency!');
      }

      const insight: WeeklyInsight = {
        id: `insight_${Date.now()}`,
        week: Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
        startDate: weekStart,
        endDate: weekEnd,
        summary: highlights.length > 0 
          ? `This week showed positive progress with ${highlights.length} key highlights` 
          : 'Continue your routine for better results',
        highlights,
        concerns,
        recommendations,
        progressScore: comparison ? (comparison.overallTrend === 'improving' ? 85 : 60) : 70,
        photosCount: weekPhotos.length,
        routineCompletionRate: completionRate * 100,
      };

      const updated = [insight, ...weeklyInsights].slice(0, 12);
      setWeeklyInsights(updated);
      await storage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(updated));

      return insight;
    } catch (error) {
      console.error('Error generating weekly insight:', error);
      return null;
    }
  }, [progressPhotos, journalEntries, weeklyInsights, getJournalStats, getProgressComparison]);

  return useMemo(() => ({
    progressPhotos,
    journalEntries,
    weeklyInsights,
    addProgressPhoto,
    addJournalEntry,
    getProgressComparison,
    getCurrentWeekInsight,
    generateWeeklyInsight,
    getTrendData,
    getJournalStats,
    deleteProgressPhoto,
    deleteJournalEntry,
  }), [
    progressPhotos,
    journalEntries,
    weeklyInsights,
    addProgressPhoto,
    addJournalEntry,
    getProgressComparison,
    getCurrentWeekInsight,
    generateWeeklyInsight,
    getTrendData,
    getJournalStats,
    deleteProgressPhoto,
    deleteJournalEntry,
  ]);
});
