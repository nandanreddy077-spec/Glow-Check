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

function sanitizeJsonString(text: string): string {
  console.log('🧹 Sanitizing JSON string...');
  
  let cleaned = text.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/g, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  
  // Remove leading/trailing text before first { or [
  const jsonStart = Math.min(
    cleaned.indexOf('{') >= 0 ? cleaned.indexOf('{') : Infinity,
    cleaned.indexOf('[') >= 0 ? cleaned.indexOf('[') : Infinity
  );
  
  if (jsonStart !== Infinity && jsonStart > 0) {
    console.log('✂️ Removing text before JSON start');
    cleaned = cleaned.substring(jsonStart);
  }
  
  // Remove trailing text after last } or ]
  const jsonEnd = Math.max(
    cleaned.lastIndexOf('}'),
    cleaned.lastIndexOf(']')
  );
  
  if (jsonEnd >= 0 && jsonEnd < cleaned.length - 1) {
    console.log('✂️ Removing text after JSON end');
    cleaned = cleaned.substring(0, jsonEnd + 1);
  }
  
  // Fix common JSON issues
  cleaned = cleaned.replace(/\n/g, ' '); // Remove newlines
  cleaned = cleaned.replace(/\r/g, ''); // Remove carriage returns
  cleaned = cleaned.replace(/\t/g, ' '); // Replace tabs with spaces
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
  
  console.log('✅ JSON sanitized');
  return cleaned;
}

function parseJsonWithFallback<T = any>(text: string, fallback: T): T {
  console.log('🔍 Parsing JSON with fallback...');
  
  try {
    const cleaned = sanitizeJsonString(text);
    const parsed = JSON.parse(cleaned);
    console.log('✅ JSON parsed successfully');
    return parsed;
  } catch (error) {
    console.warn('⚠️ JSON parse failed, using fallback');
    console.error('Parse error:', error instanceof Error ? error.message : String(error));
    console.error('Text sample:', text.substring(0, 200));
    return fallback;
  }
}

async function callToolkitAPI(messages: (UserMessage | AssistantMessage)[], timeout: number = 120000): Promise<any> {
  console.log('📡 Calling Toolkit API...');
  
  const toolkitUrl = process.env['EXPO_PUBLIC_TOOLKIT_URL'];
  if (!toolkitUrl) {
    throw new Error('EXPO_PUBLIC_TOOLKIT_URL not configured');
  }
  
  const url = `${toolkitUrl}/text/llm/`;
  console.log('🔗 URL:', url);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Toolkit API error: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log('📦 Toolkit response length:', text.length);
    console.log('📦 Response sample:', text.substring(0, 200));
    
    return text;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function callOpenAIFallback(messages: (UserMessage | AssistantMessage)[], timeout: number = 120000): Promise<any> {
  console.log('🔄 Falling back to OpenAI...');
  
  const openaiKey = process.env['EXPO_PUBLIC_OPENAI_API_KEY'] || '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';
  
  if (!openaiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Convert messages to OpenAI format
    const openaiMessages = messages.map(msg => {
      if (typeof msg.content === 'string') {
        return { role: msg.role, content: msg.content };
      }
      
      // Handle multimodal content
      const content = msg.content.map(part => {
        if (part.type === 'text') {
          return { type: 'text', text: part.text };
        }
        if (part.type === 'image') {
          return {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${part.image}`
            }
          };
        }
        return part;
      });
      
      return { role: msg.role, content };
    });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openaiMessages,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const completion = data.choices?.[0]?.message?.content;
    
    if (!completion) {
      throw new Error('No completion from OpenAI');
    }
    
    console.log('✅ OpenAI response length:', completion.length);
    return completion;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function generateObject<T = any>(
  params: GenerateObjectParams
): Promise<T> {
  console.log('🚀 Starting AI generation');
  console.log('📸 Image data length:', params.messages.map(m => {
    if (typeof m.content !== 'string') {
      const imageParts = m.content.filter(p => p.type === 'image');
      return imageParts.map(p => (p as ImagePart).image?.length || 0);
    }
    return 0;
  }));
  
  const timeoutMs = params.timeout || 120000;
  console.log(`⏱️ Setting timeout to ${timeoutMs}ms`);
  
  let responseText: string;
  
  try {
    // Try Toolkit first
    console.log('📤 Trying Toolkit API...');
    responseText = await callToolkitAPI(params.messages, timeoutMs);
    console.log('✅ Toolkit API succeeded');
    console.log('📦 Raw response sample:', responseText.substring(0, 300));
  } catch (toolkitError) {
    console.warn('⚠️ Toolkit API failed:', toolkitError);
    
    try {
      // Fall back to OpenAI
      console.log('📤 Falling back to OpenAI...');
      responseText = await callOpenAIFallback(params.messages, timeoutMs);
      console.log('✅ OpenAI fallback succeeded');
    } catch (openaiError) {
      console.error('❌ Both Toolkit and OpenAI failed');
      console.error('Toolkit error:', toolkitError);
      console.error('OpenAI error:', openaiError);
      throw new Error('AI generation failed');
    }
  }
  
  // Parse the response
  console.log('🔍 Parsing AI response...');
  
  // First try to parse as-is
  let result: any;
  try {
    const cleaned = sanitizeJsonString(responseText);
    const parsed = JSON.parse(cleaned);
    
    // Check if the response is wrapped in a completion field
    if (parsed && typeof parsed === 'object' && 'completion' in parsed && typeof parsed.completion === 'string') {
      console.log('🔄 Detected wrapped response, extracting completion field...');
      console.log('📦 Completion sample:', parsed.completion.substring(0, 300));
      
      // Parse the completion string
      const completionCleaned = sanitizeJsonString(parsed.completion);
      result = JSON.parse(completionCleaned);
      console.log('✅ Successfully parsed completion field');
    } else {
      result = parsed;
      console.log('✅ Response already in correct format');
    }
  } catch (error) {
    console.warn('⚠️ JSON parse failed, using fallback');
    console.error('Parse error:', error instanceof Error ? error.message : String(error));
    console.error('Text sample:', responseText.substring(0, 500));
    result = {} as T;
  }
  
  console.log('✅ AI generation complete');
  console.log('📦 Result type:', typeof result);
  
  if (result && typeof result === 'object') {
    console.log('📦 Result keys:', Object.keys(result).join(', '));
  }
  
  return result as T;
}

export async function generateText(params: GenerateTextParams | string): Promise<string> {
  console.log('🚀 Starting text generation');
  
  const messages: (UserMessage | AssistantMessage)[] = typeof params === 'string' 
    ? [{ role: 'user', content: params }]
    : params.messages;
  
  const timeoutMs = typeof params === 'object' ? params.timeout || 120000 : 120000;
  
  try {
    // Try Toolkit first
    const result = await callToolkitAPI(messages, timeoutMs);
    console.log('✅ Toolkit text generation succeeded');
    return result;
  } catch (toolkitError) {
    console.warn('⚠️ Toolkit failed, trying OpenAI...');
    
    try {
      const result = await callOpenAIFallback(messages, timeoutMs);
      console.log('✅ OpenAI text generation succeeded');
      return result;
    } catch (openaiError) {
      console.error('❌ Both APIs failed');
      throw new Error('Text generation failed');
    }
  }
}

export function isAIConfigured(): boolean {
  return true;
}
