import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useUser } from '@/contexts/UserContext';
import { ChevronRight, Sparkles, Star, Zap } from 'lucide-react-native';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { startDailyNotifications } from '@/lib/notifications';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  stats: { value: string; label: string }[];
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Your Beauty Intelligence',
    subtitle: 'AI-powered analysis reveals your unique radiance and creates personalized beauty plans',
    image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/wdrokw9xnolfhtc6301rh',
    stats: [
      { value: 'AI', label: 'Powered' },
      { value: '10s', label: 'Analysis' },
      { value: '30+', label: 'Metrics' },
    ],
  },
  {
    id: '2',
    title: 'Transform Your Routine',
    subtitle: 'Daily coaching and tracking that adapts to your progress and lifestyle',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1080&auto=format&fit=crop',
    stats: [
      { value: '30', label: 'Day Plans' },
      { value: '50+', label: 'Products' },
      { value: '24/7', label: 'Support' },
    ],
  },
  {
    id: '3',
    title: 'Join the Movement',
    subtitle: 'Connect with a global community celebrating authentic beauty and self-care',
    image: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1080&auto=format&fit=crop',
    stats: [
      { value: 'New', label: 'Community' },
      { value: '7 Day', label: 'Free Trial' },
      { value: '24/7', label: 'Access' },
    ],
  },
];

export default function OnboardingScreen() {
  const { setIsFirstTime } = useUser();
  const { theme } = useTheme();
  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState<number>(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0));
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  
  React.useEffect(() => {
    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    
    sparkleAnimation.start();
    pulseAnimation.start();
    
    return () => {
      sparkleAnimation.stop();
      pulseAnimation.stop();
    };
  }, [sparkleAnim, pulseAnim]);

  const handleNext = useCallback(async () => {
    const next = index + 1;
    if (next < slides.length) {
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      setIsFirstTime(false);
      await startDailyNotifications();
      router.replace('/signup');
    }
  }, [index, width, setIsFirstTime]);

  const handleSkip = useCallback(async () => {
    setIsFirstTime(false);
    await startDailyNotifications();
    router.replace('/signup');
  }, [setIsFirstTime]);

  const dotPosition = Animated.divide(scrollX, width);

  const styles = createStyles(palette, height);

  return (
    <ErrorBoundary>
      <View style={styles.container} testID="onboarding-screen">
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
        
        <LinearGradient 
          colors={gradient.hero} 
          style={StyleSheet.absoluteFillObject}
        />

        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(newIndex);
          }}
        >
          {slides.map((s, i) => {
            const scale = dotPosition.interpolate({
              inputRange: [i - 1, i, i + 1],
              outputRange: [0.85, 1, 0.85],
              extrapolate: 'clamp',
            });
            
            return (
              <View key={s.id} style={[styles.slide, { width }]}>
                <View style={styles.slideContent}>
                  
                  {/* Image Section */}
                  <Animated.View 
                    style={[
                      styles.imageSection,
                      { transform: [{ scale }] }
                    ]}
                  >
                    <View style={styles.imageContainer}>
                      <LinearGradient 
                        colors={i === 0 ? gradient.primary : i === 1 ? gradient.rose : gradient.mint} 
                        style={styles.imageBorder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.imageInner}>
                          <Image 
                            source={{ uri: s.image }} 
                            style={styles.heroImage} 
                            resizeMode="cover" 
                          />
                          <LinearGradient 
                            colors={['transparent', 'rgba(0,0,0,0.15)']} 
                            style={styles.imageGradient} 
                          />
                        </View>
                      </LinearGradient>
                      
                      {/* Animated glow rings */}
                      <Animated.View 
                        style={[
                          styles.glowRing,
                          {
                            opacity: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.15, 0.35],
                            }),
                            transform: [{
                              scale: pulseAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 1.15],
                              })
                            }]
                          }
                        ]}
                      />
                    </View>

                    {/* Stats badges */}
                    <View style={styles.statsContainer}>
                      {s.stats.map((stat, idx) => (
                        <Animated.View 
                          key={idx}
                          style={[
                            styles.statBadge,
                            {
                              opacity: sparkleAnim.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: idx === 1 ? [0.9, 1, 0.9] : [1, 0.9, 1],
                              })
                            }
                          ]}
                        >
                          <Text style={styles.statValue}>{stat.value}</Text>
                          <Text style={styles.statLabel}>{stat.label}</Text>
                        </Animated.View>
                      ))}
                    </View>
                  </Animated.View>

                  {/* Content Section */}
                  <View style={styles.contentSection}>
                    <View style={styles.textContent}>
                      <Text style={styles.title}>{s.title}</Text>
                      <Text style={styles.subtitle}>{s.subtitle}</Text>
                    </View>

                    {/* Feature highlights */}
                    <View style={styles.featuresContainer}>
                      {i === 0 && (
                        <>
                          <View style={styles.feature}>
                            <View style={styles.featureIcon}>
                              <Zap color={palette.primary} size={16} fill={palette.primary} />
                            </View>
                            <Text style={styles.featureText}>Instant AI Analysis</Text>
                          </View>
                          <View style={styles.feature}>
                            <View style={styles.featureIcon}>
                              <Sparkles color={palette.primary} size={16} fill={palette.primary} />
                            </View>
                            <Text style={styles.featureText}>Personalized Plans</Text>
                          </View>
                        </>
                      )}
                      {i === 1 && (
                        <>
                          <View style={styles.feature}>
                            <View style={styles.featureIcon}>
                              <Star color={palette.primary} size={16} fill={palette.primary} />
                            </View>
                            <Text style={styles.featureText}>Daily Coaching</Text>
                          </View>
                          <View style={styles.feature}>
                            <View style={styles.featureIcon}>
                              <Sparkles color={palette.primary} size={16} fill={palette.primary} />
                            </View>
                            <Text style={styles.featureText}>Smart Tracking</Text>
                          </View>
                        </>
                      )}
                      {i === 2 && (
                        <>
                          <View style={styles.feature}>
                            <View style={styles.featureIcon}>
                              <Sparkles color={palette.primary} size={16} fill={palette.primary} />
                            </View>
                            <Text style={styles.featureText}>Global Community</Text>
                          </View>
                          <View style={styles.feature}>
                            <View style={styles.featureIcon}>
                              <Star color={palette.primary} size={16} fill={palette.primary} />
                            </View>
                            <Text style={styles.featureText}>Expert Support</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </Animated.ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {/* Pagination */}
          <View style={styles.pagination}>
            {slides.map((_, i) => {
              const opacity = dotPosition.interpolate({
                inputRange: [i - 1, i, i + 1],
                outputRange: [0.25, 1, 0.25],
                extrapolate: 'clamp',
              });
              const scaleAnim = dotPosition.interpolate({
                inputRange: [i - 1, i, i + 1],
                outputRange: [1, 1.4, 1],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View 
                  key={i} 
                  style={[
                    styles.dot,
                    { 
                      opacity,
                      transform: [{ scale: scaleAnim }]
                    }
                  ]} 
                />
              );
            })}
          </View>

          {/* CTA Buttons */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity 
              onPress={handleNext} 
              style={styles.primaryButton}
              activeOpacity={0.8}
              accessibilityRole="button" 
              testID="onboarding-next"
            >
              <LinearGradient 
                colors={gradient.primary} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }} 
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryButtonText}>
                  {index === slides.length - 1 ? 'Start Your Journey' : 'Continue'}
                </Text>
                {index === slides.length - 1 ? (
                  <Sparkles color={palette.textLight} size={20} />
                ) : (
                  <ChevronRight color={palette.textLight} size={24} strokeWidth={2.5} />
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleSkip} 
              style={styles.skipButton}
              activeOpacity={0.7}
              accessibilityRole="button" 
              testID="onboarding-skip"
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>

          {/* Sign in link */}
          <TouchableOpacity 
            style={styles.signinButton} 
            onPress={() => router.replace('/login')}
            activeOpacity={0.7}
          >
            <Text style={styles.signinText}>
              Already have an account?{' '}
              <Text style={styles.signinTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>, height: number) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: palette.backgroundStart 
  },
  slide: { 
    flex: 1,
  },
  slideContent: {
    flex: 1,
    paddingTop: height * 0.08,
    paddingHorizontal: spacing.xl,
  },
  
  // Image Section
  imageSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBorder: {
    padding: 4,
    borderRadius: 140,
  },
  imageInner: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    backgroundColor: palette.surface,
  },
  heroImage: { 
    width: '100%', 
    height: '100%' 
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  glowRing: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    borderWidth: 2,
    borderColor: palette.primary,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  statBadge: {
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
    minWidth: 90,
    ...shadow.card,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: palette.primary,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Content Section
  contentSection: {
    flex: 1,
  },
  textContent: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -1,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 17,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    paddingHorizontal: spacing.sm,
  },
  
  // Features
  featuresContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.overlayLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.overlayGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: 0.2,
  },
  
  // Bottom Navigation
  bottomNav: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  pagination: { 
    flexDirection: 'row', 
    gap: spacing.sm, 
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  
  // CTA
  ctaContainer: {
    gap: spacing.md,
  },
  primaryButton: { 
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadow.elevated,
  },
  primaryGradient: { 
    paddingVertical: 20, 
    paddingHorizontal: spacing.xl, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.md, 
    justifyContent: 'center',
  },
  primaryButtonText: { 
    color: palette.textLight, 
    fontWeight: '800', 
    fontSize: 18,
    letterSpacing: 0.3,
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipButtonText: { 
    color: palette.textMuted, 
    fontSize: 16, 
    fontWeight: '600' 
  },
  
  // Sign in
  signinButton: { 
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  signinText: { 
    color: palette.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  signinTextBold: { 
    color: palette.primary, 
    fontWeight: '700' 
  },
});
