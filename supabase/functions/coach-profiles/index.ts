import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    console.log('Request:', req.method, url.pathname);
    console.log('Path parts:', pathParts);

    // POST - Create profile (upsert to handle duplicates)
    if (req.method === 'POST') {
      const profileData = await req.json();
      console.log('Creating profile:', profileData);

      if (!profileData.user_id || !profileData.email || !profileData.first_name || !profileData.last_name) {
        return new Response(JSON.stringify({ data: null, error: 'user_id, email, first_name, and last_name are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: profileData.user_id,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          title: profileData.title || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          years_experience: profileData.years_experience || '',
          sports: profileData.sports || [],
          levels: profileData.levels || [],
          specialties: profileData.specialties || [],
          website: profileData.website || '',
          social_links: profileData.social_links || {},
          is_creator_enabled: true
        }, { onConflict: 'user_id' })
        .select()
        .single();

      console.log('Upsert result:', { data, error });

      if (error) {
        return new Response(JSON.stringify({ data: null, error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, profile: data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET - Get profile by user ID
    if (req.method === 'GET' && pathParts.length >= 2) {
      const userId = pathParts[pathParts.length - 1];
      console.log('Fetching profile for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Fetch result:', { data, error });

      if (error) {
        return new Response(JSON.stringify({ data: null, error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data, error: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PATCH - Update profile
    if (req.method === 'PATCH' && pathParts.length >= 2) {
      const userId = pathParts[pathParts.length - 1];
      const updates = await req.json();
      console.log('Updating profile for user:', userId, updates);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      console.log('Update result:', { data, error });

      if (error) {
        return new Response(JSON.stringify({ data: null, error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ data, error: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ data: null, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ data: null, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
