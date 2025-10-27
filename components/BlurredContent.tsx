import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Crown, Sparkles, Lock } from 'lucide-react-native';
import { getPalette } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { router } from 'expo-router';

interface BlurredContentProps {
  children: React.ReactNode;
  message?: string;
  showUpgrade?: boolean;
  shouldBlur?: boolean;
  testID?: string;
}

export default function BlurredContent({ 
  children, 
  message = "Upgrade to Premium to view your results",
  showUpgrade = true,
  shouldBlur,
  testID
}: BlurredContentProps) {
  const { theme } = useTheme();
  const { canViewResults, isTrialExpired, inTrial, daysLeft } = useSubscription();
  const palette = getPalette(theme);

  const shouldShowBlurred = shouldBlur !== undefined ? shouldBlur : !canViewResults;

  if (!shouldShowBlurred) {
    return <>{children}</>;
  }

  const getTrialMessage = () => {
    if (isTrialExpired) {
      return "Your 7-day trial has ended";
    }
    if (inTrial) {
      return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in trial`;
    }
    return "Start your 7-day free trial";
  };

  const upgradeMessage = isTrialExpired 
    ? "Upgrade to Premium to continue your glow journey!"
    : message;

  const renderUpgradeCard = () => (
    <View style={styles.upgradeCard}>
      <View style={styles.iconContainer}>
        <View style={styles.lockIcon}>
          <Lock color={palette.gold} size={32} strokeWidth={2} />
        </View>
        <Sparkles 
          color={palette.blush} 
          size={24} 
          style={styles.sparkle1}
        />
        <Sparkles 
          color={palette.lavender} 
          size={20} 
          style={styles.sparkle2}
        />
      </View>
      
      <Text style={[styles.trialStatus, { color: palette.gold }]}>
        {getTrialMessage()}
      </Text>
      
      <Text style={[styles.upgradeTitle, { color: palette.textLight }]}>
        Premium Required
      </Text>
      
      <Text style={[styles.upgradeMessage, { color: palette.textSecondary }]}>
        {upgradeMessage}
      </Text>
      
      {showUpgrade && (
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => router.push('/unlock-glow')}
          activeOpacity={0.8}
          testID="upgrade-button"
        >
          <LinearGradient 
            colors={[palette.gold, palette.blush]} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }} 
            style={styles.upgradeButtonGradient}
          >
            <Crown color="#000" size={20} strokeWidth={2.5} />
            <Text style={styles.upgradeButtonText}>
              {isTrialExpired ? 'Upgrade Now' : 'Start Free Trial'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      
      <Text style={[styles.legalText, { color: palette.textMuted }]}>
        {!isTrialExpired ? '7-day free trial • ' : ''}Cancel anytime
      </Text>
    </View>
  );

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.blurredContent}>
        {children}
      </View>
      
      <View style={styles.overlay}>
        {Platform.OS !== 'web' ? (
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
            <LinearGradient 
              colors={['rgba(15,13,16,0.85)', 'rgba(15,13,16,0.95)']} 
              style={styles.overlayGradient}
            >
              {renderUpgradeCard()}
            </LinearGradient>
          </BlurView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webBlur]}>
            <LinearGradient 
              colors={['rgba(15,13,16,0.92)', 'rgba(15,13,16,0.98)']} 
              style={styles.overlayGradient}
            >
              {renderUpgradeCard()}
            </LinearGradient>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative' as const,
    flex: 1,
  },
  blurredContent: {
    flex: 1,
    opacity: 0.15,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
  },
  webBlur: {
    backdropFilter: 'blur(20px)',
  },
  overlayGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  upgradeCard: {
    backgroundColor: 'rgba(28, 24, 32, 0.95)',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center' as const,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.3)',
    shadowColor: '#D4A574',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconContainer: {
    position: 'relative' as const,
    marginBottom: 20,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 165, 116, 0.15)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.4)',
  },
  sparkle1: {
    position: 'absolute' as const,
    top: -8,
    right: -8,
  },
  sparkle2: {
    position: 'absolute' as const,
    bottom: -4,
    left: -12,
  },
  trialStatus: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '900' as const,
    marginBottom: 12,
    textAlign: 'center' as const,
    letterSpacing: -0.5,
  },
  upgradeMessage: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center' as const,
    marginBottom: 28,
    maxWidth: 280,
    opacity: 0.9,
  },
  upgradeButton: {
    borderRadius: 20,
    overflow: 'hidden' as const,
    shadowColor: '#D4A574',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  upgradeButtonGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
    paddingVertical: 18,
    gap: 10,
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '900' as const,
    letterSpacing: 0.3,
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center' as const,
    marginTop: 20,
    opacity: 0.7,
  },
});
