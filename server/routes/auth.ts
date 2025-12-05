import { Router } from 'express';
import { getSupabaseAdmin } from '../lib/supabase';

const router = Router();

// =======================
// SIGNUP ROUTE
// =======================
router.post('/signup', async (req, res) => {
  try {
    console.log('Auth signup request received');

    const { email, password, options } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing email or password'
      });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: options?.data || {},
        emailRedirectTo: undefined
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return res.status(400).json({
        data: null,
        error
      });
    }

    console.log('User created successfully:', data.user?.id);

    return res.status(200).json({
      data,
      error: null
    });

  } catch (e: any) {
    console.error('Signup error:', e);
    return res.status(500).json({
      data: null,
      error: { message: e?.message || 'Signup failed' }
    });
  }
});

// =======================
// LOGIN ROUTE
// =======================
router.post('/login', async (req, res) => {
  try {
    console.log('Auth login request received');

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing email or password'
      });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase login error:', error);
      return res.status(400).json({
        data: null,
        error
      });
    }

    console.log('User logged in successfully:', data.user?.id);

    res.json({ data, error: null });

  } catch (e: any) {
    console.error('Login error:', e);
    res.status(500).json({
      data: null,
      error: { message: e?.message || 'Login failed' }
    });
  }
});

// =======================
// LOGOUT ROUTE
// =======================
router.post('/logout', async (req, res) => {
  try {
    res.json({ success: true });
  } catch (e: any) {
    console.error('Logout error:', e);
    res.status(500).json({
      error: e?.message || 'Logout failed'
    });
  }
});

export default router;
