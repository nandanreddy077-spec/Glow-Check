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

    console.log('[NotificationContext] User detected, initializing notifications');
    updateNotificationSchedule();
  }, [user, updateNotificationSchedule]);

  useEffect(() => {
    if (!user || !isInitialized) return;

    console.log('[NotificationContext] User context changed, updating notifications');
    updateNotificationSchedule();
  }, [
    user,
    isInitialized,
    updateNotificationSchedule,
    subState.isPremium,
    subState.hasStartedTrial,
    subState.hasAddedPayment,
    freemium.hasUsedFreeGlowScan,
    freemium.hasUsedFreeStyleScan,
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
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      
      const morningRoutineDone = await AsyncStorage.getItem(`routine_morning_${new Date().toDateString()}`);
      const eveningRoutineDone = await AsyncStorage.getItem(`routine_evening_${new Date().toDateString()}`);
      const lastMissedNotification = await AsyncStorage.getItem('last_missed_routine_notification');
      
      const shouldSendMorningReminder = currentHour >= 11 && currentHour < 14 && !morningRoutineDone;
      const shouldSendEveningReminder = currentHour >= 22 && currentHour < 23 && !eveningRoutineDone;
      
      const canSendNotification = !lastMissedNotification || 
        (new Date().getTime() - new Date(lastMissedNotification).getTime()) > 4 * 60 * 60 * 1000;
      
      if (canSendNotification && (shouldSendMorningReminder || shouldSendEveningReminder)) {
        console.log('[NotificationContext] Sending missed routine notification');
        await sendMissedRoutineNotification();
        await AsyncStorage.setItem('last_missed_routine_notification', new Date().toISOString());
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
