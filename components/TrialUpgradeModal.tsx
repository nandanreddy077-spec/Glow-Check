import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, shadow, spacing, typography } from '@/constants/theme';
import { router } from 'expo-router';

interface TrialUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TrialUpgradeModal({ visible, onClose }: TrialUpgradeModalProps) {
  const { theme } = useTheme();
  const palette = getPalette(theme);

  const handleStartTrial = () => {
    onClose();
    router.push('/plan-selection');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.modalGradient}
        >
          <View style={[styles.modalContent, { backgroundColor: palette.surface }]}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <X color={palette.textSecondary} size={24} />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[palette.gold, palette.blush]}
                style={styles.iconBg}
              >
                <Crown color={palette.textLight} size={48} strokeWidth={2.5} />
              </LinearGradient>
              <View style={styles.sparkles}>
                <Sparkles color={palette.blush} size={20} style={styles.sparkle1} />
                <Sparkles color={palette.lavender} size={16} style={styles.sparkle2} />
              </View>
            </View>

            <Text style={[styles.title, { color: palette.textPrimary }]}>
              Free Scan Used! 🎉
            </Text>

            <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
              You&apos;ve used your free scan. Start your 3-day free trial to continue discovering your glow!
            </Text>

            <View style={styles.benefits}>
              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: palette.overlayBlush }]}>
                  <Text style={styles.benefitEmoji}>📸</Text>
                </View>
                <Text style={[styles.benefitText, { color: palette.textPrimary }]}>
                  2 scans per day for 3 days
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: palette.overlayGold }]}>
                  <Text style={styles.benefitEmoji}>✨</Text>
                </View>
                <Text style={[styles.benefitText, { color: palette.textPrimary }]}>
                  All personalized beauty tips
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <View style={[styles.benefitIcon, { backgroundColor: 'rgba(230,215,240,0.4)' }]}>
                  <Text style={styles.benefitEmoji}>💎</Text>
                </View>
                <Text style={[styles.benefitText, { color: palette.textPrimary }]}>
                  Full analysis access
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStartTrial}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[palette.gold, palette.blush]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startButtonGradient}
              >
                <Crown color={palette.textLight} size={20} strokeWidth={2.5} />
                <Text style={styles.startButtonText}>Start 3-Day Free Trial</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.disclaimer, { color: palette.textMuted }]}>
              Cancel anytime • No commitment
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  modalContent: {
    borderRadius: 32,
    padding: spacing.xxxxl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...shadow.floating,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    padding: spacing.sm,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.floating,
  },
  sparkles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle1: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 4,
    left: -12,
  },
  title: {
    fontSize: typography.display,
    fontWeight: typography.black,
    marginBottom: spacing.md,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    fontWeight: typography.regular,
  },
  benefits: {
    width: '100%',
    marginBottom: spacing.xxl,
    gap: spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitEmoji: {
    fontSize: 20,
  },
  benefitText: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    flex: 1,
  },
  startButton: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadow.elevated,
  },
  startButtonGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: typography.h6,
    fontWeight: typography.bold,
    letterSpacing: 0.2,
  },
  disclaimer: {
    fontSize: typography.caption,
    textAlign: 'center',
    fontWeight: typography.medium,
  },
});
