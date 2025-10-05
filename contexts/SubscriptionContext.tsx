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
  glowAnalysisScans: number;
  styleCheckScans: number;
  freeGlowScansUsed: number;
  freeStyleScansUsed: number;
  maxFreeGlowScans: number;
  maxFreeStyleScans: number;
  maxGlowScansInTrial: number;
  maxStyleScansInTrial: number;
  hasStartedTrial: boolean;
  hasAddedPayment: boolean;
  trialRequiresPayment: boolean;
  purchaseToken?: string;
  originalTransactionId?: string;
}

export interface SubscriptionContextType {
  state: SubscriptionState;
  inTrial: boolean;
  daysLeft: number;
  hoursLeft: number;
  canScanGlowAnalysis: boolean;
  canScanStyleCheck: boolean;
  glowScansLeft: number;
  styleScansLeft: number;
  isTrialExpired: boolean;
  canViewResults: boolean;
  needsPremium: boolean;
  startLocalTrial: (days?: number) => Promise<void>;
  setPremium: (value: boolean, type?: 'monthly' | 'yearly') => Promise<void>;
  setSubscriptionData: (data: Partial<SubscriptionState>) => Promise<void>;
  incrementGlowScanCount: () => Promise<void>;
  incrementStyleScanCount: () => Promise<void>;
  reset: () => Promise<void>;
  processInAppPurchase: (type: 'monthly' | 'yearly') => Promise<{ success: boolean; purchaseToken?: string; originalTransactionId?: string; error?: string }>;
}

const STORAGE_KEY = 'glowcheck_subscription_state';

const DEFAULT_STATE: SubscriptionState = {
  isPremium: false,
  glowAnalysisScans: 0,
  styleCheckScans: 0,
  freeGlowScansUsed: 0,
  freeStyleScansUsed: 0,
  maxFreeGlowScans: 2,
  maxFreeStyleScans: 2,
  maxGlowScansInTrial: 999,
  maxStyleScansInTrial: 999,
  hasStartedTrial: false,
  hasAddedPayment: false,
  trialRequiresPayment: true,
};

export const [SubscriptionProvider, useSubscription] = createContextHook<SubscriptionContextType>(() => {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const { user } = useAuth();

  // Sync subscription status with backend
  const syncSubscriptionStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('Syncing subscription status with backend...');
      
      // Try to get data directly from subscriptions table
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (subError) {
        console.log('Subscription query error (non-critical):', subError.message);
        return;
      }
      
      if (subData) {
        console.log('Backend subscription found:', subData);
        const backendState: Partial<SubscriptionState> = {
          isPremium: subData.status === 'active' && (!subData.expires_at || new Date(subData.expires_at) > new Date()),
          subscriptionType: subData.product_id?.includes('annual') || subData.product_id?.includes('yearly') ? 'yearly' : 'monthly',
          subscriptionPrice: subData.product_id?.includes('annual') || subData.product_id?.includes('yearly') ? 99 : 8.99,
          nextBillingDate: subData.expires_at,
        };
        
        setState(prev => ({ ...prev, ...backendState }));
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, ...backendState }));
        } catch (e) {
          console.log('Failed to save subscription state', e);
        }
      } else {
        console.log('No subscription found for user');
      }
    } catch (error) {
      console.log('Sync subscription status error (non-critical):', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [user?.id, state]);

  useEffect(() => {
    (async () => {
      try {
        // Load local state first
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setState(JSON.parse(raw) as SubscriptionState);
        }
        
        // Sync with backend if user is authenticated
        if (user?.id) {
          await syncSubscriptionStatus();
        }
      } catch (e) {
        console.log('Failed to load subscription state', e);
      }
    })();
  }, [user?.id, syncSubscriptionStatus]);

  const persist = useCallback(async (next: SubscriptionState) => {
    setState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.log('Failed to save subscription state', e);
    }
  }, []);

  const startLocalTrial = useCallback(async (days: number = 1) => {
    const now = new Date();
    const ends = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const next: SubscriptionState = {
      ...state,
      trialStartedAt: now.toISOString(),
      trialEndsAt: ends.toISOString(),
      hasStartedTrial: true,
      glowAnalysisScans: 0,
      styleCheckScans: 0,
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

  const canScanGlowAnalysis = useMemo(() => {
    if (state.isPremium) return true;
    if (state.freeGlowScansUsed < state.maxFreeGlowScans) return true;
    if (!state.hasStartedTrial || !state.hasAddedPayment) return false;
    return inTrial && state.glowAnalysisScans < state.maxGlowScansInTrial;
  }, [state.isPremium, state.freeGlowScansUsed, state.maxFreeGlowScans, state.hasStartedTrial, state.hasAddedPayment, inTrial, state.glowAnalysisScans, state.maxGlowScansInTrial]);

  const canScanStyleCheck = useMemo(() => {
    if (state.isPremium) return true;
    if (state.freeStyleScansUsed < state.maxFreeStyleScans) return true;
    if (!state.hasStartedTrial || !state.hasAddedPayment) return false;
    return inTrial && state.styleCheckScans < state.maxStyleScansInTrial;
  }, [state.isPremium, state.freeStyleScansUsed, state.maxFreeStyleScans, state.hasStartedTrial, state.hasAddedPayment, inTrial, state.styleCheckScans, state.maxStyleScansInTrial]);

  const glowScansLeft = useMemo(() => {
    if (state.isPremium) return Infinity;
    if (state.freeGlowScansUsed < state.maxFreeGlowScans) {
      return state.maxFreeGlowScans - state.freeGlowScansUsed;
    }
    if (!state.hasStartedTrial || !state.hasAddedPayment) return 0;
    return Math.max(0, state.maxGlowScansInTrial - state.glowAnalysisScans);
  }, [state.isPremium, state.freeGlowScansUsed, state.maxFreeGlowScans, state.hasStartedTrial, state.hasAddedPayment, state.maxGlowScansInTrial, state.glowAnalysisScans]);

  const styleScansLeft = useMemo(() => {
    if (state.isPremium) return Infinity;
    if (state.freeStyleScansUsed < state.maxFreeStyleScans) {
      return state.maxFreeStyleScans - state.freeStyleScansUsed;
    }
    if (!state.hasStartedTrial || !state.hasAddedPayment) return 0;
    return Math.max(0, state.maxStyleScansInTrial - state.styleCheckScans);
  }, [state.isPremium, state.freeStyleScansUsed, state.maxFreeStyleScans, state.hasStartedTrial, state.hasAddedPayment, state.maxStyleScansInTrial, state.styleCheckScans]);

  const incrementGlowScanCount = useCallback(async () => {
    const isUsingFreeScan = state.freeGlowScansUsed < state.maxFreeGlowScans;
    
    const next: SubscriptionState = { 
      ...state, 
      freeGlowScansUsed: isUsingFreeScan ? state.freeGlowScansUsed + 1 : state.freeGlowScansUsed,
      glowAnalysisScans: !isUsingFreeScan ? state.glowAnalysisScans + 1 : state.glowAnalysisScans
    };
    await persist(next);
    
    const allFreeScansUsed = next.freeGlowScansUsed >= next.maxFreeGlowScans && 
                              next.freeStyleScansUsed >= next.maxFreeStyleScans;
    
    if (allFreeScansUsed && !next.hasAddedPayment && !next.isPremium) {
      const { router } = await import('expo-router');
      router.push('/start-trial');
    }
  }, [persist, state]);

  const incrementStyleScanCount = useCallback(async () => {
    const isUsingFreeScan = state.freeStyleScansUsed < state.maxFreeStyleScans;
    
    const next: SubscriptionState = { 
      ...state, 
      freeStyleScansUsed: isUsingFreeScan ? state.freeStyleScansUsed + 1 : state.freeStyleScansUsed,
      styleCheckScans: !isUsingFreeScan ? state.styleCheckScans + 1 : state.styleCheckScans
    };
    await persist(next);
    
    const allFreeScansUsed = next.freeGlowScansUsed >= next.maxFreeGlowScans && 
                              next.freeStyleScansUsed >= next.maxFreeStyleScans;
    
    if (allFreeScansUsed && !next.hasAddedPayment && !next.isPremium) {
      const { router } = await import('expo-router');
      router.push('/start-trial');
    }
  }, [persist, state]);


  
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
        
        // Sync with backend after successful purchase
        if (user?.id) {
          try {
            // Update user's RevenueCat user ID in Supabase
            await supabase
              .from('profiles')
              .update({ 
                revenuecat_user_id: user.id,
                subscription_status: 'premium',
                subscription_product_id: productId,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id);
          } catch (backendError) {
            console.error('Failed to update backend subscription status:', backendError);
            // Don't fail the purchase if backend update fails
          }
        }
        
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
    return inTrial; // Can view results during trial
  }, [state.isPremium, inTrial]);

  const needsPremium = useMemo(() => {
    if (state.isPremium) return false;
    return isTrialExpired || (!canScanGlowAnalysis && !canScanStyleCheck);
  }, [state.isPremium, isTrialExpired, canScanGlowAnalysis, canScanStyleCheck]);

  return useMemo(() => ({
    state,
    inTrial,
    daysLeft,
    hoursLeft,
    canScanGlowAnalysis,
    canScanStyleCheck,
    glowScansLeft,
    styleScansLeft,
    isTrialExpired,
    canViewResults,
    needsPremium,
    startLocalTrial,
    setPremium,
    setSubscriptionData,
    incrementGlowScanCount,
    incrementStyleScanCount,
    reset,
    processInAppPurchase,
  }), [state, inTrial, daysLeft, hoursLeft, canScanGlowAnalysis, canScanStyleCheck, glowScansLeft, styleScansLeft, isTrialExpired, canViewResults, needsPremium, startLocalTrial, setPremium, setSubscriptionData, incrementGlowScanCount, incrementStyleScanCount, reset, processInAppPurchase]);
});