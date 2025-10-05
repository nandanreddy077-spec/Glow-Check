import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Star, Shield, TrendingUp, Sparkles, Camera, Zap, Crown, Check, Clock } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function StartTrialScreen() {
  const { state, processInAppPurchase, startLocalTrial, setSubscriptionData } = useSubscription();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [urgencyAnim] = useState(new Animated.Value(0));
  const [spotsLeft] = useState(Math.floor(Math.random() * 5) + 3);

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
    return () => pulse.stop();
  }, [urgencyAnim]);

  const handleStartTrial = useCallback(async () => {
    if (isProcessing) return;
    
    if (Platform.OS === 'web') {
      Alert.alert(
        'Mobile App Required',
        'To start your free trial, please download our app from the App Store or Google Play.',
        [{ text: 'Got it', style: 'default' }]
      );
      return;
    }
    
    setIsProcessing(true);
    console.log(`Starting trial with ${selectedPlan} subscription...`);
    
    try {
      const result = await processInAppPurchase(selectedPlan);
      console.log('Purchase result:', result);
      
      if (result.success) {
        await startLocalTrial(3);
        await setSubscriptionData({ hasAddedPayment: true });
        
        Alert.alert(
          '🎉 Trial Started!', 
          'Your 3-day free trial is now active! You won\'t be charged until the trial ends. Enjoy unlimited access!',
          [{ 
            text: 'Start Glowing ✨', 
            style: 'default', 
            onPress: () => {
              console.log('User confirmed trial activation');
              router.replace('/(tabs)');
            }
          }]
        );
      } else if (result.error === 'STORE_REDIRECT') {
        Alert.alert(
          'Complete Subscription',
          'Please complete your subscription in the App Store or Google Play, then return to the app.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        const errorMessage = result.error || 'We couldn\'t process your request. Please try again.';
        console.log('Trial start failed:', errorMessage);
        Alert.alert(
          'Unable to Start Trial', 
          errorMessage,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', style: 'default', onPress: () => handleStartTrial() }
          ]
        );
      }
    } catch (err) {
      console.error('Trial start error:', err);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to the payment service. Please check your internet connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', style: 'default', onPress: () => handleStartTrial() }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPlan, processInAppPurchase, startLocalTrial, setSubscriptionData, isProcessing]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const urgencyScale = urgencyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#FFF5F7', '#FFFFFF']} 
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
          <Text style={styles.headerTitle}>Start Your Free Trial</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Animated.View style={[styles.urgencyBanner, { transform: [{ scale: urgencyScale }] }]}>
            <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.urgencyGradient}>
              <Clock color="#FFFFFF" size={16} strokeWidth={2.5} />
              <Text style={styles.urgencyText}>Only {spotsLeft} trial spots left today!</Text>
            </LinearGradient>
          </Animated.View>

          <View style={styles.heroSection}>
            <LinearGradient 
              colors={['#FFB6C1', '#FFA07A']}
              style={styles.heroIcon}
            >
              <Crown color="#FFFFFF" size={40} fill="#FFFFFF" strokeWidth={2} />
            </LinearGradient>
            <Text style={styles.heroTitle}>
              Unlock Your Glow Journey
            </Text>
            <Text style={styles.heroSubtitle}>
              Start your 3-day free trial • No charge today
            </Text>
          </View>

          <View style={styles.socialProof}>
            <View style={styles.socialProofAvatars}>
              <View style={[styles.avatar, { backgroundColor: '#FFB6C1' }]} />
              <View style={[styles.avatar, { backgroundColor: '#DDA0DD', marginLeft: -12 }]} />
              <View style={[styles.avatar, { backgroundColor: '#D4A574', marginLeft: -12 }]} />
            </View>
            <Text style={styles.socialProofText}>
              <Text style={styles.socialProofBold}>12,847 women</Text> started their glow journey this week
            </Text>
          </View>

          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>What You Get:</Text>
            
            {[
              { icon: Camera, text: 'Unlimited AI Glow Analysis', color: '#FFB6C1' },
              { icon: Sparkles, text: 'Personalized Beauty Coach', color: '#DDA0DD' },
              { icon: TrendingUp, text: 'Weekly Progress Tracking', color: '#D4A574' },
              { icon: Zap, text: 'Before/After Comparisons', color: '#FF8E53' },
              { icon: Crown, text: 'Premium Style Recommendations', color: '#C8956D' },
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <LinearGradient colors={[benefit.color, benefit.color + 'CC']} style={styles.benefitIcon}>
                  <benefit.icon color="#FFFFFF" size={18} strokeWidth={2.5} />
                </LinearGradient>
                <Text style={styles.benefitText}>{benefit.text}</Text>
                <Check color="#4CAF50" size={20} strokeWidth={2.5} />
              </View>
            ))}
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
                        Save $8.88 (9%)
                      </Text>
                    </View>
                  </View>
                  <View style={styles.planPricing}>
                    <Text style={[styles.planPrice, { color: selectedPlan === 'yearly' ? '#FFFFFF' : '#1A1A1A' }]}>
                      $99
                    </Text>
                    <Text style={[styles.planPeriod, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.8)' : '#666666' }]}>
                      /year
                    </Text>
                  </View>
                  <Text style={[styles.planEquivalent, { color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.8)' : '#666666' }]}>
                    Just $8.25/month
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
                      <Text style={styles.planFlexible}>Flexible billing</Text>
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
                {state.isPremium ? 'Already Premium' : isProcessing ? 'Processing...' : 'Start 3-Day Free Trial'}
              </Text>
              {!state.isPremium && !isProcessing && (
                <Text style={styles.continuePrice}>
                  Free for 3 days, then {selectedPlan === 'yearly' ? '$99/year' : '$8.99/month'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.guarantees}>
            <View style={styles.guaranteeItem}>
              <Shield color="#4CAF50" size={16} strokeWidth={2.5} />
              <Text style={styles.guaranteeText}>Secure payment</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <TrendingUp color="#9C27B0" size={16} strokeWidth={2.5} />
              <Text style={styles.guaranteeText}>Cancel anytime</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <Clock color="#FF8E53" size={16} strokeWidth={2.5} />
              <Text style={styles.guaranteeText}>No charge for 3 days</Text>
            </View>
          </View>

          <View style={styles.trialDetails}>
            <Text style={styles.trialDetailsTitle}>How Your Trial Works:</Text>
            <View style={styles.trialStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Start your free trial today with payment info</Text>
            </View>
            <View style={styles.trialStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Enjoy unlimited access for 3 days - completely free</Text>
            </View>
            <View style={styles.trialStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Get charged only after trial ends (cancel anytime)</Text>
            </View>
          </View>

          <Text style={styles.legalText}>
            By starting your trial, you agree to our Terms of Service and Privacy Policy. Your subscription will automatically renew unless cancelled at least 24 hours before the end of the trial period.
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  urgencyBanner: {
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  urgencyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  socialProofAvatars: {
    flexDirection: 'row',
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  benefitsSection: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
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
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
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
  trialDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  trialDetailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  trialStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D4A574',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  legalText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
});
