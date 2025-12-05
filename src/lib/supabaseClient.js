import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dltscjplwbvtlgguwsbb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdHNjanBsd2J2dGxnZ3V3c2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjU0NzgsImV4cCI6MjA3NTAwMTQ3OH0.-d2tfOD7N5QgWhJOSpPsti4nF2vp2Nx_4IkZMVsfGKY";

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
