import { Router } from "express";
import { getSupabaseAdmin } from "../lib/supabase";

const router = Router();

// ==============================================
// STABLE API CONTRACT
// ==============================================
// This file establishes guaranteed API endpoints that the frontend can rely on.
// It prevents 404 errors by ensuring these paths always exist.
// Replace stubs with real handlers or delegate to existing routes as needed.

// ==============================================
// 0) UPTIME PROBE
// ==============================================
router.get("/healthz", (_req, res) => {
  res.send("ok");
});

// ==============================================
// 1) AUTH CONTRACT ENDPOINTS
// ==============================================

// POST /api/auth/login
// Current: Stub response proving the pipeline works
// TODO: Delegate to existing auth.ts handler at server/routes/auth.ts
// Migration path: Import authRoutes and use router.use('/auth', authRoutes)
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        data: null,
        error: { message: "Missing email or password" }
      });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({
        data: null,
        error
      });
    }

    return res.status(200).json({ data, error: null });
  } catch (e: any) {
    return res.status(500).json({
      data: null,
      error: { message: e?.message || "Login failed" }
    });
  }
});

// POST /api/auth/signup
// Current: Stub response proving the pipeline works
// TODO: Delegate to existing auth.ts handler at server/routes/auth.ts
router.post("/auth/signup", async (req, res) => {
  try {
    const { email, password, options } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { message: "Missing email or password" }
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
      return res.status(400).json({
        data: null,
        error
      });
    }

    return res.status(200).json({
      data,
      error: null
    });
  } catch (e: any) {
    return res.status(500).json({
      data: null,
      error: { message: e?.message || "Signup failed" }
    });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", async (_req, res) => {
  try {
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({
      error: { message: e?.message || "Logout failed" }
    });
  }
});

// ==============================================
// 2) RESOURCES CONTRACT ENDPOINT
// ==============================================

// GET /api/resources
// Current: Returns empty array to prove data route connectivity
// TODO: Delegate to existing resources.ts handler at server/routes/resources.ts
// Migration path: Remove this stub and let the mounted resourceRoutes handle it
router.get("/resources", async (_req, res) => {
  try {
    // Stub: Return empty array to prove pipeline works
    // Real implementation should query Supabase resources table
    return res.status(200).json({
      ok: true,
      data: [],
      message: "Contract stub - replace with real handler"
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      error: e?.message || "Failed to fetch resources"
    });
  }
});

// ==============================================
// MIGRATION NOTES
// ==============================================
// Once you verify the contract endpoints work in production:
//
// 1. For auth routes:
//    - Option A: Keep these implementations (they already work!)
//    - Option B: Import and delegate to server/routes/auth.ts
//      Example: router.use('/auth', authRoutes)
//
// 2. For resources route:
//    - Remove the stub GET /resources endpoint above
//    - The existing router.use('/api/resources', resourceRoutes) in index.ts
//      will handle all /api/resources/* paths
//
// 3. For any new endpoints:
//    - Add them here first as stubs
//    - Verify they work in production
//    - Then wire up the real implementation
//
// This approach guarantees zero downtime and no 404 errors during development.

export default router;
