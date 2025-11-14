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
  console.log('📸 Image data length:', params.messages.map(m => {
    if (typeof m.content !== 'string') {
      const imageParts = m.content.filter(p => p.type === 'image');
      return imageParts.map(p => (p as ImagePart).image?.length || 0);
    }
    return 0;
  }));
  
  try {
    const timeoutMs = params.timeout || 120000;
    console.log(`⏱️ Setting timeout to ${timeoutMs}ms`);
    
    console.log('📤 Sending request to Rork Toolkit...');
    console.log('📤 Schema provided:', !!params.schema);
    console.log('📤 Messages count:', params.messages.length);
    
    const resultPromise = rorkGenerateObject({
      messages: params.messages,
      schema: params.schema
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error(`⏰ AI request timeout after ${timeoutMs}ms`);
        reject(new Error(`AI request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    
    console.log('⏳ Waiting for AI response...');
    const result = await Promise.race([resultPromise, timeoutPromise]);
    
    console.log('✅ Rork Toolkit returned');
    console.log('📦 Result type:', typeof result);
    console.log('📦 Result constructor:', result?.constructor?.name || 'unknown');
    
    // Log more details about the result
    if (result === null || result === undefined) {
      console.error('❌ Received null/undefined result');
      throw new Error('AI returned null or undefined');
    }
    
    // Check if result is a string and try to parse
    if (typeof result === 'string') {
      console.warn('⚠️ Rork returned string instead of object');
      console.log('📝 String content (first 300 chars):', result.substring(0, 300));
      console.log('🔄 Attempting to parse string as JSON...');
      
      try {
        const cleaned = result.trim();
        
        // Check if it's JSON
        if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
          const parsed = JSON.parse(cleaned);
          console.log('✅ Successfully parsed JSON string');
          console.log('📦 Parsed type:', typeof parsed);
          if (parsed && typeof parsed === 'object') {
            console.log('📦 Parsed keys:', Object.keys(parsed).join(', '));
          }
          return parsed;
        } else {
          console.error('❌ String does not look like JSON');
          console.error('First 100 chars:', cleaned.substring(0, 100));
          console.error('Last 50 chars:', cleaned.substring(Math.max(0, cleaned.length - 50)));
          throw new Error('Response is not valid JSON: ' + cleaned.substring(0, 100));
        }
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError);
        if (parseError instanceof Error) {
          console.error('Parse error message:', parseError.message);
        }
        console.error('Raw response (first 500 chars):', result.substring(0, 500));
        throw new Error('Invalid response format: could not parse JSON - ' + (parseError instanceof Error ? parseError.message : 'unknown error'));
      }
    }
    
    // Check if result is actually an object
    if (typeof result !== 'object') {
      console.error('❌ Invalid result type:', typeof result);
      console.error('Result value:', String(result).substring(0, 200));
      throw new Error('Invalid response: expected object, got ' + typeof result);
    }
    
    // Validate it's a plain object (not an array, not null)
    if (Array.isArray(result)) {
      console.error('❌ Received array instead of object');
      console.error('Array length:', result.length);
      console.error('First element:', JSON.stringify(result[0]).substring(0, 200));
      throw new Error('Invalid response: received array instead of object');
    }
    
    console.log('✅ Valid object received');
    console.log('📦 Result keys:', Object.keys(result).join(', '));
    
    // Log key counts for debugging
    const keyCount = Object.keys(result).length;
    console.log('📊 Total keys:', keyCount);
    
    if (keyCount === 0) {
      console.warn('⚠️ Empty object received');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Rork Toolkit failed:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack?.substring(0, 500));
    } else {
      console.error('Non-Error object thrown:', String(error));
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
