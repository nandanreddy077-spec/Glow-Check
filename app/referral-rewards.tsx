import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { useReferral } from '@/contexts/ReferralContext';
import { palette, spacing, radii, typography, shadow } from '@/constants/theme';
import { DollarSign, Users, Gift, Share2, Copy, Check, TrendingUp, Sparkles, Heart } from 'lucide-react-native';



export default function ReferralRewardsScreen() {
  const {
    referralCode,
    stats,
    history,
    loading,
    shareReferralLink,
    copyReferralCode,
    copyReferralLink,
  } = useReferral();

  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyCode = async () => {
    const success = await copyReferralCode();
    if (success) {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>Loading your rewards...</Text>
      </View>
    );
  }

  const pendingEarnings = stats?.totalPending || 0;
  const totalEarnings = stats?.totalEarned || 0;
  const totalReferrals = stats?.totalReferrals || 0;
  const activeReferrals = stats?.activeReferrals || 0;
  const conversions = stats?.totalConversions || 0;
  const monthlyRecurringRevenue = stats?.monthlyRecurringRevenue || 0;
  const lifetimeMonths = stats?.lifetimeMonthsPaid || 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Referral Rewards',
          headerStyle: {
            backgroundColor: palette.surface,
          },
          headerTintColor: palette.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#FFE5D9', '#FFF5F0', palette.surface]}
          style={styles.headerGradient}
        >
          <View style={styles.heroSection}>
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={[palette.primary, palette.secondary]}
                style={styles.iconGradient}
              >
                <Gift size={32} color={palette.textLight} strokeWidth={2.5} />
              </LinearGradient>
            </View>

            <Text style={styles.heroTitle}>Share the Glow,</Text>
            <Text style={styles.heroTitle}>Earn Rewards</Text>
            <Text style={styles.heroSubtitle}>
              Earn $1/month for every active subscriber
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#FFF9F5']}
                  style={styles.statCardGradient}
                >
                  <View style={styles.statIconWrapper}>
                    <TrendingUp size={24} color={palette.primary} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.statValue}>
                    ${monthlyRecurringRevenue.toFixed(2)}/mo
                  </Text>
                  <Text style={styles.statLabel}>Monthly Revenue</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#F5F9FF']}
                  style={styles.statCardGradient}
                >
                  <View style={styles.statIconWrapper}>
                    <Users size={24} color={palette.info} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.statValue}>{activeReferrals}</Text>
                  <Text style={styles.statLabel}>Active Subscribers</Text>
                </LinearGradient>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#F0FFF4']}
                  style={styles.statCardGradient}
                >
                  <View style={styles.statIconWrapper}>
                    <DollarSign size={24} color={palette.success} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.statValue}>
                    ${totalEarnings.toFixed(2)}
                  </Text>
                  <Text style={styles.statLabel}>Lifetime Earnings</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#FFF0F5']}
                  style={styles.statCardGradient}
                >
                  <View style={styles.statIconWrapper}>
                    <Sparkles size={24} color={palette.rose} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.statValue}>{lifetimeMonths}</Text>
                  <Text style={styles.statLabel}>Total Months Paid</Text>
                </LinearGradient>
              </View>
            </View>

            {activeReferrals > 0 && (
              <View style={styles.pendingCard}>
                <LinearGradient
                  colors={['#E6F9F0', '#DAFFF0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pendingGradient}
                >
                  <Sparkles size={20} color={palette.success} />
                  <Text style={styles.pendingText}>
                    💰 You're earning ${monthlyRecurringRevenue.toFixed(2)}/month from {activeReferrals}{' '}
                    {activeReferrals === 1 ? 'active subscriber' : 'active subscribers'}!
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.contentSection}>
          <View style={styles.shareSection}>
            <View style={styles.sectionHeader}>
              <Share2 size={20} color={palette.primary} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Share Your Code</Text>
            </View>

            <View style={styles.codeCard}>
              <LinearGradient
                colors={[palette.primary, palette.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.codeGradient}
              >
                <View style={styles.codeContent}>
                  <View style={styles.codeLeft}>
                    <Text style={styles.codeLabel}>Your Referral Code</Text>
                    <Text style={styles.codeText}>{referralCode}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopyCode}
                    activeOpacity={0.7}
                  >
                    {codeCopied ? (
                      <Check size={20} color={palette.success} strokeWidth={3} />
                    ) : (
                      <Copy size={20} color={palette.textLight} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareReferralLink}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[palette.primary, palette.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shareButtonGradient}
              >
                <Share2 size={20} color={palette.textLight} strokeWidth={2.5} />
                <Text style={styles.shareButtonText}>Share with Friends</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleCopyLink}
              activeOpacity={0.7}
            >
              <Text style={styles.linkButtonText}>
                {linkCopied ? 'Link Copied!' : 'Copy Referral Link'}
              </Text>
              {linkCopied ? (
                <Check size={18} color={palette.success} strokeWidth={3} />
              ) : (
                <Copy size={18} color={palette.primary} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.howItWorksSection}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color={palette.primary} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>How It Works</Text>
            </View>

            <View style={styles.stepsList}>
              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: palette.blush }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Share Your Code</Text>
                  <Text style={styles.stepDescription}>
                    Send your unique referral code to friends who love beauty & style
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: palette.lavender }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>They Subscribe</Text>
                  <Text style={styles.stepDescription}>
                    When your friend subscribes to premium, you both win!
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: palette.mint }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Earn $1/Month</Text>
                  <Text style={styles.stepDescription}>
                    Get $1 every month while they stay subscribed - recurring income!
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {history.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.sectionHeader}>
                <Heart size={20} color={palette.primary} strokeWidth={2.5} />
                <Text style={styles.sectionTitle}>Your Referrals</Text>
              </View>

              <View style={styles.historyList}>
                {history.slice(0, 5).map((item, index) => (
                  <View key={item.referralId} style={styles.historyItem}>
                    <View style={styles.historyLeft}>
                      <View
                        style={[
                          styles.historyStatus,
                          {
                            backgroundColor:
                              item.status === 'converted'
                                ? palette.success
                                : item.status === 'paid'
                                ? palette.info
                                : palette.warning,
                          },
                        ]}
                      />
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyEmail} numberOfLines={1}>
                          {item.referredUserEmail}
                        </Text>
                        <Text style={styles.historyDate}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <Text
                        style={[
                          styles.historyReward,
                          item.status === 'active' && styles.historyRewardActive,
                        ]}
                      >
                        ${item.totalEarned.toFixed(2)}
                      </Text>
                      <Text style={styles.historyStatusText}>
                        {item.status === 'active'
                          ? `✓ ${item.totalMonthsPaid} ${item.totalMonthsPaid === 1 ? 'month' : 'months'}`
                          : item.status === 'inactive' || item.status === 'cancelled'
                          ? `Ended (${item.totalMonthsPaid}mo)`
                          : 'Pending'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>Why Share Lumyn?</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Sparkles size={18} color={palette.primary} strokeWidth={2.5} />
                </View>
                <Text style={styles.benefitText}>
                  Help friends discover their best beauty routine
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <DollarSign size={18} color={palette.success} strokeWidth={2.5} />
                </View>
                <Text style={styles.benefitText}>
                  Earn money while spreading the glow
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Heart size={18} color={palette.rose} strokeWidth={2.5} />
                </View>
                <Text style={styles.benefitText}>
                  Build a community of beauty enthusiasts
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.surface,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.body,
    color: palette.textSecondary,
    fontWeight: typography.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxxl,
  },
  headerGradient: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrapper: {
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  heroTitle: {
    fontSize: typography.display,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    textAlign: 'center',
    lineHeight: typography.display * 1.2,
  },
  heroSubtitle: {
    fontSize: typography.h5,
    color: palette.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    ...shadow.card,
  },
  statCardGradient: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: typography.h2,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.caption,
    color: palette.textSecondary,
    fontWeight: typography.medium,
    textAlign: 'center',
  },
  pendingCard: {
    width: '100%',
    ...shadow.card,
  },
  pendingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  pendingText: {
    flex: 1,
    fontSize: typography.bodySmall,
    fontWeight: typography.semibold,
    color: palette.textPrimary,
  },
  contentSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xxxl,
  },
  shareSection: {
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h4,
    fontWeight: typography.bold,
    color: palette.textPrimary,
  },
  codeCard: {
    ...shadow.card,
  },
  codeGradient: {
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  codeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeLeft: {
    flex: 1,
  },
  codeLabel: {
    fontSize: typography.caption,
    fontWeight: typography.medium,
    color: palette.textLight,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  codeText: {
    fontSize: typography.h3,
    fontWeight: typography.extrabold,
    color: palette.textLight,
    letterSpacing: 2,
  },
  copyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    ...shadow.card,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
  },
  shareButtonText: {
    fontSize: typography.h6,
    fontWeight: typography.bold,
    color: palette.textLight,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.border,
  },
  linkButtonText: {
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: palette.primary,
  },
  howItWorksSection: {
    gap: spacing.lg,
  },
  stepsList: {
    gap: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: palette.textPrimary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.h6,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    lineHeight: typography.bodySmall * 1.5,
  },
  historySection: {
    gap: spacing.lg,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  historyLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyInfo: {
    flex: 1,
  },
  historyEmail: {
    fontSize: typography.bodySmall,
    fontWeight: typography.medium,
    color: palette.textPrimary,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: typography.caption,
    color: palette.textMuted,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyReward: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: palette.textMuted,
    marginBottom: 2,
  },
  historyRewardActive: {
    color: palette.success,
  },
  historyStatusText: {
    fontSize: typography.caption,
    color: palette.textMuted,
  },
  benefitsSection: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  benefitsTitle: {
    fontSize: typography.h5,
    fontWeight: typography.bold,
    color: palette.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  benefitsList: {
    gap: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: typography.bodySmall,
    color: palette.textSecondary,
    lineHeight: typography.bodySmall * 1.5,
  },
});
