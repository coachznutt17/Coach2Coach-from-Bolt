# Render Deployment Checklist

## Pre-Deployment Verification ✅

- [x] Server starts locally with `npm run server:start`
- [x] `/api/healthz` returns "ok"
- [x] `/health` returns JSON response
- [x] Frontend builds successfully with `npm run build`
- [x] All dependencies moved to correct categories
- [x] Port configuration reads from environment
- [x] Route registration order fixed
- [x] Express 5 compatibility issues resolved

## Render Dashboard Setup

### 1. Service Settings
- [ ] Service name: `c2c-api` (or your preference)
- [ ] Runtime: Node
- [ ] Branch: `main` (or your default branch)

### 2. Build & Deploy
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm run server:start`
- [ ] Auto-Deploy: Enabled (recommended)

### 3. Environment Variables

Copy these to Render Environment Variables section:

```
NODE_ENV=production
SITE_URL=https://c2c-site.vercel.app
PLATFORM_FEE_PERCENT=15
```

**Add your actual values for:**
```
SUPABASE_URL=https://xkjidqfsenjrcabsagoi.supabase.co
SUPABASE_ANON_KEY=<your-value>
SUPABASE_SERVICE_ROLE_KEY=<your-value>
STRIPE_SECRET_KEY=<your-value>
STRIPE_WEBHOOK_SECRET=<your-value>
STRIPE_PUBLISHABLE_KEY=<your-value>
MEMBERSHIP_PRICE_ID=<your-value>
ADMIN_API_KEY=<generate-random-string>
```

**Important:**
- Don't leave PORT blank - Render injects it automatically
- Use production Supabase credentials
- Use live Stripe keys (not test keys)
- Generate a strong random string for ADMIN_API_KEY

## Post-Deployment Verification

### 1. Check Render Logs
Look for this line:
```
🚀 Coach2Coach API Server running on port <number>
```

**If missing:**
- Check environment variables are set
- Verify start command is correct
- Look for error messages in logs

### 2. Test Health Endpoint

```bash
curl https://c2c-site.onrender.com/api/healthz
```

**Expected:** `ok`

**If 404:**
- Check logs for `❌ 404 MISS: GET /api/healthz`
- Verify server actually started
- Check for startup errors

### 3. Test JSON Health Endpoint

```bash
curl https://c2c-site.onrender.com/health
```

**Expected:** `{"ok":true,"service":"v1","time":"..."}`

### 4. Test from Frontend

Visit: `https://c2c-site.vercel.app`

**Test these features:**
- [ ] Sign up new account
- [ ] Login with existing account
- [ ] Browse resources
- [ ] View resource details
- [ ] (Optional) Test checkout flow

**Open DevTools:**
- [ ] No CORS errors in console
- [ ] API calls show in Network tab
- [ ] API calls go to `c2c-site.onrender.com`
- [ ] Responses have correct data

### 5. Verify Logs

Check Render logs for:
- [ ] No error messages
- [ ] Successful API requests
- [ ] Database queries working
- [ ] No repeated 404s (except expected ones)

## Troubleshooting

### Server Won't Start

**Check logs for:**
- Missing dependencies → Run `npm install` worked?
- Environment variable errors → Are all vars set?
- Port binding errors → Don't set PORT manually
- TypeScript errors → Check code syntax

**Fix:**
1. Verify all environment variables
2. Check `package.json` scripts
3. Ensure `tsx` is in dependencies
4. Look for specific error message

### Still Getting 404

**Possible causes:**
1. Server didn't start → Check logs
2. Route not registered → Check server/index.ts
3. Wrong URL → Verify Render service URL
4. Deployment failed → Check deploy logs

**Debug:**
1. Check for startup message in logs
2. Try `/health` endpoint instead
3. Look for `❌ 404 MISS:` in logs
4. Verify deployment completed

### CORS Errors

**Symptoms:**
- Frontend can't reach API
- "CORS policy blocked" in console

**Fix:**
1. Verify `SITE_URL` matches Vercel domain exactly
2. Check server CORS config in `server/index.ts`
3. Ensure frontend uses correct API URL
4. Check Vercel env var `VITE_API_URL`

### Authentication Failing

**Check:**
1. Supabase environment variables are correct
2. Supabase project is active
3. Supabase redirect URLs include Vercel domain
4. Database tables exist (run migrations if needed)

## Success Criteria

✅ **Ready for Production when:**
1. `/api/healthz` returns "ok"
2. `/health` returns JSON
3. No errors in Render logs
4. Frontend can sign up/login
5. Resources load from database
6. No CORS errors
7. Stripe checkout works (if configured)

## Rollback Plan

If deployment fails:
1. Render auto-keeps previous version running
2. Fix issues locally
3. Test with `npm run server:start`
4. Push fix to GitHub
5. Render auto-deploys new version

## Support Resources

- Render Logs: Check for startup errors
- Browser Console: Check for CORS/network errors
- Network Tab: Verify API calls reach server
- Supabase Dashboard: Check auth attempts
- This repo: See `RENDER_FIX.md` for detailed guide

## Notes

- First deployment may take 2-3 minutes
- Render free tier: Service spins down after 15min inactivity
- First request after spin-down takes ~30 seconds
- Upgrade to paid tier for always-on service
