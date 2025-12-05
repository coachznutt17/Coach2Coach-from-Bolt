import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';

// Use server env first; fall back to Vite env if needed
const url =
  process.env.SUPABASE_URL ||
  (globalThis as any)?.process?.env?.VITE_SUPABASE_URL;

const anonKey =
  process.env.SUPABASE_ANON_KEY ||
  (globalThis as any)?.process?.env?.VITE_SUPABASE_ANON_KEY;

// Optional admin (only if you later add SUPABASE_SERVICE_ROLE_KEY)
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  throw new Error('Missing Supabase environment variables (URL or anon key).');
}

export const supabase = createClient(url, anonKey);
export const supabaseAdmin = serviceRole ? createClient(url, serviceRole) : supabase;

// FIX: Admin client - SDK handles auth automatically with service role key
// Falls back to anon key when service role is not available
export function getSupabaseAdmin() {
  if (!serviceRole) {
    console.warn('⚠️  getSupabaseAdmin: Service role key not configured, using anon key');
    console.warn('   Operations will be limited by RLS policies');
    return createClient(url, anonKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Create an authenticated client using a user's JWT token
// This allows server operations to act on behalf of the authenticated user
export function getAuthenticatedSupabaseClient(authToken: string) {
  // Extract the JWT from "Bearer <token>" format
  const token = authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;

  return createClient(url, anonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
// Create a per-request user client (uses anon key + user's JWT if provided)
export function getSupabaseUserClient(authHeader?: string) {
  return createClient(url!, anonKey!, {
    global: {
      headers: {
        apikey: anonKey!,                              // <— ensure apikey is always sent
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}


// Require a valid Supabase user session (Express middleware)
export async function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers?.authorization;
  if (!auth) {
    console.log('🔒 requireAuth: missing Authorization header');
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const supa = getSupabaseUserClient(auth);
  const { data, error } = await supa.auth.getUser();

  console.log('🔎 requireAuth debug', {
    url,                                   // which Supabase project URL the server is using
    anonPrefix: (process.env.SUPABASE_ANON_KEY || '').slice(0, 16),
    hasAuthHeader: !!auth,
    authPrefix: auth.slice(0, 20),
    supabaseError: error?.message || null,
    supabaseStatus: (error as any)?.status || null,
    userId: data?.user?.id || null,
  });

  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = data.user;
  req.supabaseClient = getAuthenticatedSupabaseClient(auth);
  next();
}


// Simple admin guard via header (protects /profiles/admin, etc.)
export function requireAdmin(req: any, res: any, next: any) {
  if (req.headers["x-admin-key"] !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}
