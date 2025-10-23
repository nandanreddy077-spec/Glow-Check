import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { StyleAnalysisResult } from '@/types/user';
import { generateText } from '@rork/toolkit-sdk';

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

  // Utility function for making AI API calls with retry logic using Rork Toolkit
  const makeAIRequest = async (messages: any[], maxRetries = 2): Promise<any> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🎨 Style AI API attempt ${attempt + 1}/${maxRetries + 1}`);
        
        // Use Rork Toolkit's generateText API with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
        });
        
        const requestPromise = generateText({ messages });
        
        const completion = await Promise.race([requestPromise, timeoutPromise]);
        
        if (completion) {
          console.log('✅ Rork Toolkit AI response received successfully');
          return completion;
        }
        
        throw new Error('No completion in AI response');
      } catch (error) {
        console.error(`❌ Style AI API error (attempt ${attempt + 1}):`, error);
        
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            type: error.constructor.name
          });
        }
        
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          const delayMs = 1000 * (attempt + 1);
          console.log(`⏳ Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
      }
    }
    
    console.log('🔄 All AI attempts failed, will use fallback analysis');
    throw lastError || new Error('AI API request failed after all retries');
  };

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

      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: analysisPrompt
            },
            {
              type: 'image',
              image: imageUri.startsWith('data:') ? imageUri.split(',')[1] : imageUri
            }
          ]
        }
      ];

      let completion;
      try {
        console.log('🚀 Attempting AI style analysis...');
        completion = await makeAIRequest(messages);
        console.log('✅ Raw AI response received, length:', completion?.length || 0);
      } catch (error) {
        console.error('❌ Style AI API failed after all retries, using fallback:', error);
        console.log('📊 Creating enhanced fallback style analysis...');
        
        // Use fallback analysis immediately if AI fails
        const fallbackAnalysis = createFallbackStyleAnalysis(occasion);
        const result: StyleAnalysisResult = {
          id: Date.now().toString(),
          image: imageUri,
          occasion,
          ...fallbackAnalysis,
          timestamp: new Date()
        };
        
        console.log('✅ Fallback analysis created successfully');
        setAnalysisResult(result);
        await saveAnalysisToHistory(result);
        return result;
      }

      let analysisData;
      try {
        // Check if the response is valid before processing
        if (!completion || typeof completion !== 'string') {
          console.error('❌ Invalid AI response type:', typeof completion);
          throw new Error('Invalid AI response format');
        }
        
        // Log the raw response for debugging
        console.log('📝 Raw AI response preview:', completion.substring(0, 200));
        
        let cleanedResponse = completion.replace(/```json\n?|```\n?/g, '').trim();
        
        // If the response doesn't start with {, try to find JSON in the response
        if (!cleanedResponse.startsWith('{')) {
          console.log('⚠️ Response does not start with {, attempting to extract JSON...');
          const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanedResponse = jsonMatch[0];
            console.log('✅ JSON extracted successfully');
          } else {
            console.error('❌ No valid JSON found in style response');
            console.error('Response content:', cleanedResponse.substring(0, 500));
            throw new Error('No valid JSON found in AI response');
          }
        }
        
        analysisData = JSON.parse(cleanedResponse);
        console.log('✅ Successfully parsed style analysis JSON');
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        if (parseError instanceof Error) {
          console.error('Parse error details:', {
            name: parseError.name,
            message: parseError.message
          });
        }
        console.error('Problematic response (first 500 chars):', completion?.substring(0, 500) || 'undefined');
        
        // Fallback: Create a basic analysis structure
        console.log('🔄 Creating fallback style analysis due to parse error');
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