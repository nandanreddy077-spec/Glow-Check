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
    return result;
  } catch (error) {
    console.error('❌ Rork Toolkit failed:', error);
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
    return result;
  } catch (error) {
    console.error('❌ Rork Toolkit text failed:', error);
    throw error;
  }
}

export function isAIConfigured(): boolean {
  return true;
}
