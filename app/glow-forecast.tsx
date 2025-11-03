import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, TrendingUp, Calendar, Target, Zap, Lock } from "lucide-react-native";
import { useGlowForecast } from "@/contexts/GlowForecastContext";
import { useFreemium } from "@/contexts/FreemiumContext";
import type { TimeframeType } from "@/types/forecast";

export default function GlowForecastScreen() {
  const {
    forecast,
    isLoading,
    selectedTimeframe,
    setSelectedTimeframe,
    generateForecast,
    isGenerating,
    history,
  } = useGlowForecast();
  const { canAccessGlowForecast } = useFreemium();

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
    generateForecast(selectedTimeframe);
  };

  if (!canAccessGlowForecast) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: "Glow Forecast", headerShown: true }} />
        <LinearGradient
          colors={["#FFD6E8", "#E0C3FC", "#C7CEEA"]}
          style={styles.lockedContainer}
        >
          <View style={styles.lockedContent}>
            <View style={styles.lockIconContainer}>
              <Lock size={64} color="#9333EA" />
            </View>
            <Text style={styles.lockedTitle}>Unlock Your Future Glow</Text>
            <Text style={styles.lockedDescription}>
              See exactly how beautiful you&apos;ll look in the future with AI-powered predictions
              based on your progress
            </Text>

            <View style={styles.featureList}>
              <FeatureItem text="Personalized glow predictions" />
              <FeatureItem text="Weekly milestone tracking" />
              <FeatureItem text="AI-analyzed progress insights" />
              <FeatureItem text="Beauty goal achievements" />
            </View>

            <TouchableOpacity
              style={styles.unlockButton}
              onPress={() => router.push("/premium-unlock")}
            >
              <LinearGradient
                colors={["#9333EA", "#C026D3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.unlockGradient}
              >
                <Sparkles size={20} color="#FFF" />
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
          headerStyle: { backgroundColor: "#FAFAFA" },
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#FFD6E8", "#E0C3FC", "#C7CEEA"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Sparkles size={32} color="#9333EA" />
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

          {!forecast || forecast.timeframe !== selectedTimeframe ? (
            <View style={styles.generateContainer}>
              <View style={styles.generateCard}>
                <TrendingUp size={48} color="#9333EA" />
                <Text style={styles.generateTitle}>Generate Your Forecast</Text>
                <Text style={styles.generateDescription}>
                  See how you&apos;ll glow in the future based on your current routine and progress
                </Text>

                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleGenerate}
                  disabled={isGenerating}
                >
                  <LinearGradient
                    colors={["#9333EA", "#C026D3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.generateGradient}
                  >
                    <Sparkles size={20} color="#FFF" />
                    <Text style={styles.generateButtonText}>
                      {isGenerating ? "Generating..." : "Generate Forecast"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.scoreCard}>
                <LinearGradient
                  colors={["#9333EA", "#C026D3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.scoreGradient}
                >
                  <Text style={styles.scoreLabel}>Predicted Glow Score</Text>
                  <Text style={styles.scoreValue}>
                    {forecast.overallGlowScore.predicted}
                  </Text>
                  <View style={styles.scoreChange}>
                    <TrendingUp size={16} color="#FFF" />
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
                  <Target size={24} color="#9333EA" />
                  <Text style={styles.sectionTitle}>Key Metrics</Text>
                </View>

                <View style={styles.metricsGrid}>
                  {forecast.metrics.map((metric, index) => (
                    <View key={index} style={styles.metricCard}>
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
                  <Calendar size={24} color="#9333EA" />
                  <Text style={styles.sectionTitle}>Milestones</Text>
                </View>

                {forecast.milestones.map((milestone) => (
                  <View key={milestone.id} style={styles.milestoneCard}>
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
                  <Zap size={24} color="#9333EA" />
                  <Text style={styles.sectionTitle}>Personalized Insights</Text>
                </View>

                {forecast.insights.map((insight) => (
                  <View key={insight.id} style={styles.insightCard}>
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
              >
                <Sparkles size={18} color="#9333EA" />
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

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureDot} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollView: {
    flex: 1,
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
    fontWeight: "700" as const,
    color: "#1F2937",
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  timeframeSelector: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  timeframeButtonActive: {
    backgroundColor: "#9333EA",
  },
  timeframeText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  timeframeTextActive: {
    color: "#FFF",
  },
  generateContainer: {
    marginTop: 40,
  },
  generateCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  generateTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#1F2937",
    marginTop: 16,
  },
  generateDescription: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
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
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
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
    fontWeight: "700" as const,
    color: "#1F2937",
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  metricName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#1F2937",
    marginBottom: 8,
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
    color: "#6B7280",
  },
  metricArrow: {
    fontSize: 18,
    color: "#9CA3AF",
  },
  metricPredicted: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#9333EA",
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
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
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
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneCheckboxActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
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
    fontWeight: "600" as const,
    color: "#1F2937",
    marginBottom: 4,
  },
  milestoneTitleAchieved: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },
  milestoneDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 6,
  },
  milestoneDate: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#9333EA",
  },
  insightCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#9333EA",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
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
    fontWeight: "600" as const,
    color: "#9333EA",
    marginBottom: 6,
  },
  insightText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#9333EA",
    marginTop: 12,
  },
  regenerateText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#9333EA",
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
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 20,
    alignItems: "center",
    maxWidth: 400,
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  lockIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  lockedDescription: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  featureList: {
    width: "100%",
    gap: 14,
    marginBottom: 28,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9333EA",
  },
  featureText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500" as const,
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
});
