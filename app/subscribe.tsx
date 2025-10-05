import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Platform, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscription } from '@/contexts/SubscriptionContext';

import { useTheme } from '@/contexts/ThemeContext';
import { Stack, router } from 'expo-router';
import { 
  Crown, 
  Star, 
  Shield, 
  ArrowLeft,
  Smartphone,
  Heart,
  Sparkles,
  Camera,
  Palette,
  Users,
  TrendingUp,
  Gift,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
  X,
  Flame
} from 'lucide-react-native';
import { getPalette, getGradient } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function SubscribeScreen() {
  const { startLocalTrial, processInAppPurchase, inTrial, state } = useSubscription();

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [timeLeft, setTimeLeft] = useState<number>(3600);
  const [activeUsers, setActiveUsers] = useState<number>(1247);
  const [recentUpgrades, setRecentUpgrades] = useState<number>(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const urgencyPulse = useRef(new Animated.Value(1)).current;
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    );
    pulseAnimation.start();

    const urgencyAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(urgencyPulse, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(urgencyPulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ])
    );
    urgencyAnimation.start();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) return 3600;
        return prev - 1;
      });
    }, 1000);

    const userCounter = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 3));
    }, 8000);

    const upgradeCounter = setInterval(() => {
      setRecentUpgrades(prev => prev + 1);
    }, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(userCounter);
      clearInterval(upgradeCounter);
      pulseAnimation.stop();
      urgencyAnimation.stop();
    };
  }, [scaleAnim, fadeAnim, pulseAnim, urgencyPulse]);

  const handleStartTrial = useCallback(async () => {
    try {
      await startLocalTrial(3);
      Alert.alert(
        '🌟 Trial Started!', 
        'Your 3-day free trial has started! You can now scan and view results for 3 days.',
        [{ text: 'Start Glowing ✨', style: 'default', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Error', 'Could not start trial. Please try again.');
    }
  }, [startLocalTrial]);

  const handleSubscribe = useCallback(async (type: 'monthly' | 'yearly') => {
    if (isProcessing) return;
    
    if (Platform.OS === 'web') {
      Alert.alert(
        'Mobile App Required',
        'Subscriptions are only available in the mobile app. Please download our app from the App Store or Google Play to subscribe.',
        [{ text: 'Got it', style: 'default' }]
      );
      return;
    }
    
    setIsProcessing(true);
    console.log(`Starting ${type} subscription process...`);
    
    try {
      const result = await processInAppPurchase(type);
      console.log('Purchase result:', result);
      
      if (result.success) {
        Alert.alert(
          '🎉 Welcome to Premium!', 
          `Your ${type} subscription is now active. Enjoy unlimited access to all premium features!`,
          [{ 
            text: 'Start Your Journey ✨', 
            style: 'default', 
            onPress: () => {
              console.log('User confirmed premium activation');
              router.back();
            }
          }]
        );
      } else if (result.error === 'STORE_REDIRECT') {
        Alert.alert(
          '🏪 Redirected to Store', 
          `You've been redirected to the ${Platform.OS === 'ios' ? 'App Store' : 'Google Play Store'} to complete your subscription. After subscribing, return to the app to enjoy premium features!`,
          [{ 
            text: 'Got it! ✨', 
            style: 'default', 
            onPress: () => {
              console.log('User acknowledged store redirect');
              router.back();
            }
          }]
        );
      } else {
        const errorMessage = result.error || 'We couldn\'t process your purchase. Please try again.';
        console.log('Purchase failed:', errorMessage);
        Alert.alert(
          'Purchase Failed', 
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', style: 'default', onPress: () => handleSubscribe(type) }
          ]
        );
      }
    } catch (err) {
      console.error('Subscription error:', err);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to the payment service. Please check your internet connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', style: 'default', onPress: () => handleSubscribe(type) }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, processInAppPurchase]);

  const handleManage = useCallback(async () => {
    Alert.alert(
      'Manage Subscription',
      Platform.OS === 'ios' 
        ? 'To manage your subscription, go to Settings > Apple ID > Subscriptions on your device.'
        : 'To manage your subscription, open the Google Play Store app and go to Menu > Subscriptions.',
      [{ text: 'OK', style: 'default' }]
    );
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={gradient.hero} 
        style={StyleSheet.absoluteFillObject} 
      />
      
      <Stack.Screen options={{ 
        title: '', 
        headerShown: false
      }} />
      
      {/* Custom Header */}
      <View style={[styles.safeHeader, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <View style={styles.backCircle}>
              <ArrowLeft color={palette.textPrimary} size={20} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Unlock Your Glow</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        
        {/* Urgency Banner */}
        <Animated.View style={[styles.urgencyBanner, { transform: [{ scale: urgencyPulse }] }]}>
          <LinearGradient colors={['#FF3B30', '#FF6B6B']} style={styles.urgencyGradient}>
            <Flame color="#FFF" size={18} strokeWidth={2.5} />
            <View style={styles.urgencyContent}>
              <Text style={styles.urgencyTitle}>LIMITED TIME OFFER</Text>
              <Text style={styles.urgencySubtitle}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} left to claim 50% off
              </Text>
            </View>
            <Clock color="#FFF" size={18} strokeWidth={2.5} />
          </LinearGradient>
        </Animated.View>

        {/* Social Proof */}
        <View style={[styles.socialProof, { backgroundColor: palette.surfaceElevated }]}>
          <View style={styles.socialProofRow}>
            <View style={styles.activeIndicator} />
            <Text style={[styles.socialProofText, { color: palette.textPrimary }]}>
              <Text style={styles.socialProofNumber}>{activeUsers.toLocaleString()}</Text> users glowing right now
            </Text>
          </View>
          {recentUpgrades > 0 && (
            <View style={styles.upgradeNotification}>
              <CheckCircle color={palette.mint} size={14} strokeWidth={2.5} />
              <Text style={[styles.upgradeText, { color: palette.textSecondary }]}>
                {recentUpgrades} {recentUpgrades === 1 ? 'person' : 'people'} upgraded in the last hour
              </Text>
            </View>
          )}
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient 
            colors={gradient.rose} 
            style={styles.heroIcon}
          >
            <Heart color={palette.pearl} size={32} fill={palette.pearl} strokeWidth={2} />
          </LinearGradient>
          <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>
            Start Your Beauty Journey
          </Text>
          <Text style={[styles.heroText, { color: palette.textSecondary }]}>
            3-day free trial, then choose your perfect plan
          </Text>
        </View>

        {/* Comparison Section - What You're Missing */}
        <View style={[styles.comparisonSection, { backgroundColor: palette.surface }]}>
          <View style={styles.comparisonHeader}>
            <AlertCircle color={palette.coral} size={20} strokeWidth={2.5} />
            <Text style={[styles.comparisonTitle, { color: palette.textPrimary }]}>What You&apos;re Missing Out On</Text>
          </View>
          
          <View style={styles.comparisonGrid}>
            <View style={styles.comparisonItem}>
              <View style={styles.comparisonIconWrapper}>
                <X color={palette.coral} size={16} strokeWidth={3} />
              </View>
              <View style={styles.comparisonContent}>
                <Text style={[styles.comparisonLabel, { color: palette.textMuted }]}>Free</Text>
                <Text style={[styles.comparisonValue, { color: palette.textSecondary }]}>3 scans only</Text>
              </View>
            </View>
            
            <View style={styles.comparisonItem}>
              <View style={[styles.comparisonIconWrapper, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
                <CheckCircle color={palette.mint} size={16} strokeWidth={3} />
              </View>
              <View style={styles.comparisonContent}>
                <Text style={[styles.comparisonLabel, { color: palette.gold }]}>Premium</Text>
                <Text style={[styles.comparisonValue, { color: palette.textPrimary }]}>Unlimited scans</Text>
              </View>
            </View>

            <View style={styles.comparisonItem}>
              <View style={styles.comparisonIconWrapper}>
                <X color={palette.coral} size={16} strokeWidth={3} />
              </View>
              <View style={styles.comparisonContent}>
                <Text style={[styles.comparisonLabel, { color: palette.textMuted }]}>Free</Text>
                <Text style={[styles.comparisonValue, { color: palette.textSecondary }]}>Basic analysis</Text>
              </View>
            </View>
            
            <View style={styles.comparisonItem}>
              <View style={[styles.comparisonIconWrapper, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
                <CheckCircle color={palette.mint} size={16} strokeWidth={3} />
              </View>
              <View style={styles.comparisonContent}>
                <Text style={[styles.comparisonLabel, { color: palette.gold }]}>Premium</Text>
                <Text style={[styles.comparisonValue, { color: palette.textPrimary }]}>AI beauty coach</Text>
              </View>
            </View>

            <View style={styles.comparisonItem}>
              <View style={styles.comparisonIconWrapper}>
                <X color={palette.coral} size={16} strokeWidth={3} />
              </View>
              <View style={styles.comparisonContent}>
                <Text style={[styles.comparisonLabel, { color: palette.textMuted }]}>Free</Text>
                <Text style={[styles.comparisonValue, { color: palette.textSecondary }]}>No style check</Text>
              </View>
            </View>
            
            <View style={styles.comparisonItem}>
              <View style={[styles.comparisonIconWrapper, { backgroundColor: 'rgba(52, 199, 89, 0.15)' }]}>
                <CheckCircle color={palette.mint} size={16} strokeWidth={3} />
              </View>
              <View style={styles.comparisonContent}>
                <Text style={[styles.comparisonLabel, { color: palette.gold }]}>Premium</Text>
                <Text style={[styles.comparisonValue, { color: palette.textPrimary }]}>Daily style tips</Text>
              </View>
            </View>
          </View>

          <View style={styles.lossWarning}>
            <AlertCircle color={palette.coral} size={16} strokeWidth={2.5} />
            <Text style={[styles.lossWarningText, { color: palette.textSecondary }]}>
              Free users miss out on 90% of features that could transform their beauty routine
            </Text>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={[styles.featureCard, { backgroundColor: palette.surface }]}>
            <LinearGradient colors={gradient.primary} style={styles.featureIconBg}>
              <Camera color={palette.pearl} size={20} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>Unlimited Scans</Text>
            <Text style={[styles.featureDesc, { color: palette.textMuted }]}>Analyze your glow anytime</Text>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: palette.surface }]}>
            <LinearGradient colors={gradient.rose} style={styles.featureIconBg}>
              <Sparkles color={palette.pearl} size={20} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>AI Coach</Text>
            <Text style={[styles.featureDesc, { color: palette.textMuted }]}>Personal beauty guide</Text>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: palette.surface }]}>
            <LinearGradient colors={gradient.lavender} style={styles.featureIconBg}>
              <Palette color={palette.pearl} size={20} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>Style Check</Text>
            <Text style={[styles.featureDesc, { color: palette.textMuted }]}>Perfect looks daily</Text>
          </View>
          
          <View style={[styles.featureCard, { backgroundColor: palette.surface }]}>
            <LinearGradient colors={gradient.gold} style={styles.featureIconBg}>
              <Users color={palette.pearl} size={20} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[styles.featureTitle, { color: palette.textPrimary }]}>Community</Text>
            <Text style={[styles.featureDesc, { color: palette.textMuted }]}>Connect & share</Text>
          </View>
        </View>

        {/* Trial Button */}
        {!state.hasStartedTrial && !state.isPremium && (
          <TouchableOpacity 
            style={styles.trialButton} 
            onPress={handleStartTrial}
            disabled={isProcessing}
            activeOpacity={0.8}
            testID="start-trial-button"
          >
            <LinearGradient 
              colors={gradient.primary} 
              style={styles.buttonGradient}
            >
              <Gift color={palette.textPrimary} size={20} strokeWidth={2.5} />
              <Text style={[styles.buttonText, { color: palette.textPrimary }]}>Start Free Trial</Text>
              <Text style={[styles.buttonSubtext, { color: palette.textPrimary }]}>3 days free • No payment required</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        {/* Trial Status */}
        {(inTrial || state.isPremium) && (
          <View style={[styles.statusContainer, { backgroundColor: palette.surfaceElevated }]}>
            <LinearGradient colors={gradient.gold} style={styles.statusBadge}>
              {state.isPremium ? (
                <Crown color={palette.textPrimary} size={16} strokeWidth={2.5} />
              ) : (
                <Star color={palette.textPrimary} size={16} strokeWidth={2.5} />
              )}
            </LinearGradient>
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: palette.textPrimary }]}>
                {state.isPremium ? 'Premium Active' : 'Trial Active'}
              </Text>
              {!state.isPremium && (
                <Text style={[styles.statusText, { color: palette.textSecondary }]}>
                  {state.scanCount}/3 scans used • {state.trialStartedAt ? `${3 - Math.floor((Date.now() - Number(state.trialStartedAt)) / (1000 * 60 * 60 * 24))} days left` : '3 days left'}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Plans Section */}
        <View style={styles.plansSection}>
          <View style={styles.plansTitleRow}>
            <Text style={[styles.plansTitle, { color: palette.textPrimary }]}>Choose Your Plan</Text>
            <View style={styles.popularBadge}>
              <Zap color={palette.gold} size={12} strokeWidth={3} />
              <Text style={[styles.popularBadgeText, { color: palette.gold }]}>Most choose yearly</Text>
            </View>
          </View>
          
          {/* Yearly Plan - Recommended */}
          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={selectedPlan === 'yearly' ? gradient.gold : [palette.surface, palette.surface]}
              style={[styles.planGradient, selectedPlan === 'yearly' && styles.selectedPlanGradient]}
            >
              {selectedPlan === 'yearly' && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>BEST VALUE • 89% OFF</Text>
                </View>
              )}
              <View style={styles.savingsHighlight}>
                <Text style={styles.savingsAmount}>Save $107.88/year</Text>
                <Text style={styles.savingsVs}>vs monthly plan</Text>
              </View>
              <View style={styles.planContent}>
                <View style={styles.planHeader}>
                  <View style={[styles.planRadio, { borderColor: selectedPlan === 'yearly' ? palette.pearl : palette.divider }]}>
                    {selectedPlan === 'yearly' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, { color: selectedPlan === 'yearly' ? palette.textPrimary : palette.textPrimary }]}>Yearly Glow</Text>
                    <View style={styles.savingBadge}>
                      <Text style={[styles.savingText, { color: selectedPlan === 'yearly' ? palette.textPrimary : palette.gold }]}>Save $7.80</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.planPricing}>
                  <Text style={[styles.planPrice, { color: selectedPlan === 'yearly' ? palette.textPrimary : palette.textPrimary }]}>$99</Text>
                  <Text style={[styles.planPeriod, { color: selectedPlan === 'yearly' ? palette.textSecondary : palette.textMuted }]}>/year</Text>
                </View>
                <Text style={[styles.planEquivalent, { color: selectedPlan === 'yearly' ? palette.textSecondary : palette.textMuted }]}>Just $8.25/month</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={selectedPlan === 'monthly' ? gradient.rose : [palette.surface, palette.surface]}
              style={[styles.planGradient, selectedPlan === 'monthly' && styles.selectedPlanGradient]}
            >
              <View style={styles.planContent}>
                <View style={styles.planHeader}>
                  <View style={[styles.planRadio, { borderColor: selectedPlan === 'monthly' ? palette.pearl : palette.divider }]}>
                    {selectedPlan === 'monthly' && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planName, { color: selectedPlan === 'monthly' ? palette.textPrimary : palette.textPrimary }]}>Monthly Glow</Text>
                    <Text style={[styles.planFlexible, { color: selectedPlan === 'monthly' ? palette.textSecondary : palette.textMuted }]}>Flexible billing</Text>
                  </View>
                </View>
                <View style={styles.planPricing}>
                  <Text style={[styles.planPrice, { color: selectedPlan === 'monthly' ? palette.textPrimary : palette.textPrimary }]}>$8.99</Text>
                  <Text style={[styles.planPeriod, { color: selectedPlan === 'monthly' ? palette.textSecondary : palette.textMuted }]}>/month</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Testimonial */}
        <View style={[styles.testimonial, { backgroundColor: palette.surfaceElevated }]}>
          <View style={styles.testimonialHeader}>
            <View style={styles.testimonialAvatar}>
              <Text style={styles.testimonialInitial}>S</Text>
            </View>
            <View style={styles.testimonialInfo}>
              <Text style={[styles.testimonialName, { color: palette.textPrimary }]}>Sarah M.</Text>
              <View style={styles.testimonialStars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} color={palette.gold} size={12} fill={palette.gold} strokeWidth={0} />
                ))}
              </View>
            </View>
          </View>
          <Text style={[styles.testimonialText, { color: palette.textSecondary }]}>
            &quot;I was skeptical at first, but after upgrading I realized how much I was missing. The AI coach alone is worth 10x the price. Don&apos;t make my mistake of waiting!&quot;
          </Text>
          <Text style={[styles.testimonialTime, { color: palette.textMuted }]}>2 hours ago</Text>
        </View>

        {/* FOMO Alert */}
        <Animated.View style={[styles.fomoAlert, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient colors={gradient.gold} style={styles.fomoGradient}>
            <Sparkles color={palette.textPrimary} size={18} strokeWidth={2.5} />
            <Text style={[styles.fomoText, { color: palette.textPrimary }]}>
              Join {(activeUsers * 0.73).toFixed(0)}+ premium members who upgraded this week
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Subscribe Button */}
        <TouchableOpacity 
          style={styles.subscribeButton} 
          onPress={() => handleSubscribe(selectedPlan)}
          disabled={isProcessing || state.isPremium}
          activeOpacity={0.8}
          testID="subscribe-button"
        >
          <LinearGradient 
            colors={state.isPremium ? [palette.surfaceAlt, palette.surfaceAlt] : gradient.primary} 
            style={styles.subscribeGradient}
          >
            <Text style={[styles.subscribeText, { color: state.isPremium ? palette.textMuted : palette.textPrimary }]}>
              {state.isPremium ? 'Already Premium' : isProcessing ? 'Processing...' : 'Continue'}
            </Text>
            {!state.isPremium && !isProcessing && (
              <Text style={[styles.subscribePrice, { color: palette.textSecondary }]}>
                {selectedPlan === 'yearly' ? '$99/year after trial' : '$8.99/month after trial'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Benefits */}
        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <Shield color={palette.mint} size={16} strokeWidth={2.5} />
            <Text style={[styles.benefitText, { color: palette.textSecondary }]}>Secure payment</Text>
          </View>
          <View style={styles.benefitItem}>
            <TrendingUp color={palette.lavender} size={16} strokeWidth={2.5} />
            <Text style={[styles.benefitText, { color: palette.textSecondary }]}>Cancel anytime</Text>
          </View>
        </View>

        {/* Manage Subscription */}
        {state.isPremium && (
          <TouchableOpacity style={styles.manageButton} onPress={handleManage} activeOpacity={0.7}>
            <Smartphone color={palette.textMuted} size={18} strokeWidth={2} />
            <Text style={[styles.manageText, { color: palette.textMuted }]}>Manage via {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}</Text>
          </TouchableOpacity>
        )}

        {/* Risk Reversal */}
        <View style={[styles.riskReversal, { backgroundColor: palette.surface }]}>
          <Shield color={palette.mint} size={24} strokeWidth={2.5} />
          <View style={styles.riskReversalContent}>
            <Text style={[styles.riskReversalTitle, { color: palette.textPrimary }]}>100% Risk-Free Guarantee</Text>
            <Text style={[styles.riskReversalText, { color: palette.textSecondary }]}>
              Try premium for 3 days free. Cancel anytime with one tap. No questions asked.
            </Text>
          </View>
        </View>

        {/* Legal Text */}
        <Text style={[styles.legalText, { color: palette.textMuted }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
          {!state.hasStartedTrial && !state.isPremium ? ' Your 3-day free trial starts immediately. No payment required during trial.' : ''}
          {Platform.OS !== 'web' ? ' Subscription will be charged to your App Store/Play Store account.' : ''}
        </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  safeHeader: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 32,
  },
  featureCard: {
    width: (width - 52) / 2,
    margin: 6,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  trialButton: {
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  buttonGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'column',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  buttonSubtext: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  plansSection: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  planCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: 'transparent',
  },
  planGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  selectedPlanGradient: {
    borderColor: 'transparent',
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planContent: {
    flexDirection: 'column',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  savingBadge: {
    alignSelf: 'flex-start',
  },
  savingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  planFlexible: {
    fontSize: 13,
    fontWeight: '500',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  planPeriod: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4,
  },
  planEquivalent: {
    fontSize: 13,
    fontWeight: '500',
  },
  subscribeButton: {
    marginBottom: 20,
  },
  subscribeGradient: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  subscribeText: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subscribePrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  benefits: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '600',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  manageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  urgencyBanner: {
    marginBottom: 16,
  },
  urgencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  urgencyContent: {
    flex: 1,
    alignItems: 'center',
  },
  urgencyTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  urgencySubtitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  socialProof: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  socialProofText: {
    fontSize: 14,
    fontWeight: '600',
  },
  socialProofNumber: {
    fontWeight: '800',
  },
  upgradeNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 18,
  },
  upgradeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  comparisonSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  comparisonGrid: {
    gap: 12,
    marginBottom: 16,
  },
  comparisonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  comparisonIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 138, 128, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonContent: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  lossWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(255, 138, 128, 0.1)',
    borderRadius: 10,
  },
  lossWarningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  plansTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(210, 163, 114, 0.15)',
    borderRadius: 8,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  savingsHighlight: {
    marginBottom: 12,
  },
  savingsAmount: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  savingsVs: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  testimonial: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  testimonialAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D2A372',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testimonialInitial: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonialText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 8,
  },
  testimonialTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  fomoAlert: {
    marginBottom: 20,
  },
  fomoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  fomoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  riskReversal: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  riskReversalContent: {
    flex: 1,
  },
  riskReversalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  riskReversalText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});