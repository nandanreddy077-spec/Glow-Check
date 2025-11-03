import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Stack, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, TrendingUp, Calendar, Target, Zap, Lock } from "lucide-react-native";
import { useGlowForecast } from "@/contexts/GlowForecastContext";
import { useFreemium } from "@/contexts/FreemiumContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getPalette, shadow } from "@/constants/theme";
import type { TimeframeType } from "@/types/forecast";

export default function GlowForecastScreen() {
  const {
    forecast,
    selectedTimeframe,
    setSelectedTimeframe,
    generateForecast,
    isGenerating,
    error,
  } = useGlowForecast();
  const { canAccessGlowForecast } = useFreemium();
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const styles = createStyles(palette);

  const timeframes: { value: TimeframeType; label: string }[] = [
    { value: "1week", label: "1 Week" },
    { value: "2weeks", label: "2 Weeks" },
    { value: "1month", label: "1 Month" },
    { value: "3months", label: "3 Months" },
  ];

  const handleGenerate = () => {
    if (!canAccessGlowForecast) {
      router.push("/premium-unlock");
      return;
    }
    try {
      generateForecast(selectedTimeframe);
    } catch (err) {
      console.error("Error generating forecast:", err);
    }
  };

  if (!canAccessGlowForecast) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: "Glow Forecast", 
            headerShown: true,
            headerStyle: { backgroundColor: palette.surface },
            headerTintColor: palette.textPrimary,
            headerShadowVisible: false,
          }} 
        />
        <LinearGradient
          colors={[palette.backgroundStart, palette.backgroundEnd]}
          style={styles.lockedContainer}
        >
          <View style={[styles.lockedContent, shadow.elevated]}>
            <View style={styles.lockIconContainer}>
              <Lock size={64} color={palette.gold} strokeWidth={2} />
            </View>
            <Text style={styles.lockedTitle}>Unlock Your Future Glow</Text>
            <Text style={styles.lockedDescription}>
              See exactly how beautiful you&apos;ll look in the future with AI-powered predictions
              based on your progress
            </Text>

            <View style={styles.featureList}>
              <FeatureItem text="Personalized glow predictions" palette={palette} />
              <FeatureItem text="Weekly milestone tracking" palette={palette} />
              <FeatureItem text="AI-analyzed progress insights" palette={palette} />
              <FeatureItem text="Beauty goal achievements" palette={palette} />
            </View>

            <TouchableOpacity
              style={styles.unlockButton}
              onPress={() => router.push("/premium-unlock")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#F2C2C2", "#E8A87C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.unlockGradient}
              >
                <Sparkles size={20} color="#FFF" strokeWidth={2.5} />
                <Text style={styles.unlockButtonText}>Unlock Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Glow Forecast",
          headerShown: true,
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={["#F2C2C2", "#E8A87C"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Sparkles size={32} color={palette.textLight} strokeWidth={2.5} fill={palette.textLight} />
            <Text style={styles.headerTitle}>Your Future Glow</Text>
            <Text style={styles.headerSubtitle}>
              AI-powered predictions based on your progress
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.timeframeSelector}>
            {timeframes.map((tf) => (
              <TouchableOpacity
                key={tf.value}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === tf.value && styles.timeframeButtonActive,
                ]}
                onPress={() => setSelectedTimeframe(tf.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.timeframeText,
                    selectedTimeframe === tf.value && styles.timeframeTextActive,
                  ]}
                >
                  {tf.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error && (
            <View style={[styles.errorCard, shadow.card]}>
              <Text style={styles.errorTitle}>⚠️ Error</Text>
              <Text style={styles.errorText}>
                {error instanceof Error ? error.message : "Failed to load forecast. Please make sure the database is set up correctly."}
              </Text>
            </View>
          )}

          {!forecast || forecast.timeframe !== selectedTimeframe ? (
            <View style={styles.generateContainer}>
              <View style={[styles.generateCard, shadow.card]}>
                <TrendingUp size={48} color={palette.gold} strokeWidth={2.5} />
                <Text style={styles.generateTitle}>Generate Your Forecast</Text>
                <Text style={styles.generateDescription}>
                  See how you&apos;ll glow in the future based on your current routine and progress
                </Text>

                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleGenerate}
                  disabled={isGenerating}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#F2C2C2", "#E8A87C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.generateGradient}
                  >
                    <Sparkles size={20} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.generateButtonText}>
                      {isGenerating ? "Generating..." : "Generate Forecast"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.scoreCard, shadow.elevated]}>
                <LinearGradient
                  colors={["#F2C2C2", "#E8A87C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scoreGradient}
                >
                  <Text style={styles.scoreLabel}>Predicted Glow Score</Text>
                  <Text style={styles.scoreValue}>
                    {forecast.overallGlowScore.predicted}
                  </Text>
                  <View style={styles.scoreChange}>
                    <TrendingUp size={16} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.scoreChangeText}>
                      +{forecast.overallGlowScore.change} points
                    </Text>
                  </View>
                  <Text style={styles.scoreConfidence}>
                    {forecast.confidence}% confidence
                  </Text>
                </LinearGradient>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Target size={24} color={palette.gold} strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>Key Metrics</Text>
                </View>

                <View style={styles.metricsGrid}>
                  {forecast.metrics.map((metric, index) => (
                    <View key={index} style={[styles.metricCard, shadow.card]}>
                      <Text style={styles.metricName}>{metric.name}</Text>
                      <View style={styles.metricScores}>
                        <Text style={styles.metricCurrent}>{metric.currentScore}</Text>
                        <Text style={styles.metricArrow}>→</Text>
                        <Text style={styles.metricPredicted}>{metric.predictedScore}</Text>
                      </View>
                      <View
                        style={[
                          styles.metricProgress,
                          { backgroundColor: metric.color + "20" },
                        ]}
                      >
                        <View
                          style={[
                            styles.metricProgressBar,
                            {
                              width: `${(metric.improvement / 10) * 100}%`,
                              backgroundColor: metric.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.metricImprovement}>
                        +{metric.improvement} improvement
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Calendar size={24} color={palette.gold} strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>Milestones</Text>
                </View>

                {forecast.milestones.map((milestone) => (
                  <View key={milestone.id} style={[styles.milestoneCard, shadow.card]}>
                    <View style={styles.milestoneHeader}>
                      <View
                        style={[
                          styles.milestoneCheckbox,
                          milestone.achieved && styles.milestoneCheckboxActive,
                        ]}
                      >
                        {milestone.achieved && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.milestoneContent}>
                        <Text
                          style={[
                            styles.milestoneTitle,
                            milestone.achieved && styles.milestoneTitleAchieved,
                          ]}
                        >
                          {milestone.title}
                        </Text>
                        <Text style={styles.milestoneDescription}>
                          {milestone.description}
                        </Text>
                        <Text style={styles.milestoneDate}>
                          {new Date(milestone.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Zap size={24} color={palette.gold} strokeWidth={2.5} />
                  <Text style={styles.sectionTitle}>Personalized Insights</Text>
                </View>

                {forecast.insights.map((insight) => (
                  <View key={insight.id} style={[styles.insightCard, shadow.card]}>
                    <View
                      style={[
                        styles.insightBadge,
                        insight.impact === "high" && styles.insightBadgeHigh,
                        insight.impact === "medium" && styles.insightBadgeMedium,
                        insight.impact === "low" && styles.insightBadgeLow,
                      ]}
                    >
                      <Text style={styles.insightBadgeText}>
                        {insight.impact.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.insightCategory}>{insight.category}</Text>
                    <Text style={styles.insightText}>{insight.insight}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={handleGenerate}
                disabled={isGenerating}
                activeOpacity={0.9}
              >
                <Sparkles size={18} color={palette.gold} strokeWidth={2.5} />
                <Text style={styles.regenerateText}>
                  {isGenerating ? "Generating..." : "Regenerate Forecast"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </View>
  );
}

function FeatureItem({ text, palette }: { text: string; palette: ReturnType<typeof getPalette> }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.gold }} />
      <Text style={{ fontSize: 15, color: palette.textPrimary, fontWeight: '500' as const }}>{text}</Text>
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.backgroundStart,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: palette.textLight,
    marginTop: 12,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: palette.textLight,
    marginTop: 6,
    textAlign: "center",
    opacity: 0.9,
    fontWeight: "500" as const,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timeframeSelector: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  timeframeButtonActive: {
    backgroundColor: palette.gold,
  },
  timeframeText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: palette.textSecondary,
  },
  timeframeTextActive: {
    color: palette.textLight,
    fontWeight: "700" as const,
  },
  generateContainer: {
    marginTop: 40,
  },
  generateCard: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
  },
  generateTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: palette.textPrimary,
    marginTop: 16,
    letterSpacing: -0.3,
  },
  generateDescription: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    fontWeight: "500" as const,
  },
  generateButton: {
    marginTop: 24,
    width: "100%",
  },
  generateGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFF",
  },
  scoreCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  scoreGradient: {
    padding: 30,
    alignItems: "center",
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFF",
    opacity: 0.9,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: "800" as const,
    color: "#FFF",
    marginTop: 8,
  },
  scoreChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  scoreChangeText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFF",
  },
  scoreConfidence: {
    fontSize: 13,
    color: "#FFF",
    opacity: 0.8,
    marginTop: 12,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  metricName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: palette.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  metricScores: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  metricCurrent: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: palette.textSecondary,
  },
  metricArrow: {
    fontSize: 18,
    color: palette.textMuted,
  },
  metricPredicted: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: palette.gold,
  },
  metricProgress: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  metricProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  metricImprovement: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#10B981",
  },
  milestoneCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  milestoneHeader: {
    flexDirection: "row",
    gap: 12,
  },
  milestoneCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneCheckboxActive: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  checkmark: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: palette.textPrimary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  milestoneTitleAchieved: {
    textDecorationLine: "line-through",
    color: palette.textMuted,
  },
  milestoneDescription: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
    fontWeight: "500" as const,
  },
  milestoneDate: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: palette.gold,
    letterSpacing: 0.3,
  },
  insightCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: palette.gold,
    borderWidth: 1,
    borderColor: palette.border,
  },
  insightBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  insightBadgeHigh: {
    backgroundColor: "#FEE2E2",
  },
  insightBadgeMedium: {
    backgroundColor: "#FEF3C7",
  },
  insightBadgeLow: {
    backgroundColor: "#DBEAFE",
  },
  insightBadgeText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#1F2937",
    letterSpacing: 0.5,
  },
  insightCategory: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: palette.gold,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 14,
    color: palette.textPrimary,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.gold,
    marginTop: 12,
  },
  regenerateText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: palette.gold,
    letterSpacing: 0.3,
  },
  bottomPadding: {
    height: 40,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lockedContent: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 20,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
    borderWidth: 1,
    borderColor: palette.border,
  },
  lockIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: palette.overlayGold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: palette.textPrimary,
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  lockedDescription: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: "500" as const,
  },
  featureList: {
    width: "100%",
    gap: 14,
    marginBottom: 28,
  },
  unlockButton: {
    width: "100%",
  },
  unlockGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  unlockButtonText: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#FFF",
  },
  errorCard: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#991B1B",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#7F1D1D",
    lineHeight: 20,
  },
});
