import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import { paymentService, PRODUCT_IDS, trackPurchaseEvent } from '@/lib/payments';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionState {
  isPremium: boolean;
  trialStartedAt?: string;
  trialEndsAt?: string;
  subscriptionType?: 'monthly' | 'yearly';
  subscriptionPrice?: number;
  nextBillingDate?: string;
  scanCount: number;
  weeklyScansUsed: number;
  maxWeeklyScans: number;
  lastScanResetDate?: string;
  maxScansInTrial: number;
  hasStartedTrial: boolean;
  hasAddedPayment: boolean;
  trialRequiresPayment: boolean;
  firstScanCompletedAt?: string;
  resultsUnlockedUntil?: string;
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
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
}

const STORAGE_KEY = 'lumyn_subscription_state';

const DEFAULT_STATE: SubscriptionState = {
  isPremium: true,
  scanCount: 0,
  weeklyScansUsed: 0,
  maxWeeklyScans: 999,
  maxScansInTrial: 999,
  hasStartedTrial: true,
  hasAddedPayment: true,
  trialRequiresPayment: false,
};

export const [SubscriptionProvider, useSubscription] = createContextHook<SubscriptionContextType>(() => {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const { user } = useAuth();

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
      hasAddedPayment: true,
      scanCount: 0,
      weeklyScansUsed: 0,
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
    const trialActive = state.hasStartedTrial && inTrial && state.hasAddedPayment;
    if (trialActive) return true;

    const now = new Date();
    const lastReset = state.lastScanResetDate ? new Date(state.lastScanResetDate) : null;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    if (!lastReset || lastReset < weekStart) {
      return true;
    }

    return state.weeklyScansUsed < state.maxWeeklyScans;
  }, [state.isPremium, state.hasStartedTrial, state.hasAddedPayment, inTrial, state.weeklyScansUsed, state.maxWeeklyScans, state.lastScanResetDate]);

  const scansLeft = useMemo(() => {
    if (state.isPremium) return Infinity;
    const trialActive = state.hasStartedTrial && inTrial && state.hasAddedPayment;
    if (trialActive) return Infinity;

    const now = new Date();
    const lastReset = state.lastScanResetDate ? new Date(state.lastScanResetDate) : null;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    if (!lastReset || lastReset < weekStart) {
      return state.maxWeeklyScans;
    }

    return Math.max(0, state.maxWeeklyScans - state.weeklyScansUsed);
  }, [state.isPremium, state.hasStartedTrial, state.hasAddedPayment, inTrial, state.maxWeeklyScans, state.weeklyScansUsed, state.lastScanResetDate]);

  const incrementScanCount = useCallback(async () => {
    const now = new Date();
    const lastReset = state.lastScanResetDate ? new Date(state.lastScanResetDate) : null;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    let weeklyScansUsed = state.weeklyScansUsed;
    let lastScanResetDate = state.lastScanResetDate;
    
    if (!lastReset || lastReset < weekStart) {
      weeklyScansUsed = 0;
      lastScanResetDate = now.toISOString();
    }
    
    const resultsUnlockedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    
    const next: SubscriptionState = { 
      ...state, 
      scanCount: state.scanCount + 1,
      weeklyScansUsed: weeklyScansUsed + 1,
      lastScanResetDate,
      firstScanCompletedAt: state.firstScanCompletedAt || now.toISOString(),
      resultsUnlockedUntil: state.isPremium || (state.hasStartedTrial && inTrial) ? undefined : resultsUnlockedUntil,
    };
    await persist(next);
  }, [persist, state, inTrial]);

  const setSubscriptionData = useCallback(async (data: Partial<SubscriptionState>) => {
    const next: SubscriptionState = { ...state, ...data };
    await persist(next);
  }, [persist, state]);

  // Sync subscription status with backend
  const syncSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      // Get subscription status from Supabase with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const subscriptionPromise = supabase
        .rpc('get_user_subscription_status', { user_uuid: user.id });
      
      const { data, error } = await Promise.race([
        subscriptionPromise,
        timeoutPromise
      ]) as any;
      
      if (error) {
        // Silently fail and use local state
        return;
      }
      
      if (data && data.length > 0) {
        const subscription = data[0];
        
        // Update local state with backend data
        const backendState: Partial<SubscriptionState> = {
          isPremium: subscription.is_premium,
          subscriptionType: subscription.subscription_product_id?.includes('annual') ? 'yearly' : 'monthly',
          subscriptionPrice: subscription.subscription_product_id?.includes('annual') ? 99 : 8.99,
          nextBillingDate: subscription.expires_at,
        };
        
        await setSubscriptionData(backendState);
      }
    } catch {
      // Silently fail - app will use local AsyncStorage state
      // This is expected when backend sync is not available
    }
  }, [user?.id, setSubscriptionData]);

  useEffect(() => {
    (async () => {
      try {
        // Load local state first
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setState(JSON.parse(raw) as SubscriptionState);
        }
        
        // Sync with backend if user is authenticated (non-blocking)
        if (user?.id) {
          syncSubscriptionStatus().catch(err => {
            console.log('Background sync failed, using local state:', err.message);
          });
        }
      } catch (e) {
        console.log('Failed to load subscription state', e);
      }
    })();
  }, [user?.id, syncSubscriptionStatus]);
  
  const processInAppPurchase = useCallback(async (type: 'monthly' | 'yearly'): Promise<{ success: boolean; purchaseToken?: string; originalTransactionId?: string; error?: string }> => {
    try {
      console.log(`Processing ${type} in-app purchase...`);
      
      if (Platform.OS === 'web') {
        console.log('In-app purchases not available on web');
        return { success: false, error: 'In-app purchases not supported on web. Please use the mobile app.' };
      }
      
      const initialized = await paymentService.initialize();
      if (!initialized) {
        return { success: false, error: 'Payment service unavailable. Please try again later.' };
      }
      
      const productId = type === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.YEARLY;
      
      const result = await paymentService.purchaseProduct(productId);
      
      if (result.success && result.transactionId && result.purchaseToken) {
        console.log('Purchase successful! Activating premium access...');
        
        const price = type === 'yearly' ? 99 : 8.99;
        trackPurchaseEvent(productId, price, 'USD');
        
        await setPremium(true, type);
        await setSubscriptionData({
          purchaseToken: result.purchaseToken,
          originalTransactionId: result.transactionId,
          hasAddedPayment: true,
          hasStartedTrial: false,
          trialStartedAt: undefined,
          trialEndsAt: undefined,
        });
        
        if (user?.id) {
          try {
            await supabase
              .from('profiles')
              .update({ 
                revenuecat_user_id: user.id,
                subscription_status: 'premium',
                subscription_product_id: productId,
                is_premium: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);
            
            console.log('Premium status synced with backend');
          } catch (backendError) {
            console.error('Failed to update backend subscription status:', backendError);
          }
        }
        
        console.log('Premium activated successfully!');
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
  }, [setPremium, setSubscriptionData, user?.id]);

  // Can view results (not blurred)
  const canViewResults = useMemo(() => {
    if (state.isPremium) return true;
    const trialActive = state.hasStartedTrial && inTrial && state.hasAddedPayment;
    if (trialActive) return true;

    if (state.resultsUnlockedUntil) {
      return new Date(state.resultsUnlockedUntil).getTime() > Date.now();
    }

    return false;
  }, [state.isPremium, state.hasStartedTrial, state.hasAddedPayment, inTrial, state.resultsUnlockedUntil]);

  // Needs premium (show paywall)
  const needsPremium = useMemo(() => {
    if (state.isPremium) return false;
    const trialActive = state.hasStartedTrial && inTrial && state.hasAddedPayment;
    if (trialActive) return false;
    return isTrialExpired || !canScan || !canViewResults;
  }, [state.isPremium, state.hasStartedTrial, state.hasAddedPayment, inTrial, isTrialExpired, canScan, canViewResults]);

  const restorePurchases = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Restoring purchases...');
      
      if (Platform.OS === 'web') {
        console.log('Restore purchases not available on web');
        return { success: false, error: 'Restore purchases not supported on web.' };
      }
      
      // Initialize payment service
      const initialized = await paymentService.initialize();
      if (!initialized) {
        return { success: false, error: 'Payment service unavailable. Please try again later.' };
      }
      
      // Restore purchases - returns SubscriptionInfo[]
      const subscriptions = await paymentService.restorePurchases();
      
      if (subscriptions && subscriptions.length > 0) {
        console.log('Purchases restored successfully:', subscriptions);
        
        // Update local state with restored subscription
        const activeSubscription = subscriptions[0];
        const subscriptionType = activeSubscription.productId.includes('annual') || activeSubscription.productId.includes('yearly') 
          ? 'yearly' 
          : 'monthly';
        
        await setPremium(true, subscriptionType);
        await setSubscriptionData({
          purchaseToken: activeSubscription.purchaseToken,
          originalTransactionId: activeSubscription.originalTransactionId,
          nextBillingDate: activeSubscription.expiryDate,
        });
        
        // Sync with backend to get the latest subscription status
        if (user?.id) {
          await syncSubscriptionStatus();
        }
        
        return { success: true };
      } else {
        console.log('No purchases to restore');
        return { 
          success: false, 
          error: 'No purchases found to restore.' 
        };
      }
      
    } catch (error) {
      console.error('Restore purchases error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' 
      };
    }
  }, [user?.id, syncSubscriptionStatus, setPremium, setSubscriptionData]);

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
    restorePurchases,
  }), [state, inTrial, daysLeft, hoursLeft, canScan, scansLeft, isTrialExpired, canViewResults, needsPremium, startLocalTrial, setPremium, setSubscriptionData, incrementScanCount, reset, processInAppPurchase, restorePurchases]);
});