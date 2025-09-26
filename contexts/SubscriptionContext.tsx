import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import { paymentService, PRODUCT_IDS, trackPurchaseEvent, trackTrialStartEvent } from '@/lib/payments';

export interface SubscriptionState {
  isPremium: boolean;
  trialStartedAt?: string;
  trialEndsAt?: string;
  subscriptionType?: 'monthly' | 'yearly';
  subscriptionPrice?: number;
  nextBillingDate?: string;
  scanCount: number;
  maxScansInTrial: number;
  hasStartedTrial: boolean;
  purchaseToken?: string;
  originalTransactionId?: string;
}

export interface SubscriptionContextType {
  state: SubscriptionState;
  inTrial: boolean;
  daysLeft: number;
  hoursLeft: number;
  canScan: boolean;
  scansLeft: number;
  isTrialExpired: boolean;
  canViewResults: boolean;
  needsPremium: boolean;
  startLocalTrial: (days?: number) => Promise<void>;
  setPremium: (value: boolean, type?: 'monthly' | 'yearly') => Promise<void>;
  setSubscriptionData: (data: Partial<SubscriptionState>) => Promise<void>;
  incrementScanCount: () => Promise<void>;
  reset: () => Promise<void>;
  processInAppPurchase: (type: 'monthly' | 'yearly') => Promise<{ success: boolean; purchaseToken?: string; originalTransactionId?: string; error?: string }>;
}

const STORAGE_KEY = 'glowcheck_subscription_state';

const DEFAULT_STATE: SubscriptionState = {
  isPremium: false,
  scanCount: 0,
  maxScansInTrial: 3,
  hasStartedTrial: false,
};

export const [SubscriptionProvider, useSubscription] = createContextHook<SubscriptionContextType>(() => {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setState(JSON.parse(raw) as SubscriptionState);
        }
      } catch (e) {
        console.log('Failed to load subscription state', e);
      }
    })();
  }, []);

  const persist = useCallback(async (next: SubscriptionState) => {
    setState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.log('Failed to save subscription state', e);
    }
  }, []);

  const startLocalTrial = useCallback(async (days: number = 3) => {
    const now = new Date();
    const ends = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const next: SubscriptionState = {
      ...state,
      trialStartedAt: now.toISOString(),
      trialEndsAt: ends.toISOString(),
      hasStartedTrial: true,
      scanCount: 0, // Reset scan count when starting trial
    };
    await persist(next);
  }, [persist, state]);

  const setPremium = useCallback(async (value: boolean, type: 'monthly' | 'yearly' = 'monthly') => {
    const price = type === 'yearly' ? 99 : 8.99;
    const nextBillingDate = new Date();
    if (type === 'yearly') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }
    
    const next: SubscriptionState = { 
      ...state, 
      isPremium: value,
      subscriptionType: type,
      subscriptionPrice: price,
      nextBillingDate: nextBillingDate.toISOString(),
    };
    await persist(next);
  }, [persist, state]);

  const setSubscriptionData = useCallback(async (data: Partial<SubscriptionState>) => {
    const next: SubscriptionState = { ...state, ...data };
    await persist(next);
  }, [persist, state]);

  const reset = useCallback(async () => {
    await persist(DEFAULT_STATE);
  }, [persist]);

  const inTrial = useMemo(() => {
    if (!state.trialEndsAt) return false;
    return new Date(state.trialEndsAt).getTime() > Date.now();
  }, [state.trialEndsAt]);

  const daysLeft = useMemo(() => {
    if (!state.trialEndsAt) return 0;
    const ms = new Date(state.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }, [state.trialEndsAt]);

  const hoursLeft = useMemo(() => {
    if (!state.trialEndsAt) return 0;
    const ms = new Date(state.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (60 * 60 * 1000)));
  }, [state.trialEndsAt]);

  const isTrialExpired = useMemo(() => {
    if (!state.hasStartedTrial) return false;
    return !inTrial; // Trial is expired if it was started but is no longer active
  }, [inTrial, state.hasStartedTrial]);

  const canScan = useMemo(() => {
    if (state.isPremium) return true;
    if (!state.hasStartedTrial) return true; // First time user can scan to start trial
    return inTrial && state.scanCount < state.maxScansInTrial;
  }, [state.isPremium, state.hasStartedTrial, inTrial, state.scanCount, state.maxScansInTrial]);

  const scansLeft = useMemo(() => {
    if (state.isPremium) return Infinity;
    return Math.max(0, state.maxScansInTrial - state.scanCount);
  }, [state.isPremium, state.maxScansInTrial, state.scanCount]);

  const incrementScanCount = useCallback(async () => {
    // Auto-start trial on first scan if not already started
    if (!state.hasStartedTrial && !state.isPremium) {
      await startLocalTrial(3);
      return;
    }
    
    const next: SubscriptionState = { 
      ...state, 
      scanCount: state.scanCount + 1 
    };
    await persist(next);
    
    // Check if user has reached scan limit and should see subscription screen
    if (next.scanCount >= next.maxScansInTrial && !next.isPremium && !isTrialExpired) {
      // Import router dynamically to avoid circular dependency
      const { router } = await import('expo-router');
      router.push('/unlock-glow');
    }
  }, [persist, state, startLocalTrial, isTrialExpired]);

  const processInAppPurchase = useCallback(async (type: 'monthly' | 'yearly'): Promise<{ success: boolean; purchaseToken?: string; originalTransactionId?: string; error?: string }> => {
    try {
      console.log(`Processing ${type} in-app purchase...`);
      
      if (Platform.OS === 'web') {
        console.log('In-app purchases not available on web');
        return { success: false, error: 'In-app purchases not supported on web. Please use the mobile app.' };
      }
      
      // Initialize payment service
      const initialized = await paymentService.initialize();
      if (!initialized) {
        return { success: false, error: 'Payment service unavailable. Please try again later.' };
      }
      
      // Get the product ID for the subscription type
      const productId = type === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.YEARLY;
      
      // Attempt the purchase
      const result = await paymentService.purchaseProduct(productId);
      
      if (result.success && result.transactionId && result.purchaseToken) {
        console.log('Purchase successful:', result);
        
        // Track the purchase event
        const price = type === 'yearly' ? 99 : 8.99;
        trackPurchaseEvent(productId, price, 'USD');
        
        // Update subscription state
        await setPremium(true, type);
        await setSubscriptionData({
          purchaseToken: result.purchaseToken,
          originalTransactionId: result.transactionId,
        });
        
        return { 
          success: true, 
          purchaseToken: result.purchaseToken,
          originalTransactionId: result.transactionId 
        };
      } else if (result.cancelled) {
        console.log('Purchase cancelled by user');
        return { 
          success: false, 
          error: 'Purchase cancelled' 
        };
      } else if (result.error === 'STORE_REDIRECT') {
        console.log('User redirected to app store');
        return { 
          success: false, 
          error: 'STORE_REDIRECT' 
        };
      } else {
        console.log('Purchase failed:', result.error);
        return { 
          success: false, 
          error: result.error || 'Payment failed. Please try again.' 
        };
      }
      
    } catch (error) {
      console.error('In-app purchase error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
      };
    }
  }, [setPremium, setSubscriptionData]);

  // Can view results (not blurred)
  const canViewResults = useMemo(() => {
    if (state.isPremium) return true;
    return inTrial; // Can view results during trial
  }, [state.isPremium, inTrial]);

  // Needs premium (show paywall)
  const needsPremium = useMemo(() => {
    if (state.isPremium) return false;
    return isTrialExpired || !canScan;
  }, [state.isPremium, isTrialExpired, canScan]);

  return useMemo(() => ({
    state,
    inTrial,
    daysLeft,
    hoursLeft,
    canScan,
    scansLeft,
    isTrialExpired,
    canViewResults,
    needsPremium,
    startLocalTrial,
    setPremium,
    setSubscriptionData,
    incrementScanCount,
    reset,
    processInAppPurchase,
  }), [state, inTrial, daysLeft, hoursLeft, canScan, scansLeft, isTrialExpired, canViewResults, needsPremium, startLocalTrial, setPremium, setSubscriptionData, incrementScanCount, reset, processInAppPurchase]);
});