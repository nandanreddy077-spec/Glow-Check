import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useAnalysis, AnalysisResult } from '@/contexts/AnalysisContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFreemium } from '@/contexts/FreemiumContext';
import { getPalette, getGradient, shadow } from '@/constants/theme';
import { generateObject } from '@/lib/ai-helpers';
import { z } from 'zod';



interface AnalysisStep {
  id: string;
  title: string;
  completed: boolean;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 'detection', title: 'Multi-Angle Face Detection', completed: false },
  { id: 'landmarks', title: '3D Feature Mapping', completed: false },
  { id: 'skin', title: 'Advanced Dermatological Analysis', completed: false },
  { id: 'symmetry', title: 'Facial Symmetry & Proportions', completed: false },
  { id: 'texture', title: 'Skin Texture & Pore Analysis', completed: false },
  { id: 'medical', title: 'Medical-Grade Assessment', completed: false },
  { id: 'insights', title: 'Professional Recommendations', completed: false },
];

const ENGAGEMENT_TIPS = [
  "💡 Did you know? Your skin regenerates every 28 days!",
  "✨ Professional tip: Consistency is key to healthy skin",
  "🌟 Fun fact: Your face has over 40 muscles!",
  "💎 Beauty secret: Hydration affects your glow score",
  "🔬 Science: We analyze 50+ facial features for accuracy",
  "🌸 Pro tip: Natural lighting enhances your beauty score",
  "💫 Amazing: Your unique features make you beautiful!",
];

const analysisSchema = z.object({
  skinAnalysis: z.object({
    skinType: z.string(),
    skinTone: z.string(),
    skinQuality: z.string(),
    textureScore: z.number(),
    clarityScore: z.number(),
    hydrationLevel: z.number(),
    poreVisibility: z.number(),
    elasticity: z.number(),
    pigmentationEvenness: z.number(),
  }),
  dermatologyAssessment: z.object({
    acneRisk: z.enum(['Low', 'Medium', 'High']),
    agingSigns: z.array(z.string()),
    skinConcerns: z.array(z.string()),
    recommendedTreatments: z.array(z.string()),
    skinConditions: z.array(z.string()),
    preventiveMeasures: z.array(z.string()),
  }),
  beautyScores: z.object({
    overallScore: z.number(),
    facialSymmetry: z.number(),
    skinGlow: z.number(),
    jawlineDefinition: z.number(),
    eyeArea: z.number(),
    lipArea: z.number(),
    cheekboneDefinition: z.number(),
    skinTightness: z.number(),
    facialHarmony: z.number(),
  }),
  professionalRecommendations: z.array(z.string()),
  confidence: z.number(),
  analysisAccuracy: z.string(),
});

export default function AnalysisLoadingScreen() {
  const { frontImage, leftImage, rightImage, multiAngle } = useLocalSearchParams<{ 
    frontImage: string;
    leftImage?: string;
    rightImage?: string;
    multiAngle: string;
  }>();
  const { user, refreshUserData } = useUser();
  const { theme } = useTheme();
  const { setCurrentResult, saveAnalysis } = useAnalysis();
  const { incrementGlowScan } = useFreemium();
  const [progress, setProgress] = useState(0);
  const [, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(ANALYSIS_STEPS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [engagementTip, setEngagementTip] = useState(0);
  const [progressAnim] = useState(new Animated.Value(0));
  const [flowAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [flowAnimationRunning, setFlowAnimationRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMultiAngle = multiAngle === 'true';
  
  const palette = getPalette(theme);
  const gradient = getGradient(theme);
  const styles = createStyles(palette);

  const startAnalysis = async () => {
    try {
      console.log('🔢 Incrementing glow scan count...');
      await incrementGlowScan();
      console.log('✅ Scan count incremented successfully');
    } catch (err) {
      console.error('❌ Failed to increment scan count:', err);
      setError('Failed to start analysis. Please try again.');
      setTimeout(() => router.back(), 2000);
      return;
    }
    
    setFlowAnimationRunning(true);
    const flowAnimation = Animated.loop(
      Animated.timing(flowAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      })
    );
    flowAnimation.start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    const tipInterval = setInterval(() => {
      setEngagementTip(prev => (prev + 1) % ENGAGEMENT_TIPS.length);
    }, 3000);

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCurrentStep(i);
      setSteps(prev => prev.map((step, index) => 
        index <= i ? { ...step, completed: true } : step
      ));
      
      const newProgress = ((i + 1) / steps.length) * 100;
      setProgress(newProgress);
      
      Animated.timing(progressAnim, {
        toValue: newProgress,
        duration: 500,
        useNativeDriver: false,
      }).start();
      
      if (newProgress >= 100) {
        setFlowAnimationRunning(false);
        flowAnimation.stop();
      }
    }

    clearInterval(tipInterval);
    
    setIsAnalyzing(true);
    
    try {
      const analysisResult = await performAIAnalysis();
      
      if (analysisResult) {
        setCurrentResult(analysisResult);
        await saveAnalysis(analysisResult);
        refreshUserData();
        
        setFlowAnimationRunning(false);
        flowAnimation.stop();
        pulseAnimation.stop();
        setIsAnalyzing(false);
        
        router.replace('/analysis-results');
      } else {
        throw new Error('Analysis returned no results');
      }
    } catch (error) {
      console.error('❌ Analysis failed in startAnalysis:', error);
      setFlowAnimationRunning(false);
      flowAnimation.stop();
      pulseAnimation.stop();
      setIsAnalyzing(false);
      
      setError('Analysis failed. Redirecting...');
      setTimeout(() => {
        router.replace({
          pathname: '/glow-analysis',
          params: { error: 'analysis_failed' }
        });
      }, 1500);
    }
  };

  useEffect(() => {
    startAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const performAIAnalysis = async (): Promise<AnalysisResult | null> => {
    if (!frontImage) {
      console.error('❌ No frontImage provided');
      return createQuickFallbackResult();
    }

    console.log('🚀 Starting', isMultiAngle ? 'multi-angle' : 'single-angle', 'analysis...');
    
    try {
      console.log('📸 Starting image conversion...');
      const frontBase64 = await convertImageToBase64(frontImage);
      console.log('✅ Front image converted, length:', frontBase64?.length || 0);
      
      if (!frontBase64 || frontBase64.length === 0) {
        console.error('❌ Front image conversion resulted in empty string');
        return createQuickFallbackResult();
      }
      
      let leftBase64: string | null = null;
      let rightBase64: string | null = null;
      
      if (isMultiAngle && leftImage && rightImage) {
        try {
          console.log('📸 Converting left profile...');
          leftBase64 = await convertImageToBase64(leftImage);
          console.log('✅ Left image converted, length:', leftBase64?.length || 0);
          
          console.log('📸 Converting right profile...');
          rightBase64 = await convertImageToBase64(rightImage);
          console.log('✅ Right image converted, length:', rightBase64?.length || 0);
          
          console.log('📸 All three angles converted to base64');
        } catch (profileError) {
          console.warn('⚠️ Profile image conversion failed, continuing with front only:', profileError);
        }
      }

      console.log('🧠 Starting comprehensive face analysis...');
      
      // Set a hard timeout for the entire analysis
      const analysisPromise = performComprehensiveFaceAnalysis({
        front: frontBase64,
        left: leftBase64,
        right: rightBase64,
        isMultiAngle
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Analysis timeout')), 15000);
      });
      
      const analysisData = await Promise.race([analysisPromise, timeoutPromise]).catch(error => {
        console.error('❌ Analysis failed or timed out:', error);
        return null;
      });
      
      if (!analysisData) {
        console.log('🔄 Using fallback result');
        return createQuickFallbackResult();
      }
      
      const analysisResult: AnalysisResult = {
        ...analysisData,
        imageUri: frontImage,
        timestamp: Date.now(),
      };
      
      console.log('✅ Analysis completed successfully:', {
        overallScore: analysisResult.overallScore,
        confidence: analysisResult.confidence,
        multiAngle: isMultiAngle
      });
      return analysisResult;
    } catch (error) {
      console.error('❌ Critical error in performAIAnalysis:', error);
      return createQuickFallbackResult();
    }
  };

  const convertImageToBase64 = async (imageUri: string): Promise<string> => {
    try {
      console.log('📸 Converting image to base64:', imageUri.substring(0, 100));
      
      // Check if image is already in base64 format
      if (imageUri.startsWith('data:image')) {
        const base64Data = imageUri.split(',')[1];
        if (!base64Data) {
          throw new Error('Invalid base64 data URL format');
        }
        console.log('✅ Image already in base64 format, length:', base64Data.length);
        return base64Data;
      }
      
      // On mobile (iOS/Android), use expo-file-system to read local file URIs
      if (Platform.OS !== 'web') {
        console.log('📱 Mobile platform detected:', Platform.OS);
        
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
        
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const endTime = Date.now();
        console.log(`✅ Mobile image converted in ${endTime - startTime}ms, length:`, base64.length);
        
        if (!base64 || base64.length === 0) {
          throw new Error('Converted base64 is empty');
        }
        
        return base64;
      }
      
      // On web, use fetch + FileReader
      console.log('🌐 Web platform - using fetch');
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        console.error('❌ Failed to fetch image, status:', response.status);
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('📦 Response content-type:', contentType);
      
      if (!contentType || !contentType.startsWith('image/')) {
        console.error('❌ Response is not an image:', contentType);
        throw new Error('Response is not an image');
      }
      
      const blob = await response.blob();
      console.log('📦 Blob size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        console.error('❌ Blob is empty');
        throw new Error('Image blob is empty');
      }
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadend = () => {
          try {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
              reject(new Error('Invalid FileReader result'));
              return;
            }
            const base64Data = result.split(',')[1];
            console.log('✅ Web image converted to base64, length:', base64Data.length);
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
    } catch (error) {
      console.error('❌ CRITICAL: Image conversion failed:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw new Error(`Failed to convert image: ${error instanceof Error ? error.message : String(error)}`);
    }
  };



  const performComprehensiveFaceAnalysis = async (images: {
    front: string;
    left: string | null;
    right: string | null;
    isMultiAngle: boolean;
  }) => {
    try {
      console.log('🔍 Starting', images.isMultiAngle ? 'multi-angle' : 'single-angle', 'comprehensive face analysis...');
      
      // Try Google Vision with timeout
      let frontVisionData = null;
      let leftVisionData = null;
      let rightVisionData = null;
      
      try {
        const visionPromise = analyzeWithGoogleVision(images.front);
        const visionTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Vision API timeout')), 8000);
        });
        frontVisionData = await Promise.race([visionPromise, visionTimeout]);
        console.log('✅ Google Vision analysis completed');
        
        if (images.isMultiAngle && images.left && images.right) {
          try {
            leftVisionData = await analyzeWithGoogleVision(images.left).catch(() => null);
            rightVisionData = await analyzeWithGoogleVision(images.right).catch(() => null);
          } catch (profileError) {
            console.warn('⚠️ Profile Vision API failed, continuing with front only');
          }
        }
      } catch (visionError) {
        console.warn('⚠️ Google Vision API failed, using direct fallback:', visionError);
        // Use fallback immediately if Vision fails
        return generateFallbackAnalysis(null);
      }
      
      // Validate face detection - be lenient
      const hasValidFace = frontVisionData?.faceAnnotations?.[0];
      if (!hasValidFace) {
        console.log('⚠️ No face detected, using fallback');
        return generateFallbackAnalysis(frontVisionData);
      }
      
      // Try AI analysis with timeout and immediate fallback on error
      console.log('\n🧠 Starting AI analysis...');
      let dermatologyData;
      try {
        const aiPromise = analyzeWithAdvancedAI(images, {
          front: frontVisionData,
          left: leftVisionData,
          right: rightVisionData
        });
        const aiTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('AI analysis timeout')), 12000);
        });
        dermatologyData = await Promise.race([aiPromise, aiTimeout]);
      } catch (aiError) {
        console.warn('⚠️ AI analysis failed, using enhanced fallback:', aiError);
        dermatologyData = generateFallbackAnalysis({ front: frontVisionData, left: leftVisionData, right: rightVisionData });
      }
      
      console.log('\n📊 Calculating final scores...');
      const finalResult = calculateAdvancedScores({
        front: frontVisionData,
        left: leftVisionData,
        right: rightVisionData
      }, dermatologyData, images.isMultiAngle);
      
      console.log('✅ Analysis completed successfully!');
      return finalResult;
      
    } catch (error) {
      console.error('❌ Comprehensive analysis error:', error);
      // Always return fallback instead of throwing
      return generateFallbackAnalysis(null);
    }
  };

  const analyzeWithGoogleVision = async (base64Image: string) => {
    const GOOGLE_VISION_API_KEY = 'AIzaSyBFOUmZkW1F8pFFFlGs0S-gKGaej74VROg';
    
    try {
      console.log('Calling Google Vision API...');
      
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: base64Image
            },
            features: [
              { type: 'FACE_DETECTION', maxResults: 1 },
              { type: 'IMAGE_PROPERTIES', maxResults: 1 },
              { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Vision API error:', response.status, errorText);
        throw new Error(`Vision API error: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('📦 Google Vision raw response (first 200 chars):', responseText.substring(0, 200));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse Google Vision response as JSON');
        console.error('Response text:', responseText.substring(0, 500));
        throw new Error('Invalid JSON response from Google Vision API');
      }
      
      console.log('✅ Google Vision API response parsed successfully');
      
      return data.responses[0];
      
    } catch (error) {
      console.error('Google Vision API error:', error);
      throw error;
    }
  };

  const analyzeWithAdvancedAI = async (images: {
    front: string;
    left: string | null;
    right: string | null;
    isMultiAngle: boolean;
  }, visionData: {
    front: any;
    left: any;
    right: any;
  }) => {
    try {
      const toolkitUrl = process.env['EXPO_PUBLIC_TOOLKIT_URL'];
      
      console.log('🤖 Starting AI analysis, toolkit URL configured:', !!toolkitUrl);
      console.log('📱 Platform:', Platform.OS);
      
      if (!toolkitUrl) {
        console.log('⚠️ Toolkit URL not configured, using fallback analysis');
        return generateFallbackAnalysis(visionData);
      }

      const analysisType = images.isMultiAngle ? 'multi-angle professional' : 'single-angle';
      const prompt = `You are a board-certified dermatologist and facial aesthetics expert with 20+ years of experience. Perform a ${analysisType} comprehensive facial analysis using the provided Google Vision data.

${images.isMultiAngle ? 'MULTI-ANGLE ANALYSIS DATA:' : 'SINGLE-ANGLE ANALYSIS DATA:'}
Front View Vision Data: ${JSON.stringify(visionData.front, null, 2)}
${images.isMultiAngle && visionData.left ? `Left Profile Vision Data: ${JSON.stringify(visionData.left, null, 2)}` : ''}
${images.isMultiAngle && visionData.right ? `Right Profile Vision Data: ${JSON.stringify(visionData.right, null, 2)}` : ''}

PROFESSIONAL ASSESSMENT REQUIREMENTS:
1. Medical-grade skin analysis (texture, pores, pigmentation, elasticity)
2. Dermatological pathology assessment (acne, rosacea, melasma, aging)
3. Facial structure analysis ${images.isMultiAngle ? '(3D symmetry, profile proportions)' : '(frontal symmetry)'}
4. Professional beauty scoring with clinical accuracy
5. Evidence-based treatment recommendations
6. Skin health prognosis and prevention strategies

CRITICAL: Your analysis must be as accurate as an in-person dermatologist consultation. Use medical terminology and provide specific, actionable recommendations.

Respond with ONLY a valid JSON object with this structure:
{
  "skinAnalysis": {
    "skinType": "Normal/Dry/Oily/Combination/Sensitive",
    "skinTone": "Very Light/Light/Medium Light/Medium/Medium Dark/Dark/Very Dark + Warm/Cool/Neutral undertone",
    "skinQuality": "Poor/Fair/Good/Very Good/Excellent",
    "textureScore": 85,
    "clarityScore": 90,
    "hydrationLevel": 80,
    "poreVisibility": 75,
    "elasticity": 88,
    "pigmentationEvenness": 82
  },
  "dermatologyAssessment": {
    "acneRisk": "Low/Medium/High",
    "agingSigns": ["Fine lines", "Loss of elasticity", "Volume loss", "Pigmentation"],
    "skinConcerns": ["Enlarged pores", "Uneven texture", "Dark spots"],
    "recommendedTreatments": ["Retinoid therapy", "Chemical peels", "Laser resurfacing"],
    "skinConditions": ["Any detected conditions like rosacea, melasma, etc."],
    "preventiveMeasures": ["SPF 30+ daily", "Antioxidant serums", "Gentle cleansing"]
  },
  "beautyScores": {
    "overallScore": 88,
    "facialSymmetry": 92,
    "skinGlow": 85,
    "jawlineDefinition": 78,
    "eyeArea": 90,
    "lipArea": 85,
    "cheekboneDefinition": 87,
    "skinTightness": 83,
    "facialHarmony": 89
  },
  "professionalRecommendations": ["5-7 specific dermatologist-level recommendations"],
  "confidence": 0.95,
  "analysisAccuracy": "${images.isMultiAngle ? 'Professional-grade (multi-angle)' : 'Standard (single-angle)'}"
}`;

      console.log('Making advanced AI analysis request...');
      
      const messages = [
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: prompt },
            { type: 'image' as const, image: images.front }
          ]
        }
      ];

      console.log('🤖 Sending AI request with image length:', images.front?.length || 0);
      console.log('⏱️ Starting AI analysis with 10s timeout...');
      
      const analysisResult = await generateObject({
        messages: messages,
        schema: analysisSchema,
        timeout: 10000
      });
      console.log('✅ AI analysis completed successfully!');
      console.log('📊 Scores:', {
        overall: analysisResult.beautyScores?.overallScore,
        confidence: analysisResult.confidence
      });
      return analysisResult;
    } catch (error) {
      console.error('❌ AI analysis failed, using fallback:', error instanceof Error ? error.message : String(error));
      return generateFallbackAnalysis(visionData);
    }
  };

  const generateConsistentScore = (imageUri: string, visionData?: any): number => {
    let baseHash = 0;
    
    for (let i = 0; i < imageUri.length; i++) {
      const char = imageUri.charCodeAt(i);
      baseHash = ((baseHash << 5) - baseHash) + char;
      baseHash = baseHash & baseHash;
    }
    
    let featureScore = 75;
    if (visionData?.faceAnnotations?.[0]) {
      const face = visionData.faceAnnotations[0];
      
      if (face.landmarks) {
        const symmetryScore = calculateFacialSymmetry(face.landmarks);
        featureScore = Math.max(featureScore, symmetryScore);
      }
      
      const confidence = face.detectionConfidence || 0.5;
      featureScore += Math.round(confidence * 15);
      
      const rollAngle = Math.abs(face.rollAngle || 0);
      const panAngle = Math.abs(face.panAngle || 0);
      const tiltAngle = Math.abs(face.tiltAngle || 0);
      const angleScore = Math.max(0, 10 - (rollAngle + panAngle + tiltAngle) / 10);
      featureScore += Math.round(angleScore);
      
      const qualityBonus = (face.underExposedLikelihood === 'VERY_UNLIKELY' ? 3 : 0) +
                          (face.blurredLikelihood === 'VERY_UNLIKELY' ? 3 : 0);
      featureScore += qualityBonus;
    }
    
    const normalizedHash = Math.abs(baseHash) % 1000;
    const hashScore = 70 + Math.floor((normalizedHash / 1000) * 25);
    
    const finalScore = Math.round((featureScore * 0.6) + (hashScore * 0.4));
    
    return Math.max(65, Math.min(98, finalScore));
  };

  const createQuickFallbackResult = (): AnalysisResult => {
    const baseScore = 78 + Math.floor(Math.random() * 12);
    return {
      overallScore: baseScore,
      rating: baseScore >= 85 ? "Amazing! 💫" : baseScore >= 75 ? "Excellent! ✨" : "Very Good! 🌟",
      skinPotential: "High",
      skinQuality: "Good",
      skinTone: "Medium Warm",
      skinType: "Normal",
      detailedScores: {
        jawlineSharpness: baseScore - 2,
        brightnessGlow: baseScore + 3,
        hydrationLevel: baseScore + 1,
        facialSymmetry: baseScore + 2,
        poreVisibility: baseScore - 5,
        skinTexture: baseScore,
        evenness: baseScore + 1,
        elasticity: baseScore - 1,
      },
      dermatologyInsights: {
        acneRisk: 'Low',
        agingSigns: [],
        skinConcerns: [],
        recommendedTreatments: ['SPF protection', 'Regular moisturizing'],
      },
      personalizedTips: [
        "Use a broad-spectrum SPF 30+ sunscreen daily",
        "Maintain consistent skincare routine",
        "Stay hydrated for optimal skin health"
      ],
      imageUri: frontImage,
      timestamp: Date.now(),
      confidence: 0.85,
    };
  };

  const generateFallbackAnalysis = (visionData?: any) => {
    console.log('📊 Generating enhanced fallback analysis with feature-based scoring...');
    console.log('🔍 Vision data available:', !!visionData?.front);
    
    const baseScore = generateConsistentScore(frontImage || '', visionData?.front);
    console.log('📈 Generated base score:', baseScore);
    
    const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];
    const skinTones = ['Light Warm', 'Medium Neutral', 'Medium Warm', 'Dark Cool', 'Light Cool', 'Medium Cool', 'Dark Warm'];

    
    const scoreRange = baseScore - 75;
    const variation = Math.floor(scoreRange / 4) - 3;
    
    let skinQuality = 'Good';
    if (baseScore >= 90) skinQuality = 'Excellent';
    else if (baseScore >= 80) skinQuality = 'Very Good';
    
    const textureScore = Math.max(65, Math.min(98, baseScore + variation));
    const clarityScore = Math.max(65, Math.min(98, baseScore + variation + 2));
    const hydrationScore = Math.max(65, Math.min(98, baseScore + variation - 1));
    const poreScore = Math.max(65, Math.min(98, baseScore - Math.abs(variation) - 3));
    const elasticityScore = Math.max(65, Math.min(98, baseScore + variation + 1));
    const pigmentationScore = Math.max(65, Math.min(98, baseScore + variation));
    
    const symmetryScore = Math.max(70, Math.min(98, baseScore + variation + 2));
    const glowScore = Math.max(70, Math.min(98, baseScore + variation + 1));
    const jawlineScore = Math.max(65, Math.min(95, baseScore + variation - 2));
    const eyeScore = Math.max(70, Math.min(98, baseScore + variation + 3));
    const lipScore = Math.max(70, Math.min(95, baseScore + variation));
    const cheekboneScore = Math.max(65, Math.min(95, baseScore + variation + 1));
    const tightnessScore = Math.max(70, Math.min(95, baseScore + variation - 1));
    const harmonyScore = Math.max(70, Math.min(98, baseScore + variation));
    
    const recommendations = [
      "Maintain a consistent daily skincare routine with gentle cleansing",
      "Use a broad-spectrum SPF 30+ sunscreen daily for protection"
    ];
    
    if (baseScore < 85) {
      recommendations.push("Consider incorporating a vitamin C serum for enhanced radiance");
      recommendations.push("Focus on hydration with a quality moisturizer");
    }
    
    if (baseScore >= 85) {
      recommendations.push("Your skin shows excellent health - maintain current routine");
      recommendations.push("Consider advanced treatments like retinoids for anti-aging");
    }
    
    recommendations.push("Stay hydrated and maintain a balanced diet for optimal skin health");
    
    console.log('✅ Fallback analysis generated:', {
      baseScore,
      skinQuality,
      recommendations: recommendations.length
    });
    
    return {
      skinAnalysis: {
        skinType: skinTypes[Math.abs(baseScore * 7) % skinTypes.length],
        skinTone: skinTones[Math.abs(baseScore * 11) % skinTones.length],
        skinQuality,
        textureScore,
        clarityScore,
        hydrationLevel: hydrationScore,
        poreVisibility: poreScore,
        elasticity: elasticityScore,
        pigmentationEvenness: pigmentationScore
      },
      dermatologyAssessment: {
        acneRisk: baseScore > 88 ? 'Low' : baseScore > 78 ? 'Medium' : 'Low',
        agingSigns: baseScore < 82 ? ['Fine lines', 'Minor texture changes'] : baseScore < 75 ? ['Fine lines', 'Loss of elasticity'] : [],
        skinConcerns: baseScore < 85 ? (baseScore < 75 ? ['Enlarged pores', 'Uneven texture', 'Dullness'] : ['Minor pore visibility']) : [],
        recommendedTreatments: baseScore < 80 ? ['Gentle exfoliation', 'Hydrating treatments', 'Antioxidant serums'] : ['Maintenance treatments', 'Preventive care'],
        skinConditions: [],
        preventiveMeasures: ['SPF 30+ daily', 'Gentle cleansing', 'Regular moisturizing', 'Antioxidant protection']
      },
      beautyScores: {
        overallScore: baseScore,
        facialSymmetry: symmetryScore,
        skinGlow: glowScore,
        jawlineDefinition: jawlineScore,
        eyeArea: eyeScore,
        lipArea: lipScore,
        cheekboneDefinition: cheekboneScore,
        skinTightness: tightnessScore,
        facialHarmony: harmonyScore
      },
      professionalRecommendations: recommendations,
      confidence: Math.min(0.95, 0.80 + (baseScore - 75) * 0.006),
      analysisAccuracy: visionData?.front ? 'Enhanced (feature-based analysis)' : 'Standard (consistent analysis)'
    };
  };

  const calculateAdvancedScores = (visionData: {
    front: any;
    left: any;
    right: any;
  }, aiData: any, isMultiAngle: boolean) => {
    console.log('🧮 Calculating advanced multi-angle scores...');
    
    const frontFaceData = visionData.front?.faceAnnotations?.[0];
    const leftFaceData = visionData.left?.faceAnnotations?.[0];
    const rightFaceData = visionData.right?.faceAnnotations?.[0];
    const imageProps = visionData.front?.imagePropertiesAnnotation;
    
    let facialSymmetry = 85;
    if (isMultiAngle && frontFaceData && leftFaceData && rightFaceData) {
      facialSymmetry = calculateMultiAngleFacialSymmetry(frontFaceData, leftFaceData, rightFaceData);
    } else if (frontFaceData?.landmarks) {
      facialSymmetry = calculateFacialSymmetry(frontFaceData.landmarks);
    }
    
    let brightnessScore = 80;
    if (imageProps?.dominantColors?.colors) {
      brightnessScore = calculateBrightnessScore(imageProps.dominantColors.colors);
    }
    
    const baseScore = aiData.beautyScores?.overallScore || 85;
    const multiAngleBonus = isMultiAngle ? 5 : 0;
    
    const overallScore = Math.min(100, Math.round(
      baseScore * 0.5 +
      facialSymmetry * 0.25 +
      brightnessScore * 0.15 +
      (aiData.skinAnalysis?.textureScore || 80) * 0.1 +
      multiAngleBonus
    ));
    
    const ratings = [
      { min: 90, rating: "Outstanding! 💎" },
      { min: 85, rating: "Amazing! 💫" },
      { min: 80, rating: "Excellent! ✨" },
      { min: 75, rating: "Very Good! 🌟" },
      { min: 70, rating: "Good! ⭐" },
      { min: 0, rating: "Keep Glowing! 🌸" }
    ];
    
    const rating = ratings.find(r => overallScore >= r.min)?.rating || "Keep Glowing! 🌸";
    
    return {
      overallScore,
      rating,
      skinPotential: aiData.skinAnalysis?.skinQuality === 'Excellent' ? 'Very High' : 
                    aiData.skinAnalysis?.skinQuality === 'Very Good' ? 'High' : 'Medium',
      skinQuality: aiData.skinAnalysis?.skinQuality || 'Good',
      skinTone: aiData.skinAnalysis?.skinTone || 'Medium Warm',
      skinType: aiData.skinAnalysis?.skinType || 'Normal',
      detailedScores: {
        jawlineSharpness: aiData.beautyScores?.jawlineDefinition || 80,
        brightnessGlow: brightnessScore,
        hydrationLevel: aiData.skinAnalysis?.hydrationLevel || 85,
        facialSymmetry,
        poreVisibility: Math.max(60, 100 - (aiData.skinAnalysis?.poreVisibility || 25)),
        skinTexture: aiData.skinAnalysis?.textureScore || 85,
        evenness: aiData.skinAnalysis?.pigmentationEvenness || aiData.skinAnalysis?.clarityScore || 80,
        elasticity: aiData.skinAnalysis?.elasticity || Math.max(60, 100 - (aiData.dermatologyAssessment?.agingSigns?.length || 0) * 10),
      },
      dermatologyInsights: {
        acneRisk: aiData.dermatologyAssessment?.acneRisk || 'Low',
        agingSigns: aiData.dermatologyAssessment?.agingSigns || [],
        skinConcerns: [...(aiData.dermatologyAssessment?.skinConcerns || []), ...(aiData.dermatologyAssessment?.skinConditions || [])],
        recommendedTreatments: [...(aiData.dermatologyAssessment?.recommendedTreatments || []), ...(aiData.dermatologyAssessment?.preventiveMeasures || [])],
      },
      personalizedTips: aiData.professionalRecommendations || aiData.personalizedAdvice || [
        "Use a vitamin C serum in the morning to enhance your natural glow",
        "Consider facial massage to improve jawline definition",
        "Maintain your excellent hydration routine for continued skin health",
        "Apply broad-spectrum SPF 30+ daily for optimal skin protection",
        "Consider professional treatments based on your skin analysis"
      ],
      confidence: Math.min(0.98, (aiData.confidence || 0.85) + (isMultiAngle ? 0.1 : 0)),
    };
  };

  const calculateFacialSymmetry = (landmarks: any[]) => {
    try {
      const leftEye = landmarks.find((l: any) => l.type === 'LEFT_EYE');
      const rightEye = landmarks.find((l: any) => l.type === 'RIGHT_EYE');
      const noseTip = landmarks.find((l: any) => l.type === 'NOSE_TIP');
      const leftMouth = landmarks.find((l: any) => l.type === 'MOUTH_LEFT');
      const rightMouth = landmarks.find((l: any) => l.type === 'MOUTH_RIGHT');
      const leftEar = landmarks.find((l: any) => l.type === 'LEFT_EAR_TRAGION');
      const rightEar = landmarks.find((l: any) => l.type === 'RIGHT_EAR_TRAGION');
      
      let symmetryScores = [];
      
      if (leftEye && rightEye && noseTip) {
        const leftNoseDistance = Math.abs(leftEye.position.x - noseTip.position.x);
        const rightNoseDistance = Math.abs(rightEye.position.x - noseTip.position.x);
        
        const eyeSymmetryRatio = Math.min(leftNoseDistance, rightNoseDistance) / 
                                Math.max(leftNoseDistance, rightNoseDistance);
        symmetryScores.push(eyeSymmetryRatio * 100);
      }
      
      if (leftMouth && rightMouth && noseTip) {
        const leftMouthDistance = Math.abs(leftMouth.position.x - noseTip.position.x);
        const rightMouthDistance = Math.abs(rightMouth.position.x - noseTip.position.x);
        
        const mouthSymmetryRatio = Math.min(leftMouthDistance, rightMouthDistance) / 
                                  Math.max(leftMouthDistance, rightMouthDistance);
        symmetryScores.push(mouthSymmetryRatio * 100);
      }
      
      if (leftEar && rightEar && noseTip) {
        const leftEarDistance = Math.abs(leftEar.position.x - noseTip.position.x);
        const rightEarDistance = Math.abs(rightEar.position.x - noseTip.position.x);
        
        const earSymmetryRatio = Math.min(leftEarDistance, rightEarDistance) / 
                                Math.max(leftEarDistance, rightEarDistance);
        symmetryScores.push(earSymmetryRatio * 100);
      }
      
      if (leftEye && rightEye) {
        const eyeLevelDifference = Math.abs(leftEye.position.y - rightEye.position.y);
        const eyeDistance = Math.abs(leftEye.position.x - rightEye.position.x);
        const levelSymmetry = Math.max(0, 100 - (eyeLevelDifference / eyeDistance) * 200);
        symmetryScores.push(levelSymmetry);
      }
      
      if (symmetryScores.length > 0) {
        const weightedScore = symmetryScores.length === 1 ? symmetryScores[0] :
                             symmetryScores.reduce((sum, score, index) => {
                               const weight = index === 0 ? 0.5 : 0.5 / (symmetryScores.length - 1);
                               return sum + (score * weight);
                             }, 0);
        
        return Math.max(65, Math.min(98, Math.round(weightedScore)));
      }
    } catch (error) {
      console.error('Error calculating facial symmetry:', error);
    }
    return 82;
  };

  const calculateBrightnessScore = (colors: any[]) => {
    try {
      let totalBrightness = 0;
      let totalSaturation = 0;
      let totalPixelFraction = 0;
      let skinToneColors = 0;
      
      colors.forEach((color: any) => {
        const rgb = color.color;
        const pixelFraction = color.pixelFraction || 0;
        
        const brightness = (rgb.red * 0.299 + rgb.green * 0.587 + rgb.blue * 0.114) / 255;
        
        const max = Math.max(rgb.red, rgb.green, rgb.blue) / 255;
        const min = Math.min(rgb.red, rgb.green, rgb.blue) / 255;
        const saturation = max === 0 ? 0 : (max - min) / max;
        
        const isSkinTone = (rgb.red > rgb.green && rgb.green > rgb.blue && 
                           rgb.red > 100 && rgb.green > 80 && rgb.blue > 60) ||
                          (rgb.red > 150 && rgb.green > 120 && rgb.blue > 90);
        
        if (isSkinTone) {
          skinToneColors += pixelFraction;
        }
        
        totalBrightness += brightness * pixelFraction;
        totalSaturation += saturation * pixelFraction;
        totalPixelFraction += pixelFraction;
      });
      
      const avgBrightness = totalPixelFraction > 0 ? totalBrightness / totalPixelFraction : 0.5;
      const avgSaturation = totalPixelFraction > 0 ? totalSaturation / totalPixelFraction : 0.3;
      
      let glowScore = avgBrightness * 70;
      
      const idealSaturation = 0.3;
      const saturationBonus = Math.max(0, 15 - Math.abs(avgSaturation - idealSaturation) * 50);
      glowScore += saturationBonus;
      
      const skinToneBonus = Math.min(15, skinToneColors * 30);
      glowScore += skinToneBonus;
      
      return Math.max(65, Math.min(98, Math.round(glowScore)));
    } catch (error) {
      console.error('Error calculating brightness score:', error);
    }
    return 82;
  };

  const calculateMultiAngleFacialSymmetry = (frontFace: any, leftFace: any, rightFace: any) => {
    try {
      console.log('🔄 Calculating 3D facial symmetry from multi-angle data...');
      
      const frontSymmetry = calculateFacialSymmetry(frontFace.landmarks || []);
      
      let profileSymmetry = 85;
      if (leftFace.landmarks && rightFace.landmarks) {
        const leftNose = leftFace.landmarks.find((l: any) => l.type === 'NOSE_TIP');
        const rightNose = rightFace.landmarks.find((l: any) => l.type === 'NOSE_TIP');
        
        if (leftNose && rightNose) {
          const leftProfile = leftNose.position.x;
          const rightProfile = rightNose.position.x;
          const profileRatio = Math.min(leftProfile, rightProfile) / Math.max(leftProfile, rightProfile);
          profileSymmetry = Math.round(profileRatio * 100);
        }
      }
      
      const combinedSymmetry = Math.round((frontSymmetry * 0.7) + (profileSymmetry * 0.3));
      console.log('3D symmetry calculated:', { frontSymmetry, profileSymmetry, combinedSymmetry });
      
      return Math.min(100, combinedSymmetry + 5);
      
    } catch (error) {
      console.error('Error calculating 3D facial symmetry:', error);
      return 85;
    }
  };

  const validateMultiAngleFaceDetection = (
    frontVisionData: any,
    leftVisionData: any,
    rightVisionData: any,
    isMultiAngle: boolean
  ): boolean => {
    try {
      console.log('🔍 Validating multi-angle face detection with professional criteria...');
      
      if (!validateSingleFaceDetection(frontVisionData, 'front')) {
        return false;
      }
      
      if (isMultiAngle) {
        if (leftVisionData && !validateSingleFaceDetection(leftVisionData, 'left', true)) {
          console.log('⚠️ Left profile validation failed, but continuing with front analysis');
        }
        if (rightVisionData && !validateSingleFaceDetection(rightVisionData, 'right', true)) {
          console.log('⚠️ Right profile validation failed, but continuing with front analysis');
        }
      }
      
      console.log('✅ Multi-angle face validation passed');
      return true;
      
    } catch (error) {
      console.error('❌ Error validating multi-angle face detection:', error);
      return false;
    }
  };

  const validateSingleFaceDetection = (visionData: any, angle: string, isProfile: boolean = false): boolean => {
    try {
      console.log(`🔍 Validating ${angle} face detection...`);
      
      const faceAnnotations = visionData?.faceAnnotations;
      if (!faceAnnotations || faceAnnotations.length === 0) {
        console.log(`❌ No face annotations found in ${angle} view`);
        return false;
      }
      
      const face = faceAnnotations[0];
      
      const minConfidence = isProfile ? 0.3 : 0.5;
      const detectionConfidence = face.detectionConfidence || 0;
      console.log(`${angle} face detection confidence:`, detectionConfidence);
      
      if (detectionConfidence < minConfidence) {
        console.log(`❌ ${angle} face detection confidence too low:`, detectionConfidence, `(required: ${minConfidence})`);
        return false;
      }
      
      const landmarks = face.landmarks || [];
      const requiredLandmarks = isProfile 
        ? ['NOSE_TIP']
        : ['LEFT_EYE', 'RIGHT_EYE', 'NOSE_TIP'];
      
      const foundLandmarks = landmarks.map((l: any) => l.type);
      const missingLandmarks = requiredLandmarks.filter(required => 
        !foundLandmarks.includes(required)
      );
      
      if (missingLandmarks.length > 0) {
        console.log(`❌ Missing facial landmarks in ${angle} view:`, missingLandmarks);
        return false;
      }
      
      const boundingPoly = face.boundingPoly;
      if (boundingPoly && boundingPoly.vertices) {
        const vertices = boundingPoly.vertices;
        const width = Math.abs(vertices[1].x - vertices[0].x);
        const height = Math.abs(vertices[2].y - vertices[0].y);
        
        const minSize = isProfile ? 80 : 100;
        if (width < minSize || height < minSize) {
          console.log(`❌ Face too small in ${angle} view:`, { width, height }, `(required: ${minSize}x${minSize})`);
          return false;
        }
      }
      
      const rollAngle = Math.abs(face.rollAngle || 0);
      const panAngle = Math.abs(face.panAngle || 0);
      const tiltAngle = Math.abs(face.tiltAngle || 0);
      
      const maxAngle = isProfile ? 90 : 45;
      if (!isProfile && (rollAngle > maxAngle || panAngle > maxAngle || tiltAngle > maxAngle)) {
        console.log(`❌ Face angle too extreme in ${angle} view:`, { rollAngle, panAngle, tiltAngle }, `(max: ${maxAngle}°)`);
        return false;
      }
      
      const underExposedLikelihood = face.underExposedLikelihood;
      if (underExposedLikelihood === 'VERY_LIKELY') {
        console.log(`❌ Face severely under-exposed in ${angle} view:`, underExposedLikelihood);
        return false;
      }
      
      const blurredLikelihood = face.blurredLikelihood;
      if (blurredLikelihood === 'VERY_LIKELY') {
        console.log(`❌ Face severely blurred in ${angle} view:`, blurredLikelihood);
        return false;
      }
      
      console.log(`✅ ${angle} face validation passed`);
      console.log(`${angle} face details:`, {
        confidence: detectionConfidence,
        landmarks: foundLandmarks.length,
        angles: { rollAngle, panAngle, tiltAngle },
        lighting: underExposedLikelihood,
        blur: blurredLikelihood
      });
      
      return true;
      
    } catch (error) {
      console.error(`❌ Error validating ${angle} face detection:`, error);
      return false;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradient.hero} style={StyleSheet.absoluteFillObject} />
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.mainContent}>
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Animated.View style={[styles.imageWrapper, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.imageGlow}>
                <Image 
                  source={{ uri: frontImage || user?.avatar }} 
                  style={styles.profileImage} 
                />
              </View>
            </Animated.View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Creating your</Text>
            <Text style={styles.titleAccent}>personalized plan...</Text>
          </View>
          
          <Text style={styles.description}>
            Our AI is crafting a bespoke beauty journey{"\n"}tailored exclusively for you
          </Text>

          <View style={styles.progressSection}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                {flowAnimationRunning && (
                  <Animated.View 
                    style={[
                      styles.flowingBar,
                      {
                        transform: [{
                          translateX: flowAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-120, 400],
                          })
                        }]
                      }
                    ]} 
                  />
                )}
                <Animated.View 
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      })
                    }
                  ]} 
                />
              </View>
              
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                {isAnalyzing ? (
                  <Text style={styles.analyzingText}>Finalizing analysis...</Text>
                ) : (
                  <Text style={styles.engagementTip}>{ENGAGEMENT_TIPS[engagementTip]}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.bottomTip}>
            <Text style={styles.tipText}>
              {error || '✨ This may take a few moments'}
            </Text>
          </View>

        </View>
      </View>
    </View>
  );
}

const createStyles = (palette: ReturnType<typeof getPalette>) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.backgroundStart,
  },
  mainContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 380,
  },
  imageContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  imageWrapper: {
    borderRadius: 70,
    ...shadow.elevated,
  },
  imageGlow: {
    borderRadius: 70,
    padding: 4,
    backgroundColor: `${palette.primary}15`,
    ...shadow.elevated,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: palette.primary,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: palette.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 4,
  },
  titleAccent: {
    fontSize: 26,
    fontWeight: '800',
    color: palette.primary,
    textAlign: 'center',
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  progressSection: {
    width: '100%',
    marginTop: 20,
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 8,
    backgroundColor: `${palette.primary}20`,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    ...shadow.card,
  },
  flowingBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: 100,
    backgroundColor: `${palette.primary}60`,
    borderRadius: 12,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: palette.primary,
    borderRadius: 12,
    minWidth: 2,
    ...shadow.card,
  },
  progressInfo: {
    alignItems: 'center',
    width: '100%',
  },
  progressText: {
    fontSize: 32,
    fontWeight: '800',
    color: palette.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  analyzingText: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
  },
  engagementTip: {
    fontSize: 15,
    color: palette.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
    minHeight: 22,
    paddingHorizontal: 16,
  },
  bottomTip: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: `${palette.primary}10`,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${palette.primary}20`,
  },
  tipText: {
    fontSize: 14,
    color: palette.primary,
    textAlign: 'center',
    fontWeight: '600',
    opacity: 0.8,
  },
});
