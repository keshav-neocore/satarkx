import { createClient } from '@supabase/supabase-js';

// Configuration for SatarkX Supabase Project
const supabaseUrl = 'https://vkfdmglnvzfxzrsjqrsk.supabase.co';
const supabaseAnonKey = 'sb_publishable_bS8aznzQYGA9VQ-40t3W9w_t3VWXF5j';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
