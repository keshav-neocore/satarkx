import { createClient } from '@supabase/supabase-js';

// Accessing environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Only initialize if we have a valid configuration to prevent "supabaseUrl is required" crash
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn("SatarkX: Supabase credentials not found. App is running in Local Mock Mode.");
}
