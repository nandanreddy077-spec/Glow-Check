import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthContext';
import { useSubscription } from './SubscriptionContext';
import { useFreemium } from './FreemiumContext';
import { initializeNotifications, sendStreakNotification, sendFreeScanUsedNotification } from '@/lib/notifications';

interface NotificationContextType {
  isInitialized: boolean;
  updateNotificationSchedule: () => Promise<void>;
  triggerStreakNotification: (streakDays: number) => Promise<void>;
  triggerFreeScanUsedNotification: () => Promise<void>;
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

  return useMemo(() => ({
    isInitialized,
    updateNotificationSchedule,
    triggerStreakNotification,
    triggerFreeScanUsedNotification,
  }), [
    isInitialized,
    updateNotificationSchedule,
    triggerStreakNotification,
    triggerFreeScanUsedNotification,
  ]);
});
