import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthContext';
import { useSubscription } from './SubscriptionContext';
import { supabase } from '@/lib/supabase';

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

interface FreemiumContextType {
  canScanGlow: boolean;
  canScanStyle: boolean;
  glowScansLeft: number;
  styleScansLeft: number;
  isFreemiumUser: boolean;
  isFreeUser: boolean;
  isTrialUser: boolean;
  isPaidUser: boolean;
  hasUsedFreeScan: boolean;
  glowScansToday: number;
  styleScansToday: number;
  incrementGlowScan: () => Promise<void>;
  incrementStyleScan: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  showTrialUpgradeModal: boolean;
  setShowTrialUpgradeModal: (show: boolean) => void;
}

const FREE_SCANS = 1;
const TRIAL_DAILY_SCANS = 2;
const TRIAL_DURATION_DAYS = 3;

export const [FreemiumProvider, useFreemium] = createContextHook<FreemiumContextType>(() => {
  const { user } = useAuth();
  const { state: subState } = useSubscription();
  const [trialTracking, setTrialTracking] = useState<TrialTracking | null>(null);
  const [showTrialUpgradeModal, setShowTrialUpgradeModal] = useState<boolean>(false);

  const isFreeUser = useMemo(() => {
    return !subState.isPremium && !subState.hasStartedTrial;
  }, [subState.isPremium, subState.hasStartedTrial]);

  const isTrialUser = useMemo(() => {
    return !subState.isPremium && subState.hasStartedTrial;
  }, [subState.isPremium, subState.hasStartedTrial]);

  const isPaidUser = useMemo(() => {
    return subState.isPremium;
  }, [subState.isPremium]);

  const isFreemiumUser = useMemo(() => {
    return !subState.isPremium;
  }, [subState.isPremium]);

  const hasUsedFreeScan = useMemo(() => {
    return (trialTracking?.free_scans_used || 0) >= 1;
  }, [trialTracking?.free_scans_used]);

  const loadUsage = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('trial_tracking')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading scan usage:', error.message || error);
        return;
      }

      if (data) {
        setTrialTracking(data);
      }
    } catch (error: any) {
      console.error('Failed to load scan usage:', error?.message || String(error));
    }
  }, [user?.id]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const glowScansToday = useMemo(() => {
    if (!trialTracking) return 0;
    if (!subState.hasStartedTrial) return trialTracking.free_scans_used || 0;
    const today = new Date().toISOString().split('T')[0];
    const lastScanDate = trialTracking.last_free_scan_at?.split('T')[0];
    return lastScanDate === today ? (trialTracking.free_scans_used || 0) : 0;
  }, [trialTracking, subState.hasStartedTrial]);

  const styleScansToday = useMemo(() => {
    if (!trialTracking) return 0;
    if (!subState.hasStartedTrial) return trialTracking.free_scans_used || 0;
    const today = new Date().toISOString().split('T')[0];
    const lastScanDate = trialTracking.last_free_scan_at?.split('T')[0];
    return lastScanDate === today ? (trialTracking.free_scans_used || 0) : 0;
  }, [trialTracking, subState.hasStartedTrial]);

  const canScanGlow = useMemo(() => {
    if (subState.isPremium) return true;
    
    if (subState.hasStartedTrial) {
      const today = new Date().toISOString().split('T')[0];
      const lastScanDate = trialTracking?.last_free_scan_at?.split('T')[0];
      const scansToday = lastScanDate === today ? (trialTracking?.free_scans_used || 0) : 0;
      console.log('Trial scan check:', { scansToday, limit: TRIAL_DAILY_SCANS, canScan: scansToday < TRIAL_DAILY_SCANS });
      return scansToday < TRIAL_DAILY_SCANS;
    }
    
    const canScan = (trialTracking?.free_scans_used || 0) < FREE_SCANS;
    console.log('Free scan check:', { used: trialTracking?.free_scans_used, limit: FREE_SCANS, canScan });
    return canScan;
  }, [subState.isPremium, subState.hasStartedTrial, trialTracking?.free_scans_used, trialTracking?.last_free_scan_at]);

  const canScanStyle = useMemo(() => {
    if (subState.isPremium) return true;
    
    if (subState.hasStartedTrial) {
      const today = new Date().toISOString().split('T')[0];
      const lastScanDate = trialTracking?.last_free_scan_at?.split('T')[0];
      const scansToday = lastScanDate === today ? (trialTracking?.free_scans_used || 0) : 0;
      console.log('Trial style scan check:', { scansToday, limit: TRIAL_DAILY_SCANS, canScan: scansToday < TRIAL_DAILY_SCANS });
      return scansToday < TRIAL_DAILY_SCANS;
    }
    
    const canScan = (trialTracking?.free_scans_used || 0) < FREE_SCANS;
    console.log('Free style scan check:', { used: trialTracking?.free_scans_used, limit: FREE_SCANS, canScan });
    return canScan;
  }, [subState.isPremium, subState.hasStartedTrial, trialTracking?.free_scans_used, trialTracking?.last_free_scan_at]);

  const glowScansLeft = useMemo(() => {
    if (subState.isPremium) return Infinity;
    
    if (subState.hasStartedTrial) {
      const today = new Date().toISOString().split('T')[0];
      const lastScanDate = trialTracking?.last_free_scan_at?.split('T')[0];
      const scansToday = lastScanDate === today ? (trialTracking?.free_scans_used || 0) : 0;
      return Math.max(0, TRIAL_DAILY_SCANS - scansToday);
    }
    
    return Math.max(0, FREE_SCANS - (trialTracking?.free_scans_used || 0));
  }, [subState.isPremium, subState.hasStartedTrial, trialTracking?.free_scans_used, trialTracking?.last_free_scan_at]);

  const styleScansLeft = useMemo(() => {
    if (subState.isPremium) return Infinity;
    
    if (subState.hasStartedTrial) {
      const today = new Date().toISOString().split('T')[0];
      const lastScanDate = trialTracking?.last_free_scan_at?.split('T')[0];
      const scansToday = lastScanDate === today ? (trialTracking?.free_scans_used || 0) : 0;
      return Math.max(0, TRIAL_DAILY_SCANS - scansToday);
    }
    
    return Math.max(0, FREE_SCANS - (trialTracking?.free_scans_used || 0));
  }, [subState.isPremium, subState.hasStartedTrial, trialTracking?.free_scans_used, trialTracking?.last_free_scan_at]);

  const incrementGlowScan = useCallback(async () => {
    if (!user?.id) return;

    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    const lastScanDate = trialTracking?.last_free_scan_at?.split('T')[0];
    
    console.log('Incrementing glow scan...');
    console.log('Current state:', { hasStartedTrial: subState.hasStartedTrial, today, lastScanDate, currentUsed: trialTracking?.free_scans_used });
    
    let newCount;
    if (subState.hasStartedTrial) {
      if (lastScanDate === today) {
        newCount = (trialTracking?.free_scans_used || 0) + 1;
      } else {
        newCount = 1;
      }
    } else {
      newCount = (trialTracking?.free_scans_used || 0) + 1;
    }
    
    console.log('New scan count will be:', newCount);

    try {
      const { error } = await supabase
        .from('trial_tracking')
        .upsert({
          id: user.id,
          first_scan_at: trialTracking?.first_scan_at || now,
          last_free_scan_at: now,
          free_scans_used: newCount,
          results_unlocked_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          updated_at: now,
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error incrementing glow scan:', error.message || error);
        return;
      }
      
      console.log('Scan incremented successfully. Reloading usage...');
      await loadUsage();
      
      console.log('After increment - Trial user can scan more:', subState.hasStartedTrial);

      if (!subState.isPremium && !subState.hasStartedTrial && newCount >= FREE_SCANS) {
        console.log('Showing trial upgrade modal');
        setShowTrialUpgradeModal(true);
      }
    } catch (error: any) {
      console.error('Failed to increment glow scan:', error?.message || String(error));
    }
  }, [user?.id, trialTracking, subState.isPremium, subState.hasStartedTrial, loadUsage]);

  const incrementStyleScan = useCallback(async () => {
    if (!user?.id) return;

    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    const lastScanDate = trialTracking?.last_free_scan_at?.split('T')[0];
    
    console.log('Incrementing style scan...');
    console.log('Current state:', { hasStartedTrial: subState.hasStartedTrial, today, lastScanDate, currentUsed: trialTracking?.free_scans_used });
    
    let newCount;
    if (subState.hasStartedTrial) {
      if (lastScanDate === today) {
        newCount = (trialTracking?.free_scans_used || 0) + 1;
      } else {
        newCount = 1;
      }
    } else {
      newCount = (trialTracking?.free_scans_used || 0) + 1;
    }
    
    console.log('New scan count will be:', newCount);

    try {
      const { error } = await supabase
        .from('trial_tracking')
        .upsert({
          id: user.id,
          first_scan_at: trialTracking?.first_scan_at || now,
          last_free_scan_at: now,
          free_scans_used: newCount,
          results_unlocked_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          updated_at: now,
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('Error incrementing style scan:', error.message || error);
        return;
      }
      
      console.log('Style scan incremented successfully. Reloading usage...');
      await loadUsage();
      
      console.log('After increment - Trial user can scan more:', subState.hasStartedTrial);

      if (!subState.isPremium && !subState.hasStartedTrial && newCount >= FREE_SCANS) {
        console.log('Showing trial upgrade modal');
        setShowTrialUpgradeModal(true);
      }
    } catch (error: any) {
      console.error('Failed to increment style scan:', error?.message || String(error));
    }
  }, [user?.id, trialTracking, subState.isPremium, subState.hasStartedTrial, loadUsage]);

  const refreshUsage = useCallback(async () => {
    await loadUsage();
  }, [loadUsage]);

  return useMemo(() => ({
    canScanGlow,
    canScanStyle,
    glowScansLeft,
    styleScansLeft,
    isFreemiumUser,
    isFreeUser,
    isTrialUser,
    isPaidUser,
    hasUsedFreeScan,
    glowScansToday,
    styleScansToday,
    incrementGlowScan,
    incrementStyleScan,
    refreshUsage,
    showTrialUpgradeModal,
    setShowTrialUpgradeModal,
  }), [
    canScanGlow,
    canScanStyle,
    glowScansLeft,
    styleScansLeft,
    isFreemiumUser,
    isFreeUser,
    isTrialUser,
    isPaidUser,
    hasUsedFreeScan,
    glowScansToday,
    styleScansToday,
    incrementGlowScan,
    incrementStyleScan,
    refreshUsage,
    showTrialUpgradeModal,
  ]);
});
