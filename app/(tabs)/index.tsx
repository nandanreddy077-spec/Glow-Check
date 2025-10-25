import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Sparkles, ChevronRight, User, Star, Heart, Flower2, Palette, Crown, Wand2, Sun, Zap, Compass, ArrowRight, TrendingUp, Package, AlertCircle } from "lucide-react-native";
import { router } from "expo-router";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useProgressTracking } from "@/contexts/ProgressTrackingContext";
import { useProductTracking } from "@/contexts/ProductTrackingContext";
import { useSeasonalAdvisor } from "@/contexts/SeasonalAdvisorContext";
import PhotoPickerModal from "@/components/PhotoPickerModal";
import { getPalette, getGradient, shadow, spacing, radii, typography } from "@/constants/theme";

const { width: screenWidth } = Dimensions.get('window');

const DAILY_AFFIRMATIONS = [
  {
    text: "You are radiant, inside and out",
    author: "Daily Glow",
    icon: Heart,
  },
  {
    text: "Your beauty is uniquely yours to celebrate",
    author: "Self Love",
    icon: Flower2,
  },
  {
    text: "Today is perfect for embracing your glow",
    author: "Beauty Wisdom",
    icon: Sun,
  },
  {
    text: "Confidence is your most beautiful feature",
    author: "Inner Beauty",
    icon: Crown,
  },
];

const BEAUTY_SERVICES = [
  {
    id: 'glow-analysis',
    title: 'Glow Analysis',
    subtitle: 'Discover your natural radiance',
    description: 'AI-powered beauty insights tailored just for you',
    icon: Camera,
    gradient: ['#F2C2C2', '#E8A87C'],
    route: '/glow-analysis',
    badge: 'Gentle',
  },
  {
    id: 'style-guide',
    title: 'Style Guide',
    subtitle: 'Find your perfect aesthetic',
    description: 'Personalized style recommendations',
    icon: Palette,
    gradient: ['#E8D5F0', '#D4A574'],
    route: '/style-check',
    badge: 'Creative',
  },
  {
    id: 'beauty-coach',
    title: 'Beauty Coach',
    subtitle: 'Your personal glow mentor',
    description: 'Daily guidance for your beauty journey',
    icon: Wand2,
    gradient: ['#D4F0E8', '#F5D5C2'],
    route: '/glow-coach',
    badge: 'Caring',
  },
];

export default function HomeScreen() {
  const { user, isFirstTime, setIsFirstTime } = useUser();
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  const { progressPhotos } = useProgressTracking();
  const { products, alerts } = useProductTracking();
  const { recommendations, currentSeason, dismissRecommendation, getSeasonalTip } = useSeasonalAdvisor();
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [floatingAnim] = useState(new Animated.Value(0));
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState<number>(0);
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const currentAffirmation = DAILY_AFFIRMATIONS[currentAffirmationIndex];

  useEffect(() => {
    if (isFirstTime) {
      setShowPhotoPicker(true);
      setIsFirstTime(false);
    }
    
    // Gentle sparkle animation
    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Floating animation for cards
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );
    
    sparkleAnimation.start();
    floatingAnimation.start();
    
    // Cycle through affirmations
    const affirmationInterval = setInterval(() => {
      setCurrentAffirmationIndex((prev) => (prev + 1) % DAILY_AFFIRMATIONS.length);
    }, 5000);
    
    return () => {
      sparkleAnimation.stop();
      floatingAnimation.stop();
      clearInterval(affirmationInterval);
    };
  }, [isFirstTime, setIsFirstTime, sparkleAnim, floatingAnim]);

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handlePhotoPickerClose = () => {
    setShowPhotoPicker(false);
  };

  const styles = createStyles(palette);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[palette.backgroundStart, palette.backgroundEnd]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleGlowAnalysis = () => {
    router.push("/glow-analysis");
  };

  const handleStyleCheck = () => {
    router.push("/style-check");
  };

  const handleGlowCoach = () => {
    router.push("/glow-coach");
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={getGradient(theme).hero} style={StyleSheet.absoluteFillObject} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Floating sparkles */}
        <Animated.View 
          style={[
            styles.sparkle1,
            {
              opacity: sparkleAnim,
              transform: [{
                rotate: sparkleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }
          ]}
        >
          <Sparkles color={palette.blush} size={16} fill={palette.blush} />
        </Animated.View>
        <Animated.View 
          style={[
            styles.sparkle2,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            }
          ]}
        >
          <Star color={palette.lavender} size={12} fill={palette.lavender} />
        </Animated.View>
        <Animated.View 
          style={[
            styles.sparkle3,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 0.8],
              }),
            }
          ]}
        >
          <Heart color={palette.champagne} size={14} fill={palette.champagne} />
        </Animated.View>
        
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Hello beautiful,</Text>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{authUser?.user_metadata && typeof authUser.user_metadata === 'object' ? (authUser.user_metadata as { full_name?: string; name?: string }).full_name ?? (authUser.user_metadata as { full_name?: string; name?: string }).name ?? user.name : user.name}</Text>
              <View style={styles.crownContainer}>
                <Flower2 color={palette.blush} size={20} fill={palette.blush} />
              </View>
            </View>
            <Text style={styles.subtitle}>Ready to discover your inner glow?</Text>
          </View>
          <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.8} style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={getGradient(theme).rose} style={styles.avatarPlaceholder}>
                <User color={palette.pearl} size={28} strokeWidth={2} />
              </LinearGradient>
            )}
            <View style={styles.avatarGlow} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleGlowAnalysis} activeOpacity={0.95} style={styles.mainCtaContainer}>
          <LinearGradient
            colors={getGradient(theme).primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.mainCta, shadow.card]}
          >
            <View style={styles.ctaContent}>
              <View style={styles.ctaIconContainer}>
                <Heart color={palette.textPrimary} size={32} strokeWidth={2} fill={palette.blush} />
                <View style={styles.iconShimmer} />
              </View>
              <Text style={styles.ctaTitle}>Discover Your{"\n"}Beautiful Glow</Text>
              <Text style={styles.ctaSubtitle}>
                Gentle AI insights for your{"\n"}unique beauty journey
              </Text>
              <View style={styles.ctaBadge}>
                <Sparkles color={palette.textPrimary} size={14} fill={palette.blush} />
                <Text style={styles.ctaBadgeText}>Personalized</Text>
              </View>
            </View>
            <ChevronRight color={palette.textPrimary} size={24} style={styles.ctaArrow} strokeWidth={2.5} />
            <View style={styles.decorativeElements}>
              <View style={[styles.decorativeCircle, { top: 20, right: 30, backgroundColor: palette.overlayBlush }]} />
              <View style={[styles.decorativeCircle, { bottom: 40, right: 60, opacity: 0.6, backgroundColor: palette.overlayGold }]} />
              <View style={[styles.decorativeCircle, { top: 50, right: 85, opacity: 0.4, width: 10, height: 10, backgroundColor: palette.lavender }]} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Compass color={palette.gold} size={20} strokeWidth={2.5} />
              <Text style={styles.sectionTitle}>Seasonal Guide</Text>
              <View style={styles.newBadge}>
                <Sparkles color={palette.textLight} size={10} fill={palette.gold} />
                <Text style={styles.newBadgeText}>SMART</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>Personalized tips based on current season: {currentSeason.toUpperCase()}</Text>
            {recommendations.slice(0, 2).map((rec) => (
              <TouchableOpacity
                key={rec.id}
                onPress={() => dismissRecommendation(rec.id)}
                activeOpacity={0.9}
                style={[styles.seasonalAlertCard, shadow.elevated]}
              >
                <LinearGradient 
                  colors={rec.priority === 'high' ? ['#FFE5E5', '#FFF0E5'] : ['#F0F9FF', '#F0FFF4']} 
                  style={styles.seasonalAlertGradient}
                >
                  <View style={styles.seasonalAlertContent}>
                    <View style={[styles.seasonalAlertIcon, { 
                      backgroundColor: rec.category === 'alert' ? 'rgba(255, 152, 0, 0.2)' : 
                                      rec.category === 'routine' ? 'rgba(242, 194, 194, 0.3)' :
                                      rec.category === 'product' ? 'rgba(212, 240, 232, 0.3)' :
                                      'rgba(248, 113, 113, 0.2)'
                    }]}>
                      {rec.category === 'alert' && <AlertCircle color="#FF9800" size={24} strokeWidth={2.5} />}
                      {rec.category === 'routine' && <Sun color="#F2C2C2" size={24} strokeWidth={2.5} />}
                      {rec.category === 'product' && <Package color="#D4F0E8" size={24} strokeWidth={2.5} />}
                      {rec.category === 'lifestyle' && <Heart color={palette.blush} size={24} strokeWidth={2.5} fill={palette.blush} />}
                    </View>
                    <View style={styles.seasonalAlertText}>
                      <View style={styles.seasonalAlertHeader}>
                        <Text style={styles.seasonalAlertTitle}>{rec.title}</Text>
                        {rec.priority === 'high' && (
                          <View style={styles.priorityBadge}>
                            <Zap color="#FF9800" size={12} fill="#FF9800" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.seasonalAlertDesc}>{rec.description}</Text>
                      {rec.actionable && rec.action && (
                        <View style={styles.seasonalAlertAction}>
                          <ArrowRight color={palette.gold} size={16} strokeWidth={2.5} />
                          <Text style={styles.seasonalAlertActionText}>{rec.action}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp color={palette.gold} size={20} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Your Progress Hub</Text>
            <View style={styles.newBadge}>
              <Sparkles color={palette.textLight} size={10} fill={palette.gold} />
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>Track your glow journey & product routines</Text>
          
          <View style={styles.trackersRow}>
            <TouchableOpacity onPress={() => router.push('/progress-tracker')} activeOpacity={0.9} style={styles.trackerCard}>
              <LinearGradient colors={['#F2C2C2', '#E8A87C']} style={[styles.trackerCardInner, shadow.elevated]}>
                <Animated.View style={{
                  transform: [{
                    scale: floatingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.05],
                    })
                  }]
                }}>
                  <TrendingUp color={palette.textLight} size={28} strokeWidth={2.5} />
                </Animated.View>
                <Text style={styles.trackerTitle}>Progress Photos</Text>
                <Text style={styles.trackerValue}>{progressPhotos.length}</Text>
                <Text style={styles.trackerLabel}>snapshots</Text>
                <View style={styles.trackerCTA}>
                  <Text style={styles.trackerCTAText}>Track changes</Text>
                  <ArrowRight color={palette.textLight} size={14} strokeWidth={3} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push('/product-library')} activeOpacity={0.9} style={styles.trackerCard}>
              <LinearGradient colors={['#D4F0E8', '#F5D5C2']} style={[styles.trackerCardInner, shadow.elevated]}>
                <Animated.View style={{
                  transform: [{
                    rotate: floatingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '5deg'],
                    })
                  }]
                }}>
                  <Package color={palette.textLight} size={28} strokeWidth={2.5} />
                </Animated.View>
                <Text style={styles.trackerTitle}>Product Shelf</Text>
                <Text style={styles.trackerValue}>{products.length}</Text>
                <Text style={styles.trackerLabel}>products</Text>
                {alerts.length > 0 && (
                  <View style={styles.trackerBadge}>
                    <Text style={styles.trackerBadgeText}>{alerts.length}</Text>
                  </View>
                )}
                <View style={styles.trackerCTA}>
                  <Text style={styles.trackerCTAText}>Never expire</Text>
                  <ArrowRight color={palette.textLight} size={14} strokeWidth={3} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Beauty Services</Text>
            <View style={styles.sectionDivider} />
          </View>
          
          <TouchableOpacity onPress={handleGlowAnalysis} activeOpacity={0.9}>
            <View style={[styles.actionCard, shadow.card]}>
              <View style={styles.actionIconContainer}>
                <LinearGradient 
                  colors={['#F2C2C2', '#E8A87C']} 
                  style={styles.actionIconBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Camera color={palette.textLight} size={28} strokeWidth={2.5} />
                  <View style={styles.iconSparkle}>
                    <Sparkles color={palette.textLight} size={12} fill={palette.textLight} />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Glow Analysis</Text>
                <Text style={styles.actionSubtitle}>Discover your skin&apos;s natural beauty</Text>
                <View style={styles.actionBadge}>
                  <Heart color={palette.blush} size={12} fill={palette.blush} />
                  <Text style={[styles.actionBadgeText, { color: palette.blush }]}>Gentle</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.blush} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleStyleCheck} activeOpacity={0.9}>
            <View style={[styles.actionCard, shadow.card]}>
              <View style={styles.actionIconContainer}>
                <LinearGradient 
                  colors={['#E8D5F0', '#D4A574']} 
                  style={styles.actionIconBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Palette color={palette.textLight} size={28} strokeWidth={2.5} />
                  <View style={[styles.iconSparkle, { top: 8, right: 8 }]}>
                    <Zap color={palette.textLight} size={12} fill={palette.textLight} />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Style Guide</Text>
                <Text style={styles.actionSubtitle}>Find your perfect aesthetic</Text>
                <View style={styles.actionBadge}>
                  <Sparkles color={palette.champagne} size={12} fill={palette.champagne} />
                  <Text style={[styles.actionBadgeText, { color: palette.champagne }]}>Creative</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.champagne} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGlowCoach} activeOpacity={0.9}>
            <View style={[styles.actionCard, shadow.card]}>
              <View style={styles.actionIconContainer}>
                <LinearGradient 
                  colors={['#D4F0E8', '#F5D5C2']} 
                  style={styles.actionIconBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Wand2 color={palette.textLight} size={28} strokeWidth={2.5} />
                  <View style={[styles.iconSparkle, { bottom: 8, left: 8 }]}>
                    <Star color={palette.textLight} size={12} fill={palette.textLight} />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Beauty Coach</Text>
                <Text style={styles.actionSubtitle}>Nurture your glow journey</Text>
                <View style={styles.actionBadge}>
                  <Star color={palette.lavender} size={12} fill={palette.lavender} />
                  <Text style={[styles.actionBadgeText, { color: palette.lavender }]}>Caring</Text>
                </View>
              </View>
              <View style={styles.actionArrow}>
                <ArrowRight color={palette.lavender} size={24} strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Inspiration</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={[styles.quoteCard, shadow.card]}>
            <View style={styles.quoteIconContainer}>
              <Heart color={palette.blush} size={28} fill={palette.blush} />
              <View style={styles.quoteIconGlow} />
            </View>
            <Text style={styles.quoteText}>&ldquo;{currentAffirmation.text}&rdquo;</Text>
            <Text style={styles.quoteAuthor}>— {currentAffirmation.author}</Text>
            <View style={styles.quoteDivider} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Glow Journey</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={[styles.statsContainer, shadow.card]}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: palette.overlayBlush }]}>
                <Camera color={palette.blush} size={20} strokeWidth={2.5} />
              </View>
              <Text style={styles.statNumber}>{user.stats.analyses}</Text>
              <Text style={styles.statLabel}>ANALYSES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: palette.overlayGold }]}>
                <Heart color={palette.champagne} size={20} fill={palette.champagne} strokeWidth={2.5} />
              </View>
              <Text style={styles.statNumber}>{user.stats.dayStreak}</Text>
              <Text style={styles.statLabel}>DAY STREAK</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(230,215,240,0.4)' }]}>
                <Star color={palette.lavender} size={20} fill={palette.lavender} strokeWidth={2.5} />
              </View>
              <Text style={styles.statNumber}>{user.stats.glowScore}</Text>
              <Text style={styles.statLabel}>GLOW SCORE</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <PhotoPickerModal
        visible={showPhotoPicker}
        onClose={handlePhotoPickerClose}
      />
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: palette.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
    fontWeight: "500",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    fontSize: 32,
    fontWeight: "800",
    color: palette.textPrimary,
    marginRight: 12,
    letterSpacing: -0.5,
  },
  crownContainer: {
    marginTop: 4,
  },
  subtitle: {
    fontSize: 17,
    color: palette.textSecondary,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: palette.gold,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: palette.gold,
  },
  avatarGlow: {
    position: "absolute",
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 35,
    backgroundColor: palette.overlayGold,
    zIndex: -1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: palette.textSecondary,
  },
  mainCtaContainer: {
    marginHorizontal: 24,
    marginBottom: 40,
  },
  mainCta: {
    borderRadius: 24,
    padding: 28,
    minHeight: 160,
    position: "relative",
    overflow: "hidden",
  },
  ctaContent: {
    flex: 1,
    zIndex: 2,
  },
  ctaIconContainer: {
    position: "relative",
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  iconShimmer: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 20,
    backgroundColor: palette.overlayLight,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: palette.textPrimary,
    marginBottom: 12,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: "500",
  },
  ctaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.overlayLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  ctaBadgeText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  ctaArrow: {
    position: "absolute",
    top: 28,
    right: 28,
    zIndex: 3,
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  decorativeCircle: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(248, 246, 240, 0.3)",
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.textPrimary,
    letterSpacing: -0.3,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.textLight,
    letterSpacing: 0.5,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: palette.gold,
    width: 40,
    borderRadius: 1,
  },

  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  actionIconContainer: {
    position: "relative",
    marginRight: 20,
  },
  actionIconGlow: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 20,
    backgroundColor: palette.overlayGold,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: palette.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  actionBadgeText: {
    color: palette.gold,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  quoteCard: {
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  quoteIconContainer: {
    position: "relative",
    marginBottom: 20,
  },
  quoteIconGlow: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 20,
    backgroundColor: palette.overlayGold,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: "italic",
    color: palette.textPrimary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 26,
    fontWeight: "500",
  },
  quoteAuthor: {
    fontSize: 14,
    color: palette.gold,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quoteDivider: {
    height: 1,
    backgroundColor: palette.gold,
    width: 60,
    borderRadius: 0.5,
  },
  statsContainer: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.divider,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "900",
    color: palette.gold,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: palette.textSecondary,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statDivider: {
    width: 2,
    height: 50,
    backgroundColor: palette.divider,
    marginHorizontal: 20,
    borderRadius: 1,
  },
  trackersRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  trackerCard: {
    flex: 1,
  },
  trackerCardInner: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  trackerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textLight,
    marginTop: 12,
  },
  trackerValue: {
    fontSize: 32,
    fontWeight: '900',
    color: palette.textLight,
    marginTop: 8,
  },
  trackerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textLight,
    opacity: 0.8,
    marginTop: 4,
  },
  trackerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  trackerCTAText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textLight,
    opacity: 0.9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  trackerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.glow,
  },
  trackerBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  // Floating sparkles
  sparkle1: {
    position: 'absolute',
    top: 80,
    right: 40,
    zIndex: 1,
  },
  sparkle2: {
    position: 'absolute',
    top: 140,
    left: 30,
    zIndex: 1,
  },
  sparkle3: {
    position: 'absolute',
    top: 200,
    right: 80,
    zIndex: 1,
  },
  // Action icon background
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconSparkle: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  actionArrow: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  seasonalAlertCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  seasonalAlertGradient: {
    padding: 20,
  },
  seasonalAlertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  seasonalAlertIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seasonalAlertText: {
    flex: 1,
  },
  seasonalAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  seasonalAlertTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: palette.textPrimary,
    flex: 1,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seasonalAlertDesc: {
    fontSize: 15,
    color: palette.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  seasonalAlertAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seasonalAlertActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.gold,
    letterSpacing: 0.3,
  },
});