import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { 
  ArrowLeft, Star, Shield, Clock, Crown, Check, TrendingUp, Lock 
} from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';



export default function PremiumUnlockScreen() {
  const { state, processInAppPurchase, startLocalTrial, setSubscriptionData } = useSubscription();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [urgencyAnim] = useState(new Animated.Value(0));
  const [spotsLeft] = useState(Math.floor(Math.random() * 5) + 5);
  const [usersUpgradedToday] = useState(Math.floor(Math.random() * 500) + 12000);
  const [timeLeft, setTimeLeft] = useState(18);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(urgencyAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(urgencyAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 3600000);

    return () => {
      pulse.stop();
      clearInterval(timer);
    };
  }, [urgencyAnim]);

  const handleStartTrial = useCallback(async () => {
    if (isProcessing) return;
    
    if (Platform.OS === 'web') {
      Alert.alert(
        'Mobile App Required',
        'To unlock premium features, please download our app from the App Store or Google Play.',
        [{ text: 'Got it', style: 'default' }]
      );
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const result = await processInAppPurchase(selectedPlan);
      
      if (result.success) {
        await startLocalTrial(7);
        await setSubscriptionData({ hasAddedPayment: true });
        
        Alert.alert(
          '🎉 Welcome to Premium!', 
          'Your 7-day free trial is now active! Enjoy unlimited scans and full access to all features.',
          [{ 
            text: 'Start Your Glow Journey ✨', 
            style: 'default', 
            onPress: () => router.replace('/(tabs)')
          }]
        );
      } else if (result.error !== 'STORE_REDIRECT' && result.error !== 'Purchase cancelled') {
        Alert.alert(
          'Unable to Start Trial', 
          result.error || 'Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (err) {
      console.error('Trial start error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPlan, processInAppPurchase, startLocalTrial, setSubscriptionData, isProcessing]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const urgencyScale = urgencyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  const monthlyTotal = (8.99 * 12).toFixed(2);
  const savings = (parseFloat(monthlyTotal) - 99).toFixed(2);

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#FFF5F7', '#FFEEF5', '#FFFFFF']} 
        style={StyleSheet.absoluteFillObject} 
      />
      
      <Stack.Screen options={{ 
        title: '', 
        headerShown: false
      }} />
      
      <View style={[styles.safeHeader, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color="#1A1A1A" size={24} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Animated.View style={[styles.urgencyBanner, { transform: [{ scale: urgencyScale }] }]}>
            <LinearGradient colors={['#FF6B9D', '#FF8E53']} style={styles.urgencyGradient}>
              <Clock color="#FFFFFF" size={16} strokeWidth={2.5} />
              <Text style={styles.urgencyText}>
                Only {spotsLeft} trial spots left today!
              </Text>
            </LinearGradient>
          </Animated.View>

          <View style={styles.heroSection}>
            <LinearGradient 
              colors={['#FFB6C1', '#FFA07A']}
              style={styles.heroIcon}
            >
              <Crown color="#FFFFFF" size={48} fill="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
            <Text style={styles.heroTitle}>
              Unlock Your Full{'\n'}Beauty Potential
            </Text>
            <Text style={styles.heroSubtitle}>
              Join {(usersUpgradedToday / 1000).toFixed(1)}K+ women who upgraded today
            </Text>
          </View>

          <View style={styles.expiryWarning}>
            <LinearGradient colors={['#FFF3CD', '#FFE5A0']} style={styles.expiryGradient}>
              <Lock color="#FF8E53" size={20} strokeWidth={2.5} />
              <View style={styles.expiryContent}>
                <Text style={styles.expiryTitle}>⏰ Your results expire in {timeLeft} hours</Text>
                <Text style={styles.expiryText}>
                  Don&apos;t lose your personalized beauty plan. Save forever with premium.
                </Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.valueComparison}>
            <Text style={styles.valueTitle}>What You&apos;re Missing:</Text>
            <View style={styles.comparisonTable}>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>AI Glow Analysis</Text>
                <View style={styles.comparisonValues}>
                  <Text style={styles.freeValue}>1/week</Text>
                  <View style={styles.premiumValue}>
                    <Check color="#4CAF50" size={16} strokeWidth={3} />
                    <Text style={styles.premiumText}>Unlimited</Text>
                  </View>
                </View>
              </View>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Style Recommendations</Text>
                <View style={styles.comparisonValues}>
                  <Text style={styles.freeValue}>—</Text>
                  <View style={styles.premiumValue}>
                    <Check color="#4CAF50" size={16} strokeWidth={3} />
                    <Text style={styles.premiumText}>Daily</Text>
                  </View>
                </View>
              </View>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Progress Tracking</Text>
                <View style={styles.comparisonValues}>
                  <Text style={styles.freeValue}>—</Text>
                  <View style={styles.premiumValue}>
                    <Check color="#4CAF50" size={16} strokeWidth={3} />
                    <Text style={styles.premiumText}>Full History</Text>
                  </View>
                </View>
              </View>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>AI Beauty Coach</Text>
                <View style={styles.comparisonValues}>
                  <Text style={styles.freeValue}>—</Text>
                  <View style={styles.premiumValue}>
                    <Check color="#4CAF50" size={16} strokeWidth={3} />
                    <Text style={styles.premiumText}>24/7</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.socialProof}>
            <View style={styles.socialProofHeader}>
              <View style={styles.avatarStack}>
                <View style={[styles.avatar, { backgroundColor: '#FFB6C1', zIndex: 3 }]} />
                <View style={[styles.avatar, { backgroundColor: '#DDA0DD', marginLeft: -12, zIndex: 2 }]} />
                <View style={[styles.avatar, { backgroundColor: '#D4A574', marginLeft: -12, zIndex: 1 }]} />
              </View>
              <Text style={styles.socialProofText}>
                <Text style={styles.socialProofBold}>{usersUpgradedToday.toLocaleString()} women</Text> upgraded to premium this week
              </Text>
            </View>
            <View style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <View style={[styles.testimonialAvatar, { backgroundColor: '#FFB6C1' }]} />
                <View>
                  <Text style={styles.testimonialName}>Jessica M.</Text>
                  <View style={styles.ratingStars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} color="#FFD700" size={12} fill="#FFD700" strokeWidth={0} />
                    ))}
                  </View>
                </View>
              </View>
              <Text style={styles.testimonialText}>
                &ldquo;The AI analysis changed my skincare routine completely. My skin has never looked better!&rdquo;
              </Text>
            </View>
          </View>

          <View style={styles.planSection}>
            <Text style={styles.planSectionTitle}>Choose Your Plan</Text>
            
            <TouchableOpacity 
              style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={selectedPlan === 'yearly' ? ['#D4A574', '#C8956D'] : ['#FFFFFF', '#FFFFFF']}
                style={styles.planGradient}
              >
                <View style={styles.popularBadge}>
                  <Star color="#FFD700" size={12} fill="#FFD700" strokeWidth={2.5} />
                  <Text style={styles.popularText}>BEST VALUE</Text>
                </View>
                <View style={styles.planContent}>
                  <View style={styles.planHeader}>
                    <View style={[styles.planRadio, { borderColor: selectedPlan === 'yearly' ? '#FFFFFF' : '#D4A574' }]}>
                      {selectedPlan === 'yearly' && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={[styles.planName, { color: selectedPlan === 'yearly' ? '#FFFFFF' : '#1A1A1A' }]}>
                        Yearly Premium
                      </Text>
                      <Text style={[styles.planSaving, { color: selectedPlan === 'yearly' ? '#FFFFFF' : '#D4A574' }]}>
                        Save ${savings} ({((parseFloat(savings) / parseFloat(monthlyTotal)) * 100).toFixed(0)}%)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.planPricing}>
                    <Text style={[styles.planOriginal, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.6)' : '#999999' }]}>
                      ${monthlyTotal}
                    </Text>
                    <Text style={[styles.planPrice, { color: selectedPlan === 'yearly' ? '#FFFFFF' : '#1A1A1A' }]}>
                      $99
                    </Text>
                    <Text style={[styles.planPeriod, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.8)' : '#666666' }]}>
                      /year
                    </Text>
                  </View>
                  <Text style={[styles.planEquivalent, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.8)' : '#666666' }]}>
                    Just $0.27/day • Less than a coffee
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              <View style={[styles.planGradient, { backgroundColor: '#FFFFFF' }]}>
                <View style={styles.planContent}>
                  <View style={styles.planHeader}>
                    <View style={[styles.planRadio, { borderColor: selectedPlan === 'monthly' ? '#D4A574' : '#CCCCCC' }]}>
                      {selectedPlan === 'monthly' && (
                        <View style={[styles.radioInner, { backgroundColor: '#D4A574' }]} />
                      )}
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={styles.planName}>Monthly Premium</Text>
                      <Text style={styles.planFlexible}>Pay month-to-month</Text>
                    </View>
                  </View>
                  <View style={styles.planPricing}>
                    <Text style={styles.planPrice}>$8.99</Text>
                    <Text style={styles.planPeriod}>/month</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleStartTrial}
            disabled={isProcessing || state.isPremium}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={state.isPremium ? ['#CCCCCC', '#CCCCCC'] : ['#D4A574', '#C8956D']}
              style={styles.continueGradient}
            >
              <Text style={[styles.continueText, { color: state.isPremium ? '#666666' : '#FFFFFF' }]}>
                {state.isPremium ? 'Already Premium' : isProcessing ? 'Processing...' : '🎉 Start 7-Day Free Trial'}
              </Text>
              {!state.isPremium && !isProcessing && (
                <Text style={styles.continuePrice}>
                  Free for 7 days, then {selectedPlan === 'yearly' ? '$99/year' : '$8.99/month'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.guarantees}>
            <View style={styles.guaranteeItem}>
              <Shield color="#4CAF50" size={16} strokeWidth={2.5} />
              <Text style={styles.guaranteeText}>Secure via App Store</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <TrendingUp color="#9C27B0" size={16} strokeWidth={2.5} />
              <Text style={styles.guaranteeText}>Cancel anytime</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <Clock color="#FF8E53" size={16} strokeWidth={2.5} />
              <Text style={styles.guaranteeText}>No charge for 7 days</Text>
            </View>
          </View>

          <Text style={styles.legalText}>
            By starting your trial, you agree to our Terms of Service and Privacy Policy. Your subscription will automatically renew unless cancelled at least 24 hours before the end of the trial period. You can manage your subscription in your App Store account settings.
          </Text>
        </View>
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
  headerSpacer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  urgencyBanner: {
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  urgencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  expiryWarning: {
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  expiryGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  expiryContent: {
    flex: 1,
  },
  expiryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  expiryText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  valueComparison: {
    marginBottom: 32,
  },
  valueTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  comparisonTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  comparisonValues: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  freeValue: {
    fontSize: 14,
    color: '#999999',
    width: 60,
    textAlign: 'center',
  },
  premiumValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 100,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  socialProof: {
    marginBottom: 32,
  },
  socialProofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  avatarStack: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  socialProofText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  socialProofBold: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  testimonialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  testimonialName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonialText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  planSection: {
    marginBottom: 24,
  },
  planSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  planCard: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: '#D4A574',
  },
  planGradient: {
    padding: 20,
    borderRadius: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planContent: {
    paddingTop: 8,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1A1A1A',
  },
  planSaving: {
    fontSize: 14,
    fontWeight: '600',
  },
  planFlexible: {
    fontSize: 14,
    color: '#666666',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
    gap: 8,
  },
  planOriginal: {
    fontSize: 18,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  planEquivalent: {
    fontSize: 14,
    color: '#666666',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  continueGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  continuePrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  guarantees: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 32,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guaranteeText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  legalText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
});
