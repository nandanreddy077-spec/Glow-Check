import React, { useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, usePathname } from 'expo-router';
import { getPalette } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  children: React.ReactNode;
  requiresPremium?: boolean;
  showPaywall?: boolean;
  accessMode?: 'scan' | 'feature';
}

export default function SubscriptionGuard({ children, requiresPremium = false, showPaywall = true, accessMode = 'scan' }: Props) {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const { state, canScan, inTrial, isTrialExpired } = useSubscription();
  const { loading } = useAuth();
  const pathname = usePathname();

  // Routes that are always accessible
  const publicRoutes = [
    '/subscribe', 
    '/privacy-care', 
    '/(tabs)/profile', 
    '/(tabs)/community',
    '/login', 
    '/signup', 
    '/forgot-password', 
    '/onboarding'
  ];
  
  // Routes that require premium features
  const premiumRoutes = [
    '/glow-analysis',
    '/analysis-results',
    '/style-check',
    '/style-results',
    '/skincare-plan-selection',
    '/skincare-plan-overview',
    '/glow-coach'
  ];

  const isPublicRoute = useMemo(() => {
    return publicRoutes.some(route => pathname.includes(route));
  }, [pathname]);

  const isPremiumRoute = useMemo(() => {
    return premiumRoutes.some(route => pathname.includes(route)) || requiresPremium;
  }, [pathname, requiresPremium]);

  const hasAccess = useMemo(() => {
    if (isPublicRoute) return true;
    if (state.isPremium) return true;

    if (isPremiumRoute) {
      if (isTrialExpired) return false;
      if (accessMode === 'feature') {
        // Feature access during trial regardless of scan count
        return inTrial;
      }
      // Scan-gated access respects scan limit
      return canScan;
    }

    return true;
  }, [isPublicRoute, state.isPremium, isPremiumRoute, isTrialExpired, canScan, accessMode, inTrial]);

  const shouldShowPaywall = useMemo(() => {
    return !hasAccess && !isPublicRoute && showPaywall;
  }, [hasAccess, isPublicRoute, showPaywall]);

  // Navigate to free-scan-limit if access denied and paywall is disabled
  useEffect(() => {
    if (!loading && !hasAccess && !isPublicRoute && !showPaywall) {
      router.replace('/free-scan-limit');
    }
  }, [hasAccess, loading, pathname, isPublicRoute, showPaywall]);
  
  // Navigate to start-trial if paywall is enabled and access denied
  useEffect(() => {
    if (!loading && shouldShowPaywall) {
      router.push('/start-trial');
    }
  }, [shouldShowPaywall, loading]);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: palette.backgroundStart }]}>
        <ActivityIndicator size="large" color={palette.gold} />
      </View>
    );
  }

  // Return loading indicator while redirecting to prevent blank screen flash
  if (!hasAccess && !isPublicRoute) {
    return (
      <View style={[styles.loading, { backgroundColor: palette.backgroundStart }]}>
        <ActivityIndicator size="large" color={palette.gold} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
});