# Render 404 Fix - Deploy Instructions

## What Was Fixed

1. **Server Start Command**: Changed from `node server/index.js` to `npx tsx server/index.ts` to run TypeScript directly
2. **Production Dependencies**: Moved `tsx`, `express`, `cors`, and `dotenv` to `dependencies` (not devDependencies)
3. **Port Configuration**: Updated to properly read Render's injected `PORT` environment variable
4. **Route Priority**: Registered `/api/healthz` FIRST, before any other middleware
5. **Express 5 Compatibility**: Fixed wildcard route syntax issues

## Render Configuration

### Option 1: Use render.yaml (Recommended)

The `render.yaml` file is included in the repo. Render will automatically detect and use it.

**In Render Dashboard:**
1. Go to your service settings
2. Set these environment variables (marked as `sync: false` in render.yaml):
   - `SITE_URL` = `https://c2c-site.vercel.app`
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_ANON_KEY` = your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key
   - `STRIPE_SECRET_KEY` = your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` = your Stripe webhook secret
   - `STRIPE_PUBLISHABLE_KEY` = your Stripe publishable key
   - `MEMBERSHIP_PRICE_ID` = your Stripe membership price ID
   - `ADMIN_API_KEY` = generate a random secure string

### Option 2: Manual Configuration

If you prefer not to use render.yaml:

**Build Command:**
```
npm install
```

**Start Command:**
```
npm run server:start
```

**Environment Variables:**
Set all the variables listed above in Option 1.

## Verification Steps

1. **Check Deployment Logs**
   - Look for: `🚀 Coach2Coach API Server running on port <number>`
   - Should see NO errors about missing files or path-to-regexp

2. **Test Health Endpoint**
   ```bash
   curl https://c2c-site.onrender.com/api/healthz
   ```
   - Expected response: `ok`

3. **Test from Browser**
   - Visit: `https://c2c-site.onrender.com/health`
   - Expected: `{"ok":true,"service":"v1","time":"..."}`

4. **Check Render Logs for 404s**
   - If you see `❌ 404 MISS:` in logs, that helps identify which routes aren't registered

## Why This Fixes the 404

**Previous Issue:**
- Render was trying to run `node server/index.js`
- But `server/index.js` didn't exist (only TypeScript files)
- Build process only compiled frontend, not backend
- Server never started, so ALL routes returned 404

**Current Solution:**
- Use `tsx` to run TypeScript directly in production
- No compilation step needed for server
- Simpler, more reliable
- Explicit route registration order prevents middleware conflicts

## Troubleshooting

### Still Getting 404?

1. **Check Render logs** - Is the server starting?
   ```
   🚀 Coach2Coach API Server running on port...
   ```

2. **Verify environment variables** - Are they all set?

3. **Check PORT binding** - Render injects `PORT`, don't hardcode it

4. **Look for error logs** - Any startup errors?

### Server Not Starting?

1. Check Render logs for dependency errors
2. Verify `tsx` is in `dependencies` not `devDependencies`
3. Ensure all environment variables are set

### CORS Errors?

Verify `SITE_URL` on Render matches your Vercel domain exactly:
```
SITE_URL=https://c2c-site.vercel.app
```

## Next Steps

After verifying `/api/healthz` works:

1. Test authentication: Sign up/login from frontend
2. Test resource browsing
3. Monitor Render logs for any errors
4. Check database connections
5. Test Stripe checkout flow

## Support

If issues persist after following this guide:
1. Check Render logs first
2. Verify all environment variables
3. Test health endpoint
4. Look for `❌ 404 MISS:` patterns in logs
