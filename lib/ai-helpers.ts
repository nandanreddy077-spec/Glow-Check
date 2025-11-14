import { generateObject as rorkGenerateObject, generateText as rorkGenerateText } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

type ImagePart = { type: 'image'; image: string };
type TextPart = { type: 'text'; text: string };
type UserMessage = { role: 'user'; content: string | (TextPart | ImagePart)[] };
type AssistantMessage = { role: 'assistant'; content: string | TextPart[] };

interface GenerateObjectParams {
  messages: (UserMessage | AssistantMessage)[];
  schema?: any;
  timeout?: number;
}

interface GenerateTextParams {
  messages: (UserMessage | AssistantMessage)[];
  timeout?: number;
}

export async function generateObject<T = any>(
  params: GenerateObjectParams
): Promise<T> {
  console.log('🚀 Starting AI generation with Rork Toolkit SDK');
  console.log('📸 Image data length:', params.messages.map(m => {
    if (typeof m.content !== 'string') {
      const imageParts = m.content.filter(p => p.type === 'image');
      return imageParts.map(p => (p as ImagePart).image?.length || 0);
    }
    return 0;
  }));
  
  try {
    const result = await rorkGenerateObject({
      messages: params.messages,
      schema: params.schema || z.any(),
    });
    
    console.log('✅ AI generation complete');
    console.log('📦 Result type:', typeof result);
    
    if (result && typeof result === 'object') {
      console.log('📦 Result keys:', Object.keys(result).join(', '));
    }
    
    return result as T;
  } catch (error) {
    console.error('❌ AI generation failed:', error);
    throw error;
  }
}

export async function generateText(params: GenerateTextParams | string): Promise<string> {
  console.log('🚀 Starting text generation with Rork Toolkit SDK');
  
  const messages: (UserMessage | AssistantMessage)[] = typeof params === 'string' 
    ? [{ role: 'user', content: params }]
    : params.messages;
  
  try {
    const result = await rorkGenerateText({ messages });
    console.log('✅ Text generation succeeded');
    return result;
  } catch (error) {
    console.error('❌ Text generation failed:', error);
    throw error;
  }
}

export function isAIConfigured(): boolean {
  return true;
}
