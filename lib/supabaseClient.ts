
import { createClient } from '@supabase/supabase-js';

// Credentials for Supabase project
const supabaseUrl = 'https://mivjlphkhrtlebymnkah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdmpscGhraHJ0bGVieW1ua2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MjU0MzMsImV4cCI6MjA4MTEwMTQzM30.ngfc8RA5Krxb2tMhPm7DJw2AtGMayUksoGDuSfbwNuo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
