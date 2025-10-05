import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { Shirt, Sparkles, Camera, Upload } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useStyle } from "@/contexts/StyleContext";
import { LinearGradient } from 'expo-linear-gradient';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';

export default function StyleCheckScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentImage, resetAnalysis } = useStyle();
  const { theme } = useTheme();
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette);
  const { needsPremium, isTrialExpired, inTrial, canScanStyleCheck, state, daysLeft, styleScansLeft } = useSubscription();

  React.useEffect(() => {
    resetAnalysis();
  }, [resetAnalysis]);

  const handleTakePhoto = async () => {
    if (!canScanStyleCheck) {
      const freeScansLeft = state.maxFreeStyleScans - state.freeStyleScansUsed;
      const allFreeScansUsed = state.freeGlowScansUsed >= state.maxFreeGlowScans && 
                                state.freeStyleScansUsed >= state.maxFreeStyleScans;
      
      if (state.isPremium) {
        return;
      } else if (isTrialExpired) {
        Alert.alert(
          "Trial Expired",
          "Your 3-day free trial has ended. Upgrade to Premium to continue checking your style!",
          [
            { text: "Maybe Later", style: "cancel" },
            { text: "Upgrade Now", onPress: () => router.push('/subscribe') }
          ]
        );
      } else if (allFreeScansUsed && !state.hasAddedPayment) {
        Alert.alert(
          "Free Trials Used",
          "You've used all your free trials! Add your payment method to start a 3-day free trial with unlimited scans. You won't be charged until the trial ends.",
          [
            { text: "Maybe Later", style: "cancel" },
            { text: "Add Payment & Start Trial", onPress: () => router.push('/start-trial') }
          ]
        );
      } else if (freeScansLeft > 0) {
        return;
      } else {
        Alert.alert(
          "Add Payment for Trial",
          "Add your payment info to start your 3-day free trial with unlimited scans. You won't be charged until the trial ends!",
          [
            { text: "Maybe Later", style: "cancel" },
            { text: "Add Payment & Start Trial", onPress: () => router.push('/start-trial') }
          ]
        );
      }
      return;
    }

    if (Platform.OS === 'web') {
      Alert.alert('Camera not available', 'Camera not available on web. Please use upload photo instead.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is required to take photos.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].base64 
          ? `data:image/jpeg;base64,${result.assets[0].base64}`
          : result.assets[0].uri;
        
        setCurrentImage(imageUri);
        router.push('/occasion-selection');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!canScanStyleCheck) {
      const freeScansLeft = state.maxFreeStyleScans - state.freeStyleScansUsed;
      const allFreeScansUsed = state.freeGlowScansUsed >= state.maxFreeGlowScans && 
                                state.freeStyleScansUsed >= state.maxFreeStyleScans;
      
      if (state.isPremium) {
        return;
      } else if (isTrialExpired) {
        Alert.alert(
          "Trial Expired",
          "Your 3-day free trial has ended. Upgrade to Premium to continue checking your style!",
          [
            { text: "Maybe Later", style: "cancel" },
            { text: "Upgrade Now", onPress: () => router.push('/subscribe') }
          ]
        );
      } else if (allFreeScansUsed && !state.hasAddedPayment) {
        Alert.alert(
          "Free Trials Used",
          "You've used all your free trials! Add your payment method to start a 3-day free trial with unlimited scans. You won't be charged until the trial ends.",
          [
            { text: "Maybe Later", style: "cancel" },
            { text: "Add Payment & Start Trial", onPress: () => router.push('/start-trial') }
          ]
        );
      } else if (freeScansLeft > 0) {
        return;
      } else {
        Alert.alert(
          "Add Payment for Trial",
          "Add your payment info to start your 3-day free trial with unlimited scans. You won't be charged until the trial ends!",
          [
            { text: "Maybe Later", style: "cancel" },
            { text: "Add Payment & Start Trial", onPress: () => router.push('/start-trial') }
          ]
        );
      }
      return;
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].base64 
          ? `data:image/jpeg;base64,${result.assets[0].base64}`
          : result.assets[0].uri;
        
        setCurrentImage(imageUri);
        router.push('/occasion-selection');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SubscriptionGuard requiresPremium showPaywall>
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen 
        options={{ 
          title: "Style Check",
          headerBackTitle: "Back",
          headerShown: true,
          headerStyle: {
            backgroundColor: palette.surface,
          },
          headerTintColor: palette.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }} 
      />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconGlow}>
            <Shirt color={palette.primary} size={48} strokeWidth={2.5} />
          </View>
          <View style={styles.sparkleContainer}>
            <Sparkles color={palette.rose} size={16} fill={palette.rose} style={styles.sparkle1} />
            <Shirt color={palette.lavender} size={14} style={styles.sparkle2} />
            <Sparkles color={palette.peach} size={12} fill={palette.peach} style={styles.sparkle3} />
          </View>
        </View>
        
        <Text style={styles.title}>AI Style Analysis</Text>
        <Text style={styles.description}>
          Discover your perfect style with AI-powered outfit analysis. Get personalized recommendations for fit, color harmony, and occasion-appropriate styling that enhances your natural beauty.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.disabledButton]}
            onPress={handleTakePhoto}
            disabled={isLoading}
          >
            <Camera color={palette.textLight} size={20} strokeWidth={2.5} />
            <Text style={styles.primaryButtonText}>
              {isLoading ? "Processing..." : "Take Outfit Photo"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isLoading && styles.disabledButton]}
            onPress={handleUploadPhoto}
            disabled={isLoading}
          >
            <Upload color={palette.primary} size={20} strokeWidth={2.5} />
            <Text style={styles.secondaryButtonText}>Upload from Gallery</Text>
          </TouchableOpacity>
        </View>
        {/* Trial/Access notice */}
        <View style={styles.trialStatusCard}>
          <Text style={styles.trialStatusText}>
            {state.isPremium ? '👑 Premium Active - Unlimited Scans' :
             isTrialExpired ? '⏰ Trial Expired - Upgrade to Continue' :
             inTrial && state.hasAddedPayment ? `🎯 Trial Active - Unlimited scans for ${daysLeft} days` :
             state.freeStyleScansUsed < state.maxFreeStyleScans ? `🎁 ${state.maxFreeStyleScans - state.freeStyleScansUsed} free Style scan${(state.maxFreeStyleScans - state.freeStyleScansUsed) !== 1 ? 's' : ''} left` :
             '✨ Add payment to start your 3-day free trial'}
          </Text>
        </View>
      </View>
      </SafeAreaView>
    </SubscriptionGuard>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
    ...shadow.elevated,
    borderWidth: 3,
    borderColor: palette.primary,
    position: 'relative',
  },
  iconGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.overlayGold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    right: 25,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 30,
    left: 20,
  },
  sparkle3: {
    position: 'absolute',
    top: 35,
    left: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: palette.textPrimary,
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 17,
    color: palette.textSecondary,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 56,
    paddingHorizontal: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: palette.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    ...shadow.elevated,
    minHeight: 56,
  },
  primaryButtonText: {
    color: palette.textLight,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    ...shadow.card,
    minHeight: 56,
  },
  secondaryButtonText: {
    color: palette.primary,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  disabledButton: {
    opacity: 0.6,
  },
  trialStatusCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: palette.gold,
    ...shadow.card,
  },
  trialStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.gold,
    textAlign: 'center',
  },
});