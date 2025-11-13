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

  const analyzeOutfit = useCallback(async (imageUri: string, occasion: string): Promise<StyleAnalysisResult> => {
    console.log('🎨 analyzeOutfit called with:', { imageUri: imageUri.substring(0, 50), occasion });
    setIsAnalyzing(true);
    
    try {
      // Enhanced prompt for more accurate and impressive style analysis
      const analysisPrompt = `You are an elite fashion stylist featured in Vogue, Harper's Bazaar, and trusted by A-list celebrities. Analyze this outfit photo for a ${occasion} occasion with precision and style expertise.

🎯 YOUR MISSION:
Provide a style analysis so insightful and accurate that the user thinks "WOW, this is like having a personal celebrity stylist!"

👗 CRITICAL RULES:
1. OBSERVE CAREFULLY: Base every assessment on what you actually see in the image
2. BE SPECIFIC: Describe exact items, colors, fits - not generic statements  
3. BE FASHION-FORWARD: Reference current trends and timeless style principles
4. BE CONSTRUCTIVE: Highlight what works AND give actionable improvement tips
5. SCORE ACCURATELY: Use full range 60-95 based on fashion expertise
   - 88-95: Editorial/runway quality, impeccable styling
   - 80-87: Very well styled, fashion-forward
   - 72-79: Good styling with room for refinement
   - 65-71: Average, needs significant improvements
   - 60-64: Poorly styled (rarely use)

📸 ANALYZE THESE ASPECTS:

**OVERALL VIBE** (be specific, not generic):
Describe the aesthetic in 2-3 words that capture the exact mood (e.g., "Effortlessly chic Parisian", "Bold streetwear edge", "Polished minimalist", "Romantic boho luxe")

**COLOR ANALYSIS** (observe actual colors in image):
- Dominant Colors: List 3 exact colors you see (e.g., "Navy blue", "Cream", "Burgundy")
- Color Harmony Score (60-100): How well do colors work together?
- Seasonal Match: Spring/Summer/Autumn/Winter based on color palette
- Recommended Colors: 3 colors that would elevate this look

**OUTFIT BREAKDOWN** (describe what you actually see):

TOP:
- Item: Specific description (e.g., "White silk blouse", "Black turtleneck sweater")
- Fit Score (60-100): How well does it fit? Too loose/tight/perfect?
- Color: Exact color name
- Style: Describe the style (e.g., "Classic tailored", "Oversized casual", "Fitted modern")
- Rating (60-100): Overall effectiveness of this piece
- Feedback: 1-2 specific sentences on what works/what to improve

BOTTOM:
- Item: Specific description (e.g., "Dark wash jeans", "Black midi skirt")
- Fit Score (60-100): Fit assessment
- Color: Exact color
- Style: Describe the style
- Rating (60-100): Overall score
- Feedback: Specific constructive feedback

ACCESSORIES:
- Jewelry: List items you see, rate appropriateness (60-100), give feedback
- Shoes: Describe style, rate match with outfit (60-100), feedback
- Bag: Describe style, rate coordination (60-100), feedback

**OCCASION MATCH** (for ${occasion}):
- Appropriateness (60-100): How well does this outfit suit the occasion?
- Formality Level: Casual/Smart Casual/Business/Business Formal/Formal
- Suggestions: 2-3 specific ways to make this more occasion-appropriate

**BODY TYPE RECOMMENDATIONS**:
- Strengths: 2-3 things this outfit does well for the body type
- Improvements: 2-3 specific styling adjustments for flattery
- Styles That Suit: 3 style aesthetics that would complement their shape

**OVERALL FEEDBACK**:
- What Worked: 2-3 specific strengths of this outfit
- Improvements: 2-3 specific areas for enhancement
- Specific Suggestions: 3 actionable styling tips (e.g., "Add a statement belt", "Try ankle boots instead", "Layer with a structured blazer")

💡 EXAMPLE OF GREAT ANALYSIS:
"The crisp white button-down (fit: 92) shows excellent tailoring with a modern slim cut that flatters without restricting. Paired with high-waisted black trousers (fit: 88), this creates a sophisticated silhouette perfect for ${occasion}. The color harmony (score: 85) is elevated by the subtle navy blazer that adds depth without overwhelming. Consider swapping the casual sneakers for leather loafers to elevate the formality level and better match the polished top half."

❌ BAD (too generic): "Nice outfit. Good colors. Wear different shoes."
✅ GOOD (specific & helpful): "Your navy blazer (rating: 89) creates perfect structure, but the oversized fit in the sleeves (fit: 74) detracts from the tailored aesthetic. Having the sleeves taken up by 1 inch would create a sharp, intentional look that elevates the entire outfit for this ${occasion}."

Respond with ONLY this exact JSON format:
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
        
        if (!FileSystem || !FileSystem.readAsStringAsync) {
          console.error('❌ FileSystem API not available!');
          throw new Error('FileSystem module not loaded properly');
        }
        
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
      console.log('🔧 Toolkit URL:', toolkitUrl);
      
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
        setIsAnalyzing(false);
        return result;
      }

      console.log('🤖 Sending style AI request with image length:', imageBase64?.length || 0);
      console.log('⏱️ Starting AI analysis at:', new Date().toISOString());
      
      let analysisData;
      try {
        const startTime = Date.now();
        
        const analysisPromise = generateObject({
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
          schema: StyleAnalysisSchema
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AI request timeout after 30s')), 30000);
        });
        
        analysisData = await Promise.race([analysisPromise, timeoutPromise]) as z.infer<typeof StyleAnalysisSchema>;
        
        const endTime = Date.now();
        console.log(`✅ Style AI response received in ${endTime - startTime}ms`);
        console.log('📊 Result type:', typeof analysisData);
        
        if (!analysisData || typeof analysisData !== 'object') {
          console.error('❌ Invalid analysis data type:', typeof analysisData);
          throw new Error('Invalid analysis data');
        }
        
        if (!analysisData.outfitBreakdown || !analysisData.colorAnalysis) {
          console.error('❌ Missing required fields in analysis data');
          throw new Error('Incomplete analysis data');
        }
      } catch (error) {
        console.log('🔄 AI API failed, using fallback analysis:', error);
        console.log('⏱️ Fallback triggered at:', new Date().toISOString());
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
        setIsAnalyzing(false);
        return result;
      }

      console.log('✅ AI analysis successful, creating result object');
      const result: StyleAnalysisResult = {
        id: Date.now().toString(),
        image: imageUri,
        occasion,
        ...analysisData,
        timestamp: new Date()
      };

      setAnalysisResult(result);
      await saveAnalysisToHistory(result);
      setIsAnalyzing(false);
      
      console.log('✅ Style analysis complete, result saved');
      return result;
    } catch (error) {
      console.error('❌ Outer catch - Error analyzing outfit:', error);
      console.log('⏱️ Error occurred at:', new Date().toISOString());
      
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
      setIsAnalyzing(false);
      
      console.log('✅ Fallback result created and saved');
      return result;
    }
  }, [saveAnalysisToHistory]);

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
  }), [currentImage, selectedOccasion, isAnalyzing, analysisResult, analysisHistory, analyzeOutfit, resetAnalysis]);
});
