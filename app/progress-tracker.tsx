import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
  Camera,
  TrendingUp,
  Calendar,
  Sparkles,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Smile,
  Frown,
  Meh,
  Sun,
  Cloud,
  CloudRain,
  Droplets,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  BookOpen,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useProgressTracking } from '@/contexts/ProgressTrackingContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ProgressPhoto, SkinJournalEntry } from '@/types/progress';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, shadow } from '@/constants/theme';
import PremiumPaywall from '@/components/PremiumPaywall';

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressTrackerScreen() {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const styles = createStyles(palette);
  
  const {
    progressPhotos,
    journalEntries,
    addProgressPhoto,
    addJournalEntry,
    getProgressComparison,
    getTrendData,
    getJournalStats,
    deleteProgressPhoto,
    getCurrentWeekInsight,
    generateWeeklyInsight,
  } = useProgressTracking();
  
  const { state } = useSubscription();
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'photos' | 'journal' | 'insights'>('photos');
  const [selectedComparison, setSelectedComparison] = useState<number>(30);
  const [showJournalModal, setShowJournalModal] = useState<boolean>(false);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);

  const comparison = getProgressComparison(selectedComparison);
  const trendData = getTrendData();
  const journalStats = getJournalStats();
  const weekInsight = getCurrentWeekInsight();

  useEffect(() => {
    if (!state.isPremium && (progressPhotos.length > 3 || journalEntries.length > 5)) {
      setShowPaywall(true);
    }
  }, [progressPhotos.length, journalEntries.length, state.isPremium]);

  const handleAddPhoto = async () => {
    if (!state.isPremium && progressPhotos.length >= 3) {
      setShowPaywall(true);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: Omit<ProgressPhoto, 'id'> = {
        uri: result.assets[0].uri,
        timestamp: Date.now(),
        concerns: [],
        mood: 'good',
      };
      await addProgressPhoto(newPhoto);
    }
  };

  const handleAddJournal = () => {
    if (!state.isPremium && journalEntries.length >= 5) {
      setShowPaywall(true);
      return;
    }
    setShowJournalModal(true);
  };

  const renderPhotosTab = () => {
    if (progressPhotos.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Camera color={palette.textSecondary} size={64} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Start Your Journey</Text>
          <Text style={styles.emptyText}>
            Take progress photos to track your glow transformation
          </Text>
          <TouchableOpacity onPress={handleAddPhoto} style={styles.emptyButton}>
            <LinearGradient colors={['#F2C2C2', '#E8A87C']} style={styles.emptyButtonGradient}>
              <Plus color={palette.textLight} size={20} strokeWidth={2.5} />
              <Text style={styles.emptyButtonText}>Take First Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {comparison && (
          <View style={[styles.comparisonCard, shadow.card]}>
            <View style={styles.comparisonHeader}>
              <View style={styles.comparisonTitleContainer}>
                <TrendingUp color={palette.blush} size={24} strokeWidth={2.5} />
                <Text style={styles.comparisonTitle}>Progress Comparison</Text>
              </View>
              <View style={styles.comparisonTabs}>
                {[7, 30, 90].map((days) => (
                  <TouchableOpacity
                    key={days}
                    onPress={() => setSelectedComparison(days)}
                    style={[
                      styles.comparisonTab,
                      selectedComparison === days && styles.comparisonTabActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.comparisonTabText,
                        selectedComparison === days && styles.comparisonTabTextActive,
                      ]}
                    >
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.comparisonImages}>
              <View style={styles.comparisonImageContainer}>
                <Image source={{ uri: comparison.before.uri }} style={styles.comparisonImage} />
                <View style={styles.comparisonImageLabel}>
                  <Text style={styles.comparisonImageLabelText}>Before</Text>
                </View>
              </View>
              <View style={styles.comparisonArrow}>
                <ChevronRight color={palette.gold} size={32} strokeWidth={3} />
              </View>
              <View style={styles.comparisonImageContainer}>
                <Image source={{ uri: comparison.after.uri }} style={styles.comparisonImage} />
                <View style={styles.comparisonImageLabel}>
                  <Text style={styles.comparisonImageLabelText}>After</Text>
                </View>
              </View>
            </View>

            <View style={styles.comparisonMetrics}>
              <Text style={styles.comparisonDays}>{comparison.daysBetween} Days Progress</Text>
              <View style={styles.comparisonTrend}>
                {comparison.overallTrend === 'improving' && (
                  <>
                    <ArrowUp color="#4CAF50" size={20} strokeWidth={2.5} />
                    <Text style={[styles.comparisonTrendText, { color: '#4CAF50' }]}>
                      Improving
                    </Text>
                  </>
                )}
                {comparison.overallTrend === 'stable' && (
                  <>
                    <Minus color={palette.gold} size={20} strokeWidth={2.5} />
                    <Text style={[styles.comparisonTrendText, { color: palette.gold }]}>
                      Stable
                    </Text>
                  </>
                )}
                {comparison.overallTrend === 'declining' && (
                  <>
                    <ArrowDown color="#F44336" size={20} strokeWidth={2.5} />
                    <Text style={[styles.comparisonTrendText, { color: '#F44336' }]}>
                      Needs Attention
                    </Text>
                  </>
                )}
              </View>
            </View>

            {comparison.improvements.length > 0 && (
              <View style={styles.improvements}>
                {comparison.improvements.map((improvement, index) => (
                  <View key={index} style={styles.improvementItem}>
                    <Text style={styles.improvementCategory}>{improvement.category}</Text>
                    <Text
                      style={[
                        styles.improvementChange,
                        { color: improvement.percentageChange > 0 ? '#4CAF50' : '#F44336' },
                      ]}
                    >
                      {improvement.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.photoGrid}>
          {progressPhotos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              onPress={() => setSelectedPhoto(photo)}
              style={styles.photoItem}
            >
              <Image source={{ uri: photo.uri }} style={styles.photoItemImage} />
              <View style={styles.photoItemOverlay}>
                <Text style={styles.photoItemDate}>
                  {new Date(photo.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderJournalTab = () => {
    if (journalEntries.length === 0) {
      return (
        <View style={styles.emptyState}>
          <BookOpen color={palette.textSecondary} size={64} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Start Journaling</Text>
          <Text style={styles.emptyText}>
            Track your daily habits and see how they affect your skin
          </Text>
          <TouchableOpacity onPress={handleAddJournal} style={styles.emptyButton}>
            <LinearGradient colors={['#E8D5F0', '#D4A574']} style={styles.emptyButtonGradient}>
              <Plus color={palette.textLight} size={20} strokeWidth={2.5} />
              <Text style={styles.emptyButtonText}>Add First Entry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={[styles.statsCard, shadow.card]}>
          <Text style={styles.statsTitle}>Your Averages (Last 30 Days)</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(147, 112, 219, 0.2)' }]}>
                <Sun color="#9370DB" size={24} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{journalStats.averageSleep.toFixed(1)}h</Text>
              <Text style={styles.statLabel}>Sleep</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(64, 169, 255, 0.2)' }]}>
                <Droplets color="#40A9FF" size={24} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{journalStats.averageWater.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Glasses/day</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 152, 0, 0.2)' }]}>
                <Zap color="#FF9800" size={24} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{journalStats.averageStress.toFixed(1)}/5</Text>
              <Text style={styles.statLabel}>Stress</Text>
            </View>
          </View>
        </View>

        <View style={styles.journalList}>
          {journalEntries.map((entry) => (
            <View key={entry.id} style={[styles.journalCard, shadow.card]}>
              <View style={styles.journalHeader}>
                <Text style={styles.journalDate}>
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
                <View style={styles.journalMood}>
                  {entry.mood === 'great' && <Smile color="#4CAF50" size={20} strokeWidth={2} />}
                  {entry.mood === 'good' && <Smile color="#8BC34A" size={20} strokeWidth={2} />}
                  {entry.mood === 'okay' && <Meh color={palette.gold} size={20} strokeWidth={2} />}
                  {entry.mood === 'bad' && <Frown color="#F44336" size={20} strokeWidth={2} />}
                </View>
              </View>
              {entry.notes && <Text style={styles.journalNotes}>{entry.notes}</Text>}
              <View style={styles.journalMetrics}>
                {entry.sleep && (
                  <View style={styles.journalMetric}>
                    <Sun color={palette.textSecondary} size={14} strokeWidth={2} />
                    <Text style={styles.journalMetricText}>{entry.sleep}h sleep</Text>
                  </View>
                )}
                {entry.water && (
                  <View style={styles.journalMetric}>
                    <Droplets color={palette.textSecondary} size={14} strokeWidth={2} />
                    <Text style={styles.journalMetricText}>{entry.water} glasses</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderInsightsTab = () => {
    return (
      <View style={styles.tabContent}>
        {weekInsight ? (
          <View style={[styles.insightCard, shadow.card]}>
            <View style={styles.insightHeader}>
              <Sparkles color={palette.gold} size={24} strokeWidth={2} fill={palette.gold} />
              <Text style={styles.insightTitle}>This Week's Insights</Text>
            </View>
            <Text style={styles.insightSummary}>{weekInsight.summary}</Text>

            {weekInsight.highlights.length > 0 && (
              <View style={styles.insightSection}>
                <Text style={styles.insightSectionTitle}>Highlights</Text>
                {weekInsight.highlights.map((highlight, index) => (
                  <Text key={index} style={styles.insightBullet}>
                    • {highlight}
                  </Text>
                ))}
              </View>
            )}

            {weekInsight.recommendations.length > 0 && (
              <View style={styles.insightSection}>
                <Text style={styles.insightSectionTitle}>Recommendations</Text>
                {weekInsight.recommendations.map((rec, index) => (
                  <Text key={index} style={styles.insightBullet}>
                    • {rec}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Sparkles color={palette.textSecondary} size={64} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Insights Yet</Text>
            <Text style={styles.emptyText}>
              Add more progress photos and journal entries to get personalized insights
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Progress Tracker',
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <LinearGradient colors={[palette.backgroundStart, palette.backgroundEnd]} style={StyleSheet.absoluteFillObject} />

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setActiveTab('photos')}
          style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
        >
          <Camera
            color={activeTab === 'photos' ? palette.textPrimary : palette.textSecondary}
            size={20}
            strokeWidth={2.5}
          />
          <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
            Photos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('journal')}
          style={[styles.tab, activeTab === 'journal' && styles.tabActive]}
        >
          <BookOpen
            color={activeTab === 'journal' ? palette.textPrimary : palette.textSecondary}
            size={20}
            strokeWidth={2.5}
          />
          <Text style={[styles.tabText, activeTab === 'journal' && styles.tabTextActive]}>
            Journal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('insights')}
          style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
        >
          <Sparkles
            color={activeTab === 'insights' ? palette.textPrimary : palette.textSecondary}
            size={20}
            strokeWidth={2.5}
          />
          <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>
            Insights
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'photos' && renderPhotosTab()}
        {activeTab === 'journal' && renderJournalTab()}
        {activeTab === 'insights' && renderInsightsTab()}
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          onPress={activeTab === 'photos' ? handleAddPhoto : handleAddJournal}
          style={styles.fab}
        >
          <LinearGradient
            colors={activeTab === 'photos' ? ['#F2C2C2', '#E8A87C'] : ['#E8D5F0', '#D4A574']}
            style={styles.fabGradient}
          >
            <Plus color={palette.textLight} size={28} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <JournalModal
        visible={showJournalModal}
        onClose={() => setShowJournalModal(false)}
        onSave={addJournalEntry}
        palette={palette}
      />

      {showPaywall && (
        <View style={styles.paywallContainer}>
          <PremiumPaywall
            onStartTrial={async () => {
              router.push('/start-trial');
            }}
            onSubscribe={() => {
              router.push('/subscribe');
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

interface JournalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: Omit<SkinJournalEntry, 'id'>) => Promise<void>;
  palette: ReturnType<typeof getPalette>;
}

function JournalModal({ visible, onClose, onSave, palette }: JournalModalProps) {
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'bad'>('good');
  const [skinCondition, setSkinCondition] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [sleep, setSleep] = useState<string>('7');
  const [water, setWater] = useState<string>('8');
  const [stress, setStress] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState<string>('');

  const handleSave = async () => {
    const entry: Omit<SkinJournalEntry, 'id'> = {
      date: new Date(),
      mood,
      skinCondition,
      sleep: parseFloat(sleep) || 0,
      water: parseInt(water) || 0,
      stress,
      notes: notes.trim() || undefined,
    };
    await onSave(entry);
    onClose();
  };

  const styles = createModalStyles(palette);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Daily Journal</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={palette.textSecondary} size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>How are you feeling?</Text>
              <View style={styles.moodSelector}>
                {(['great', 'good', 'okay', 'bad'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMood(m)}
                    style={[styles.moodButton, mood === m && styles.moodButtonActive]}
                  >
                    {m === 'great' && <Smile color={mood === m ? '#fff' : '#4CAF50'} size={24} strokeWidth={2} />}
                    {m === 'good' && <Smile color={mood === m ? '#fff' : '#8BC34A'} size={24} strokeWidth={2} />}
                    {m === 'okay' && <Meh color={mood === m ? '#fff' : palette.gold} size={24} strokeWidth={2} />}
                    {m === 'bad' && <Frown color={mood === m ? '#fff' : '#F44336'} size={24} strokeWidth={2} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Sleep (hours)</Text>
              <TextInput
                value={sleep}
                onChangeText={setSleep}
                keyboardType="decimal-pad"
                style={styles.modalInput}
                placeholder="7"
                placeholderTextColor={palette.textSecondary}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Water (glasses)</Text>
              <TextInput
                value={water}
                onChangeText={setWater}
                keyboardType="number-pad"
                style={styles.modalInput}
                placeholder="8"
                placeholderTextColor={palette.textSecondary}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                style={[styles.modalInput, styles.modalInputMultiline]}
                placeholder="How&apos;s your skin feeling today?"
                placeholderTextColor={palette.textSecondary}
              />
            </View>
          </ScrollView>

          <TouchableOpacity onPress={handleSave} style={styles.modalSaveButton}>
            <LinearGradient colors={['#E8D5F0', '#D4A574']} style={styles.modalSaveGradient}>
              <Text style={styles.modalSaveText}>Save Entry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: palette.surface,
    gap: 8,
  },
  tabActive: {
    backgroundColor: palette.surfaceElevated,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  tabTextActive: {
    color: palette.textPrimary,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  tabContent: {
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textLight,
  },
  comparisonCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  comparisonTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  comparisonTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  comparisonTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: palette.surfaceElevated,
  },
  comparisonTabActive: {
    backgroundColor: palette.blush,
  },
  comparisonTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  comparisonTabTextActive: {
    color: palette.textLight,
    fontWeight: '700',
  },
  comparisonImages: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  comparisonImageContainer: {
    flex: 1,
    position: 'relative',
  },
  comparisonImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
  },
  comparisonImageLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  comparisonImageLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  comparisonArrow: {
    paddingHorizontal: 12,
  },
  comparisonMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
  },
  comparisonDays: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  comparisonTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comparisonTrendText: {
    fontSize: 16,
    fontWeight: '700',
  },
  improvements: {
    marginTop: 16,
    gap: 8,
  },
  improvementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  improvementCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  improvementChange: {
    fontSize: 14,
    fontWeight: '700',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: (screenWidth - 60) / 3,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoItemImage: {
    width: '100%',
    height: '100%',
  },
  photoItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  photoItemDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statsCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  journalList: {
    gap: 16,
  },
  journalCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  journalDate: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  journalMood: {
    padding: 4,
  },
  journalNotes: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  journalMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  journalMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  journalMetricText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  insightCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  insightSummary: {
    fontSize: 16,
    color: palette.textPrimary,
    lineHeight: 24,
    marginBottom: 20,
  },
  insightSection: {
    marginBottom: 20,
  },
  insightSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.gold,
    marginBottom: 8,
  },
  insightBullet: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywallContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 20,
  },
});

const createModalStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  modalScroll: {
    paddingHorizontal: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  moodSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  moodButton: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodButtonActive: {
    backgroundColor: palette.blush,
    borderColor: palette.gold,
  },
  modalInput: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: palette.textPrimary,
  },
  modalInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalSaveButton: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textLight,
  },
});
