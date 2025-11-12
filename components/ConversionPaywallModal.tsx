import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { X, Check, Sparkles, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import { 
  getConversionCopy, 
  getRandomTestimonial,
  premiumFeatures 
} from '@/lib/conversion-helpers';

interface ConversionPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  trigger: 'scan_limit' | 'results_expired' | 'premium_feature' | 'trial_reminder';
  isFreeUser: boolean;
  isTrialUser: boolean;
  scansUsed: number;
}

export default function ConversionPaywallModal({
  visible,
  onClose,
  trigger,
  isFreeUser,
  isTrialUser,
  scansUsed
}: ConversionPaywallModalProps) {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const [scaleAnim] = useState(new Animated.Value(0.95));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [testimonial] = useState(getRandomTestimonial());
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');

  const conversionCopy = getConversionCopy(isFreeUser, isTrialUser, scansUsed);
  const styles = createStyles(palette);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.95);
      fadeAnim.setValue(0);
    }
  }, [visible, scaleAnim, fadeAnim]);

  const handleStartTrial = () => {
    onClose();
    router.push('/start-trial');
  };

  const handleUpgrade = () => {
    onClose();
    router.push('/plan-selection');
  };

  const handleMaybeLater = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BlurView intensity={90} style={StyleSheet.absoluteFill} tint={theme === 'dark' ? 'dark' : 'light'}>
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <LinearGradient colors={gradient.hero} style={styles.modal}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <View style={styles.closeButtonInner}>
                <X color={palette.textSecondary} size={20} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              {/* Hero Section with Before/After Preview */}
              <View style={styles.heroSection}>
                <View style={styles.iconContainer}>
                  <LinearGradient colors={gradient.rose} style={styles.iconGradient}>
                    <Sparkles color={palette.textLight} size={32} fill={palette.textLight} strokeWidth={2.5} />
                  </LinearGradient>
                </View>
                
                <Text style={styles.heading}>{conversionCopy.heading}</Text>
                <Text style={styles.subheading}>{conversionCopy.subheading}</Text>
                
                {/* Aspirational Before/After Preview */}
                <View style={styles.beforeAfterPreview}>
                  <View style={styles.beforeAfterCard}>
                    <View style={styles.beforeColumn}>
                      <Text style={styles.beforeAfterLabel}>Before</Text>
                      <View style={styles.beforeAfterImagePlaceholder}>
                        <View style={styles.blurredBadge}>
                          <Text style={styles.blurredText}>🔒</Text>
                        </View>
                      </View>
                      <Text style={styles.beforeAfterScore}>Score: 72</Text>
                    </View>
                    <View style={styles.arrowContainer}>
                      <TrendingUp color={palette.success} size={28} strokeWidth={3} />
                    </View>
                    <View style={styles.afterColumn}>
                      <Text style={styles.beforeAfterLabel}>After 30 Days</Text>
                      <View style={[styles.beforeAfterImagePlaceholder, styles.glowingPlaceholder]}>
                        <Sparkles color={palette.primary} size={32} fill={palette.primary} strokeWidth={2.5} />
                      </View>
                      <Text style={[styles.beforeAfterScore, { color: palette.success }]}>Score: 89 ✨</Text>
                    </View>
                  </View>
                  <Text style={styles.beforeAfterCaption}>Track your transformation like {testimonial.name}</Text>
                </View>
              </View>



              {/* Premium Features */}
              <View style={styles.featuresSection}>
                <Text style={styles.featuresTitle}>What You&apos;ll Unlock:</Text>
                {premiumFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureIconText}>{feature.icon}</Text>
                    </View>
                    <View style={styles.featureContent}>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                    <Check color={palette.success} size={20} strokeWidth={3} />
                  </View>
                ))}
              </View>

              {/* Pricing Plans (if free user) */}
              {isFreeUser && (
                <View style={styles.pricingSection}>
                  <Text style={styles.pricingTitle}>Choose Your Plan:</Text>
                  
                  <TouchableOpacity 
                    onPress={() => setSelectedPlan('yearly')}
                    activeOpacity={0.9}
                  >
                    <View style={[styles.pricingCard, selectedPlan === 'yearly' && styles.pricingCardSelected]}>
                      {selectedPlan === 'yearly' && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>BEST VALUE</Text>
                        </View>
                      )}
                      <View style={styles.pricingHeader}>
                        <Text style={styles.pricingLabel}>Yearly</Text>
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsText}>Save 50%</Text>
                        </View>
                      </View>
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingAmount}>$8.25</Text>
                        <Text style={styles.pricingPeriod}>/month</Text>
                      </View>
                      <Text style={styles.pricingSubtext}>$99/year • Just $0.27/day</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => setSelectedPlan('monthly')}
                    activeOpacity={0.9}
                  >
                    <View style={[styles.pricingCard, selectedPlan === 'monthly' && styles.pricingCardSelected]}>
                      <View style={styles.pricingHeader}>
                        <Text style={styles.pricingLabel}>Monthly</Text>
                      </View>
                      <View style={styles.pricingRow}>
                        <Text style={styles.pricingAmount}>$9.99</Text>
                        <Text style={styles.pricingPeriod}>/month</Text>
                      </View>
                      <Text style={styles.pricingSubtext}>Billed monthly • Cancel anytime</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Testimonial */}
              <View style={styles.testimonialSection}>
                <View style={styles.testimonialCard}>
                  <Image source={{ uri: testimonial.avatar }} style={styles.testimonialAvatar} />
                  <View style={styles.testimonialContent}>
                    <Text style={styles.testimonialText}>
                      💬 &ldquo;I finally understand my skin! The before/after tracking is incredible!&rdquo;
                    </Text>
                    <View style={styles.testimonialAuthor}>
                      <Text style={styles.testimonialName}>{testimonial.name}</Text>
                      <View style={styles.verifiedBadge}>
                        <Check color={palette.textLight} size={12} strokeWidth={3} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>



              {/* CTA Buttons */}
              <View style={styles.ctaSection}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={isFreeUser ? handleStartTrial : isTrialUser ? handleUpgrade : handleStartTrial}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={gradient.primary} style={styles.primaryButtonGradient}>
                    <Sparkles color={palette.textLight} size={20} fill={palette.textLight} strokeWidth={2.5} />
                    <Text style={styles.primaryButtonText}>{conversionCopy.cta}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={handleMaybeLater}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>Maybe Later</Text>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                  Cancel anytime • No hidden fees • 100% satisfaction guaranteed
                </Text>
              </View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 32,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.card,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 56,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.elevated,
  },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  beforeAfterPreview: {
    width: '100%',
    marginBottom: 20,
  },
  beforeAfterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: palette.primary,
    ...shadow.elevated,
  },
  beforeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  afterColumn: {
    flex: 1,
    alignItems: 'center',
  },
  arrowContainer: {
    marginHorizontal: 12,
  },
  beforeAfterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  beforeAfterImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...shadow.card,
  },
  glowingPlaceholder: {
    backgroundColor: palette.overlayGold,
    borderWidth: 2,
    borderColor: palette.primary,
  },
  blurredBadge: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.overlayDark,
    borderRadius: 40,
  },
  blurredText: {
    fontSize: 24,
  },
  beforeAfterScore: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  beforeAfterCaption: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
    ...shadow.elevated,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.overlayBlush,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  featureDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.textSecondary,
    lineHeight: 18,
  },
  pricingSection: {
    marginBottom: 24,
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  pricingCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: palette.divider,
    position: 'relative',
    ...shadow.card,
  },
  pricingCardSelected: {
    borderColor: palette.primary,
    borderWidth: 3,
    ...shadow.elevated,
  },
  selectedBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: palette.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    ...shadow.card,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: palette.textLight,
    letterSpacing: 0.5,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pricingLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  savingsBadge: {
    backgroundColor: palette.overlayGold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '800',
    color: palette.gold,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: palette.primary,
    letterSpacing: -1,
  },
  pricingPeriod: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textSecondary,
    marginLeft: 4,
  },
  pricingSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textSecondary,
  },
  testimonialSection: {
    marginBottom: 24,
  },
  testimonialCard: {
    flexDirection: 'row',
    backgroundColor: palette.overlayLavender,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.divider,
    ...shadow.card,
  },
  testimonialAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: palette.primary,
  },
  testimonialContent: {
    flex: 1,
  },
  testimonialText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
    lineHeight: 20,
    marginBottom: 8,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testimonialName: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textLight,
  },
  socialProofSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  socialProofItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  socialProofText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textSecondary,
  },
  ctaSection: {
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 28,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textLight,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textSecondary,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});