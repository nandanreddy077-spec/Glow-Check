import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Image, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useUser } from '@/contexts/UserContext';
import { ChevronRight, Heart, Sparkles, Star } from 'lucide-react-native';
import { getPalette, getGradient, shadow, spacing, radii } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { startDailyNotifications } from '@/lib/notifications';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Discover Your Natural Radiance ✨',
    subtitle: 'AI-powered beauty insights that celebrate your unique glow. Get personalized skincare recommendations, style suggestions, and confidence-boosting tips tailored just for you.',
    image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/wdrokw9xnolfhtc6301rh',
  },
  {
    id: '2',
    title: 'Nurture Your Beautiful Self 💖',
    subtitle: 'Transform your daily routine with personalized beauty coaching. Track your glow journey, build healthy habits, and unlock your most radiant self with gentle guidance.',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1080&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Join Our Beauty Community 🌟',
    subtitle: 'Connect with thousands of beautiful souls sharing their glow journeys. Get inspired, share tips, celebrate wins, and support each other in a loving, judgment-free space.',
    image: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=1080&auto=format&fit=crop',
  },
];

export default function OnboardingScreen() {
  const { setIsFirstTime } = useUser();
  const { theme } = useTheme();
  const width = Dimensions.get('window').width;
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState<number>(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const [sparkleAnim] = useState(new Animated.Value(0));
  const [floatingAnim] = useState(new Animated.Value(0));
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  
  React.useEffect(() => {
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
    
    return () => {
      sparkleAnimation.stop();
      floatingAnimation.stop();
    };
  }, [sparkleAnim, floatingAnim]);

  const handleNext = useCallback(async () => {
    const next = index + 1;
    if (next < slides.length) {
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      setIsFirstTime(false);
      // Start notifications when user completes onboarding
      await startDailyNotifications();
      router.replace('/signup');
    }
  }, [index, width, setIsFirstTime]);

  const handleSkip = useCallback(async () => {
    setIsFirstTime(false);
    // Start notifications when user skips onboarding
    await startDailyNotifications();
    router.replace('/signup');
  }, [setIsFirstTime]);

  const dotPosition = Animated.divide(scrollX, width);

  const styles = createStyles(palette);

  return (
    <ErrorBoundary>
      <View style={styles.container} testID="onboarding-screen">
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
        <LinearGradient colors={getGradient(theme).hero} style={styles.gradient} />
        
        {/* Floating decorative elements */}
        <Animated.View 
          style={[
            styles.floatingSparkle1,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
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
            styles.floatingSparkle2,
            {
              opacity: sparkleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0.9],
              }),
            }
          ]}
        >
          <Heart color={palette.lavender} size={14} fill={palette.lavender} />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.floatingSparkle3,
            {
              opacity: floatingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            }
          ]}
        >
          <Star color={palette.champagne} size={12} fill={palette.champagne} />
        </Animated.View>

        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          ref={scrollRef}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {slides.map((s, i) => (
            <Animated.View 
              key={s.id} 
              style={[
                styles.slide, 
                { width },
                {
                  transform: [{
                    translateY: floatingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -8 + (i * 3)],
                    })
                  }]
                }
              ]}
            >
              <View style={styles.imageContainer}>
                <LinearGradient 
                  colors={i === 0 ? gradient.primary : i === 1 ? gradient.secondary : gradient.tertiary} 
                  style={styles.imageGradientBorder}
                >
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: s.image }} style={styles.heroImage} resizeMode="cover" />
                    <LinearGradient 
                      colors={['transparent', 'rgba(0,0,0,0.1)']} 
                      style={styles.imageOverlay} 
                    />
                  </View>
                </LinearGradient>
                <View style={styles.imageGlow} />
              </View>

              <View style={styles.contentContainer}>
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.subtitle}>{s.subtitle}</Text>
                
                <View style={styles.featureHighlight}>
                  <Heart color={palette.primary} size={16} fill={palette.blush} />
                  <Text style={styles.featureText}>
                    {i === 0 ? 'AI-Powered & Personal' : i === 1 ? 'Gentle & Transformative' : 'Supportive & Inspiring'}
                  </Text>
                </View>
                
                <View style={styles.benefitsContainer}>
                  {i === 0 && (
                    <>
                      <View style={styles.benefitItem}>
                        <Sparkles color={palette.primary} size={12} fill={palette.blush} />
                        <Text style={styles.benefitText}>Instant skin analysis</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Sparkles color={palette.primary} size={12} fill={palette.blush} />
                        <Text style={styles.benefitText}>Personalized recommendations</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Sparkles color={palette.primary} size={12} fill={palette.blush} />
                        <Text style={styles.benefitText}>Style matching technology</Text>
                      </View>
                    </>
                  )}
                  {i === 1 && (
                    <>
                      <View style={styles.benefitItem}>
                        <Heart color={palette.primary} size={12} fill={palette.blush} />
                        <Text style={styles.benefitText}>30-day glow plans</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Heart color={palette.primary} size={12} fill={palette.blush} />
                        <Text style={styles.benefitText}>Daily beauty coaching</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Heart color={palette.primary} size={12} fill={palette.blush} />
                        <Text style={styles.benefitText}>Progress tracking</Text>
                      </View>
                    </>
                  )}
                  {i === 2 && (
                    <>
                      <View style={styles.benefitItem}>
                        <Star color={palette.primary} size={12} fill={palette.blush} />
                        <Text style={styles.benefitText}>Beauty circles & groups</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Star color={palette.primary} size={12} fill={palette.blush} />
                        <Text style={styles.benefitText}>Share your glow journey</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Star color={palette.primary} size={12} fill={palette.blush} />
                        <Text style={styles.benefitText}>Expert tips & challenges</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </Animated.View>
          ))}
        </Animated.ScrollView>

        <View style={styles.pagination}>
          {slides.map((_, i) => {
            const opacity = dotPosition.interpolate({
              inputRange: [i - 1, i, i + 1],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            const widthAnim = dotPosition.interpolate({
              inputRange: [i - 1, i, i + 1],
              outputRange: [6, 18, 6],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View key={i} style={[styles.dot, { opacity, width: widthAnim }]} />
            );
          })}
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} accessibilityRole="button" testID="onboarding-skip">
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.nextBtn} accessibilityRole="button" testID="onboarding-next">
            <LinearGradient colors={getGradient(theme).primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.nextGradient, shadow.glow]}>
              <Heart color={palette.textLight} size={18} fill={palette.textLight} />
              <Text style={styles.nextText} numberOfLines={1} adjustsFontSizeToFit>{index === slides.length - 1 ? 'Start My Glow Journey ✨' : 'Continue'}</Text>
              <ChevronRight color={palette.textLight} size={20} strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.signinLink} onPress={() => router.replace('/login')}>
            <Text style={styles.signinText}>
              Already part of our beautiful community?{' '}
              <Text style={styles.signinTextBold}>Welcome Back</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ErrorBoundary>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: palette.backgroundStart 
  },
  gradient: { 
    ...StyleSheet.absoluteFillObject 
  },
  slide: { 
    alignItems: 'center', 
    paddingTop: 80, 
    paddingHorizontal: spacing.xl,
    flex: 1
  },
  imageContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageGradientBorder: {
    padding: 8,
    borderRadius: 140,
    ...shadow.elevated
  },
  imageWrapper: {
    width: 260,
    height: 260,
    borderRadius: 130,
    overflow: 'hidden',
    position: 'relative'
  },
  heroImage: { 
    width: '100%', 
    height: '100%' 
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderBottomLeftRadius: 110,
    borderBottomRightRadius: 110
  },
  imageGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: palette.overlayGold,
    zIndex: -1,
    opacity: 0.2
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    flex: 1
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: palette.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.8,
    lineHeight: 38,
    paddingHorizontal: spacing.sm
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 340,
    fontWeight: '500',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs
  },
  featureHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.overlayLight,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  featureText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.primary,
    letterSpacing: 0.5
  },
  benefitsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-start'
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  benefitText: {
    fontSize: 14,
    color: palette.textSecondary,
    fontWeight: '600',
    lineHeight: 20
  },
  bottomSection: {
    alignItems: 'center',
    gap: spacing.lg
  },
  trustIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.overlayLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.primary
  },
  pagination: { 
    flexDirection: 'row', 
    gap: spacing.sm, 
    alignSelf: 'center', 
    marginTop: spacing.md,
    marginBottom: spacing.md
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
    marginHorizontal: 2
  },
  ctaRow: { 
    paddingHorizontal: spacing.xl, 
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md
  },
  skipBtn: { 
    paddingVertical: spacing.md, 
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start'
  },
  skipText: { 
    color: palette.textMuted, 
    fontSize: 16, 
    fontWeight: '600' 
  },
  nextBtn: { 
    width: '100%'
  },
  nextGradient: { 
    paddingVertical: 18, 
    paddingHorizontal: spacing.xl, 
    borderRadius: radii.xl, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.sm, 
    justifyContent: 'center',
    width: '100%'
  },
  nextText: { 
    color: palette.textLight, 
    fontWeight: '800', 
    fontSize: 17,
    letterSpacing: 0.3
  },
  signinLink: { 
    alignSelf: 'center', 
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md
  },
  signinText: { 
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    flexWrap: 'wrap'
  },
  signinTextBold: { 
    color: palette.primary, 
    fontWeight: '700' 
  },
  
  // Floating elements
  floatingSparkle1: {
    position: 'absolute',
    top: 150,
    right: 50,
    zIndex: 1
  },
  floatingSparkle2: {
    position: 'absolute',
    top: 220,
    left: 40,
    zIndex: 1
  },
  floatingSparkle3: {
    position: 'absolute',
    top: 300,
    right: 100,
    zIndex: 1
  }
});