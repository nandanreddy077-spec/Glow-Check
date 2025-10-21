import { useState, useEffect, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from './AuthContext';
import { useSubscription } from './SubscriptionContext';
import { supabase } from '@/lib/supabase';

interface ScanUsage {
  glowAnalysisScans: number;
  styleGuideScans: number;
  lastGlowScan?: string;
  lastStyleScan?: string;
  todayGlowScans: number;
  todayStyleScans: number;
  lastScanDate?: string;
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

const FREE_GLOW_SCANS = 1;
const FREE_STYLE_SCANS = 1;
const TRIAL_DAILY_SCANS = 2;
const TRIAL_DURATION_DAYS = 3;

export const [FreemiumProvider, useFreemium] = createContextHook<FreemiumContextType>(() => {
  const { user } = useAuth();
  const { state: subState } = useSubscription();
  const [scanUsage, setScanUsage] = useState<ScanUsage>({
    glowAnalysisScans: 0,
    styleGuideScans: 0,
    todayGlowScans: 0,
    todayStyleScans: 0,
  });
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
    return scanUsage.glowAnalysisScans >= 1 || scanUsage.styleGuideScans >= 1;
  }, [scanUsage.glowAnalysisScans, scanUsage.styleGuideScans]);

  const loadUsage = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_scan_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading scan usage:', error.message || error);
        return;
      }

      if (data) {
        const today = new Date().toISOString().split('T')[0];
        const lastScanDate = data.last_scan_date?.split('T')[0];
        const isToday = lastScanDate === today;
        
        setScanUsage({
          glowAnalysisScans: data.glow_analysis_scans || 0,
          styleGuideScans: data.style_guide_scans || 0,
          lastGlowScan: data.last_glow_scan || undefined,
          lastStyleScan: data.last_style_scan || undefined,
          todayGlowScans: isToday ? (data.today_glow_scans || 0) : 0,
          todayStyleScans: isToday ? (data.today_style_scans || 0) : 0,
          lastScanDate: data.last_scan_date || undefined,
        });
      }
    } catch (error: any) {
      console.error('Failed to load scan usage:', error?.message || String(error));
    }
  }, [user?.id]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const glowScansToday = useMemo(() => {
    return scanUsage.todayGlowScans;
  }, [scanUsage.todayGlowScans]);

  const styleScansToday = useMemo(() => {
    return scanUsage.todayStyleScans;
  }, [scanUsage.todayStyleScans]);

  const canScanGlow = useMemo(() => {
    if (subState.isPremium) return true;
    
    if (subState.hasStartedTrial) {
      return scanUsage.todayGlowScans < TRIAL_DAILY_SCANS;
    }
    
    return scanUsage.glowAnalysisScans < FREE_GLOW_SCANS;
  }, [subState.isPremium, subState.hasStartedTrial, scanUsage.glowAnalysisScans, scanUsage.todayGlowScans]);

  const canScanStyle = useMemo(() => {
    if (subState.isPremium) return true;
    
    if (subState.hasStartedTrial) {
      return scanUsage.todayStyleScans < TRIAL_DAILY_SCANS;
    }
    
    return scanUsage.styleGuideScans < FREE_STYLE_SCANS;
  }, [subState.isPremium, subState.hasStartedTrial, scanUsage.styleGuideScans, scanUsage.todayStyleScans]);

  const glowScansLeft = useMemo(() => {
    if (subState.isPremium) return Infinity;
    
    if (subState.hasStartedTrial) {
      return Math.max(0, TRIAL_DAILY_SCANS - scanUsage.todayGlowScans);
    }
    
    return Math.max(0, FREE_GLOW_SCANS - scanUsage.glowAnalysisScans);
  }, [subState.isPremium, subState.hasStartedTrial, scanUsage.glowAnalysisScans, scanUsage.todayGlowScans]);

  const styleScansLeft = useMemo(() => {
    if (subState.isPremium) return Infinity;
    
    if (subState.hasStartedTrial) {
      return Math.max(0, TRIAL_DAILY_SCANS - scanUsage.todayStyleScans);
    }
    
    return Math.max(0, FREE_STYLE_SCANS - scanUsage.styleGuideScans);
  }, [subState.isPremium, subState.hasStartedTrial, scanUsage.styleGuideScans, scanUsage.todayStyleScans]);

  const incrementGlowScan = useCallback(async () => {
    if (!user?.id) return;

    const newCount = scanUsage.glowAnalysisScans + 1;
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const lastScanDate = scanUsage.lastScanDate?.split('T')[0];
    const isToday = lastScanDate === today;
    const newTodayCount = isToday ? scanUsage.todayGlowScans + 1 : 1;

    try {
      const { error } = await supabase
        .from('user_scan_usage')
        .upsert({
          user_id: user.id,
          glow_analysis_scans: newCount,
          last_glow_scan: now,
          today_glow_scans: newTodayCount,
          last_scan_date: now,
          updated_at: now,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error incrementing glow scan:', error.message || error);
        return;
      }

      setScanUsage(prev => ({
        ...prev,
        glowAnalysisScans: newCount,
        lastGlowScan: now,
        todayGlowScans: newTodayCount,
        lastScanDate: now,
      }));

      if (!subState.isPremium && !subState.hasStartedTrial && newCount > FREE_GLOW_SCANS) {
        setShowTrialUpgradeModal(true);
      }
    } catch (error: any) {
      console.error('Failed to increment glow scan:', error?.message || String(error));
    }
  }, [user?.id, scanUsage.glowAnalysisScans, scanUsage.todayGlowScans, scanUsage.lastScanDate, subState.isPremium, subState.hasStartedTrial]);

  const incrementStyleScan = useCallback(async () => {
    if (!user?.id) return;

    const newCount = scanUsage.styleGuideScans + 1;
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const lastScanDate = scanUsage.lastScanDate?.split('T')[0];
    const isToday = lastScanDate === today;
    const newTodayCount = isToday ? scanUsage.todayStyleScans + 1 : 1;

    try {
      const { error } = await supabase
        .from('user_scan_usage')
        .upsert({
          user_id: user.id,
          style_guide_scans: newCount,
          last_style_scan: now,
          today_style_scans: newTodayCount,
          last_scan_date: now,
          updated_at: now,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error incrementing style scan:', error.message || error);
        return;
      }

      setScanUsage(prev => ({
        ...prev,
        styleGuideScans: newCount,
        lastStyleScan: now,
        todayStyleScans: newTodayCount,
        lastScanDate: now,
      }));

      if (!subState.isPremium && !subState.hasStartedTrial && newCount > FREE_STYLE_SCANS) {
        setShowTrialUpgradeModal(true);
      }
    } catch (error: any) {
      console.error('Failed to increment style scan:', error?.message || String(error));
    }
  }, [user?.id, scanUsage.styleGuideScans, scanUsage.todayStyleScans, scanUsage.lastScanDate, subState.isPremium, subState.hasStartedTrial]);

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
