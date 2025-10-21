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
}

interface FreemiumContextType {
  canScanGlow: boolean;
  canScanStyle: boolean;
  glowScansLeft: number;
  styleScansLeft: number;
  isFreemiumUser: boolean;
  incrementGlowScan: () => Promise<void>;
  incrementStyleScan: () => Promise<void>;
  refreshUsage: () => Promise<void>;
}

const FREE_GLOW_SCANS = 1;
const FREE_STYLE_SCANS = 1;

export const [FreemiumProvider, useFreemium] = createContextHook<FreemiumContextType>(() => {
  const { user } = useAuth();
  const { state: subState } = useSubscription();
  const [scanUsage, setScanUsage] = useState<ScanUsage>({
    glowAnalysisScans: 0,
    styleGuideScans: 0,
  });

  const isFreemiumUser = useMemo(() => {
    return !subState.isPremium && !subState.hasStartedTrial;
  }, [subState.isPremium, subState.hasStartedTrial]);

  const loadUsage = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_scan_usage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading scan usage:', error);
        return;
      }

      if (data) {
        setScanUsage({
          glowAnalysisScans: data.glow_analysis_scans || 0,
          styleGuideScans: data.style_guide_scans || 0,
          lastGlowScan: data.last_glow_scan || undefined,
          lastStyleScan: data.last_style_scan || undefined,
        });
      }
    } catch (error) {
      console.error('Failed to load scan usage:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const canScanGlow = useMemo(() => {
    if (subState.isPremium || subState.hasStartedTrial) return true;
    return scanUsage.glowAnalysisScans < FREE_GLOW_SCANS;
  }, [subState.isPremium, subState.hasStartedTrial, scanUsage.glowAnalysisScans]);

  const canScanStyle = useMemo(() => {
    if (subState.isPremium || subState.hasStartedTrial) return true;
    return scanUsage.styleGuideScans < FREE_STYLE_SCANS;
  }, [subState.isPremium, subState.hasStartedTrial, scanUsage.styleGuideScans]);

  const glowScansLeft = useMemo(() => {
    if (subState.isPremium || subState.hasStartedTrial) return Infinity;
    return Math.max(0, FREE_GLOW_SCANS - scanUsage.glowAnalysisScans);
  }, [subState.isPremium, subState.hasStartedTrial, scanUsage.glowAnalysisScans]);

  const styleScansLeft = useMemo(() => {
    if (subState.isPremium || subState.hasStartedTrial) return Infinity;
    return Math.max(0, FREE_STYLE_SCANS - scanUsage.styleGuideScans);
  }, [subState.isPremium, subState.hasStartedTrial, scanUsage.styleGuideScans]);

  const incrementGlowScan = useCallback(async () => {
    if (!user?.id) return;

    const newCount = scanUsage.glowAnalysisScans + 1;
    const now = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('user_scan_usage')
        .upsert({
          user_id: user.id,
          glow_analysis_scans: newCount,
          last_glow_scan: now,
          updated_at: now,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error incrementing glow scan:', error);
        return;
      }

      setScanUsage(prev => ({
        ...prev,
        glowAnalysisScans: newCount,
        lastGlowScan: now,
      }));
    } catch (error) {
      console.error('Failed to increment glow scan:', error);
    }
  }, [user?.id, scanUsage.glowAnalysisScans]);

  const incrementStyleScan = useCallback(async () => {
    if (!user?.id) return;

    const newCount = scanUsage.styleGuideScans + 1;
    const now = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('user_scan_usage')
        .upsert({
          user_id: user.id,
          style_guide_scans: newCount,
          last_style_scan: now,
          updated_at: now,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error incrementing style scan:', error);
        return;
      }

      setScanUsage(prev => ({
        ...prev,
        styleGuideScans: newCount,
        lastStyleScan: now,
      }));
    } catch (error) {
      console.error('Failed to increment style scan:', error);
    }
  }, [user?.id, scanUsage.styleGuideScans]);

  const refreshUsage = useCallback(async () => {
    await loadUsage();
  }, [loadUsage]);

  return useMemo(() => ({
    canScanGlow,
    canScanStyle,
    glowScansLeft,
    styleScansLeft,
    isFreemiumUser,
    incrementGlowScan,
    incrementStyleScan,
    refreshUsage,
  }), [
    canScanGlow,
    canScanStyle,
    glowScansLeft,
    styleScansLeft,
    isFreemiumUser,
    incrementGlowScan,
    incrementStyleScan,
    refreshUsage,
  ]);
});
