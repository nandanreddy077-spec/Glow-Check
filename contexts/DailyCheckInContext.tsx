import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import {
  DailyCheckIn,
  DailyHabit,
  CheckInStreak,
  DailyReward,
  WeeklyProgress,
  DailyCheckInContextType,
} from '@/types/daily-checkin';
import { useUser } from './UserContext';
import { useGamification } from './GamificationContext';
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

const STORAGE_KEYS = {
  CHECK_INS: 'glowcheck_daily_checkins',
  HABITS: 'glowcheck_daily_habits',
  REWARDS: 'glowcheck_daily_rewards',
  STREAK: 'glowcheck_checkin_streak',
  WEEKLY_PROGRESS: 'glowcheck_weekly_progress',
};

const INITIAL_HABITS: Omit<DailyHabit, 'id' | 'streak' | 'totalCompletions' | 'createdAt'>[] = [
  {
    title: 'Morning Skincare',
    description: 'Complete your morning skincare routine',
    icon: '🧴',
    ritualTime: 'morning',
    lastCompletedDate: undefined,
    isActive: true,
  },
  {
    title: 'SPF Protection',
    description: 'Apply sunscreen before going out',
    icon: '☀️',
    ritualTime: 'morning',
    lastCompletedDate: undefined,
    isActive: true,
  },
  {
    title: 'Remove Makeup',
    description: 'Gently remove makeup & cleanse',
    icon: '🧼',
    ritualTime: 'evening',
    lastCompletedDate: undefined,
    isActive: true,
  },
  {
    title: 'Evening Skincare',
    description: 'Complete your evening skincare routine',
    icon: '🌸',
    ritualTime: 'evening',
    lastCompletedDate: undefined,
    isActive: true,
  },
  {
    title: 'Drink Water',
    description: 'Stay hydrated throughout the day',
    icon: '💧',
    ritualTime: 'both',
    lastCompletedDate: undefined,
    isActive: true,
  },
];

export const [DailyCheckInProvider, useDailyCheckIn] = createContextHook<DailyCheckInContextType>(() => {
  const { user, setUser } = useUser();
  const { addGlowBoost } = useGamification();
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [habits, setHabits] = useState<DailyHabit[]>([]);
  const [rewards, setRewards] = useState<DailyReward[]>([]);
  const [streak, setStreak] = useState<CheckInStreak>({
    currentStreak: 0,
    longestStreak: 0,
    totalCheckIns: 0,
    lastCheckInDate: '',
    streakHistory: [],
  });
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [checkInsData, habitsData, rewardsData, streakData, weeklyData] = await Promise.all([
        storage.getItem(STORAGE_KEYS.CHECK_INS),
        storage.getItem(STORAGE_KEYS.HABITS),
        storage.getItem(STORAGE_KEYS.REWARDS),
        storage.getItem(STORAGE_KEYS.STREAK),
        storage.getItem(STORAGE_KEYS.WEEKLY_PROGRESS),
      ]);

      if (checkInsData) {
        setCheckIns(JSON.parse(checkInsData));
      }

      if (habitsData) {
        setHabits(JSON.parse(habitsData));
      } else {
        const initialHabits: DailyHabit[] = INITIAL_HABITS.map((habit, index) => ({
          ...habit,
          id: `habit_${Date.now()}_${index}`,
          streak: 0,
          totalCompletions: 0,
          createdAt: new Date().toISOString(),
        }));
        setHabits(initialHabits);
        await storage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(initialHabits));
      }

      if (rewardsData) {
        setRewards(JSON.parse(rewardsData));
      }

      if (streakData) {
        setStreak(JSON.parse(streakData));
      }

      if (weeklyData) {
        setWeeklyProgress(JSON.parse(weeklyData));
      }
    } catch (error) {
      console.error('Error loading daily check-in data:', error);
    }
  };

  const saveCheckIns = async (newCheckIns: DailyCheckIn[]) => {
    try {
      const limited = newCheckIns.slice(0, 90);
      await storage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(limited));
    } catch (error) {
      console.error('Error saving check-ins:', error);
    }
  };

  const saveHabits = async (newHabits: DailyHabit[]) => {
    try {
      await storage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(newHabits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const saveRewards = async (newRewards: DailyReward[]) => {
    try {
      const limited = newRewards.slice(0, 50);
      await storage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(limited));
    } catch (error) {
      console.error('Error saving rewards:', error);
    }
  };

  const saveStreak = async (newStreak: CheckInStreak) => {
    try {
      await storage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(newStreak));
    } catch (error) {
      console.error('Error saving streak:', error);
    }
  };

  const getTodaysCheckIn = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return checkIns.find((c) => c.date === today) || null;
  }, [checkIns]);

  const hasMorningCheckIn = useCallback(() => {
    const todaysCheckIn = getTodaysCheckIn();
    return todaysCheckIn?.ritualType === 'morning' || todaysCheckIn?.ritualType === 'full';
  }, [getTodaysCheckIn]);

  const hasEveningCheckIn = useCallback(() => {
    const todaysCheckIn = getTodaysCheckIn();
    return todaysCheckIn?.ritualType === 'evening' || todaysCheckIn?.ritualType === 'full';
  }, [getTodaysCheckIn]);

  const calculateCompleteness = (checkIn: Omit<DailyCheckIn, 'id' | 'timestamp' | 'rewardPoints' | 'completeness'>) => {
    let total = 0;
    let completed = 0;

    Object.values(checkIn.checklist).forEach((value) => {
      total++;
      if (value) completed++;
    });

    Object.values(checkIn.ratings).forEach((value) => {
      total++;
      if (value > 0) completed++;
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const calculateRewardPoints = (completeness: number, ritualType: 'morning' | 'evening' | 'full', currentStreak: number) => {
    let basePoints = 50;
    
    if (ritualType === 'full') basePoints = 100;
    if (completeness === 100) basePoints += 25;
    
    const streakBonus = Math.min(currentStreak * 5, 50);
    
    return basePoints + streakBonus;
  };

  const calculateStreak = useCallback(() => {
    if (checkIns.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        lastCheckInDate: '',
        streakHistory: [],
      };
    }

    const sortedCheckIns = [...checkIns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate = new Date(sortedCheckIns[0].date);
    lastDate.setHours(0, 0, 0, 0);

    const streakHistory: { date: string; ritualType: 'morning' | 'evening' | 'full' }[] = [];

    for (const checkIn of sortedCheckIns) {
      const checkInDate = new Date(checkIn.date);
      checkInDate.setHours(0, 0, 0, 0);

      streakHistory.push({
        date: checkIn.date,
        ritualType: checkIn.ritualType,
      });

      if (currentStreak === 0) {
        const diffDays = Math.floor((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0 || diffDays === 1) {
          currentStreak = 1;
          tempStreak = 1;
          lastDate = checkInDate;
        }
      } else {
        const diffDays = Math.floor((lastDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
          tempStreak++;
          lastDate = checkInDate;
        } else if (diffDays === 0) {
          continue;
        } else {
          tempStreak++;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);
      if (diffDays > 1) tempStreak = 0;
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalCheckIns: checkIns.length,
      lastCheckInDate: sortedCheckIns[0].date,
      streakHistory: streakHistory.slice(0, 30),
    };
  }, [checkIns]);

  const checkForRewards = useCallback(async (newStreak: CheckInStreak, checkIn: DailyCheckIn): Promise<DailyReward[]> => {
    const newRewards: DailyReward[] = [];
    const today = new Date().toISOString().split('T')[0];

    if (newStreak.currentStreak === 3) {
      newRewards.push({
        id: `reward_streak3_${Date.now()}`,
        date: today,
        type: 'streak',
        title: '3-Day Streak!',
        description: 'You\'re building a beautiful habit',
        points: 100,
        badge: { icon: '🔥', color: '#FF6B6B', rarity: 'common' },
        claimed: false,
      });
    }

    if (newStreak.currentStreak === 7) {
      newRewards.push({
        id: `reward_streak7_${Date.now()}`,
        date: today,
        type: 'streak',
        title: 'Week Warrior!',
        description: 'A full week of dedication',
        points: 250,
        badge: { icon: '👑', color: '#FFD700', rarity: 'rare' },
        claimed: false,
      });
    }

    if (newStreak.currentStreak === 14) {
      newRewards.push({
        id: `reward_streak14_${Date.now()}`,
        date: today,
        type: 'streak',
        title: 'Two Week Champion!',
        description: 'Your glow is becoming unstoppable',
        points: 500,
        badge: { icon: '💎', color: '#9B59B6', rarity: 'epic' },
        claimed: false,
      });
    }

    if (newStreak.currentStreak === 30) {
      newRewards.push({
        id: `reward_streak30_${Date.now()}`,
        date: today,
        type: 'milestone',
        title: 'Glow Legend!',
        description: 'A full month of transformation',
        points: 1000,
        badge: { icon: '✨', color: '#F012BE', rarity: 'legendary' },
        claimed: false,
      });
    }

    if (checkIn.completeness === 100) {
      newRewards.push({
        id: `reward_perfect_${Date.now()}`,
        date: today,
        type: 'consistency',
        title: 'Perfect Day!',
        description: 'You completed everything today',
        points: 75,
        badge: { icon: '⭐', color: '#FFD700', rarity: 'common' },
        claimed: false,
      });
    }

    if (newStreak.currentStreak === 1 && newStreak.totalCheckIns > 7) {
      const lastCheckInDate = new Date(newStreak.lastCheckInDate);
      const daysSinceLastCheckIn = Math.floor((Date.now() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastCheckIn > 3) {
        newRewards.push({
          id: `reward_comeback_${Date.now()}`,
          date: today,
          type: 'comeback',
          title: 'Welcome Back!',
          description: 'Your glow journey continues',
          points: 50,
          badge: { icon: '🌈', color: '#3498DB', rarity: 'common' },
          claimed: false,
        });
      }
    }

    return newRewards;
  }, []);

  const createCheckIn = useCallback(async (
    checkInData: Omit<DailyCheckIn, 'id' | 'timestamp' | 'rewardPoints' | 'completeness'>
  ): Promise<DailyReward[]> => {
    try {
      console.log('🎯 Creating check-in...', checkInData.ritualType);
      
      const existingCheckIn = getTodaysCheckIn();
      const completeness = calculateCompleteness(checkInData);
      
      let finalRitualType = checkInData.ritualType;
      if (existingCheckIn) {
        if (existingCheckIn.ritualType === 'morning' && checkInData.ritualType === 'evening') {
          finalRitualType = 'full';
        } else if (existingCheckIn.ritualType === 'evening' && checkInData.ritualType === 'morning') {
          finalRitualType = 'full';
        }
      }

      const updatedStreak = calculateStreak();
      const newStreakCount = updatedStreak.currentStreak + (existingCheckIn ? 0 : 1);
      
      const rewardPoints = calculateRewardPoints(completeness, finalRitualType, newStreakCount);

      const newCheckIn: DailyCheckIn = {
        ...checkInData,
        id: existingCheckIn?.id || `checkin_${Date.now()}`,
        timestamp: Date.now(),
        ritualType: finalRitualType,
        completeness,
        rewardPoints,
        checklist: {
          ...existingCheckIn?.checklist,
          ...checkInData.checklist,
        },
        ratings: {
          ...existingCheckIn?.ratings,
          ...checkInData.ratings,
        },
      };

      let updatedCheckIns: DailyCheckIn[];
      if (existingCheckIn) {
        updatedCheckIns = checkIns.map((c) => (c.id === existingCheckIn.id ? newCheckIn : c));
      } else {
        updatedCheckIns = [newCheckIn, ...checkIns];
      }

      setCheckIns(updatedCheckIns);
      await saveCheckIns(updatedCheckIns);

      const newStreak: CheckInStreak = {
        ...updatedStreak,
        currentStreak: newStreakCount,
        totalCheckIns: updatedStreak.totalCheckIns + (existingCheckIn ? 0 : 1),
        lastCheckInDate: newCheckIn.date,
        streakHistory: [
          { date: newCheckIn.date, ritualType: newCheckIn.ritualType },
          ...updatedStreak.streakHistory.filter(h => h.date !== newCheckIn.date),
        ].slice(0, 30),
      };
      setStreak(newStreak);
      await saveStreak(newStreak);

      if (user) {
        const updatedUser = {
          ...user,
          stats: {
            ...user.stats,
            totalPoints: user.stats.totalPoints + rewardPoints,
            dayStreak: Math.max(user.stats.dayStreak, newStreak.currentStreak),
          },
        };
        setUser(updatedUser);
      }

      await addGlowBoost({
        type: 'daily_completion',
        title: `${finalRitualType === 'full' ? 'Full Day' : finalRitualType === 'morning' ? 'Morning' : 'Evening'} Ritual Complete!`,
        message: `+${rewardPoints} points • ${newStreak.currentStreak} day streak 🔥`,
        points: rewardPoints,
      });

      const earnedRewards = await checkForRewards(newStreak, newCheckIn);
      if (earnedRewards.length > 0) {
        const updatedRewards = [...earnedRewards, ...rewards];
        setRewards(updatedRewards);
        await saveRewards(updatedRewards);
      }

      console.log('✅ Check-in created successfully');
      return earnedRewards;
    } catch (error) {
      console.error('❌ Error creating check-in:', error);
      return [];
    }
  }, [checkIns, getTodaysCheckIn, calculateStreak, user, setUser, addGlowBoost, rewards, checkForRewards]);

  const claimReward = useCallback(async (rewardId: string) => {
    try {
      const reward = rewards.find((r) => r.id === rewardId);
      if (!reward || reward.claimed) return;

      const updatedRewards = rewards.map((r) =>
        r.id === rewardId ? { ...r, claimed: true, claimedAt: new Date().toISOString() } : r
      );
      setRewards(updatedRewards);
      await saveRewards(updatedRewards);

      if (user) {
        const updatedUser = {
          ...user,
          stats: {
            ...user.stats,
            totalPoints: user.stats.totalPoints + reward.points,
          },
        };
        setUser(updatedUser);
      }

      await addGlowBoost({
        type: 'streak_milestone',
        title: reward.title,
        message: reward.description,
        points: reward.points,
      });
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  }, [rewards, user, setUser, addGlowBoost]);

  const generateWeeklyProgress = useCallback(async (): Promise<WeeklyProgress | null> => {
    try {
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekCheckIns = checkIns.filter((c) => {
        const checkInDate = new Date(c.date);
        return checkInDate >= weekStart && checkInDate <= weekEnd;
      });

      if (weekCheckIns.length < 3) {
        console.log('Not enough check-ins for weekly insight');
        return null;
      }

      const totalMood = weekCheckIns.reduce((sum, c) => sum + c.ratings.mood, 0);
      const totalEnergy = weekCheckIns.reduce((sum, c) => sum + c.ratings.energy, 0);
      const totalSkinFeeling = weekCheckIns.reduce((sum, c) => sum + c.ratings.skin_feeling, 0);
      const totalConfidence = weekCheckIns.reduce((sum, c) => sum + c.ratings.confidence, 0);
      const totalPoints = weekCheckIns.reduce((sum, c) => sum + c.rewardPoints, 0);
      const perfectDays = weekCheckIns.filter((c) => c.ritualType === 'full').length;

      const averages = {
        mood: totalMood / weekCheckIns.length,
        energy: totalEnergy / weekCheckIns.length,
        skinFeeling: totalSkinFeeling / weekCheckIns.length,
        confidence: totalConfidence / weekCheckIns.length,
      };

      const insightSchema = z.object({
        insights: z.array(z.string()).min(3).max(5),
      });

      const prompt = `You are an expert beauty and wellness coach analyzing a woman's daily check-in data for the week.

Week Summary:
- Check-ins completed: ${weekCheckIns.length}/14 (target is 2 per day)
- Average mood: ${averages.mood.toFixed(1)}/5
- Average energy: ${averages.energy.toFixed(1)}/5
- Average skin feeling: ${averages.skinFeeling.toFixed(1)}/5
- Average confidence: ${averages.confidence.toFixed(1)}/5
- Perfect days (both morning & evening): ${perfectDays}
- Total points earned: ${totalPoints}
- Current streak: ${streak.currentStreak} days

Daily Details:
${weekCheckIns.map(c => `- ${c.date}: ${c.ritualType} ritual, mood ${c.ratings.mood}/5, energy ${c.ratings.energy}/5, skin ${c.ratings.skin_feeling}/5, confidence ${c.ratings.confidence}/5`).join('\n')}

Generate 3-5 encouraging, personalized insights that:
1. Celebrate specific patterns (e.g., "Your confidence soared to 4.5/5 on days you did both rituals!")
2. Connect habits to feelings (e.g., "Morning rituals boosted your energy by 20%")
3. Give actionable encouragement (e.g., "Try evening rituals on weekdays too - your skin will thank you")
4. Make her feel SEEN and motivated to continue
5. Reference specific numbers and patterns from the data

Be warm, personal, and data-driven. Make her trust that these daily check-ins are tracking real transformation.`;

      const aiResult = await generateObject({
        messages: [{ role: 'user', content: prompt }],
        schema: insightSchema,
        timeout: 20000,
      });

      const progress: WeeklyProgress = {
        weekStartDate: weekStart.toISOString(),
        weekEndDate: weekEnd.toISOString(),
        checkInsCompleted: weekCheckIns.length,
        targetCheckIns: 14,
        averageMood: averages.mood,
        averageEnergy: averages.energy,
        averageSkinFeeling: averages.skinFeeling,
        averageConfidence: averages.confidence,
        totalPoints,
        perfectDays,
        insights: aiResult.insights,
      };

      setWeeklyProgress(progress);
      await storage.setItem(STORAGE_KEYS.WEEKLY_PROGRESS, JSON.stringify(progress));

      return progress;
    } catch (error) {
      console.error('Error generating weekly progress:', error);
      return null;
    }
  }, [checkIns, streak]);

  const addHabit = useCallback(async (habitData: Omit<DailyHabit, 'id' | 'streak' | 'totalCompletions' | 'createdAt'>) => {
    try {
      const newHabit: DailyHabit = {
        ...habitData,
        id: `habit_${Date.now()}`,
        streak: 0,
        totalCompletions: 0,
        createdAt: new Date().toISOString(),
      };

      const updatedHabits = [newHabit, ...habits];
      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  }, [habits]);

  const toggleHabit = useCallback(async (habitId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const updatedHabits = habits.map((habit) => {
        if (habit.id === habitId) {
          const isCompletingToday = habit.lastCompletedDate !== today;
          return {
            ...habit,
            lastCompletedDate: isCompletingToday ? today : undefined,
            totalCompletions: isCompletingToday ? habit.totalCompletions + 1 : habit.totalCompletions - 1,
            streak: isCompletingToday ? habit.streak + 1 : Math.max(0, habit.streak - 1),
          };
        }
        return habit;
      });

      setHabits(updatedHabits);
      await saveHabits(updatedHabits);
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  }, [habits]);

  const getActiveHabits = useCallback((ritualTime: 'morning' | 'evening') => {
    return habits.filter((h) => h.isActive && (h.ritualTime === ritualTime || h.ritualTime === 'both'));
  }, [habits]);

  const getCheckInHistory = useCallback((days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return checkIns
      .filter((c) => new Date(c.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [checkIns]);

  const getMoodTrend = useCallback((days: number) => {
    const history = getCheckInHistory(days).reverse();
    return {
      dates: history.map((c) => c.date),
      moods: history.map((c) => c.ratings.mood),
      energy: history.map((c) => c.ratings.energy),
    };
  }, [getCheckInHistory]);

  const getSkinTrend = useCallback((days: number) => {
    const history = getCheckInHistory(days).reverse();
    return {
      dates: history.map((c) => c.date),
      ratings: history.map((c) => c.ratings.skin_feeling),
    };
  }, [getCheckInHistory]);

  const unclaimedRewards = useMemo(() => {
    return rewards.filter((r) => !r.claimed);
  }, [rewards]);

  return useMemo(() => ({
    checkIns,
    streak,
    weeklyProgress,
    unclaimedRewards,
    habits,
    getTodaysCheckIn,
    hasMorningCheckIn,
    hasEveningCheckIn,
    createCheckIn,
    calculateStreak,
    claimReward,
    generateWeeklyProgress,
    addHabit,
    toggleHabit,
    getActiveHabits,
    getCheckInHistory,
    getMoodTrend,
    getSkinTrend,
  }), [
    checkIns,
    streak,
    weeklyProgress,
    unclaimedRewards,
    habits,
    getTodaysCheckIn,
    hasMorningCheckIn,
    hasEveningCheckIn,
    createCheckIn,
    calculateStreak,
    claimReward,
    generateWeeklyProgress,
    addHabit,
    toggleHabit,
    getActiveHabits,
    getCheckInHistory,
    getMoodTrend,
    getSkinTrend,
  ]);
});
