import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dltscjplwbvtlgguwsbb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdHNjanBsd2J2dGxnZ3V3c2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjU0NzgsImV4cCI6MjA3NTAwMTQ3OH0.-d2tfOD7N5QgWhJOSpPsti4nF2vp2Nx_4IkZMVsfGKY";

console.log('Initializing Supabase with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export const db = {
  getCoachProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return { data, error };
  },

  createCoachProfile: async (profileData: any) => {
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('user_id', profileData.user_id)
      .maybeSingle();

    const profileUpdate = {
      user_id: profileData.user_id,
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      email: profileData.email,
      title: profileData.title || '',
      bio: profileData.bio || '',
      location: profileData.location || '',
      years_experience: profileData.years_experience,
      sports: profileData.sports || [],
      levels: profileData.levels || [],
      specialties: profileData.specialties || [],
      achievements: profileData.achievements || [],
      website: profileData.website,
      social_links: profileData.social_links || {},
      is_creator_enabled: true,
      updated_at: new Date().toISOString()
    };

    // If profile exists, update it; otherwise insert with id
    if (existingProfile) {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', profileData.user_id)
        .select()
        .maybeSingle();

      return { data, error };
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: profileData.user_id,
          ...profileUpdate
        })
        .select()
        .maybeSingle();

      return { data, error };
    }
  },

  updateCoachProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .maybeSingle();

    return { data, error };
  },

  getUserResources: async (profileId: string) => {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('owner_id', profileId)
      .order('created_at', { ascending: false });

    return { data, error };
  }
};

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
