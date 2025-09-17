import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

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
  deviceId?: string;
  trialUsedDevices?: string[];
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
  processInAppPurchase: (type: 'monthly' | 'yearly') => Promise<{ success: boolean; purchaseToken?: string; originalTransactionId?: string }>;
}

const STORAGE_KEY = 'glowcheck_subscription_state';
const DEVICE_TRIAL_KEY = 'glowcheck_device_trials';

const DEFAULT_STATE: SubscriptionState = {
  isPremium: false,
  scanCount: 0,
  maxScansInTrial: 999, // Unlimited scans during trial
  hasStartedTrial: false,
};

const getDeviceId = async (): Promise<string> => {
  try {
    // Try to get a unique device identifier
    if (Platform.OS === 'web') {
      // For web, use a combination of user agent and screen info
      const webId = btoa(navigator.userAgent + screen.width + screen.height).slice(0, 16);
      return `web_${webId}`;
    } else {
      // For mobile, use device model + OS version as fallback
      const deviceInfo = `${Device.modelName || 'unknown'}_${Device.osVersion || 'unknown'}`;
      return deviceInfo.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 32);
    }
  } catch (error) {
    console.log('Failed to get device ID, using fallback', error);
    return `fallback_${Date.now()}`;
  }
};

export const [SubscriptionProvider, useSubscription] = createContextHook<SubscriptionContextType>(() => {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);

  useEffect(() => {
    (async () => {
      try {
        const deviceId = await getDeviceId();
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const deviceTrialsRaw = await AsyncStorage.getItem(DEVICE_TRIAL_KEY);
        
        let currentState = DEFAULT_STATE;
        if (raw) {
          currentState = JSON.parse(raw) as SubscriptionState;
        }
        
        // Check if this device has already used a trial
        let trialUsedDevices: string[] = [];
        if (deviceTrialsRaw) {
          trialUsedDevices = JSON.parse(deviceTrialsRaw);
        }
        
        const hasDeviceUsedTrial = trialUsedDevices.includes(deviceId);
        
        // If device has used trial before, check if trial is still active
        if (hasDeviceUsedTrial) {
          // If trial was started but no end date, or trial has expired, mark as expired
          if (!currentState.trialEndsAt || new Date(currentState.trialEndsAt).getTime() <= Date.now()) {
            currentState = {
              ...currentState,
              hasStartedTrial: true,
              deviceId,
              trialUsedDevices,
              // Clear trial dates if expired
              trialStartedAt: undefined,
              trialEndsAt: undefined
            };
          } else {
            // Trial is still active
            currentState = {
              ...currentState,
              deviceId,
              trialUsedDevices
            };
          }
        } else {
          currentState = {
            ...currentState,
            deviceId,
            trialUsedDevices
          };
        }
        
        setState(currentState);
      } catch (e) {
        console.log('Failed to load subscription state', e);
      }
    })();
  }, []);

  const persist = useCallback(async (next: SubscriptionState) => {
    if (!next || typeof next !== 'object') {
      console.error('Invalid subscription state provided to persist');
      return;
    }
    
    setState(next);
    try {
      const sanitizedState = {
        ...next,
        // Ensure strings are properly sanitized
        trialStartedAt: next.trialStartedAt?.trim(),
        trialEndsAt: next.trialEndsAt?.trim(),
        subscriptionType: next.subscriptionType,
        purchaseToken: next.purchaseToken?.trim(),
        originalTransactionId: next.originalTransactionId?.trim(),
        deviceId: next.deviceId?.trim(),
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedState));
      
      // Also persist device trial usage
      if (next.trialUsedDevices && Array.isArray(next.trialUsedDevices)) {
        const sanitizedDevices = next.trialUsedDevices.filter(id => id && typeof id === 'string' && id.trim().length > 0);
        await AsyncStorage.setItem(DEVICE_TRIAL_KEY, JSON.stringify(sanitizedDevices));
      }
    } catch (e) {
      console.log('Failed to save subscription state', e);
    }
  }, []);

  const startLocalTrial = useCallback(async (days: number = 3) => {
    const deviceId = await getDeviceId();
    const deviceTrialsRaw = await AsyncStorage.getItem(DEVICE_TRIAL_KEY);
    let trialUsedDevices: string[] = [];
    
    if (deviceTrialsRaw) {
      trialUsedDevices = JSON.parse(deviceTrialsRaw);
    }
    
    // Check if this device has already used a trial
    if (trialUsedDevices.includes(deviceId)) {
      console.log('Device has already used trial, cannot start new trial');
      // Force user to subscription screen
      const { router } = await import('expo-router');
      router.push('/unlock-glow');
      return;
    }
    
    const now = new Date();
    const ends = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    // Add device to trial used list
    const updatedTrialDevices = [...trialUsedDevices, deviceId];
    
    const next: SubscriptionState = {
      ...state,
      trialStartedAt: now.toISOString(),
      trialEndsAt: ends.toISOString(),
      hasStartedTrial: true,
      scanCount: 0, // Reset scan count when starting trial
      deviceId,
      trialUsedDevices: updatedTrialDevices
    };
    await persist(next);
  }, [persist, state]);

  const setPremium = useCallback(async (value: boolean, type: 'monthly' | 'yearly' = 'monthly') => {
    const price = type === 'yearly' ? 99 : 8.90;
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
    
    // Check if device has already used trial and trial is expired
    if (state.deviceId && state.trialUsedDevices?.includes(state.deviceId)) {
      // Device has used trial, only allow if currently in trial period
      return inTrial;
    }
    
    if (!state.hasStartedTrial) return true; // First time user can scan to start trial
    return inTrial; // During trial, unlimited scans
  }, [state.isPremium, state.hasStartedTrial, state.deviceId, state.trialUsedDevices, inTrial]);

  const scansLeft = useMemo(() => {
    if (state.isPremium) return Infinity;
    if (inTrial) return Infinity; // Unlimited during trial
    return 0; // No scans after trial expires
  }, [state.isPremium, inTrial]);

  const incrementScanCount = useCallback(async () => {
    const deviceId = await getDeviceId();
    
    // Check if device has already used trial and trial is expired
    if (state.trialUsedDevices?.includes(deviceId) && !state.isPremium && !inTrial) {
      // Device has used trial and it's expired, force subscription
      const { router } = await import('expo-router');
      router.push('/unlock-glow');
      return;
    }
    
    // Auto-start trial on first scan if not already started
    if (!state.hasStartedTrial && !state.isPremium) {
      await startLocalTrial(3);
      return;
    }
    
    // Just increment scan count for analytics, no limits during trial
    const next: SubscriptionState = { 
      ...state, 
      scanCount: state.scanCount + 1 
    };
    await persist(next);
  }, [persist, state, startLocalTrial, inTrial]);

  const processInAppPurchase = useCallback(async (type: 'monthly' | 'yearly'): Promise<{ success: boolean; purchaseToken?: string; originalTransactionId?: string }> => {
    try {
      console.log(`Processing ${type} in-app purchase...`);
      
      if (Platform.OS === 'web') {
        console.log('In-app purchases not available on web');
        return { success: false };
      }
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, simulate successful payment
      // In a real app, you would use react-native-iap or expo-in-app-purchases
      const purchaseToken = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transactionId = `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await setPremium(true, type);
      await setSubscriptionData({
        purchaseToken,
        originalTransactionId: transactionId,
      });
      
      console.log(`Successfully processed ${type} subscription`);
      
      return { 
        success: true, 
        purchaseToken,
        originalTransactionId: transactionId 
      };
      
    } catch (error) {
      console.error('In-app purchase error:', error);
      return { success: false };
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