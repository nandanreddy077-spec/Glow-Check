import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Sun,
  Moon,
  Heart,
  Zap,
  Sparkles,
  Check,
  Star,
  Flame,
  TrendingUp,
  Calendar,
  Award,
  ChevronRight,
  Droplet,
  Shield,
  X,
  Camera,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useDailyCheckIn } from '@/contexts/DailyCheckInContext';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow, spacing } from '@/constants/theme';
import { DailyReward } from '@/types/daily-checkin';

const { width: screenWidth } = Dimensions.get('window');

type RitualTime = 'morning' | 'evening';

export default function DailyRitualScreen() {
  const { theme } = useTheme();
  const { user } = useUser();
  const {
    streak,
    hasMorningCheckIn,
    hasEveningCheckIn,
    createCheckIn,
    unclaimedRewards,
    claimReward,
    getTodaysCheckIn,
  } = useDailyCheckIn();

  const palette = getPalette(theme);
  const gradient = getGradient(theme);

  const [ritualTime, setRitualTime] = useState<RitualTime>('morning');
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const [earnedRewards, setEarnedRewards] = useState<DailyReward[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [checklist, setChecklist] = useState<{
    skincare?: boolean;
    water?: boolean;
    sunscreen?: boolean;
    makeup_removal?: boolean;
    sleep?: boolean;
    vitamins?: boolean;
  }>({});

  const [ratings, setRatings] = useState<{
    mood: number;
    energy: number;
    skin_feeling: number;
    confidence: number;
  }>({
    mood: 0,
    energy: 0,
    skin_feeling: 0,
    confidence: 0,
  });

  const [notes, setNotes] = useState<string>('');

  const [glowAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 17) {
      setRitualTime('morning');
    } else {
      setRitualTime('evening');
    }

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim, pulseAnim]);

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setRating = (key: keyof typeof ratings, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const rewards = await createCheckIn({
        date: today,
        ritualType,
        checklist,
        ratings,
        notes: notes.trim() || undefined,
      });

      if (rewards.length > 0) {
        setEarnedRewards(rewards);
        setShowRewardModal(true);
      }

      setChecklist({});
      setRatings({
        mood: 0,
        energy: 0,
        skin_feeling: 0,
        confidence: 0,
      });
      setNotes('');
    } catch (error) {
      console.error('Error submitting check-in:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = () => {
    if (ritualTime === 'morning' && hasMorningCheckIn()) return false;
    if (ritualTime === 'evening' && hasEveningCheckIn()) return false;
    
    const hasRatings = ratings.mood > 0 || ratings.energy > 0 || ratings.skin_feeling > 0;
    const hasChecklist = Object.values(checklist).some((v) => v);
    
    return hasRatings || hasChecklist;
  };

  const styles = createStyles(palette);

  const isMorning = ritualTime === 'morning';
  const ritualGradient = isMorning ? ['#FFF4E6', '#FFE5CC'] : ['#1A1A2E', '#2D1B4E'];
  const ritualIcon = isMorning ? Sun : Moon;
  const RitualIcon = ritualIcon;

  const morningChecklist = [
    { key: 'skincare' as const, label: 'Morning Skincare', icon: Droplet },
    { key: 'sunscreen' as const, label: 'SPF Protection', icon: Shield },
    { key: 'water' as const, label: 'Drink Water', icon: Droplet },
    { key: 'vitamins' as const, label: 'Take Vitamins', icon: Sparkles },
  ];

  const eveningChecklist = [
    { key: 'makeup_removal' as const, label: 'Remove Makeup', icon: X },
    { key: 'skincare' as const, label: 'Evening Skincare', icon: Heart },
    { key: 'water' as const, label: 'Drink Water', icon: Droplet },
  ];

  const checklistItems = isMorning ? morningChecklist : eveningChecklist;

  const ratingItems = [
    { key: 'mood' as const, label: 'Mood', icon: Heart, color: palette.blush },
    { key: 'energy' as const, label: 'Energy', icon: Zap, color: palette.gold },
    { key: 'skin_feeling' as const, label: 'Skin Feeling', icon: Sparkles, color: palette.champagne },
    { key: 'confidence' as const, label: 'Confidence', icon: Star, color: palette.lavender },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={ritualGradient} style={StyleSheet.absoluteFillObject} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={[styles.iconContainer, { backgroundColor: isMorning ? palette.gold : palette.lavender }]}>
              <RitualIcon color={palette.textLight} size={32} strokeWidth={2.5} />
            </View>
          </Animated.View>
          <Text style={[styles.title, { color: isMorning ? palette.textPrimary : palette.textLight }]}>
            {isMorning ? 'Good Morning' : 'Good Evening'}
          </Text>
          <Text style={[styles.subtitle, { color: isMorning ? palette.textSecondary : 'rgba(255,255,255,0.8)' }]}>
            {isMorning
              ? 'Start your day with intention'
              : 'Wind down with gratitude'}
          </Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRitualTime('morning')}
            disabled={hasMorningCheckIn()}
            style={[
              styles.toggleButton,
              ritualTime === 'morning' && styles.toggleButtonActive,
              hasMorningCheckIn() && styles.toggleButtonDisabled,
            ]}
          >
            <Sun
              color={ritualTime === 'morning' ? palette.textLight : palette.textSecondary}
              size={20}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.toggleText,
                ritualTime === 'morning' && styles.toggleTextActive,
                hasMorningCheckIn() && styles.toggleTextDisabled,
              ]}
            >
              Morning
            </Text>
            {hasMorningCheckIn() && (
              <View style={styles.completedBadge}>
                <Check color={palette.textLight} size={12} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRitualTime('evening')}
            disabled={hasEveningCheckIn()}
            style={[
              styles.toggleButton,
              ritualTime === 'evening' && styles.toggleButtonActive,
              hasEveningCheckIn() && styles.toggleButtonDisabled,
            ]}
          >
            <Moon
              color={ritualTime === 'evening' ? palette.textLight : palette.textSecondary}
              size={20}
              strokeWidth={2.5}
            />
            <Text
              style={[
                styles.toggleText,
                ritualTime === 'evening' && styles.toggleTextActive,
                hasEveningCheckIn() && styles.toggleTextDisabled,
              ]}
            >
              Evening
            </Text>
            {hasEveningCheckIn() && (
              <View style={styles.completedBadge}>
                <Check color={palette.textLight} size={12} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.streakCard, shadow.elevated]}>
          <LinearGradient colors={getGradient(theme).rose} style={styles.streakGradient}>
            <View style={styles.streakContent}>
              <View style={styles.streakIconContainer}>
                <Flame color={palette.textLight} size={32} fill={palette.gold} strokeWidth={2.5} />
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakNumber}>{streak.currentStreak}</Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
              <View style={styles.streakStats}>
                <View style={styles.streakStat}>
                  <Text style={styles.streakStatNumber}>{streak.totalCheckIns}</Text>
                  <Text style={styles.streakStatLabel}>check-ins</Text>
                </View>
                <View style={styles.streakDivider} />
                <View style={styles.streakStat}>
                  <Text style={styles.streakStatNumber}>{streak.longestStreak}</Text>
                  <Text style={styles.streakStatLabel}>best</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {unclaimedRewards.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowRewardModal(true)}
            style={[styles.rewardsAlert, shadow.card]}
          >
            <Award color={palette.gold} size={24} strokeWidth={2.5} />
            <Text style={styles.rewardsAlertText}>
              {unclaimedRewards.length} reward{unclaimedRewards.length > 1 ? 's' : ''} waiting!
            </Text>
            <ChevronRight color={palette.gold} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isMorning ? palette.textPrimary : palette.textLight }]}>
            Quick Checklist
          </Text>
          <View style={styles.checklistGrid}>
            {checklistItems.map((item) => {
              const Icon = item.icon;
              const isChecked = checklist[item.key] || false;

              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.8}
                  onPress={() => toggleChecklistItem(item.key)}
                  style={[
                    styles.checklistItem,
                    isChecked && styles.checklistItemChecked,
                    { backgroundColor: isMorning ? palette.surface : 'rgba(255,255,255,0.15)' },
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isChecked && styles.checkboxChecked,
                      { borderColor: isMorning ? palette.divider : 'rgba(255,255,255,0.3)' },
                    ]}
                  >
                    {isChecked && <Check color={palette.textLight} size={16} strokeWidth={3} />}
                  </View>
                  <Icon
                    color={isChecked ? palette.gold : isMorning ? palette.textSecondary : 'rgba(255,255,255,0.6)'}
                    size={20}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.checklistLabel,
                      isChecked && styles.checklistLabelChecked,
                      { color: isMorning ? palette.textPrimary : palette.textLight },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isMorning ? palette.textPrimary : palette.textLight }]}>
            How do you feel?
          </Text>
          {ratingItems.map((item) => {
            const Icon = item.icon;
            const currentRating = ratings[item.key];

            return (
              <View key={item.key} style={styles.ratingItem}>
                <View style={styles.ratingHeader}>
                  <Icon color={item.color} size={20} strokeWidth={2.5} />
                  <Text style={[styles.ratingLabel, { color: isMorning ? palette.textPrimary : palette.textLight }]}>
                    {item.label}
                  </Text>
                </View>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      activeOpacity={0.8}
                      onPress={() => setRating(item.key, star)}
                      style={styles.starButton}
                    >
                      <Star
                        color={star <= currentRating ? item.color : isMorning ? palette.divider : 'rgba(255,255,255,0.3)'}
                        size={32}
                        fill={star <= currentRating ? item.color : 'transparent'}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isMorning ? palette.textPrimary : palette.textLight }]}>
            Notes (Optional)
          </Text>
          <TextInput
            style={[
              styles.notesInput,
              {
                backgroundColor: isMorning ? palette.surface : 'rgba(255,255,255,0.15)',
                color: isMorning ? palette.textPrimary : palette.textLight,
                borderColor: isMorning ? palette.divider : 'rgba(255,255,255,0.3)',
              },
            ]}
            placeholder={isMorning ? 'How are you feeling today?' : 'Reflect on your day...'}
            placeholderTextColor={isMorning ? palette.textSecondary : 'rgba(255,255,255,0.5)'}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
          style={[
            styles.submitButton,
            (!canSubmit() || isSubmitting) && styles.submitButtonDisabled,
          ]}
        >
          <LinearGradient
            colors={canSubmit() && !isSubmitting ? getGradient(theme).primary : ['#CCCCCC', '#999999']}
            style={styles.submitGradient}
          >
            <Sparkles color={palette.textLight} size={20} strokeWidth={2.5} />
            <Text style={styles.submitText}>
              {isSubmitting ? 'Saving...' : 'Complete Ritual'}
            </Text>
            <ChevronRight color={palette.textLight} size={20} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {showRewardModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowRewardModal(false)}
              style={styles.closeButton}
            >
              <X color={palette.textSecondary} size={24} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Award color={palette.gold} size={48} strokeWidth={2.5} />
              </Animated.View>
              <Text style={styles.modalTitle}>🎉 Rewards Earned!</Text>
            </View>

            <ScrollView style={styles.rewardsList} showsVerticalScrollIndicator={false}>
              {earnedRewards.map((reward) => (
                <View key={reward.id} style={[styles.rewardCard, shadow.card]}>
                  {reward.badge && (
                    <Text style={styles.rewardIcon}>{reward.badge.icon}</Text>
                  )}
                  <View style={styles.rewardContent}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                    <Text style={styles.rewardPoints}>+{reward.points} points</Text>
                  </View>
                </View>
              ))}

              {unclaimedRewards.filter(r => !earnedRewards.find(e => e.id === r.id)).map((reward) => (
                <TouchableOpacity
                  key={reward.id}
                  activeOpacity={0.9}
                  onPress={() => claimReward(reward.id)}
                  style={[styles.rewardCard, shadow.card]}
                >
                  {reward.badge && (
                    <Text style={styles.rewardIcon}>{reward.badge.icon}</Text>
                  )}
                  <View style={styles.rewardContent}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                    <View style={styles.claimButton}>
                      <Text style={styles.claimButtonText}>Claim +{reward.points}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.backgroundStart,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      paddingTop: 20,
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: '900',
      color: palette.textPrimary,
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '500',
      color: palette.textSecondary,
      textAlign: 'center',
    },
    toggleContainer: {
      flexDirection: 'row',
      marginHorizontal: 24,
      marginBottom: 24,
      gap: 12,
    },
    toggleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.05)',
      gap: 8,
    },
    toggleButtonActive: {
      backgroundColor: palette.gold,
    },
    toggleButtonDisabled: {
      backgroundColor: 'rgba(0,0,0,0.1)',
      opacity: 0.6,
    },
    toggleText: {
      fontSize: 15,
      fontWeight: '700',
      color: palette.textSecondary,
    },
    toggleTextActive: {
      color: palette.textLight,
    },
    toggleTextDisabled: {
      color: palette.textSecondary,
    },
    completedBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
    },
    streakCard: {
      marginHorizontal: 24,
      marginBottom: 24,
      borderRadius: 20,
      overflow: 'hidden',
    },
    streakGradient: {
      padding: 24,
    },
    streakContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    streakIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    streakInfo: {
      flex: 1,
    },
    streakNumber: {
      fontSize: 36,
      fontWeight: '900',
      color: palette.textLight,
      letterSpacing: -0.5,
    },
    streakLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textLight,
      opacity: 0.9,
    },
    streakStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    streakStat: {
      alignItems: 'center',
    },
    streakStatNumber: {
      fontSize: 18,
      fontWeight: '800',
      color: palette.textLight,
    },
    streakStatLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: palette.textLight,
      opacity: 0.8,
    },
    streakDivider: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    rewardsAlert: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 24,
      marginBottom: 24,
      padding: 16,
      borderRadius: 16,
      backgroundColor: palette.overlayGold,
      gap: 12,
    },
    rewardsAlertText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    section: {
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: palette.textPrimary,
      marginBottom: 16,
      letterSpacing: -0.3,
    },
    checklistGrid: {
      gap: 12,
    },
    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      backgroundColor: palette.surface,
      borderWidth: 2,
      borderColor: 'transparent',
      gap: 12,
    },
    checklistItemChecked: {
      borderColor: palette.gold,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: palette.divider,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: palette.gold,
      borderColor: palette.gold,
    },
    checklistLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: palette.textPrimary,
    },
    checklistLabelChecked: {
      color: palette.gold,
    },
    ratingItem: {
      marginBottom: 24,
    },
    ratingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    ratingLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    ratingStars: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
    },
    starButton: {
      padding: 4,
    },
    notesInput: {
      backgroundColor: palette.surface,
      borderRadius: 16,
      padding: 16,
      fontSize: 15,
      color: palette.textPrimary,
      borderWidth: 1,
      borderColor: palette.divider,
      minHeight: 100,
    },
    submitButton: {
      marginHorizontal: 24,
      marginTop: 8,
      borderRadius: 16,
      overflow: 'hidden',
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 18,
      paddingHorizontal: 24,
      gap: 12,
    },
    submitText: {
      fontSize: 17,
      fontWeight: '800',
      color: palette.textLight,
      letterSpacing: 0.3,
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      width: '100%',
      maxHeight: '80%',
      backgroundColor: palette.surface,
      borderRadius: 24,
      padding: 24,
      ...shadow.elevated,
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 10,
      padding: 8,
    },
    modalHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: palette.textPrimary,
      marginTop: 16,
      textAlign: 'center',
    },
    rewardsList: {
      maxHeight: 400,
    },
    rewardCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surfaceElevated,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      gap: 16,
    },
    rewardIcon: {
      fontSize: 40,
    },
    rewardContent: {
      flex: 1,
    },
    rewardTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: palette.textPrimary,
      marginBottom: 4,
    },
    rewardDescription: {
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 8,
    },
    rewardPoints: {
      fontSize: 16,
      fontWeight: '700',
      color: palette.gold,
    },
    claimButton: {
      backgroundColor: palette.gold,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    claimButtonText: {
      fontSize: 14,
      fontWeight: '800',
      color: palette.textLight,
    },
  });
