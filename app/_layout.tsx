import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { validateAndCleanStorage } from "@/lib/storage-cleanup";
import { UserProvider } from "@/contexts/UserContext";
import { AnalysisProvider } from "@/contexts/AnalysisContext";
import { SkincareProvider } from "@/contexts/SkincareContext";
import { StyleProvider } from "@/contexts/StyleContext";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CommunityProvider } from "@/contexts/CommunityContext";
import ErrorBoundary from "@/components/ErrorBoundary";

import { initializeNotifications } from "@/lib/notifications";
import { StyleSheet } from 'react-native';

// Notifications are handled in the simplified notification system
import TrialStarter from "@/components/TrialStarter";


SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="glow-analysis" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="analysis-loading" options={{ headerShown: false }} />
      <Stack.Screen name="analysis-results" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="skincare-plan-selection" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="skincare-plan-overview" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="style-check" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="occasion-selection" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="style-loading" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="style-results" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="subscribe" options={{ headerShown: true, headerBackTitle: "Back" }} />
      <Stack.Screen name="privacy-care" options={{ headerShown: true, headerBackTitle: "Back" }} />
    </Stack>
  );
}



export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Simplified initialization - just hide splash screen
        console.log('✅ Hiding splash screen...');
        await SplashScreen.hideAsync();
        console.log('✅ App initialization completed');
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        // Still hide splash screen even if there's an error
        await SplashScreen.hideAsync();
      }
    };
    
    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.container}>
          <ThemeProvider>
            <AuthProvider>
              <UserProvider>
                <SubscriptionProvider>
                  <GamificationProvider>
                    <AnalysisProvider>
                      <SkincareProvider>
                        <StyleProvider>
                          <CommunityProvider>
                            <TrialStarter />
                            <RootLayoutNav />
                          </CommunityProvider>
                        </StyleProvider>
                      </SkincareProvider>
                    </AnalysisProvider>
                  </GamificationProvider>
                </SubscriptionProvider>
              </UserProvider>
            </AuthProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
