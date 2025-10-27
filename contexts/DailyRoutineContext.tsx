import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { DailyRoutine, RoutineStep, RoutineType, RoutineTemplate, DailyTip, StreakData } from '@/types/routine';
import { useAuth } from './AuthContext';
import { sendStreakNotification } from '@/lib/notifications';

interface DailyRoutineContextType {
  morningRoutine: DailyRoutine | null;
  eveningRoutine: DailyRoutine | null;
  streakData: StreakData;
  todaysTip: DailyTip | null;
  hasCompletedMorningRoutine: boolean;
  hasCompletedEveningRoutine: boolean;
  hasCompletedBothRoutines: boolean;
  toggleStep: (routineType: RoutineType, stepId: string) => Promise<void>;
  completeRoutine: (routineType: RoutineType) => Promise<void>;
  resetDailyRoutines: () => Promise<void>;
  getNextFreeTip: () => Promise<void>;
  isLoadingRoutines: boolean;
}

const STORAGE_KEYS = {
  ROUTINES: 'daily_routines',
  STREAK_DATA: 'streak_data',
  DAILY_TIP: 'daily_tip',
  LAST_TIP_DATE: 'last_tip_date',
};

const DEFAULT_MORNING_TEMPLATE: RoutineTemplate = {
  id: 'default_morning',
  name: 'Morning Glow Routine',
  type: 'morning',
  recommendedTime: '8:00 AM',
  steps: [
    {
      id: 'morning_1',
      title: 'Cleanse',
      description: 'Gentle cleanser to remove overnight oils',
      duration: 2,
      order: 1,
    },
    {
      id: 'morning_2',
      title: 'Toner',
      description: 'Balance your skin pH',
      duration: 1,
      order: 2,
    },
    {
      id: 'morning_3',
      title: 'Serum',
      description: 'Apply vitamin C or hydrating serum',
      duration: 2,
      order: 3,
    },
    {
      id: 'morning_4',
      title: 'Moisturize',
      description: 'Lock in hydration',
      duration: 2,
      order: 4,
    },
    {
      id: 'morning_5',
      title: 'Sunscreen',
      description: 'SPF 30+ to protect from UV damage',
      duration: 2,
      order: 5,
    },
  ],
};

const DEFAULT_EVENING_TEMPLATE: RoutineTemplate = {
  id: 'default_evening',
  name: 'Evening Wind Down',
  type: 'evening',
  recommendedTime: '10:00 PM',
  steps: [
    {
      id: 'evening_1',
      title: 'Remove Makeup',
      description: 'Double cleanse to remove all makeup',
      duration: 3,
      order: 1,
    },
    {
      id: 'evening_2',
      title: 'Cleanser',
      description: 'Deep clean pores',
      duration: 2,
      order: 2,
    },
    {
      id: 'evening_3',
      title: 'Exfoliate',
      description: 'Gentle exfoliation 2-3x per week',
      duration: 2,
      order: 3,
    },
    {
      id: 'evening_4',
      title: 'Treatment',
      description: 'Apply retinol or treatment serum',
      duration: 2,
      order: 4,
    },
    {
      id: 'evening_5',
      title: 'Night Cream',
      description: 'Rich moisturizer for overnight repair',
      duration: 2,
      order: 5,
    },
    {
      id: 'evening_6',
      title: 'Eye Cream',
      description: 'Gentle care for delicate eye area',
      duration: 1,
      order: 6,
    },
  ],
};

const DAILY_TIPS: DailyTip[] = [
  {
    id: 'tip_1',
    title: 'Hydration is Key',
    content: 'Drink at least 8 glasses of water today for glowing skin from within!',
    category: 'wellness',
    isPremium: false,
    date: '',
    icon: '💧',
  },
  {
    id: 'tip_2',
    title: 'Double Cleanse Magic',
    content: 'Oil cleanse first, then water-based cleanser for perfectly clean skin.',
    category: 'skincare',
    isPremium: false,
    date: '',
    icon: '✨',
  },
  {
    id: 'tip_3',
    title: 'Sleep for Beauty',
    content: '7-9 hours of sleep helps your skin repair and regenerate. Beauty sleep is real!',
    category: 'wellness',
    isPremium: false,
    date: '',
    icon: '😴',
  },
  {
    id: 'tip_4',
    title: 'Sunscreen Daily',
    content: 'UV damage is the #1 cause of premature aging. Wear SPF 30+ every single day!',
    category: 'skincare',
    isPremium: false,
    date: '',
    icon: '☀️',
  },
  {
    id: 'tip_5',
    title: 'Antioxidants Matter',
    content: 'Eat colorful fruits and veggies rich in vitamins for healthy, radiant skin.',
    category: 'nutrition',
    isPremium: true,
    date: '',
    icon: '🥗',
  },
  {
    id: 'tip_6',
    title: "Pat, Don't Rub",
    content: 'Gently pat products into your skin for better absorption and less irritation.',
    category: 'skincare',
    isPremium: true,
    date: '',
    icon: '👋',
  },
  {
    id: 'tip_7',
    title: 'Change Pillowcases',
    content: 'Swap pillowcases every 2-3 days to prevent bacteria buildup and breakouts.',
    category: 'lifestyle',
    isPremium: true,
    date: '',
    icon: '🛏️',
  },
  {
    id: 'tip_8',
    title: 'Less is More',
    content: 'Using too many products at once can irritate skin. Keep it simple and consistent.',
    category: 'skincare',
    isPremium: true,
    date: '',
    icon: '🌿',
  },
];

export const [DailyRoutineProvider, useDailyRoutine] = createContextHook<DailyRoutineContextType>(() => {
  const { user } = useAuth();
  const [morningRoutine, setMorningRoutine] = useState<DailyRoutine | null>(null);
  const [eveningRoutine, setEveningRoutine] = useState<DailyRoutine | null>(null);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: '',
    totalCompletedDays: 0,
  });
  const [todaysTip, setTodaysTip] = useState<DailyTip | null>(null);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState<boolean>(true);

  useEffect(() => {
    initializeDailyRoutines();
  }, [user]);

  const initializeDailyRoutines = async () => {
    try {
      setIsLoadingRoutines(true);
      const today = new Date().toISOString().split('T')[0];

      const [routinesData, streakDataStr, tipData, lastTipDate] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ROUTINES),
        AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_TIP),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_TIP_DATE),
      ]);

      let parsedRoutines: { morning: DailyRoutine | null; evening: DailyRoutine | null } = {
        morning: null,
        evening: null,
      };

      if (routinesData) {
        try {
          parsedRoutines = JSON.parse(routinesData);
        } catch {
          console.error('[DailyRoutine] Error parsing routines data');
        }
      }

      if (parsedRoutines.morning && parsedRoutines.morning.date === today) {
        setMorningRoutine(parsedRoutines.morning);
      } else {
        const newMorning = createRoutineFromTemplate(DEFAULT_MORNING_TEMPLATE, today);
        setMorningRoutine(newMorning);
      }

      if (parsedRoutines.evening && parsedRoutines.evening.date === today) {
        setEveningRoutine(parsedRoutines.evening);
      } else {
        const newEvening = createRoutineFromTemplate(DEFAULT_EVENING_TEMPLATE, today);
        setEveningRoutine(newEvening);
      }

      if (streakDataStr) {
        try {
          const parsed = JSON.parse(streakDataStr);
          setStreakData(parsed);
        } catch {
          console.error('[DailyRoutine] Error parsing streak data');
        }
      }

      if (lastTipDate !== today) {
        await getNextFreeTipInternal();
      } else if (tipData) {
        try {
          const parsed = JSON.parse(tipData);
          setTodaysTip(parsed);
        } catch {
          console.error('[DailyRoutine] Error parsing tip data');
        }
      }

      setIsLoadingRoutines(false);
    } catch (error) {
      console.error('[DailyRoutine] Error initializing routines:', error);
      setIsLoadingRoutines(false);
    }
  };

  const createRoutineFromTemplate = (template: RoutineTemplate, date: string): DailyRoutine => {
    return {
      id: `${template.id}_${date}`,
      type: template.type,
      date,
      steps: template.steps.map(step => ({ ...step, completed: false })),
    };
  };

  const saveRoutines = async (morning: DailyRoutine | null, evening: DailyRoutine | null) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ROUTINES,
        JSON.stringify({ morning, evening })
      );
    } catch (error) {
      console.error('[DailyRoutine] Error saving routines:', error);
    }
  };

  const saveStreakData = async (data: StreakData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('[DailyRoutine] Error saving streak data:', error);
    }
  };

  const toggleStep = useCallback(
    async (routineType: RoutineType, stepId: string) => {
      const routine = routineType === 'morning' ? morningRoutine : eveningRoutine;
      if (!routine) return;

      const updatedSteps = routine.steps.map(step =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      );

      const updatedRoutine = { ...routine, steps: updatedSteps };

      if (routineType === 'morning') {
        setMorningRoutine(updatedRoutine);
        await saveRoutines(updatedRoutine, eveningRoutine);
      } else {
        setEveningRoutine(updatedRoutine);
        await saveRoutines(morningRoutine, updatedRoutine);
      }
    },
    [morningRoutine, eveningRoutine]
  );

  const completeRoutine = useCallback(
    async (routineType: RoutineType) => {
      const routine = routineType === 'morning' ? morningRoutine : eveningRoutine;
      if (!routine) return;

      const now = new Date().toISOString();
      const updatedRoutine = { ...routine, completedAt: now };

      if (routineType === 'morning') {
        setMorningRoutine(updatedRoutine);
        await saveRoutines(updatedRoutine, eveningRoutine);
      } else {
        setEveningRoutine(updatedRoutine);
        await saveRoutines(morningRoutine, updatedRoutine);
      }

      const bothCompleted =
        (routineType === 'morning' ? updatedRoutine.completedAt : morningRoutine?.completedAt) &&
        (routineType === 'evening' ? updatedRoutine.completedAt : eveningRoutine?.completedAt);

      if (bothCompleted) {
        await updateStreak();
      }
    },
    [morningRoutine, eveningRoutine]
  );

  const updateStreak = async () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let newStreak = 1;
    let newLongest = streakData.longestStreak;

    if (streakData.lastCompletedDate === yesterday) {
      newStreak = streakData.currentStreak + 1;
    } else if (streakData.lastCompletedDate === today) {
      return;
    }

    if (newStreak > streakData.longestStreak) {
      newLongest = newStreak;
    }

    const newStreakData: StreakData = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCompletedDate: today,
      totalCompletedDays: streakData.totalCompletedDays + 1,
    };

    setStreakData(newStreakData);
    await saveStreakData(newStreakData);

    if (newStreak >= 3) {
      await sendStreakNotification(newStreak);
    }
  };

  const resetDailyRoutines = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const newMorning = createRoutineFromTemplate(DEFAULT_MORNING_TEMPLATE, today);
    const newEvening = createRoutineFromTemplate(DEFAULT_EVENING_TEMPLATE, today);

    setMorningRoutine(newMorning);
    setEveningRoutine(newEvening);
    await saveRoutines(newMorning, newEvening);
  }, []);

  const getNextFreeTipInternal = async () => {
    try {
      const freeTips = DAILY_TIPS.filter(tip => !tip.isPremium);
      const randomTip = freeTips[Math.floor(Math.random() * freeTips.length)];
      
      const tipWithDate = {
        ...randomTip,
        date: new Date().toISOString().split('T')[0],
      };

      setTodaysTip(tipWithDate);
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_TIP, JSON.stringify(tipWithDate));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_TIP_DATE, tipWithDate.date);
    } catch (error) {
      console.error('[DailyRoutine] Error getting next tip:', error);
    }
  };

  const getNextFreeTip = useCallback(async () => {
    await getNextFreeTipInternal();
  }, []);

  const hasCompletedMorningRoutine = useMemo(
    () => morningRoutine?.completedAt !== undefined,
    [morningRoutine]
  );

  const hasCompletedEveningRoutine = useMemo(
    () => eveningRoutine?.completedAt !== undefined,
    [eveningRoutine]
  );

  const hasCompletedBothRoutines = useMemo(
    () => hasCompletedMorningRoutine && hasCompletedEveningRoutine,
    [hasCompletedMorningRoutine, hasCompletedEveningRoutine]
  );

  return useMemo(
    () => ({
      morningRoutine,
      eveningRoutine,
      streakData,
      todaysTip,
      hasCompletedMorningRoutine,
      hasCompletedEveningRoutine,
      hasCompletedBothRoutines,
      toggleStep,
      completeRoutine,
      resetDailyRoutines,
      getNextFreeTip,
      isLoadingRoutines,
    }),
    [
      morningRoutine,
      eveningRoutine,
      streakData,
      todaysTip,
      hasCompletedMorningRoutine,
      hasCompletedEveningRoutine,
      hasCompletedBothRoutines,
      toggleStep,
      completeRoutine,
      resetDailyRoutines,
      getNextFreeTip,
      isLoadingRoutines,
    ]
  );
});
