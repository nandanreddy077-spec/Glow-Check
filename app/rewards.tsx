import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft,
  Trophy,
  Star,
  Flame,
  Crown,
  Sparkles,
  Award,
  Zap,
  TrendingUp,
  Gift,
  Heart,
  Target,
  Calendar,
} from 'lucide-react-native';
import { useUser } from '@/contexts/UserContext';
import { useGamification } from '@/contexts/GamificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow, spacing, typography } from '@/constants/theme';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'badges' | 'achievements' | 'history';

export default function RewardsScreen() {
  const { user } = useUser();
  const { badges, achievements, glowBoosts, calculateLevel, getLevelProgress } = useGamification();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [glowAnim] = useState(new Animated.Value(0));

  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim]);

  if (!user) return null;

  const level = calculateLevel(user.stats.totalPoints);
  const levelProgress = getLevelProgress(user.stats.totalPoints, level);
  const completedAchievements = achievements.filter((a) => a.completed);
  const recentBoosts = glowBoosts.slice(0, 10);

  const renderOverview = () => (
    <View>
      {/* Level Card */}
      <View style={[styles.card, shadow.elevated]}>
        <LinearGradient colors={gradient.primary} style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelIconContainer}>
              <Crown color={palette.textLight} size={32} strokeWidth={2.5} />
              <Animated.View
                style={[
                  styles.levelIconGlow,
                  {
                    opacity: glowAnim,
                  },
                ]}
              />
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {level}</Text>
              <Text style={styles.levelSubtitle}>Glow Master</Text>
            </View>
            <View style={styles.pointsContainer}>
              <Flame color={palette.gold} size={20} fill={palette.gold} />
              <Text style={styles.pointsValue}>{user.stats.totalPoints}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {levelProgress.current} / {levelProgress.total} points
              </Text>
              <Text style={styles.progressPercent}>
                {Math.round(levelProgress.percentage)}% to Level {level + 1}
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg} />
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${levelProgress.percentage}%`,
                  },
                ]}
              />
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, shadow.card]}>
          <LinearGradient colors={['#F2C2C2', '#E8A87C']} style={styles.statCardInner}>
            <Trophy color={palette.textLight} size={24} strokeWidth={2.5} />
            <Text style={styles.statValue}>{badges.length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </LinearGradient>
        </View>

        <View style={[styles.statCard, shadow.card]}>
          <LinearGradient colors={['#E8D5F0', '#D4A574']} style={styles.statCardInner}>
            <Award color={palette.textLight} size={24} strokeWidth={2.5} />
            <Text style={styles.statValue}>{completedAchievements.length}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </LinearGradient>
        </View>

        <View style={[styles.statCard, shadow.card]}>
          <LinearGradient colors={['#D4F0E8', '#F5D5C2']} style={styles.statCardInner}>
            <Zap color={palette.textLight} size={24} strokeWidth={2.5} fill={palette.textLight} />
            <Text style={styles.statValue}>{user.stats.dayStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp color={palette.gold} size={20} strokeWidth={2.5} />
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        {recentBoosts.length > 0 ? (
          recentBoosts.map((boost) => (
            <View key={boost.id} style={[styles.activityItem, shadow.card]}>
              <View style={styles.activityIconContainer}>
                {boost.type === 'score_improvement' && (
                  <Star color={palette.gold} size={20} fill={palette.gold} />
                )}
                {boost.type === 'streak_milestone' && (
                  <Flame color={palette.blush} size={20} fill={palette.blush} />
                )}
                {boost.type === 'first_analysis' && (
                  <Sparkles color={palette.lavender} size={20} fill={palette.lavender} />
                )}
                {boost.type === 'perfect_score' && (
                  <Crown color={palette.gold} size={20} fill={palette.gold} />
                )}
                {boost.type === 'comeback' && (
                  <TrendingUp color={palette.champagne} size={20} />
                )}
                {!['score_improvement', 'streak_milestone', 'first_analysis', 'perfect_score', 'comeback'].includes(boost.type) && (
                  <Gift color={palette.gold} size={20} />
                )}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{boost.title}</Text>
                <Text style={styles.activityMessage}>{boost.message}</Text>
                <Text style={styles.activityTime}>
                  {new Date(boost.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.activityPoints}>
                <Text style={styles.activityPointsText}>+{boost.points}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Sparkles color={palette.textSecondary} size={48} />
            <Text style={styles.emptyStateText}>Start your journey to earn rewards!</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderBadges = () => (
    <View style={styles.section}>
      <Text style={styles.sectionSubtitle}>
        Unlock special badges by completing milestones in your glow journey
      </Text>

      {badges.length > 0 ? (
        <View style={styles.badgesGrid}>
          {badges.map((badge) => (
            <View key={badge.id} style={[styles.badgeCard, shadow.card]}>
              <LinearGradient
                colors={
                  badge.rarity === 'legendary'
                    ? ['#FFD700', '#FFA500']
                    : badge.rarity === 'epic'
                    ? ['#9333EA', '#C084FC']
                    : badge.rarity === 'rare'
                    ? ['#3B82F6', '#60A5FA']
                    : gradient.card
                }
                style={styles.badgeCardInner}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
                <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(badge.rarity) }]}>
                  <Text style={styles.rarityText}>{badge.rarity.toUpperCase()}</Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Trophy color={palette.textSecondary} size={48} />
          <Text style={styles.emptyStateText}>No badges yet. Complete your first analysis!</Text>
        </View>
      )}
    </View>
  );

  const renderAchievements = () => (
    <View style={styles.section}>
      <Text style={styles.sectionSubtitle}>
        Track your progress and unlock achievements
      </Text>

      {achievements.length > 0 ? (
        achievements.map((achievement) => (
          <View key={achievement.id} style={[styles.achievementCard, shadow.card]}>
            <LinearGradient
              colors={achievement.completed ? gradient.glow : gradient.card}
              style={styles.achievementCardInner}
            >
              <View style={styles.achievementHeader}>
                <View
                  style={[
                    styles.achievementIconContainer,
                    {
                      backgroundColor: achievement.completed
                        ? palette.overlayGold
                        : palette.overlayLight,
                    },
                  ]}
                >
                  {achievement.completed ? (
                    <Award color={palette.gold} size={24} strokeWidth={2.5} />
                  ) : (
                    <Target color={palette.textSecondary} size={24} strokeWidth={2.5} />
                  )}
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                </View>
                <Text style={styles.achievementPoints}>+{achievement.points}</Text>
              </View>

              <View style={styles.achievementProgress}>
                <View style={styles.achievementProgressBar}>
                  <View style={styles.achievementProgressBg} />
                  <View
                    style={[
                      styles.achievementProgressFill,
                      {
                        width: `${(achievement.progress / achievement.target) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.achievementProgressText}>
                  {achievement.progress} / {achievement.target}
                </Text>
              </View>
            </LinearGradient>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Award color={palette.textSecondary} size={48} />
          <Text style={styles.emptyStateText}>Achievements coming soon!</Text>
        </View>
      )}
    </View>
  );

  const renderHistory = () => (
    <View style={styles.section}>
      <Text style={styles.sectionSubtitle}>Your complete points history</Text>

      {recentBoosts.length > 0 ? (
        recentBoosts.map((boost) => (
          <View key={boost.id} style={[styles.historyItem, shadow.card]}>
            <View style={styles.historyDate}>
              <Calendar color={palette.textSecondary} size={16} />
              <Text style={styles.historyDateText}>
                {new Date(boost.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.historyContent}>
              <Text style={styles.historyTitle}>{boost.title}</Text>
              <Text style={styles.historyMessage}>{boost.message}</Text>
            </View>
            <View style={styles.historyPoints}>
              <Zap color={palette.gold} size={16} fill={palette.gold} />
              <Text style={styles.historyPointsText}>+{boost.points}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Heart color={palette.textSecondary} size={48} />
          <Text style={styles.emptyStateText}>No activity yet. Start your glow journey!</Text>
        </View>
      )}
    </View>
  );

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9333EA';
      case 'rare':
        return '#3B82F6';
      default:
        return palette.gold;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={palette.textPrimary} size={24} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('overview')}
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('badges')}
            style={[styles.tab, activeTab === 'badges' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'badges' && styles.tabTextActive]}>
              Badges
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('achievements')}
            style={[styles.tab, activeTab === 'achievements' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.tabTextActive]}>
              Achievements
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('history')}
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'badges' && renderBadges()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.card,
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: typography.black,
    color: '#2D1B2E',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },
  tabs: {
    paddingBottom: spacing.lg,
  },
  tabsContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  tabActive: {
    backgroundColor: 'rgba(242, 194, 194, 0.6)',
  },
  tabText: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2D1B2E',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxxl,
  },
  card: {
    borderRadius: 24,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  levelCard: {
    padding: spacing.xxl,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  levelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
    position: 'relative',
  },
  levelIconGlow: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 33,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: typography.h4,
    fontWeight: typography.black,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  levelSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: typography.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    gap: 6,
  },
  pointsValue: {
    fontSize: typography.h5,
    fontWeight: typography.bold,
    color: '#FFFFFF',
  },
  progressSection: {
    gap: spacing.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: typography.bodySmall,
    fontWeight: typography.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressPercent: {
    fontSize: typography.bodySmall,
    fontWeight: typography.bold,
    color: '#FFFFFF',
  },
  progressBarContainer: {
    position: 'relative',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statCardInner: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statValue: {
    fontSize: typography.h3,
    fontWeight: typography.black,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: typography.caption,
    fontWeight: typography.bold,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h5,
    fontWeight: typography.extrabold,
    color: '#2D1B2E',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: typography.medium,
    color: '#6B7280',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(242, 194, 194, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: '#2D1B2E',
    marginBottom: 2,
  },
  activityMessage: {
    fontSize: typography.bodySmall,
    color: '#6B7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: typography.caption,
    color: '#9CA3AF',
  },
  activityPoints: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 163, 114, 0.2)',
  },
  activityPointsText: {
    fontSize: typography.bodySmall,
    fontWeight: typography.bold,
    color: '#D2A372',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxxl,
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.body,
    fontWeight: typography.medium,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badgeCard: {
    width: (width - spacing.xl * 2 - spacing.md) / 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  badgeCardInner: {
    padding: spacing.lg,
    alignItems: 'center',
    minHeight: 180,
  },
  badgeIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  badgeName: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  badgeDescription: {
    fontSize: typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  rarityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: typography.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  achievementCard: {
    borderRadius: 16,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  achievementCardInner: {
    padding: spacing.lg,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  achievementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: '#2D1B2E',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: typography.bodySmall,
    color: '#6B7280',
  },
  achievementPoints: {
    fontSize: typography.h6,
    fontWeight: typography.extrabold,
    color: '#D2A372',
  },
  achievementProgress: {
    gap: spacing.xs,
  },
  achievementProgressBar: {
    position: 'relative',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  achievementProgressBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#D2A372',
    borderRadius: 4,
  },
  achievementProgressText: {
    fontSize: typography.caption,
    fontWeight: typography.medium,
    color: '#6B7280',
    textAlign: 'right',
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  historyDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyDateText: {
    fontSize: typography.caption,
    color: '#9CA3AF',
  },
  historyContent: {
    paddingVertical: spacing.xs,
  },
  historyTitle: {
    fontSize: typography.body,
    fontWeight: typography.bold,
    color: '#2D1B2E',
    marginBottom: 4,
  },
  historyMessage: {
    fontSize: typography.bodySmall,
    color: '#6B7280',
  },
  historyPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(212, 163, 114, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  historyPointsText: {
    fontSize: typography.bodySmall,
    fontWeight: typography.bold,
    color: '#D2A372',
  },
});
