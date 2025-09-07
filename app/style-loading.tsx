import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Shirt, Sparkles } from 'lucide-react-native';
import { useStyle } from '@/contexts/StyleContext';
import { palette, shadow } from '@/constants/theme';

const LOADING_MESSAGES = [
  'Analyzing your outfit...',
  'Evaluating color combinations...',
  'Checking occasion appropriateness...',
  'Assessing fit and style...',
  'Generating personalized recommendations...',
];

export default function StyleLoadingScreen() {
  const { currentImage, selectedOccasion, occasions, analyzeOutfit } = useStyle();
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);

  const selectedOccasionData = occasions.find(o => o.id === selectedOccasion);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    const performAnalysis = async () => {
      if (!currentImage || !selectedOccasion) {
        router.replace('/style-check');
        return;
      }

      try {
        await analyzeOutfit(currentImage, selectedOccasionData?.name || selectedOccasion);
        router.replace('/style-results');
      } catch (error) {
        console.error('Style analysis failed:', error);
        router.replace('/style-check');
      }
    };

    const timer = setTimeout(performAnalysis, 3000);
    return () => clearTimeout(timer);
  }, [currentImage, selectedOccasion, selectedOccasionData, analyzeOutfit]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Analyzing Style",
          headerBackTitle: "Back",
          gestureEnabled: false,
        }} 
      />
      
      <View style={styles.content}>
        {/* Outfit Preview */}
        {currentImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: currentImage }} style={styles.outfitImage} />
            <View style={styles.occasionBadge}>
              <Text style={styles.occasionEmoji}>{selectedOccasionData?.icon}</Text>
              <Text style={styles.occasionText}>{selectedOccasionData?.name}</Text>
            </View>
          </View>
        )}

        {/* Loading Animation */}
        <View style={styles.loadingContainer}>
          <View style={styles.iconContainer}>
            <Sparkles color={palette.rose} size={44} />
            <ActivityIndicator 
              size="large" 
              color={palette.rose} 
              style={styles.spinner}
            />
          </View>
          
          <Text style={styles.loadingTitle}>AI Style Analysis</Text>
          <Text style={styles.loadingMessage}>
            {LOADING_MESSAGES[currentMessageIndex]}
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>This may take a few moments...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 56,
  },
  outfitImage: {
    width: 160,
    height: 200,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: palette.primary,
    ...shadow.elevated,
  },
  occasionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.blush,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 10,
    ...shadow.card,
  },
  occasionEmoji: {
    fontSize: 16,
  },
  occasionText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textPrimary,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 56,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  spinner: {
    position: 'absolute',
    top: -10,
    left: -10,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: palette.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  loadingMessage: {
    fontSize: 17,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '85%',
    height: 8,
    backgroundColor: palette.surface,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...shadow.card,
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.rose,
    borderRadius: 20,
    width: '100%',
  },
  progressText: {
    fontSize: 15,
    color: palette.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
});