import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthContext';
import { useSubscription } from './SubscriptionContext';
import { useFreemium } from './FreemiumContext';
import { initializeNotifications, sendStreakNotification, sendFreeScanUsedNotification, sendMissedRoutineNotification } from '@/lib/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextType {
  isInitialized: boolean;
  updateNotificationSchedule: () => Promise<void>;
  triggerStreakNotification: (streakDays: number) => Promise<void>;
  triggerFreeScanUsedNotification: () => Promise<void>;
  checkMissedRoutine: () => Promise<void>;
}

export const [NotificationProvider, useNotifications] = createContextHook<NotificationContextType>(() => {
  const { user } = useAuth();
  const { state: subState } = useSubscription();
  const freemium = useFreemium();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const getUserContext = useCallback(() => {
    if (!user) return undefined;

    const trialStartDate = subState.trialStartedAt ? new Date(subState.trialStartedAt) : null;
    const trialDaysLeft = trialStartDate 
      ? Math.max(0, 7 - Math.floor((Date.now() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24)))
      : undefined;

    return {
      isPremium: subState.isPremium,
      isTrialUser: subState.hasStartedTrial && subState.hasAddedPayment,
      hasUsedFreeScan: freemium.hasUsedFreeGlowScan || freemium.hasUsedFreeStyleScan,
      trialDaysLeft,
      lastScanDate: undefined,
    };
  }, [user, subState, freemium]);

  const updateNotificationSchedule = useCallback(async () => {
    if (!user) {
      console.log('[NotificationContext] No user, skipping notification setup');
      return;
    }

    const context = getUserContext();
    console.log('[NotificationContext] Updating notification schedule with context:', context);
    
    try {
      await initializeNotifications(context);
      setIsInitialized(true);
    } catch (error) {
      console.error('[NotificationContext] Failed to update schedule:', error);
    }
  }, [user, getUserContext]);

  useEffect(() => {
    if (!user) {
      console.log('[NotificationContext] No user logged in, notifications not initialized');
      return;
    }

    const initializeOnce = async () => {
      const lastInit = await AsyncStorage.getItem('last_notification_init');
      const now = Date.now();
      
      if (!lastInit || now - parseInt(lastInit) > 24 * 60 * 60 * 1000) {
        console.log('[NotificationContext] First init or 24h passed, initializing notifications');
        await updateNotificationSchedule();
        await AsyncStorage.setItem('last_notification_init', now.toString());
      } else {
        console.log('[NotificationContext] Already initialized in last 24h, skipping');
      }
    };

    initializeOnce();
  }, [user]);

  useEffect(() => {
    if (!user || !isInitialized) return;

    const handleContextChange = async () => {
      const lastUpdate = await AsyncStorage.getItem('last_notification_update');
      const now = Date.now();
      
      if (!lastUpdate || now - parseInt(lastUpdate) > 12 * 60 * 60 * 1000) {
        console.log('[NotificationContext] User context changed significantly, updating notifications');
        await updateNotificationSchedule();
        await AsyncStorage.setItem('last_notification_update', now.toString());
      }
    };

    handleContextChange();
  }, [
    subState.isPremium,
    subState.hasStartedTrial,
  ]);

  const triggerStreakNotification = useCallback(async (streakDays: number) => {
    console.log('[NotificationContext] Triggering streak notification for', streakDays, 'days');
    await sendStreakNotification(streakDays);
  }, []);

  const triggerFreeScanUsedNotification = useCallback(async () => {
    console.log('[NotificationContext] Triggering free scan used notification');
    await sendFreeScanUsedNotification();
  }, []);

  const checkMissedRoutine = useCallback(async () => {
    if (!user) return;

    try {
      const currentHour = new Date().getHours();
      const dateKey = new Date().toDateString();
      
      const morningRoutineDone = await AsyncStorage.getItem(`routine_morning_${dateKey}`);
      const eveningRoutineDone = await AsyncStorage.getItem(`routine_evening_${dateKey}`);
      const lastMorningNotif = await AsyncStorage.getItem('last_morning_missed_notif');
      const lastEveningNotif = await AsyncStorage.getItem('last_evening_missed_notif');
      
      const shouldSendMorningReminder = currentHour >= 11 && currentHour < 14 && !morningRoutineDone;
      const shouldSendEveningReminder = currentHour >= 22 && currentHour < 23 && !eveningRoutineDone;
      
      const canSendMorningNotif = !lastMorningNotif || 
        (new Date().getTime() - new Date(lastMorningNotif).getTime()) > 24 * 60 * 60 * 1000;
      
      const canSendEveningNotif = !lastEveningNotif || 
        (new Date().getTime() - new Date(lastEveningNotif).getTime()) > 24 * 60 * 60 * 1000;
      
      if (shouldSendMorningReminder && canSendMorningNotif) {
        console.log('[NotificationContext] Sending morning missed routine notification');
        await sendMissedRoutineNotification('morning');
        await AsyncStorage.setItem('last_morning_missed_notif', new Date().toISOString());
      }
      
      if (shouldSendEveningReminder && canSendEveningNotif) {
        console.log('[NotificationContext] Sending evening missed routine notification');
        await sendMissedRoutineNotification('evening');
        await AsyncStorage.setItem('last_evening_missed_notif', new Date().toISOString());
      }
    } catch (error) {
      console.error('[NotificationContext] Error checking missed routine:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user || !isInitialized) return;

    const checkInterval = setInterval(() => {
      checkMissedRoutine();
    }, 60 * 60 * 1000);

    checkMissedRoutine();

    return () => clearInterval(checkInterval);
  }, [user, isInitialized, checkMissedRoutine]);

  return useMemo(() => ({
    isInitialized,
    updateNotificationSchedule,
    triggerStreakNotification,
    triggerFreeScanUsedNotification,
    checkMissedRoutine,
  }), [
    isInitialized,
    updateNotificationSchedule,
    triggerStreakNotification,
    triggerFreeScanUsedNotification,
    checkMissedRoutine,
  ]);
});
