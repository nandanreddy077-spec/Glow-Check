import { generateObject as rorkGenerateObject, generateText as rorkGenerateText } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

type ImagePart = { type: 'image'; image: string };
type TextPart = { type: 'text'; text: string };
type UserMessage = { role: 'user'; content: string | (TextPart | ImagePart)[] };
type AssistantMessage = { role: 'assistant'; content: string | TextPart[] };

interface GenerateObjectParams<T extends z.ZodType> {
  messages: (UserMessage | AssistantMessage)[];
  schema: T;
  timeout?: number;
}

interface GenerateTextParams {
  messages: (UserMessage | AssistantMessage)[];
  timeout?: number;
}

export async function generateObject<T extends z.ZodType>(
  params: GenerateObjectParams<T>
): Promise<z.infer<T>> {
  console.log('🚀 Using Rork Toolkit SDK for AI generation');
  
  try {
    const result = await rorkGenerateObject({
      messages: params.messages,
      schema: params.schema
    });
    
    console.log('✅ Rork Toolkit success');
    console.log('📦 Result type:', typeof result);
    
    // Validate the result is an object, not a string
    if (typeof result === 'string') {
      console.error('❌ Rork returned string instead of object:', result.substring(0, 100));
      throw new Error('Invalid response format: expected object, got string');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Rork Toolkit failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

export async function generateText(params: GenerateTextParams | string): Promise<string> {
  console.log('🚀 Using Rork Toolkit SDK for text generation');
  
  const messages: (UserMessage | AssistantMessage)[] = typeof params === 'string' 
    ? [{ role: 'user', content: params }]
    : params.messages;

  try {
    const result = await rorkGenerateText({
      messages
    });
    
    console.log('✅ Rork Toolkit text success');
    console.log('📦 Result length:', result?.length || 0);
    
    // Validate result is a string
    if (typeof result !== 'string') {
      console.error('❌ Rork returned non-string:', typeof result);
      throw new Error('Invalid response format: expected string');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Rork Toolkit text failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

export function isAIConfigured(): boolean {
  return true;
}
