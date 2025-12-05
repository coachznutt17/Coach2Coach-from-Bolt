import { Router } from "express";
import { getSupabaseAdmin, getSupabaseUserClient, requireAuth, requireAdmin } from "../lib/supabase";

const router = Router();

// Fields a normal user is allowed to set on their own profile
const USER_FIELDS = new Set(["username", "display_name", "sport", "role", "bio", "avatar_url"]);

/**
 * GET /profiles/:id  (public read)
 */
router.get("/:id", async (req, res) => {
  const admin = getSupabaseAdmin();
  const { id } = req.params;

  const { data, error } = await admin.from("profiles").select("*").eq("id", id).single();
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});

/**
 * POST /profiles/self  (create/update own profile)
 * Requires: Authorization: Bearer <user access token>
 */
router.post("/self", requireAuth as any, async (req: any, res: any) => {
  const user = req.user;
  const authHeader = req.headers.authorization as string;
  const supa = getSupabaseUserClient(authHeader);

  const payload: Record<string, any> = { id: user.id };
  for (const [k, v] of Object.entries(req.body ?? {})) {
    if (USER_FIELDS.has(k)) payload[k] = v;
  }

  const { data, error } = await supa.from("profiles").upsert(payload, { onConflict: "id" }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json(data);
});

/**
 * POST /profiles/admin  (seed or edit any profile)
 * Requires: x-admin-key: <ADMIN_API_KEY>
 * Body must include: { id: "<auth.users uuid>", ... }
 */
router.post("/admin", requireAdmin as any, async (req, res) => {
  const admin = getSupabaseAdmin();
  const body = req.body || {};
  if (!body.id) return res.status(400).json({ error: "id (auth.users uuid) is required" });

  const { data, error } = await admin.from("profiles").upsert(body, { onConflict: "id" }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json(data);
});

export default router;
