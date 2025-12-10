
import { createClient } from '@supabase/supabase-js';

// NOTE: In a real Vite project, use import.meta.env.VITE_SUPABASE_URL
// For this environment, we assume these are set or you must replace them with your actual keys
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
