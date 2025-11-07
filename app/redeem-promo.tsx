import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Gift, Sparkles, Check, X, Tag } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import { paymentService } from '@/lib/payments';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const PROMO_CODES = {
  WELCOME17: {
    code: 'WELCOME17',
    type: 'appstore_promo' as const,
    description: 'Free for the first month',
    emoji: '🎉',
  },
  GLOWCHECK: {
    code: 'GLOWCHECK',
    type: 'appstore_promo' as const,
    description: 'Free for the first month',
    emoji: '✨',
  },
  WELCOME7DAYS: {
    code: 'WELCOME7DAYS',
    days: 7,
    type: 'trial' as const,
    description: '7 days premium access',
    emoji: '🎉',
  },
  GLOW1WEEK: {
    code: 'GLOW1WEEK',
    days: 7,
    type: 'trial' as const,
    description: '1 week premium trial',
    emoji: '✨',
  },
  BEAUTY7: {
    code: 'BEAUTY7',
    days: 7,
    type: 'trial' as const,
    description: '7 days beauty experience',
    emoji: '💅',
  },
};

export default function RedeemPromoScreen() {
  const { theme } = useTheme();
  const { startLocalTrial, state, setSubscriptionData } = useSubscription();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successAnimation] = useState(new Animated.Value(0));
  const [shakeAnimation] = useState(new Animated.Value(0));

  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  useEffect(() => {
    Animated.spring(successAnimation, {
      toValue: 1,
      tension: 40,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [successAnimation]);

  const triggerShake = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnimation]);

  const triggerSuccess = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const validatePromoCode = useCallback((code: string): boolean => {
    const normalizedCode = code.trim().toUpperCase();
    return Object.keys(PROMO_CODES).includes(normalizedCode);
  }, []);

  const handleRedeemPromo = useCallback(async () => {
    if (!promoCode.trim()) {
      setValidationError('Please enter a promo code');
      triggerShake();
      return;
    }

    const normalizedCode = promoCode.trim().toUpperCase();

    if (!validatePromoCode(normalizedCode)) {
      setValidationError('Invalid promo code. Please check and try again.');
      triggerShake();
      return;
    }

    const promoDetails = PROMO_CODES[normalizedCode as keyof typeof PROMO_CODES];

    if (!promoDetails) {
      setValidationError('Promo code not found');
      triggerShake();
      return;
    }

    if (state.isPremium) {
      Alert.alert(
        '✨ Already Premium',
        'You already have an active premium subscription. Promo codes can only be redeemed by free users.',
        [{ text: 'Got it' }]
      );
      return;
    }

    setIsRedeeming(true);
    setValidationError(null);

    try {
      console.log(`Redeeming promo code: ${normalizedCode}`);
      console.log(`Promo details:`, promoDetails);

      if (promoDetails.type === 'appstore_promo') {
        if (Platform.OS === 'web') {
          Alert.alert(
            '📱 Mobile Only',
            'App Store promo codes can only be redeemed on iOS devices. Please use the mobile app to redeem this code.',
            [{ text: 'OK' }]
          );
          return;
        }

        const result = await paymentService.redeemPromoCode(normalizedCode);
        
        if (result.success) {
          await setSubscriptionData({
            isPremium: true,
            hasAddedPayment: true,
            hasStartedTrial: false,
            trialStartedAt: undefined,
            trialEndsAt: undefined,
          });
          
          if (user?.id) {
            try {
              await supabase
                .from('profiles')
                .update({ 
                  subscription_status: 'premium',
                  is_premium: true,
                  promo_code_used: normalizedCode,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
              
              console.log('Promo code synced with backend');
            } catch (backendError) {
              console.error('Failed to update backend promo code status:', backendError);
            }
          }
          
          triggerSuccess();
          Alert.alert(
            `${promoDetails.emoji} Promo Code Redeemed!`,
            `Congratulations! ${promoDetails.description}\n\nEnjoy:\n✨ Unlimited glow scans\n💅 AI beauty coaching\n🌟 Personalized skincare plans\n👗 Style recommendations\n\nYour glow journey starts now!`,
            [
              {
                text: 'Start Glowing ✨',
                onPress: () => {
                  router.replace('/(tabs)');
                },
              },
            ]
          );
        } else {
          setValidationError(result.error || 'Failed to redeem promo code');
          triggerShake();
        }
      } else if (promoDetails.type === 'trial' && promoDetails.days) {
        if (state.hasStartedTrial) {
          Alert.alert(
            '💫 Trial Already Used',
            'You already used your trial. Promo codes can only be used once per account.',
            [{ text: 'Got it' }]
          );
          return;
        }

        await startLocalTrial(promoDetails.days);
        triggerSuccess();

        Alert.alert(
          `${promoDetails.emoji} Promo Code Redeemed!`,
          `Congratulations! You now have ${promoDetails.days} days of premium access.\n\nEnjoy:\n✨ Unlimited glow scans\n💅 AI beauty coaching\n🌟 Personalized skincare plans\n👗 Style recommendations\n\nYour glow journey starts now!`,
          [
            {
              text: 'Start Glowing ✨',
              onPress: () => {
                router.replace('/(tabs)');
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to redeem promo code:', error);
      Alert.alert(
        '😞 Redemption Failed',
        'We couldn\'t redeem your promo code. Please try again or contact support if the problem persists.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRedeeming(false);
    }
  }, [promoCode, validatePromoCode, state.isPremium, state.hasStartedTrial, startLocalTrial, setSubscriptionData, user?.id, triggerShake, triggerSuccess]);

  const handleBack = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />

      <Stack.Screen
        options={{
          title: '',
          headerShown: false,
        }}
      />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <View style={[styles.backCircle, { backgroundColor: palette.surfaceElevated }]}>
            <ArrowLeft color={palette.textPrimary} size={20} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Redeem Promo Code</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            style={[
              styles.heroSection,
              {
                opacity: successAnimation,
                transform: [{
                  translateY: successAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            <LinearGradient colors={gradient.rose} style={styles.heroIcon}>
              <Gift color={palette.pearl} size={40} strokeWidth={2} />
            </LinearGradient>
            <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>
              Have a Promo Code?
            </Text>
            <Text style={[styles.heroSubtitle, { color: palette.textSecondary }]}>
              Unlock premium features with your exclusive code
            </Text>
          </Animated.View>

          <Animated.View 
            style={[
              styles.inputContainer,
              shadow.card,
              {
                transform: [{ translateX: shakeAnimation }],
              },
            ]}
          >
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: palette.surface,
                  borderColor: validationError ? palette.error : promoCode.length > 0 ? palette.gold : palette.divider,
                  borderWidth: promoCode.length > 0 ? 2 : 1,
                },
              ]}
            >
              <Tag
                color={validationError ? palette.error : promoCode.length > 0 ? palette.gold : palette.textMuted}
                size={20}
                strokeWidth={2.5}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: palette.textPrimary,
                  },
                ]}
                placeholder="Enter your exclusive code"
                placeholderTextColor={palette.textMuted}
                value={promoCode}
                onChangeText={(text) => {
                  setPromoCode(text);
                  setValidationError(null);
                  if (Platform.OS !== 'web' && text.length > 0) {
                    Haptics.selectionAsync();
                  }
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isRedeeming}
                testID="promo-code-input"
              />
              {promoCode.length > 0 && !isRedeeming && (
                <TouchableOpacity 
                  onPress={() => {
                    setPromoCode('');
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }} 
                  testID="clear-promo"
                >
                  <X color={palette.textMuted} size={20} strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>
            {validationError && (
              <Animated.View
                style={{
                  opacity: successAnimation,
                }}
              >
                <Text style={[styles.errorText, { color: palette.error }]}>{validationError}</Text>
              </Animated.View>
            )}
          </Animated.View>

          <TouchableOpacity
            style={styles.redeemButton}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              handleRedeemPromo();
            }}
            disabled={isRedeeming || !promoCode.trim()}
            activeOpacity={0.8}
            testID="redeem-button"
          >
            <LinearGradient
              colors={
                isRedeeming || !promoCode.trim()
                  ? [palette.surfaceAlt, palette.surfaceAlt]
                  : gradient.primary
              }
              style={styles.redeemGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isRedeeming ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={palette.textPrimary} size="small" />
                  <Text style={[styles.redeemText, { color: palette.textPrimary, marginLeft: 10 }]}>
                    Activating...
                  </Text>
                </View>
              ) : (
                <>
                  <Sparkles color={palette.textPrimary} size={20} strokeWidth={2.5} />
                  <Text style={[styles.redeemText, { color: palette.textPrimary }]}>
                    Redeem Code
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={[styles.benefitsCard, { backgroundColor: palette.surface }]}>
            <Text style={[styles.benefitsTitle, { color: palette.textPrimary }]}>
              What You&apos;ll Get
            </Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <View
                  style={[
                    styles.benefitIcon,
                    { backgroundColor: 'rgba(255, 215, 0, 0.15)' },
                  ]}
                >
                  <Check color={palette.gold} size={16} strokeWidth={3} />
                </View>
                <Text style={[styles.benefitText, { color: palette.textSecondary }]}>
                  Unlimited glow analyses
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <View
                  style={[
                    styles.benefitIcon,
                    { backgroundColor: 'rgba(255, 215, 0, 0.15)' },
                  ]}
                >
                  <Check color={palette.gold} size={16} strokeWidth={3} />
                </View>
                <Text style={[styles.benefitText, { color: palette.textSecondary }]}>
                  AI-powered beauty coaching
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <View
                  style={[
                    styles.benefitIcon,
                    { backgroundColor: 'rgba(255, 215, 0, 0.15)' },
                  ]}
                >
                  <Check color={palette.gold} size={16} strokeWidth={3} />
                </View>
                <Text style={[styles.benefitText, { color: palette.textSecondary }]}>
                  Personalized skincare plans
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <View
                  style={[
                    styles.benefitIcon,
                    { backgroundColor: 'rgba(255, 215, 0, 0.15)' },
                  ]}
                >
                  <Check color={palette.gold} size={16} strokeWidth={3} />
                </View>
                <Text style={[styles.benefitText, { color: palette.textSecondary }]}>
                  Style recommendations
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.helpSection}>
            <View style={styles.divider} />
            <Text style={[styles.helpTitle, { color: palette.textSecondary }]}>
              Where to find promo codes?
            </Text>
            <Text style={[styles.helpText, { color: palette.textMuted }]}>
              • Check your email for exclusive offers{`\n`}
              • Follow us on social media for special codes{`\n`}
              • Contact support for assistance{`\n`}
              • Look for seasonal promotions
            </Text>
            
            {state.hasStartedTrial && (
              <View style={[styles.trialNotice, { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderColor: palette.gold }]}>
                <Sparkles color={palette.gold} size={16} strokeWidth={2.5} />
                <Text style={[styles.trialNoticeText, { color: palette.textSecondary }]}>
                  You already have an active trial. Promo codes cannot be stacked.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  heroSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 14,
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginLeft: 4,
  },
  redeemButton: {
    marginBottom: 32,
  },
  redeemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
  },
  redeemText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 20,
  },
  trialNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  trialNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  benefitsCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  helpSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
});
