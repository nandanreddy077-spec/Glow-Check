import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Lock, Zap, TrendingUp, Star, Crown, Clock, CheckCircle } from 'lucide-react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function FreeScanLimitScreen() {
  const { state, processInAppPurchase, startLocalTrial, setSubscriptionData } = useSubscription();
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

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
            text: 'Continue ✨', 
            style: 'default', 
            onPress: () => router.replace('/(tabs)')
          }]
        );
      } else if (result.error !== 'STORE_REDIRECT') {
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
          <Text style={styles.headerTitle}>Upgrade to Premium</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <LinearGradient 
              colors={['#FFB6C1', '#FFA07A']}
              style={styles.heroIcon}
            >
              <Lock color="#FFFFFF" size={40} strokeWidth={2} />
            </LinearGradient>
            <Text style={styles.heroTitle}>
              You've Used Your Free Scan
            </Text>
            <Text style={styles.heroSubtitle}>
              Unlock unlimited scans and premium features with a 7-day free trial
            </Text>
          </View>

          <View style={styles.limitInfo}>
            <View style={styles.limitCard}>
              <View style={styles.limitHeader}>
                <Text style={styles.limitTitle}>Free Plan</Text>
                <View style={styles.limitBadge}>
                  <Text style={styles.limitBadgeText}>CURRENT</Text>
                </View>
              </View>
              <View style={styles.limitFeatures}>
                <View style={styles.limitFeature}>
                  <CheckCircle color="#4CAF50" size={16} strokeWidth={2.5} />
                  <Text style={styles.limitFeatureText}>1 scan per week</Text>
                </View>
                <View style={styles.limitFeature}>
                  <Clock color="#FF9800" size={16} strokeWidth={2.5} />
                  <Text style={styles.limitFeatureText}>Results visible for 24 hours</Text>
                </View>
                <View style={styles.limitFeature}>
                  <Lock color="#999999" size={16} strokeWidth={2.5} />
                  <Text style={styles.limitFeatureText}>Limited features</Text>
                </View>
              </View>
              <Text style={styles.resetText}>
                Your free scan resets every Sunday
              </Text>
            </View>
          </View>

          <View style={styles.premiumSection}>
            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
            
            <View style={styles.benefitsList}>
              {[
                { icon: Zap, text: 'Unlimited scans anytime', color: '#FFB6C1' },
                { icon: TrendingUp, text: 'Full results access forever', color: '#DDA0DD' },
                { icon: Star, text: 'Weekly progress tracking', color: '#D4A574' },
                { icon: Crown, text: 'AI beauty coach & tips', color: '#C8956D' },
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <LinearGradient colors={[benefit.color, benefit.color + 'CC']} style={styles.benefitIcon}>
                    <benefit.icon color="#FFFFFF" size={18} strokeWidth={2.5} />
                  </LinearGradient>
                  <Text style={styles.benefitText}>{benefit.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.planSection}>
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
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={['#D4A574', '#C8956D']}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>
                {isProcessing ? 'Processing...' : 'Start 7-Day Free Trial'}
              </Text>
              {!isProcessing && (
                <Text style={styles.continuePrice}>
                  Free for 7 days, then {selectedPlan === 'yearly' ? '$99/year' : '$8.99/month'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

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
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
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
    paddingHorizontal: 20,
  },
  limitInfo: {
    marginBottom: 32,
  },
  limitCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  limitTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  limitBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  limitBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666666',
    letterSpacing: 0.5,
  },
  limitFeatures: {
    gap: 12,
    marginBottom: 16,
  },
  limitFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  limitFeatureText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  resetText: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  premiumSection: {
    marginBottom: 32,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1A1A1A',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
    color: '#FFFFFF',
    marginBottom: 4,
  },
  continuePrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
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
