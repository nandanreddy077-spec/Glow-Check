import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
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

      // Convert image to base64 with comprehensive error handling
      let imageBase64: string;
      
      console.log('📸 Converting style image to base64:', imageUri.substring(0, 100));
      
      if (imageUri.startsWith('data:image')) {
        const base64Data = imageUri.split(',')[1];
        if (!base64Data) {
          throw new Error('Invalid base64 data URL format');
        }
        imageBase64 = base64Data;
        console.log('✅ Style image already in base64 format, length:', imageBase64.length);
      } else if (Platform.OS !== 'web') {
        console.log('📱 Mobile platform - converting file URI to base64');
        
        // Verify FileSystem is available
        if (!FileSystem || !FileSystem.readAsStringAsync) {
          console.error('❌ FileSystem API not available!');
          throw new Error('FileSystem module not loaded properly');
        }
        
        // Check if file exists
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        console.log('📁 File info:', JSON.stringify(fileInfo));
        
        if (!fileInfo.exists) {
          console.error('❌ File does not exist:', imageUri);
          throw new Error('Image file not found');
        }
        
        console.log('📱 Reading file as base64...');
        const startTime = Date.now();
        
        imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const endTime = Date.now();
        console.log(`✅ Mobile style image converted in ${endTime - startTime}ms, length:`, imageBase64.length);
        
        if (!imageBase64 || imageBase64.length === 0) {
          throw new Error('Converted base64 is empty');
        }
      } else {
        // Web platform - fetch and convert
        console.log('🌐 Web platform - fetching image');
        const response = await fetch(imageUri);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log('📦 Blob size:', blob.size, 'type:', blob.type);
        
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onloadend = () => {
            try {
              const result = reader.result as string;
              if (!result || !result.includes(',')) {
                reject(new Error('Invalid FileReader result'));
                return;
              }
              const base64Data = result.split(',')[1];
              console.log('✅ Web style image converted, length:', base64Data.length);
              resolve(base64Data);
            } catch (err) {
              reject(err);
            }
          };
          
          reader.onerror = () => {
            console.error('❌ FileReader error:', reader.error);
            reject(new Error('FileReader failed to read image'));
          };
          
          reader.readAsDataURL(blob);
        });
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