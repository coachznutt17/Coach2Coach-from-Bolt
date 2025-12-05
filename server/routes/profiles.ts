// server/routes/profiles.ts
import { Router } from 'express';
import { getSupabaseAdmin, requireAuth } from '../lib/supabase';

const router = Router();

/**
 * POST /api/coach-profiles
 * Creates or updates a coach profile using the service role (bypasses RLS).
 * Body: {
 *   user_id: string, email: string,
 *   first_name?: string, last_name?: string, title?: string, bio?: string,
 *   location?: string, years_experience?: number,
 *   sports?: string[], levels?: string[], specialties?: string[],
 *   achievements?: string[], website?: string, social_links?: any
 * }
 */
// Allow preflight requests
// Allow preflight (CORS)
router.options('/', (_req, res) => res.sendStatus(200));

// Simple debug endpoint to confirm the router is mounted
router.get('/debug', (_req, res) => {
  res.json({ ok: true, route: '/api/coach-profiles' });
});

router.options('/', (_req, res) => res.sendStatus(200));

// Simple ping to prove the route is mounted
router.get('/debug', (_req, res) => {
  res.json({ ok: true, route: '/api/coach-profiles' });
});

// GET current user's profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Use authenticated client (RLS allows users to read all profiles)
    const { data, error } = await req.supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message, code: error.code });
    }

    return res.json({ profile: data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'server_error' });
  }
});

// UPDATE current user's profile
router.put('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    };

    // Map allowed fields
    const allowedFields = ['first_name', 'last_name', 'title', 'bio', 'location', 'years_experience', 'sports', 'levels', 'specialties', 'website', 'social_links', 'avatar_url'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Use authenticated client (RLS allows users to update their own profile)
    const { data, error } = await req.supabaseClient
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(400).json({ error: error.message, code: error.code });
    }

    return res.json({ profile: data });
  } catch (e: any) {
    console.error('profiles/me PUT error:', e);
    return res.status(500).json({ error: e?.message || 'server_error' });
  }
});

// GET profile by user_id (public read - uses anon key)
router.get('/check/:userId', async (req, res) => {
  try {
    // Use getSupabaseAdmin which falls back to anon key
    // RLS allows authenticated users to read all profiles
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.params.userId)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message, code: error.code });
    }

    return res.json({ profile: data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'server_error' });
  }
});

// Create or update profile (requires authentication)
// RLS ensures users can only create/update their own profile
router.post('/', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!body.email || !body.first_name || !body.last_name) {
      return res.status(400).json({ error: 'email, first_name, and last_name are required' });
    }

    // Only include fields that are provided to avoid schema cache issues
    const profileData: any = {
      user_id: userId, // Always use authenticated user's ID
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      is_creator_enabled: true,
      updated_at: new Date().toISOString()
    };

    // Add optional fields only if provided
    if (body.title) profileData.title = body.title;
    if (body.bio) profileData.bio = body.bio;
    if (body.location) profileData.location = body.location;
    if (body.years_experience) profileData.years_experience = body.years_experience;
    if (body.website) profileData.website = body.website;
    if (body.sports && body.sports.length > 0) profileData.sports = body.sports;
    if (body.levels && body.levels.length > 0) profileData.levels = body.levels;
    if (body.specialties && body.specialties.length > 0) profileData.specialties = body.specialties;
    if (body.social_links) profileData.social_links = body.social_links;

    // Use authenticated client (RLS allows users to insert/update their own profile)
    const { data, error } = await req.supabaseClient
      .from('profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Profile upsert error:', error);
      return res.status(400).json({ error: error.message, code: error.code });
    }

    return res.status(200).json({ success: true, profile: data });
  } catch (e: any) {
    console.error('profiles route error:', e);
    return res.status(500).json({ error: e?.message || 'server_error' });
  }
});

export default router;
