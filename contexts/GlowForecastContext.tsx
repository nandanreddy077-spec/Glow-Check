import { useState } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { generateObject } from "@rork/toolkit-sdk";
import { z } from "zod";
import type {
  GlowForecast,
  TimeframeType,
  MilestoneType,
  PredictionInsight,
  ForecastHistory,
} from "@/types/forecast";

const ForecastSchema = z.object({
  overallGlowScore: z.object({
    current: z.number(),
    predicted: z.number(),
    change: z.number(),
  }),
  metrics: z.array(
    z.object({
      name: z.string(),
      currentScore: z.number(),
      predictedScore: z.number(),
      improvement: z.number(),
      confidence: z.number(),
      color: z.string(),
      icon: z.string(),
    })
  ),
  milestones: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      daysFromNow: z.number(),
      metric: z.string(),
      targetScore: z.number(),
    })
  ),
  insights: z.array(
    z.object({
      category: z.string(),
      insight: z.string(),
      impact: z.enum(["high", "medium", "low"]),
      actionable: z.boolean(),
    })
  ),
  confidence: z.number(),
});

export const [GlowForecastContext, useGlowForecast] = createContextHook(() => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeType>("2weeks");

  const forecastQuery = useQuery({
    queryKey: ["glowForecast", user?.id, selectedTimeframe],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("glow_forecasts")
        .select("*")
        .eq("user_id", user.id)
        .eq("timeframe", selectedTimeframe)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching forecast:", error);
      }

      return data as GlowForecast | null;
    },
    enabled: !!user?.id,
  });

  const progressPhotosQuery = useQuery({
    queryKey: ["progressPhotos", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from("progress_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("photo_date", { ascending: false })
        .limit(10);

      return data || [];
    },
    enabled: !!user?.id,
  });

  const analysesQuery = useQuery({
    queryKey: ["recentAnalyses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from("glow_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      return data || [];
    },
    enabled: !!user?.id,
  });

  const generateForecastMutation = useMutation({
    mutationFn: async (timeframe: TimeframeType) => {
      if (!user?.id) throw new Error("No user");

      console.log("🔮 Generating Glow Forecast...");

      const progressPhotos = progressPhotosQuery.data || [];
      const analyses = analysesQuery.data || [];

      if (progressPhotos.length === 0 && analyses.length === 0) {
        throw new Error("Need at least one analysis or progress photo");
      }

      const currentScore = analyses[0]?.overall_score || 70;
      const skinScore = analyses[0]?.skin_score || 70;
      const makeupScore = analyses[0]?.makeup_score || 70;
      const hairScore = analyses[0]?.hair_score || 70;

      const timeframeInfo = {
        "1week": { days: 7, label: "1 Week" },
        "2weeks": { days: 14, label: "2 Weeks" },
        "1month": { days: 30, label: "1 Month" },
        "3months": { days: 90, label: "3 Months" },
      };

      const { days, label } = timeframeInfo[timeframe];

      const improvementTrend = analyses.length > 1
        ? analyses[0].overall_score - analyses[analyses.length - 1].overall_score
        : 0;

      const prompt = `You are a beauty AI expert analyzing a user's skincare and beauty progress.

Current Data:
- Overall Glow Score: ${currentScore}/100
- Skin Score: ${skinScore}/100
- Makeup Score: ${makeupScore}/100
- Hair Score: ${hairScore}/100
- Progress photos: ${progressPhotos.length}
- Days tracked: ${analyses.length > 0 ? Math.floor((new Date().getTime() - new Date(analyses[analyses.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}
- Recent trend: ${improvementTrend > 0 ? `+${improvementTrend} points improvement` : improvementTrend < 0 ? `${improvementTrend} points decline` : "stable"}

Predict what will happen in ${label} (${days} days) if the user continues their current routine.

Generate:
1. Predicted scores for overall, skin, makeup, and hair (realistic improvements)
2. 4-5 specific, actionable milestones with dates
3. 5-7 personalized insights about what will improve and why
4. Confidence score (0-100) based on available data

Be optimistic but realistic. Focus on achievable improvements.`;

      const forecast = await generateObject({
        messages: [{ role: "user", content: prompt }],
        schema: ForecastSchema,
      });

      console.log("✨ Forecast generated:", forecast);

      const milestonesWithDates: MilestoneType[] = forecast.milestones.map(
        (m, idx) => ({
          id: `milestone-${idx}`,
          title: m.title,
          description: m.description,
          date: new Date(Date.now() + m.daysFromNow * 24 * 60 * 60 * 1000),
          achieved: false,
          metric: m.metric,
          targetScore: m.targetScore,
        })
      );

      const insightsWithId: PredictionInsight[] = forecast.insights.map((ins, idx) => ({
        id: `insight-${idx}`,
        ...ins,
      }));

      const forecastData: Omit<GlowForecast, "id"> = {
        userId: user.id,
        generatedAt: new Date(),
        timeframe,
        overallGlowScore: forecast.overallGlowScore,
        metrics: forecast.metrics,
        milestones: milestonesWithDates,
        insights: insightsWithId,
        confidence: forecast.confidence,
        basedOnPhotos: progressPhotos.length,
        basedOnDays: analyses.length > 0
          ? Math.floor(
              (new Date().getTime() -
                new Date(analyses[analyses.length - 1].created_at).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
      };

      const { data, error } = await supabase
        .from("glow_forecasts")
        .insert({
          user_id: user.id,
          timeframe,
          generated_at: new Date().toISOString(),
          overall_glow_score: forecast.overallGlowScore,
          metrics: forecast.metrics,
          milestones: milestonesWithDates,
          insights: insightsWithId,
          confidence: forecast.confidence,
          based_on_photos: progressPhotos.length,
          based_on_days: forecastData.basedOnDays,
        })
        .select()
        .single();

      if (error) throw error;

      console.log("💾 Forecast saved to database");

      return data as GlowForecast;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glowForecast", user?.id] });
    },
  });

  const historyQuery = useQuery({
    queryKey: ["forecastHistory", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from("glow_analyses")
        .select("created_at, overall_score, skin_score, makeup_score, hair_score")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(30);

      if (!data) return [];

      return data.map((item) => ({
        date: new Date(item.created_at),
        overallScore: item.overall_score,
        skinScore: item.skin_score,
        makeupScore: item.makeup_score,
        hairScore: item.hair_score,
      })) as ForecastHistory[];
    },
    enabled: !!user?.id,
  });

  const achieveMilestoneMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      if (!user?.id || !forecastQuery.data?.id) return;

      const updatedMilestones = forecastQuery.data.milestones.map((m) =>
        m.id === milestoneId ? { ...m, achieved: true } : m
      );

      const { error } = await supabase
        .from("glow_forecasts")
        .update({ milestones: updatedMilestones })
        .eq("id", forecastQuery.data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glowForecast", user?.id] });
    },
  });

  return {
    forecast: forecastQuery.data,
    isLoading: forecastQuery.isLoading,
    error: forecastQuery.error,
    selectedTimeframe,
    setSelectedTimeframe,
    generateForecast: generateForecastMutation.mutate,
    isGenerating: generateForecastMutation.isPending,
    history: historyQuery.data || [],
    achieveMilestone: achieveMilestoneMutation.mutate,
    progressPhotos: progressPhotosQuery.data || [],
    recentAnalyses: analysesQuery.data || [],
  };
});
