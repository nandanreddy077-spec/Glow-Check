import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Sparkles, Wand2, Eye, Zap } from 'lucide-react-native';
import { useStyle } from '@/contexts/StyleContext';
import { useFreemium } from '@/contexts/FreemiumContext';
import { palette, shadow, gradient } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const LOADING_STAGES = [
  { icon: Eye, message: 'Analyzing your style...', color: palette.rose },
  { icon: Sparkles, message: 'Evaluating colors & harmony...', color: palette.primary },
  { icon: Wand2, message: 'Checking occasion fit...', color: palette.lavender },
  { icon: Zap, message: 'Crafting recommendations...', color: palette.gold },
];

export default function StyleLoadingScreen() {
  const { currentImage, selectedOccasion, occasions, analyzeOutfit } = useStyle();
  const { incrementStyleScan } = useFreemium();
  const [currentStageIndex, setCurrentStageIndex] = React.useState(0);

  const selectedOccasionData = occasions.find(o => o.id === selectedOccasion);

  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const orbitAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    orbitAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + index * 500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 18000,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();

    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => (prev + 1) % LOADING_STAGES.length);
    }, 2500);

    return () => clearInterval(stageInterval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const performAnalysis = async () => {
      if (!currentImage || !selectedOccasion) {
        router.replace('/style-check');
        return;
      }

      try {
        console.log('🔢 Incrementing style scan count...');
        await incrementStyleScan();
        console.log('✅ Style scan count incremented successfully');
        
        console.log('🎨 Starting outfit analysis...');
        await analyzeOutfit(currentImage, selectedOccasionData?.name || selectedOccasion);
        console.log('✅ Analysis completed successfully');
        
        if (isMounted) {
          router.replace('/style-results');
        }
      } catch (error) {
        console.error('❌ Style analysis error:', error);
        // The analyzeOutfit function has built-in fallback, so we can still navigate
        if (isMounted) {
          console.log('➡️ Navigating to results with fallback data');
          router.replace('/style-results');
        }
      }
    };

    const timer = setTimeout(performAnalysis, 2000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentImage, selectedOccasion, selectedOccasionData, analyzeOutfit, incrementStyleScan]);

  const currentStage = LOADING_STAGES[currentStageIndex];
  const IconComponent = currentStage.icon;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      
      <LinearGradient
        colors={[palette.backgroundStart, palette.backgroundEnd, '#FFF9F5']}
        locations={[0, 0.5, 1]}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Decorative Elements */}
            <View style={styles.decorativeContainer}>
              {[0, 1, 2].map((index) => {
                const orbit = orbitAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                });
                
                const orbitReverse = orbitAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-360deg'],
                });
                
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.orbitDot,
                      {
                        transform: [
                          { rotate: orbit },
                          { translateX: 80 + index * 20 },
                          { rotate: orbitReverse },
                        ],
                      },
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: [palette.rose, palette.primary, palette.lavender][index] }]} />
                  </Animated.View>
                );
              })}
            </View>

            {/* Outfit Preview */}
            {currentImage && (
              <Animated.View 
                style={[
                  styles.imageContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: currentImage }} style={styles.outfitImage} />
                  
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      {
                        transform: [{ translateX: shimmerTranslate }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        'rgba(255,255,255,0)',
                        'rgba(255,255,255,0.8)',
                        'rgba(255,255,255,0)',
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>

                  <Animated.View style={[styles.scanLine, { transform: [{ rotate }] }]}>
                    <LinearGradient
                      colors={[currentStage.color + '00', currentStage.color, currentStage.color + '00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.scanGradient}
                    />
                  </Animated.View>
                </View>

                <LinearGradient
                  colors={[palette.surface, palette.surfaceElevated]}
                  style={styles.occasionBadge}
                >
                  <Text style={styles.occasionEmoji}>{selectedOccasionData?.icon}</Text>
                  <Text style={styles.occasionText}>{selectedOccasionData?.name}</Text>
                  <View style={[styles.badge, { backgroundColor: currentStage.color }]} />
                </LinearGradient>
              </Animated.View>
            )}

            {/* Loading Animation */}
            <View style={styles.loadingContainer}>
              <Animated.View 
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <LinearGradient
                  colors={[currentStage.color + '20', currentStage.color + '05']}
                  style={styles.iconBackground}
                >
                  <IconComponent color={currentStage.color} size={40} strokeWidth={2.5} />
                </LinearGradient>
              </Animated.View>
              
              <Text style={styles.loadingTitle}>AI Style Analysis</Text>
              <Text style={[styles.loadingMessage, { color: currentStage.color }]}>
                {currentStage.message}
              </Text>

              <View style={styles.dotsContainer}>
                {LOADING_STAGES.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.stageDot,
                      index === currentStageIndex && styles.stageDotActive,
                      { backgroundColor: index === currentStageIndex ? currentStage.color : palette.divider },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBar, { width: progressWidth }]}>
                  <LinearGradient
                    colors={[currentStage.color, palette.primary, palette.rose]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressGradient}
                  />
                </Animated.View>
              </View>
              <Text style={styles.progressText}>Analyzing with AI precision...</Text>
            </View>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  decorativeContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 300,
    height: 300,
    marginLeft: -150,
    marginTop: -150,
  },
  orbitDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -4,
    marginTop: -4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.3,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  imageWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 32,
    marginBottom: 20,
  },
  outfitImage: {
    width: 200,
    height: 260,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: palette.surface,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shimmerGradient: {
    flex: 1,
    width: width * 0.3,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 3,
    marginTop: -1.5,
  },
  scanGradient: {
    flex: 1,
  },
  occasionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
    ...shadow.elevated,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  occasionEmoji: {
    fontSize: 18,
  },
  occasionText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 48,
    gap: 16,
  },
  iconContainer: {
    marginBottom: 8,
  },
  iconBackground: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: palette.surface,
    ...shadow.glow,
  },
  loadingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.textPrimary,
    letterSpacing: 0.5,
  },
  loadingMessage: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stageDotActive: {
    width: 24,
    borderRadius: 4,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  progressBarContainer: {
    width: '90%',
    height: 6,
    backgroundColor: palette.surface,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadow.card,
    borderWidth: 1,
    borderColor: palette.borderLight,
  },
  progressBar: {
    height: '100%',
    borderRadius: 20,
  },
  progressGradient: {
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});