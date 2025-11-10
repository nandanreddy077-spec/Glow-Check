import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { ProgressPhoto, ProgressComparison, WeeklyInsight, SkinJournalEntry } from '@/types/progress';
import { Platform } from 'react-native';
import { generateObject } from '@/lib/ai-helpers';
import { z } from 'zod';

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
  analyzePhotoWithAI: (photoUri: string, previousPhotoUri?: string) => Promise<{
    skinCondition: { hydration: number; texture: number; brightness: number; acne: number };
    concerns: string[];
    improvements: string[];
  }>;
  getConsistentDaysCount: () => number;
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

  const analyzePhotoWithAI = useCallback(async (photoUri: string, previousPhotoUri?: string): Promise<{
    skinCondition: { hydration: number; texture: number; brightness: number; acne: number };
    concerns: string[];
    improvements: string[];
  }> => {
    try {
      const schema = z.object({
        skinCondition: z.object({
          hydration: z.number().min(0).max(100),
          texture: z.number().min(0).max(100),
          brightness: z.number().min(0).max(100),
          acne: z.number().min(0).max(100),
        }),
        concerns: z.array(z.string()),
        improvements: z.array(z.string()),
      });

      const messages = previousPhotoUri ? [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Analyze these two photos to track skin improvements. First photo is older, second is recent. Provide: 1) Detailed skin condition scores (0-100 for hydration, texture, brightness, acne where higher=better except acne). 2) Current concerns to address. 3) Specific improvements noticed between photos.' },
            { type: 'image' as const, image: previousPhotoUri },
            { type: 'image' as const, image: photoUri },
          ],
        },
      ] : [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'Analyze this facial photo for skin health. Provide: 1) Detailed skin condition scores (0-100 for hydration, texture, brightness, acne where higher=better except acne). 2) Specific concerns to address. 3) Empty improvements array for now.' },
            { type: 'image' as const, image: photoUri },
          ],
        },
      ];

      const result = await generateObject({ messages, schema, timeout: 20000 });
      return result;
    } catch (error) {
      console.error('AI photo analysis error:', error);
      return {
        skinCondition: { hydration: 50, texture: 50, brightness: 50, acne: 50 },
        concerns: [],
        improvements: [],
      };
    }
  }, []);

  const addProgressPhoto = useCallback(async (photo: Omit<ProgressPhoto, 'id'>) => {
    try {
      const previousPhoto = progressPhotos[0];
      const aiAnalysis = await analyzePhotoWithAI(
        photo.uri,
        previousPhoto?.uri
      );

      const newPhoto: ProgressPhoto = {
        ...photo,
        id: `photo_${Date.now()}`,
        skinCondition: aiAnalysis.skinCondition,
        concerns: aiAnalysis.concerns,
      };

      const updated = [newPhoto, ...progressPhotos].slice(0, 50);
      setProgressPhotos(updated);
      await storage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error adding progress photo:', error);
      const newPhoto: ProgressPhoto = {
        ...photo,
        id: `photo_${Date.now()}`,
      };
      const updated = [newPhoto, ...progressPhotos].slice(0, 50);
      setProgressPhotos(updated);
      await storage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(updated));
    }
  }, [progressPhotos, analyzePhotoWithAI]);

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

  const getConsistentDaysCount = useCallback(() => {
    const uniqueDates = new Set<string>();
    
    progressPhotos.forEach(photo => {
      const date = new Date(photo.timestamp).toDateString();
      uniqueDates.add(date);
    });
    
    journalEntries.forEach(entry => {
      const date = new Date(entry.date).toDateString();
      uniqueDates.add(date);
    });
    
    return uniqueDates.size;
  }, [progressPhotos, journalEntries]);

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
      const consistentDays = getConsistentDaysCount();
      
      if (consistentDays < 5) {
        console.log('Not enough consistent days for insights. Current:', consistentDays, 'Required: 5');
        return null;
      }

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

      const stats = getJournalStats();
      const comparison = getProgressComparison(7);

      const allPhotos = progressPhotos.slice(0, 10);
      const recentPhotosData = allPhotos.map(p => ({
        date: new Date(p.timestamp).toLocaleDateString(),
        skinCondition: p.skinCondition,
        concerns: p.concerns,
        mood: p.mood,
      }));

      const contextData = {
        totalConsistentDays: consistentDays,
        weekPhotosCount: weekPhotos.length,
        weekJournalCount: weekJournal.length,
        averageSleep: stats.averageSleep.toFixed(1),
        averageWater: stats.averageWater.toFixed(0),
        averageStress: stats.averageStress.toFixed(1),
        moodDistribution: stats.moodDistribution,
        skinTrend: comparison?.overallTrend || 'stable',
        improvements: comparison?.improvements || [],
        recentNotes: weekJournal.map(e => e.notes).filter(Boolean).slice(0, 3),
        photoAnalysis: recentPhotosData,
      };

      const prompt = `You are an expert beauty and psychology coach analyzing ${consistentDays} days of a woman's glow transformation journey. Your role is to make her BELIEVE in her progress and trust this app is tracking REAL, visible changes.

Psychological Principles:
- Women need to SEE their transformation validated with specific evidence
- Connect internal habits (sleep, water, mood) to external beauty outcomes
- Use emotional, personal language while being data-driven
- Build confidence by highlighting measurable improvements
- Make her feel SEEN and understood in her journey

Photo Analysis Data:
${JSON.stringify(contextData.photoAnalysis, null, 2)}

Lifestyle & Journal Data:
- Total consistent tracking days: ${contextData.totalConsistentDays}
- Photos taken this week: ${contextData.weekPhotosCount}
- Journal entries: ${contextData.weekJournalCount}/7 days
- Sleep average: ${contextData.averageSleep} hours (${parseFloat(contextData.averageSleep) >= 7 ? 'optimal' : 'needs improvement'})
- Daily water intake: ${contextData.averageWater} glasses (${parseFloat(contextData.averageWater) >= 8 ? 'excellent' : 'increase more'})
- Stress level: ${contextData.averageStress}/5 (${parseFloat(contextData.averageStress) <= 2 ? 'low' : parseFloat(contextData.averageStress) >= 4 ? 'high' : 'moderate'})
- Mood patterns: ${JSON.stringify(contextData.moodDistribution)}
- Overall skin trend: ${contextData.skinTrend}
- Measured changes: ${JSON.stringify(contextData.improvements)}
- Personal notes: ${JSON.stringify(contextData.recentNotes)}

Your Task - Generate insights that make her trust this app:

1. SUMMARY (2-3 sentences):
   - Open with validation of her commitment ("${consistentDays} days of dedication...")
   - Reference SPECIFIC measured changes from photo analysis (e.g., "Your hydration increased from 45 to 62")
   - Connect a habit to a visible result (e.g., "Those 8-hour sleep nights directly improved your skin brightness")
   - Make it emotional and personal

2. HIGHLIGHTS (3-5 specific wins):
   - Each must connect a HABIT to a VISIBLE RESULT with numbers
   - Example: "Your commitment to 8+ glasses of water on Jan 15-17 matches your 18% hydration boost we measured in photos"
   - Example: "That 'great' mood streak from Jan 20-22? Your skin brightness jumped 12% during those exact days"
   - Use dates, percentages, and specific correlations
   - Make her feel like THIS APP is what's tracking her real transformation

3. CONCERNS (0-2 only if critical):
   - Only mention if there's a clear negative pattern
   - Frame constructively: "When your sleep dropped below 6h on [dates], we noticed a 10% decline in texture"

4. RECOMMENDATIONS (3-5 actionable tips):
   - Based on what's WORKING in her data
   - Specific and personal: "Keep up those 8h sleep nights - they're directly improving your brightness"
   - Give her confidence that small changes = big results

CRITICAL: Use actual numbers from the data. Reference specific dates when possible. Make correlations between habits and skin metrics. Build TRUST that this app sees her real transformation.

Make it personal, evidence-based, and build trust that this app tracks REAL transformation. Reference specific numbers and dates.`;

      const insightSchema = z.object({
        summary: z.string(),
        highlights: z.array(z.string()).min(3).max(5),
        concerns: z.array(z.string()).max(3),
        recommendations: z.array(z.string()).min(3).max(5),
      });

      const aiResult = await generateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: insightSchema,
        timeout: 25000
      });

      const completionRate = weekJournal.length / 7;
      const progressScore = comparison 
        ? (comparison.overallTrend === 'improving' ? 85 : comparison.overallTrend === 'declining' ? 45 : 65)
        : Math.min(30 + (completionRate * 40) + (weekPhotos.length * 5), 100);

      const insight: WeeklyInsight = {
        id: `insight_${Date.now()}`,
        week: Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
        startDate: weekStart,
        endDate: weekEnd,
        summary: aiResult.summary,
        highlights: aiResult.highlights,
        concerns: aiResult.concerns,
        recommendations: aiResult.recommendations,
        progressScore,
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
  }, [progressPhotos, journalEntries, weeklyInsights, getJournalStats, getProgressComparison, getConsistentDaysCount]);

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
    analyzePhotoWithAI,
    getConsistentDaysCount,
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
    getConsistentDaysCount,
    getJournalStats,
    deleteProgressPhoto,
    deleteJournalEntry,
    analyzePhotoWithAI,
  ]);
});
