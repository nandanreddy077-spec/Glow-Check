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

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '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';
const TOOLKIT_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://toolkit.rork.com';
const DEFAULT_TIMEOUT = 60000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
    return result;
  } catch (error) {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
    throw error;
  }
}

function compressBase64Image(base64: string, maxLength: number = 500000): string {
  if (base64.length <= maxLength) {
    return base64;
  }
  
  console.log(`📊 Compressing base64 from ${base64.length} chars`);
  const compressionRatio = maxLength / base64.length;
  const step = Math.ceil(1 / compressionRatio);
  
  let compressed = '';
  for (let i = 0; i < base64.length; i += step) {
    compressed += base64[i];
  }
  
  console.log(`✅ Compressed to ${compressed.length} chars`);
  return compressed;
}

async function generateObjectWithOpenAI<T extends z.ZodType>(
  params: GenerateObjectParams<T>
): Promise<z.infer<T>> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🔄 Using OpenAI fallback...');
  


  const openaiMessages: any[] = [];
  
  for (const message of params.messages) {
    if (typeof message.content === 'string') {
      openaiMessages.push({
        role: message.role,
        content: message.content
      });
    } else {
      const content: any[] = [];
      for (const part of message.content) {
        if (part.type === 'text') {
          content.push({ type: 'text', text: part.text });
        } else if (part.type === 'image') {
          const compressedImage = compressBase64Image(part.image, 400000);
          content.push({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${compressedImage}`
            }
          });
        }
      }
      openaiMessages.push({
        role: message.role,
        content
      });
    }
  }

  openaiMessages.push({
    role: 'user',
    content: '\n\nRespond with ONLY a valid JSON object matching the schema. No markdown, no explanations.'
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const responseText = await response.text();
  console.log('📦 OpenAI raw response (first 100 chars):', responseText.substring(0, 100));
  
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.error('❌ Failed to parse OpenAI response as JSON');
    console.error('Response text:', responseText.substring(0, 500));
    throw new Error('Invalid JSON response from OpenAI API');
  }
  
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : content;
  
  try {
    const parsed = JSON.parse(jsonStr);
    return params.schema.parse(parsed);
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error);
    throw error;
  }
}

export async function generateObject<T extends z.ZodType>(
  params: GenerateObjectParams<T>
): Promise<z.infer<T>> {
  const timeout = params.timeout || DEFAULT_TIMEOUT;
  
  console.log('🐛 DEBUG: AI config check:', {
    hasToolkitUrl: !!TOOLKIT_URL,
    hasOpenAI: !!OPENAI_API_KEY,
    openAIKeyLength: OPENAI_API_KEY?.length || 0,
    toolkitUrl: TOOLKIT_URL,
    timeout
  });
  
  console.log('✅ Using OpenAI directly - bypassing Rork Toolkit for stability');
  
  // Always use OpenAI directly for better reliability
  if (OPENAI_API_KEY) {
    try {
      console.log('🤖 Using OpenAI directly (reliable path)...');
      const result = await withTimeout(
        generateObjectWithOpenAI(params),
        timeout,
        'OpenAI request timed out'
      );
      console.log('✅ OpenAI success');
      console.log('🐛 Result sample:', JSON.stringify(result).substring(0, 200));
      return result;
    } catch (error) {
      console.error('❌ OpenAI failed:', error);
      throw error;
    }
  }
  
  console.error('❌ No AI service configured!');
  throw new Error('No AI service configured (OpenAI key not found)');
}

export async function generateText(params: GenerateTextParams | string): Promise<string> {
  const messages: (UserMessage | AssistantMessage)[] = typeof params === 'string' 
    ? [{ role: 'user', content: params }]
    : params.messages;
  
  const timeout = typeof params === 'object' ? (params.timeout || DEFAULT_TIMEOUT) : DEFAULT_TIMEOUT;

  if (!OPENAI_API_KEY) {
    throw new Error('No AI service configured (OpenAI key not found)');
  }

  try {
    console.log('🤖 Using OpenAI text directly...');
    const openaiMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : 
        msg.content.filter(p => p.type === 'text').map(p => (p as TextPart).text).join('\n')
    }));

    const response = await withTimeout(
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 1000
        })
      }),
      timeout,
      'OpenAI text request timed out'
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI text API error:', response.status, errorText.substring(0, 200));
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('❌ Failed to parse OpenAI text response as JSON');
      console.error('Response text:', responseText.substring(0, 500));
      throw new Error('Invalid JSON response from OpenAI API');
    }
    const result = data.choices[0]?.message?.content || '';
    console.log('✅ OpenAI text success');
    return result;
  } catch (error) {
    console.error('❌ OpenAI text failed:', error);
    throw error;
  }
}

export function isAIConfigured(): boolean {
  return Boolean(TOOLKIT_URL || OPENAI_API_KEY);
}
