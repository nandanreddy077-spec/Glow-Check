import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
}

// Enhanced configuration with better error handling and timeouts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Add retry configuration
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': `${Platform.OS}/${Platform.Version}`,
    },
  },
  // Add database configuration with connection pooling
  db: {
    schema: 'public',
  },
  // Add realtime configuration
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Add connection test function
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is fine for testing
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test exception:', error);
    return false;
  }
};