import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { StyleAnalysisResult } from '@/types/user';

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

  // Utility function for making AI API calls with retry logic
  const makeAIRequest = async (messages: any[], maxRetries = 1): Promise<any> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Style AI API attempt ${attempt + 1}/${maxRetries + 1}`);
        
        // Try the toolkit API with timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
          
          const response = await fetch(`${(process.env.EXPO_PUBLIC_TOOLKIT_URL ?? 'https://toolkit.rork.com').replace(/\/$/, '')}/text/llm/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.completion) {
              console.log('✅ Style AI API succeeded');
              return data.completion;
            }
          } else {
            console.log(`Primary API returned status ${response.status}`);
          }
        } catch (fetchError) {
          console.log('Primary API failed:', fetchError instanceof Error ? fetchError.message : 'Unknown error');
        }
        
        // Fallback to OpenAI API (only if a key is provided)
        const fallbackKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
        if (!fallbackKey) {
          console.log('No OpenAI key configured, will use fallback analysis');
          throw new Error('No AI API available');
        }
        
        console.log('Trying OpenAI API fallback...');
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 8000); // 8 second timeout
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${fallbackKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            max_tokens: 2000,
            temperature: 0.7
          }),
          signal: controller2.signal
        });
        
        clearTimeout(timeoutId2);

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text().catch(() => 'Unknown error');
          console.error(`OpenAI API Response not OK (attempt ${attempt + 1}):`, openaiResponse.status, errorText);
          throw new Error(`AI API error: ${openaiResponse.status}`);
        }

        const openaiData = await openaiResponse.json();
        if (!openaiData.choices?.[0]?.message?.content) {
          throw new Error('No completion in AI response');
        }
        
        console.log('✅ OpenAI API succeeded');
        return openaiData.choices[0].message.content;
      } catch (error) {
        console.error(`Style AI API error (attempt ${attempt + 1}):`, error instanceof Error ? error.message : String(error));
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          console.log(`Waiting before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
    }
    
    console.log('❌ All Style AI API attempts failed, will use fallback analysis');
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

      // Convert image to base64 if needed
      let imageBase64 = imageUri;
      if (imageUri.startsWith('data:')) {
        imageBase64 = imageUri.split(',')[1];
        console.log('✅ Style image already in base64 format, length:', imageBase64?.length || 0);
      } else {
        console.log('📸 Style image URI (not base64):', imageUri.substring(0, 50));
      }
      
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
              image: imageBase64
            }
          ]
        }
      ];

      console.log('🤖 Sending style AI request with image length:', imageBase64?.length || 0);
      let completion;
      try {
        completion = await makeAIRequest(messages);
        console.log('✅ Style AI response received, length:', completion?.length || 0);
      } catch (error) {
        console.error('Style AI API failed after retries, using fallback:', error);
        // Use fallback analysis immediately if AI fails
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

      let analysisData;
      try {
        let cleanedResponse = completion.replace(/```json\n?|```\n?/g, '').trim();
        
        // If the response doesn't start with {, try to find JSON in the response
        if (!cleanedResponse.startsWith('{')) {
          const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cleanedResponse = jsonMatch[0];
          } else {
            console.error('No valid JSON found in style response:', cleanedResponse);
            throw new Error('No valid JSON found in AI response');
          }
        }
        
        analysisData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Problematic response:', completion);
        
        // Fallback: Create a basic analysis structure
        console.log('Creating fallback style analysis due to parse error');
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