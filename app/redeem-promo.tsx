import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Gift, Sparkles, Check, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';

const PROMO_CODES = {
  WELCOME7DAYS: {
    code: 'WELCOME7DAYS',
    days: 7,
    type: 'trial' as const,
    description: '7 days free premium access',
  },
  GLOW1WEEK: {
    code: 'GLOW1WEEK',
    days: 7,
    type: 'trial' as const,
    description: '1 week free trial',
  },
  BEAUTY7: {
    code: 'BEAUTY7',
    days: 7,
    type: 'trial' as const,
    description: '7 days premium trial',
  },
};

export default function RedeemPromoScreen() {
  const { theme } = useTheme();
  const { startLocalTrial, state } = useSubscription();
  const insets = useSafeAreaInsets();
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  const validatePromoCode = useCallback((code: string): boolean => {
    const normalizedCode = code.trim().toUpperCase();
    return Object.keys(PROMO_CODES).includes(normalizedCode);
  }, []);

  const handleRedeemPromo = useCallback(async () => {
    if (!promoCode.trim()) {
      setValidationError('Please enter a promo code');
      return;
    }

    const normalizedCode = promoCode.trim().toUpperCase();

    if (!validatePromoCode(normalizedCode)) {
      setValidationError('Invalid promo code. Please check and try again.');
      return;
    }

    const promoDetails = PROMO_CODES[normalizedCode as keyof typeof PROMO_CODES];

    if (!promoDetails) {
      setValidationError('Promo code not found');
      return;
    }

    if (state.isPremium) {
      Alert.alert(
        'Already Premium',
        'You already have an active premium subscription. Promo codes can only be redeemed by free users.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsRedeeming(true);
    setValidationError(null);

    try {
      console.log(`Redeeming promo code: ${normalizedCode}`);
      console.log(`Promo details:`, promoDetails);

      await startLocalTrial(promoDetails.days);

      Alert.alert(
        '🎉 Promo Code Redeemed!',
        `You now have ${promoDetails.days} days of premium access! Enjoy unlimited scans, AI coaching, and all premium features.`,
        [
          {
            text: 'Start Your Glow Journey ✨',
            onPress: () => {
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to redeem promo code:', error);
      Alert.alert(
        'Redemption Failed',
        'We could not redeem your promo code. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRedeeming(false);
    }
  }, [promoCode, validatePromoCode, state.isPremium, startLocalTrial]);

  const handleBack = useCallback(() => {
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
          <View style={styles.heroSection}>
            <LinearGradient colors={gradient.rose} style={styles.heroIcon}>
              <Gift color={palette.pearl} size={40} strokeWidth={2} />
            </LinearGradient>
            <Text style={[styles.heroTitle, { color: palette.textPrimary }]}>
              Have a Promo Code?
            </Text>
            <Text style={[styles.heroSubtitle, { color: palette.textSecondary }]}>
              Unlock premium features with your promo code
            </Text>
          </View>

          <View style={[styles.inputContainer, shadow.card]}>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: palette.surface,
                  borderColor: validationError ? palette.error : palette.divider,
                },
              ]}
            >
              <Gift
                color={validationError ? palette.error : palette.gold}
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
                placeholder="Enter promo code"
                placeholderTextColor={palette.textMuted}
                value={promoCode}
                onChangeText={(text) => {
                  setPromoCode(text);
                  setValidationError(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isRedeeming}
                testID="promo-code-input"
              />
              {promoCode.length > 0 && !isRedeeming && (
                <TouchableOpacity onPress={() => setPromoCode('')} testID="clear-promo">
                  <X color={palette.textMuted} size={20} strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>
            {validationError && (
              <Text style={[styles.errorText, { color: palette.error }]}>{validationError}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.redeemButton}
            onPress={handleRedeemPromo}
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
            >
              {isRedeeming ? (
                <ActivityIndicator color={palette.textPrimary} />
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
            <Text style={[styles.helpTitle, { color: palette.textSecondary }]}>
              Where to find promo codes?
            </Text>
            <Text style={[styles.helpText, { color: palette.textMuted }]}>
              Check your email for exclusive offers, follow us on social media, or contact our
              support team.
            </Text>
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
