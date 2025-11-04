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
import { FreemiumProvider } from "@/contexts/FreemiumContext";
import { ProgressTrackingProvider } from "@/contexts/ProgressTrackingContext";
import { ProductTrackingProvider } from "@/contexts/ProductTrackingContext";
import { SeasonalAdvisorProvider } from "@/contexts/SeasonalAdvisorContext";
import { GlowForecastContext } from "@/contexts/GlowForecastContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ErrorBoundary from "@/components/ErrorBoundary";


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
      <Stack.Screen name="glow-forecast" options={{ headerShown: false }} />
      <Stack.Screen name="progress-tracker" options={{ headerShown: false }} />
      <Stack.Screen name="product-library" options={{ headerShown: false }} />
      <Stack.Screen name="premium-unlock" options={{ headerShown: true, headerBackTitle: "Back" }} />
    </Stack>
  );
}



export default function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await validateAndCleanStorage();
        console.log('✅ Storage validated and cleaned successfully');
      } catch (error) {
        console.error('❌ Storage cleanup failed:', error);
      } finally {
        SplashScreen.hideAsync();
      }
    };
    
    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <AuthProvider>
              <UserProvider>
                <GamificationProvider>
                  <AnalysisProvider>
                    <SkincareProvider>
                      <StyleProvider>
                        <SubscriptionProvider>
                          <FreemiumProvider>
                            <NotificationProvider>
                              <ProgressTrackingProvider>
                              <ProductTrackingProvider>
                                <SeasonalAdvisorProvider>
                                  <GlowForecastContext>
                                    <GestureHandlerRootView style={styles.container}>
                                      <CommunityProvider>
                                        <TrialStarter />
                                        <RootLayoutNav />
                                      </CommunityProvider>
                                    </GestureHandlerRootView>
                                  </GlowForecastContext>
                                </SeasonalAdvisorProvider>
                              </ProductTrackingProvider>
                              </ProgressTrackingProvider>
                            </NotificationProvider>
                          </FreemiumProvider>
                        </SubscriptionProvider>
                      </StyleProvider>
                    </SkincareProvider>
                  </AnalysisProvider>
                </GamificationProvider>
              </UserProvider>
            </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
