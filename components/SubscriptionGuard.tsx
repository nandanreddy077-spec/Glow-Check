import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { router, usePathname } from 'expo-router';
import PremiumPaywall from './PremiumPaywall';
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
  const { state, canScan, inTrial, isTrialExpired, startLocalTrial, processInAppPurchase } = useSubscription();
  const { loading } = useAuth();
  const pathname = usePathname();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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

  useEffect(() => {
    if (!loading && !hasAccess && !isPublicRoute && !showPaywall) {
      router.replace('/free-scan-limit');
    }
  }, [hasAccess, loading, pathname, isPublicRoute, showPaywall]);



  const handleStartTrial = useCallback(async () => {
    try {
      await startLocalTrial(3);
      Alert.alert(
        '🌟 Trial Started!', 
        'Your 3-day free trial has started! You can now scan and view results for 3 days.',
        [{ text: 'Start Glowing ✨', style: 'default' }]
      );
    } catch {
      Alert.alert('Error', 'Could not start trial. Please try again.');
    }
  }, [startLocalTrial]);

  const handleSubscribe = useCallback(async (type: 'monthly' | 'yearly') => {
    if (isProcessing) return;
    
    if (Platform.OS === 'web') {
      Alert.alert(
        'In-App Purchase Required',
        'Please use the mobile app to subscribe. In-app purchases are not available on web.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await processInAppPurchase(type);
      if (result.success) {
        Alert.alert(
          '🎉 Welcome to Premium!', 
          `Your ${type} subscription is now active. Enjoy unlimited access to all premium features!`,
          [{ text: 'Start Your Journey ✨', style: 'default' }]
        );
      } else {
        Alert.alert(
          'Purchase Failed', 
          'We couldn\'t process your purchase. Please try again.',
          [{ text: 'Try Again', style: 'default' }]
        );
      }
    } catch (err) {
      console.error('Subscription error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processInAppPurchase]);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: palette.backgroundStart }]}>
        <ActivityIndicator size="large" color={palette.gold} />
      </View>
    );
  }

  // Show paywall inline if access is denied and paywall is enabled
  if (shouldShowPaywall) {
    return (
      <View style={[styles.paywallContainer, { backgroundColor: palette.backgroundStart }]}>
        <PremiumPaywall 
          onStartTrial={handleStartTrial}
          onSubscribe={handleSubscribe}
        />
      </View>
    );
  }

  // Redirect to subscribe page if access denied and paywall disabled
  if (!hasAccess && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  paywallContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});