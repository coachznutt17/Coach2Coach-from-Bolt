import { createClient } from 'npm:@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (path.endsWith('/signup')) {
      const { email, password, options } = await req.json();
      const { data, error } = await supabase.auth.signUp({ email, password, options });
      
      return new Response(
        JSON.stringify({ data, error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: error ? 400 : 200 }
      );
    }

    if (path.endsWith('/login')) {
      const { email, password } = await req.json();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      return new Response(
        JSON.stringify({ data, error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: error ? 400 : 200 }
      );
    }

    if (path.endsWith('/logout')) {
      const { error } = await supabase.auth.signOut();
      
      return new Response(
        JSON.stringify({ error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: error ? 400 : 200 }
      );
    }

    if (path.endsWith('/session')) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ data: { session: null }, error: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabase.auth.getUser(token);
      
      return new Response(
        JSON.stringify({ data: { session: data.user ? { user: data.user, access_token: token } : null }, error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});