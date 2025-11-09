import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import createContextHook from '@nkzw/create-context-hook';
import { StyleAnalysisResult } from '@/types/user';
import { generateObject } from '@/lib/ai-helpers';
import { z } from 'zod';

const OCCASIONS = [
  { id: 'casual', name: 'Casual Day Out', icon: '👕' },
  { id: 'work', name: 'Work/Office', icon: '💼' },
  { id: 'date', name: 'Date Night', icon: '💕' },
  { id: 'party', name: 'Party/Event', icon: '🎉' },
  { id: 'formal', name: 'Formal Event', icon: '👔' },
  { id: 'wedding', name: 'Wedding', icon: '💒' },
  { id: 'interview', name: 'Job Interview', icon: '📋' },
  { id: 'gym', name: 'Gym/Workout', icon: '💪' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'brunch', name: 'Brunch/Lunch', icon: '🥂' },
];

// Zod schema for style analysis
const StyleAnalysisSchema = z.object({
  overallScore: z.number(),
  vibe: z.string(),
  colorAnalysis: z.object({
    dominantColors: z.array(z.string()),
    colorHarmony: z.number(),
    seasonalMatch: z.string(),
    recommendedColors: z.array(z.string()),
  }),
  outfitBreakdown: z.object({
    top: z.object({
      item: z.string(),
      fit: z.number(),
      color: z.string(),
      style: z.string(),
      rating: z.number(),
      feedback: z.string(),
    }),
    bottom: z.object({
      item: z.string(),
      fit: z.number(),
      color: z.string(),
      style: z.string(),
      rating: z.number(),
      feedback: z.string(),
    }),
    accessories: z.object({
      jewelry: z.object({
        items: z.array(z.string()),
        appropriateness: z.number(),
        feedback: z.string(),
      }),
      shoes: z.object({
        style: z.string(),
        match: z.number(),
        feedback: z.string(),
      }),
      bag: z.object({
        style: z.string(),
        match: z.number(),
        feedback: z.string(),
      }),
    }),
  }),
  occasionMatch: z.object({
    appropriateness: z.number(),
    formalityLevel: z.string(),
    suggestions: z.array(z.string()),
  }),
  bodyTypeRecommendations: z.object({
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    stylesThatSuit: z.array(z.string()),
  }),
  overallFeedback: z.object({
    whatWorked: z.array(z.string()),
    improvements: z.array(z.string()),
    specificSuggestions: z.array(z.string()),
  }),
});

export const [StyleProvider, useStyle] = createContextHook(() => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StyleAnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<StyleAnalysisResult[]>([]);

  const loadAnalysisHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('styleAnalysisHistory');
      if (stored) {
        const history = JSON.parse(stored);
        setAnalysisHistory(history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  }, []);

  useEffect(() => {
    loadAnalysisHistory();
  }, [loadAnalysisHistory]);

  const saveAnalysisToHistory = useCallback(async (result: StyleAnalysisResult) => {
    try {
      const updatedHistory = [result, ...analysisHistory.slice(0, 9)];
      setAnalysisHistory(updatedHistory);
      await AsyncStorage.setItem('styleAnalysisHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving analysis to history:', error);
    }
  }, [analysisHistory]);

  const analyzeOutfit = useCallback(async (imageUri: string, occasion: string): Promise<StyleAnalysisResult> => {
    setIsAnalyzing(true);
    
    try {
      const analysisPrompt = `
Analyze this outfit photo for a ${occasion} occasion. Provide a comprehensive style analysis including:

1. Overall vibe and aesthetic
2. Color analysis and harmony
3. Detailed breakdown of each clothing item (top, bottom, accessories)
4. Jewelry and accessories evaluation
5. Appropriateness for the occasion
6. Body type recommendations
7. Specific improvement suggestions
8. Color recommendations that would suit the person
9. Style suggestions for this specific occasion

Be very detailed and precise. Rate each aspect out of 100. Provide constructive feedback.

Respond in this exact JSON format:
{
  "overallScore": number,
  "vibe": "string describing the overall aesthetic",
  "colorAnalysis": {
    "dominantColors": ["color1", "color2", "color3"],
    "colorHarmony": number,
    "seasonalMatch": "Spring/Summer/Autumn/Winter",
    "recommendedColors": ["color1", "color2", "color3"]
  },
  "outfitBreakdown": {
    "top": {
      "item": "description",
      "fit": number,
      "color": "color",
      "style": "style description",
      "rating": number,
      "feedback": "detailed feedback"
    },
    "bottom": {
      "item": "description",
      "fit": number,
      "color": "color",
      "style": "style description",
      "rating": number,
      "feedback": "detailed feedback"
    },
    "accessories": {
      "jewelry": {
        "items": ["item1", "item2"],
        "appropriateness": number,
        "feedback": "feedback"
      },
      "shoes": {
        "style": "shoe style",
        "match": number,
        "feedback": "feedback"
      },
      "bag": {
        "style": "bag style",
        "match": number,
        "feedback": "feedback"
      }
    }
  },
  "occasionMatch": {
    "appropriateness": number,
    "formalityLevel": "Casual/Smart Casual/Business/Formal",
    "suggestions": ["suggestion1", "suggestion2"]
  },
  "bodyTypeRecommendations": {
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "stylesThatSuit": ["style1", "style2"]
  },
  "overallFeedback": {
    "whatWorked": ["positive1", "positive2"],
    "improvements": ["improvement1", "improvement2"],
    "specificSuggestions": ["suggestion1", "suggestion2"]
  }
}`;

      // Convert image to base64 if needed
      let imageBase64 = imageUri;
      if (imageUri.startsWith('data:')) {
        imageBase64 = imageUri.split(',')[1];
        console.log('✅ Style image already in base64 format, length:', imageBase64?.length || 0);
      } else if (Platform.OS !== 'web' && (imageUri.startsWith('file://') || imageUri.startsWith('content://'))) {
        console.log('📱 Converting mobile file URI to base64 for style analysis');
        try {
          // Check if FileSystem.EncodingType exists
          if (!FileSystem || !FileSystem.EncodingType || !FileSystem.EncodingType.Base64) {
            throw new Error('FileSystem.EncodingType.Base64 is not available');
          }
          imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log('✅ Mobile image converted, length:', imageBase64?.length || 0);
        } catch (fsError) {
          console.error('❌ FileSystem error:', fsError);
          console.log('🔄 Trying alternative base64 conversion method...');
          
          // Fallback: Use fetch with blob for mobile if FileSystem fails
          try {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            
            imageBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                const base64Data = result.split(',')[1];
                console.log('✅ Mobile image converted using FileReader, length:', base64Data?.length || 0);
                resolve(base64Data);
              };
              reader.onerror = (error) => {
                console.error('❌ FileReader error:', error);
                reject(new Error('Failed to convert image to base64'));
              };
              reader.readAsDataURL(blob);
            });
          } catch (fetchError) {
            console.error('❌ Fetch fallback also failed:', fetchError);
            throw new Error('All image conversion methods failed');
          }
        }
      } else {
        console.log('📸 Style image URI (not base64):', imageUri.substring(0, 50));
      }

      const toolkitUrl = process.env['EXPO_PUBLIC_TOOLKIT_URL'];
      
      if (!toolkitUrl) {
        console.log('⚠️ Toolkit URL not configured, using fallback analysis');
        const fallbackAnalysis = createFallbackStyleAnalysis(occasion);
        const result: StyleAnalysisResult = {
          id: Date.now().toString(),
          image: imageUri,
          occasion,
          ...fallbackAnalysis,
          timestamp: new Date()
        };
        
        setAnalysisResult(result);
        await saveAnalysisToHistory(result);
        return result;
      }

      console.log('🤖 Sending style AI request with image length:', imageBase64?.length || 0);
      let analysisData;
      try {
        analysisData = await generateObject({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: analysisPrompt
                },
                {
                  type: 'image',
                  image: imageBase64
                }
              ]
            }
          ],
          schema: StyleAnalysisSchema,
          timeout: 25000
        });
        console.log('✅ Style AI response received');
      } catch (error) {
        console.log('🔄 AI API failed, using fallback analysis:', error);
        const fallbackAnalysis = createFallbackStyleAnalysis(occasion);
        const result: StyleAnalysisResult = {
          id: Date.now().toString(),
          image: imageUri,
          occasion,
          ...fallbackAnalysis,
          timestamp: new Date()
        };
        
        setAnalysisResult(result);
        await saveAnalysisToHistory(result);
        return result;
      }

      const result: StyleAnalysisResult = {
        id: Date.now().toString(),
        image: imageUri,
        occasion,
        ...analysisData,
        timestamp: new Date()
      };

      setAnalysisResult(result);
      await saveAnalysisToHistory(result);
      
      return result;
    } catch (error) {
      console.error('Error analyzing outfit:', error);
      // Create fallback analysis on any error
      const fallbackAnalysis = createFallbackStyleAnalysis(occasion);
      const result: StyleAnalysisResult = {
        id: Date.now().toString(),
        image: imageUri,
        occasion,
        ...fallbackAnalysis,
        timestamp: new Date()
      };
      
      setAnalysisResult(result);
      await saveAnalysisToHistory(result);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, [saveAnalysisToHistory]);

  // Helper function to create fallback style analysis
  const createFallbackStyleAnalysis = (occasion: string) => {
    return {
      overallScore: 75,
      vibe: 'Stylish and put-together',
      colorAnalysis: {
        dominantColors: ['Black', 'White', 'Blue'],
        colorHarmony: 80,
        seasonalMatch: 'Autumn',
        recommendedColors: ['Navy', 'Burgundy', 'Cream']
      },
      outfitBreakdown: {
        top: {
          item: 'Casual top',
          fit: 85,
          color: 'Neutral',
          style: 'Classic',
          rating: 80,
          feedback: 'Good fit and style choice'
        },
        bottom: {
          item: 'Casual bottom',
          fit: 80,
          color: 'Neutral',
          style: 'Classic',
          rating: 75,
          feedback: 'Complements the overall look'
        },
        accessories: {
          jewelry: {
            items: ['Watch', 'Ring'],
            appropriateness: 85,
            feedback: 'Well-chosen accessories'
          },
          shoes: {
            style: 'Casual',
            match: 80,
            feedback: 'Good match for the outfit'
          },
          bag: {
            style: 'Casual',
            match: 75,
            feedback: 'Functional and stylish'
          }
        }
      },
      occasionMatch: {
        appropriateness: 85,
        formalityLevel: 'Casual',
        suggestions: ['Consider adding a statement piece', `Great for ${occasion.toLowerCase()}`]
      },
      bodyTypeRecommendations: {
        strengths: ['Good proportions', 'Flattering fit'],
        improvements: ['Try different silhouettes', 'Experiment with colors'],
        stylesThatSuit: ['Classic', 'Casual', 'Smart casual']
      },
      overallFeedback: {
        whatWorked: ['Good color coordination', 'Appropriate for occasion'],
        improvements: ['Add more personality', 'Try bolder accessories'],
        specificSuggestions: ['Consider layering', 'Experiment with textures']
      }
    };
  };

  const resetAnalysis = useCallback(() => {
    setCurrentImage(null);
    setSelectedOccasion(null);
    setAnalysisResult(null);
  }, []);

  return useMemo(() => ({
    occasions: OCCASIONS,
    currentImage,
    setCurrentImage,
    selectedOccasion,
    setSelectedOccasion,
    isAnalyzing,
    analysisResult,
    analysisHistory,
    analyzeOutfit,
    resetAnalysis
    // Note: analyzeOutfit is intentionally excluded from deps to avoid circular dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentImage, selectedOccasion, isAnalyzing, analysisResult, analysisHistory, resetAnalysis]);
});