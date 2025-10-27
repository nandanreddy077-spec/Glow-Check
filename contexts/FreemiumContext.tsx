import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthContext';
import { useSubscription } from './SubscriptionContext';
import { supabase } from '@/lib/supabase';
import { scheduleTrialConversionReminders } from '@/lib/notifications';

interface TrialTracking {
  id: string;
  first_scan_at?: string;
  last_free_scan_at?: string;
  free_scans_used: number;
  results_unlocked_until?: string;
  trial_started_at?: string;
  trial_ends_at?: string;
  has_payment_method: boolean;
  payment_added_at?: string;
}

interface UsageTracking {
  glow_analysis: number;
  style_analysis: number;
  last_reset_date: string;
}

interface FreemiumContextType {
  canScanGlow: boolean;
  canScanStyle: boolean;
  glowScansLeft: number;
  styleScansLeft: number;
  isFreemiumUser: boolean;
  isFreeUser: boolean;
  isTrialUser: boolean;
  isPaidUser: boolean;
  hasUsedFreeGlowScan: boolean;
  hasUsedFreeStyleScan: boolean;
  glowScansToday: number;
  styleScansToday: number;
  incrementGlowScan: () => Promise<void>;
  incrementStyleScan: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  showTrialUpgradeModal: boolean;
  setShowTrialUpgradeModal: (show: boolean) => void;
  resultsUnlockedUntil: string | null;
}

const FREE_SCANS = 1;
const TRIAL_DAILY_SCANS = 2;

export const [FreemiumProvider, useFreemium] = createContextHook<FreemiumContextType>(() => {
  const { user } = useAuth();
  const { state: subState } = useSubscription();
  const [trialTracking, setTrialTracking] = useState<TrialTracking | null>(null);
  const [usageTracking, setUsageTracking] = useState<UsageTracking>({ glow_analysis: 0, style_analysis: 0, last_reset_date: new Date().toISOString().split('T')[0] });
  const [showTrialUpgradeModal, setShowTrialUpgradeModal] = useState<boolean>(false);

  const isFreeUser = useMemo(() => {
    return !subState.isPremium && !subState.hasStartedTrial;
  }, [subState.isPremium, subState.hasStartedTrial]);

  const isTrialUser = useMemo(() => {
    return !subState.isPremium && subState.hasStartedTrial && subState.hasAddedPayment;
  }, [subState.isPremium, subState.hasStartedTrial, subState.hasAddedPayment]);

  const isPaidUser = useMemo(() => {
    return subState.isPremium;
  }, [subState.isPremium]);

  const isFreemiumUser = useMemo(() => {
    return !subState.isPremium;
  }, [subState.isPremium]);

  const hasUsedFreeGlowScan = useMemo(() => {
    return usageTracking.glow_analysis >= 1;
  }, [usageTracking.glow_analysis]);

  const hasUsedFreeStyleScan = useMemo(() => {
    return usageTracking.style_analysis >= 1;
  }, [usageTracking.style_analysis]);

  const loadUsage = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: trialData, error: trialError } = await supabase
        .from('trial_tracking')
        .select('*')
        .eq('id', user.id)
        .single();

      if (trialError && trialError.code !== 'PGRST116') {
        console.error('Error loading trial tracking:', trialError.message || trialError);
      } else if (trialData) {
        setTrialTracking(trialData);
      }

      const { data: usageData, error: usageError } = await supabase
        .from('usage_tracking')
        .select('feature_type, usage_count, last_reset_date')
        .eq('user_id', user.id)
        .in('feature_type', ['glow_analysis', 'style_analysis']);

      if (usageError) {
        console.error('Error loading usage tracking:', usageError.message || usageError);
      } else if (usageData) {
        const today = new Date().toISOString().split('T')[0];
        const glowUsage = usageData.find(u => u.feature_type === 'glow_analysis');
        const styleUsage = usageData.find(u => u.feature_type === 'style_analysis');
        
        setUsageTracking({
          glow_analysis: glowUsage && glowUsage.last_reset_date === today ? glowUsage.usage_count : 0,
          style_analysis: styleUsage && styleUsage.last_reset_date === today ? styleUsage.usage_count : 0,
          last_reset_date: today,
        });
      }
    } catch (error: any) {
      console.error('Error loading scan usage:', error?.message || String(error));
    }
  }, [user?.id]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const glowScansToday = useMemo(() => {
    return usageTracking.glow_analysis;
  }, [usageTracking.glow_analysis]);

  const styleScansToday = useMemo(() => {
    return usageTracking.style_analysis;
  }, [usageTracking.style_analysis]);

  const canScanGlow = useMemo(() => {
    if (subState.isPremium) return true;

    const trialActive = subState.hasStartedTrial && subState.hasAddedPayment;
    if (trialActive) {
      const scansToday = usageTracking.glow_analysis;
      console.log('Trial glow scan check:', { scansToday, limit: TRIAL_DAILY_SCANS, canScan: scansToday < TRIAL_DAILY_SCANS });
      return scansToday < TRIAL_DAILY_SCANS;
    }

    const canScan = usageTracking.glow_analysis < FREE_SCANS;
    console.log('Free glow scan check:', { used: usageTracking.glow_analysis, limit: FREE_SCANS, canScan });
    return canScan;
  }, [subState.isPremium, subState.hasStartedTrial, subState.hasAddedPayment, usageTracking.glow_analysis]);

  const canScanStyle = useMemo(() => {
    if (subState.isPremium) return true;

    const trialActive = subState.hasStartedTrial && subState.hasAddedPayment;
    if (trialActive) {
      const scansToday = usageTracking.style_analysis;
      console.log('Trial style scan check:', { scansToday, limit: TRIAL_DAILY_SCANS, canScan: scansToday < TRIAL_DAILY_SCANS });
      return scansToday < TRIAL_DAILY_SCANS;
    }

    const canScan = usageTracking.style_analysis < FREE_SCANS;
    console.log('Free style scan check:', { used: usageTracking.style_analysis, limit: FREE_SCANS, canScan });
    return canScan;
  }, [subState.isPremium, subState.hasStartedTrial, subState.hasAddedPayment, usageTracking.style_analysis]);

  const glowScansLeft = useMemo(() => {
    if (subState.isPremium) return Infinity;

    const trialActive = subState.hasStartedTrial && subState.hasAddedPayment;
    if (trialActive) {
      const scansToday = usageTracking.glow_analysis;
      return Math.max(0, TRIAL_DAILY_SCANS - scansToday);
    }

    return Math.max(0, FREE_SCANS - usageTracking.glow_analysis);
  }, [subState.isPremium, subState.hasStartedTrial, subState.hasAddedPayment, usageTracking.glow_analysis]);

  const styleScansLeft = useMemo(() => {
    if (subState.isPremium) return Infinity;

    const trialActive = subState.hasStartedTrial && subState.hasAddedPayment;
    if (trialActive) {
      const scansToday = usageTracking.style_analysis;
      return Math.max(0, TRIAL_DAILY_SCANS - scansToday);
    }

    return Math.max(0, FREE_SCANS - usageTracking.style_analysis);
  }, [subState.isPremium, subState.hasStartedTrial, subState.hasAddedPayment, usageTracking.style_analysis]);

  const incrementGlowScan = useCallback(async () => {
    if (!user?.id) return;

    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Incrementing glow scan...');
    console.log('Current state:', { hasStartedTrial: subState.hasStartedTrial, today, currentUsed: usageTracking.glow_analysis });

    try {
      const { error } = await supabase.rpc('increment_usage_tracking', {
        p_user_id: user.id,
        p_feature_type: 'glow_analysis'
      });

      if (error) {
        console.error('Error incrementing glow scan:', error.message || error);
        return;
      }

      const resultsExpiryTime = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      
      const { error: trialError } = await supabase
        .from('trial_tracking')
        .upsert({
          id: user.id,
          first_scan_at: trialTracking?.first_scan_at || now,
          results_unlocked_until: resultsExpiryTime,
          updated_at: now,
        }, {
          onConflict: 'id'
        });

      if (trialError) {
        console.error('Error updating trial tracking:', trialError.message || trialError);
      } else {
        console.log('[FreemiumContext] Scheduling trial conversion notifications');
        await scheduleTrialConversionReminders(resultsExpiryTime);
      }
      
      console.log('Glow scan incremented successfully. Reloading usage...');
      await loadUsage();

      const newGlowCount = usageTracking.glow_analysis + 1;
      if (!subState.isPremium && !subState.hasStartedTrial && newGlowCount >= FREE_SCANS) {
        console.log('Showing trial upgrade modal');
        setShowTrialUpgradeModal(true);
      }
    } catch (error: any) {
      console.error('Failed to increment glow scan:', error?.message || String(error));
    }
  }, [user?.id, trialTracking, subState.isPremium, subState.hasStartedTrial, usageTracking.glow_analysis, loadUsage]);

  const incrementStyleScan = useCallback(async () => {
    if (!user?.id) return;

    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Incrementing style scan...');
    console.log('Current state:', { hasStartedTrial: subState.hasStartedTrial, today, currentUsed: usageTracking.style_analysis });

    try {
      const { error } = await supabase.rpc('increment_usage_tracking', {
        p_user_id: user.id,
        p_feature_type: 'style_analysis'
      });

      if (error) {
        console.error('Error incrementing style scan:', error.message || error);
        return;
      }

      const resultsExpiryTime = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      
      const { error: trialError } = await supabase
        .from('trial_tracking')
        .upsert({
          id: user.id,
          first_scan_at: trialTracking?.first_scan_at || now,
          results_unlocked_until: resultsExpiryTime,
          updated_at: now,
        }, {
          onConflict: 'id'
        });

      if (trialError) {
        console.error('Error updating trial tracking:', trialError.message || trialError);
      } else {
        console.log('[FreemiumContext] Scheduling trial conversion notifications');
        await scheduleTrialConversionReminders(resultsExpiryTime);
      }
      
      console.log('Style scan incremented successfully. Reloading usage...');
      await loadUsage();

      const newStyleCount = usageTracking.style_analysis + 1;
      if (!subState.isPremium && !subState.hasStartedTrial && newStyleCount >= FREE_SCANS) {
        console.log('Showing trial upgrade modal');
        setShowTrialUpgradeModal(true);
      }
    } catch (error: any) {
      console.error('Failed to increment style scan:', error?.message || String(error));
    }
  }, [user?.id, trialTracking, subState.isPremium, subState.hasStartedTrial, usageTracking.style_analysis, loadUsage]);

  const refreshUsage = useCallback(async () => {
    await loadUsage();
  }, [loadUsage]);

  const resultsUnlockedUntil = useMemo(() => {
    return trialTracking?.results_unlocked_until || null;
  }, [trialTracking?.results_unlocked_until]);

  return useMemo(() => ({
    canScanGlow,
    canScanStyle,
    glowScansLeft,
    styleScansLeft,
    isFreemiumUser,
    isFreeUser,
    isTrialUser,
    isPaidUser,
    hasUsedFreeGlowScan,
    hasUsedFreeStyleScan,
    glowScansToday,
    styleScansToday,
    incrementGlowScan,
    incrementStyleScan,
    refreshUsage,
    showTrialUpgradeModal,
    setShowTrialUpgradeModal,
    resultsUnlockedUntil,
  }), [
    canScanGlow,
    canScanStyle,
    glowScansLeft,
    styleScansLeft,
    isFreemiumUser,
    isFreeUser,
    isTrialUser,
    isPaidUser,
    hasUsedFreeGlowScan,
    hasUsedFreeStyleScan,
    glowScansToday,
    styleScansToday,
    incrementGlowScan,
    incrementStyleScan,
    refreshUsage,
    showTrialUpgradeModal,
    resultsUnlockedUntil,
  ]);
});
