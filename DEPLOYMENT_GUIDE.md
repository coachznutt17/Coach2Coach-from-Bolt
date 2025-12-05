# Coach2Coach Deployment Guide

## Overview

Your application is now configured to connect your Vercel frontend to your Render backend with Supabase as the database.

**Production URLs:**
- Frontend: https://c2c-site.vercel.app
- Backend: https://c2c-site.onrender.com
- Database: Supabase

## What Was Changed

### 1. Centralized API Configuration
- Created `src/lib/apiConfig.ts` to manage API base URL
- Uses `VITE_API_URL` environment variable
- Falls back to empty string for local development (uses Vite proxy)

### 2. Backend CORS Update
- Updated `server/index.ts` to accept requests from:
  - https://c2c-site.vercel.app
  - *.vercel.app (for preview deployments)
  - localhost (for development)

### 3. Updated All API Calls
- Modified 15+ files to use `getApiUrl()` function
- All fetch calls now use: `fetch(getApiUrl('/api/endpoint'))`
- Works in both development and production

### 4. Created Deployment Configuration
- Added `vercel.json` with build settings and environment variables
- Updated `.env.example` with production URL examples

## Deployment Steps

### Step 1: Configure Vercel Environment Variables

Go to your Vercel project dashboard and add these environment variables:

**Required Variables:**
```
VITE_API_URL=https://c2c-site.onrender.com
VITE_SUPABASE_URL=https://dltscjplwbvtlgguwsbb.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
VITE_SITE_URL=https://c2c-site.vercel.app
VITE_APP_URL=https://c2c-site.vercel.app
VITE_ENABLE_PAID=true
```

**Important Notes:**
- All frontend environment variables MUST start with `VITE_`
- Set these for both "Production" and "Preview" environments
- DO NOT include `SUPABASE_SERVICE_ROLE_KEY` on frontend (security risk)

### Step 2: Configure Render Environment Variables

Go to your Render dashboard and add these environment variables:

**Required Variables:**
```
SITE_URL=https://c2c-site.vercel.app
PORT=8787
NODE_ENV=production

# Supabase
SUPABASE_URL=https://xkjidqfsenjrcabsagoi.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Stripe
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
MEMBERSHIP_PRICE_ID=<your-membership-price-id>
PLATFORM_FEE_PERCENT=15

# Admin
ADMIN_API_KEY=<your-admin-api-key>
```

**Important Notes:**
- Backend environment variables should NOT have `VITE_` prefix
- Include `SUPABASE_SERVICE_ROLE_KEY` here (it's safe on backend)
- Ensure `SITE_URL` matches your Vercel domain for CORS

### Step 3: Configure Supabase

In your Supabase dashboard:

1. Go to **Authentication → URL Configuration**
2. Add these URLs to **Redirect URLs**:
   - https://c2c-site.vercel.app
   - https://c2c-site.vercel.app/**
   - https://*.vercel.app/** (for preview deployments)

3. Set **Site URL** to: https://c2c-site.vercel.app

### Step 4: Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Configure frontend-backend connection for production"
   git push origin main
   ```

2. Vercel will automatically deploy from your GitHub repository

3. Check deployment logs for any errors

### Step 5: Deploy to Render

1. Render should auto-deploy from GitHub
2. Check Render logs to ensure server starts successfully
3. Verify CORS settings by checking logs for incoming requests

### Step 6: Test the Connection

1. Visit https://c2c-site.vercel.app
2. Open browser DevTools (F12) → Network tab
3. Try to sign up or browse resources
4. Check that API calls go to https://c2c-site.onrender.com
5. Verify no CORS errors in Console tab

**Expected Behavior:**
- Frontend loads from Vercel
- API calls go to Render backend
- Database queries use Supabase
- No CORS errors
- Authentication works across domains

## Troubleshooting

### CORS Errors

**Symptom:** Browser console shows "CORS policy blocked" errors

**Solutions:**
1. Check Render logs - are requests arriving?
2. Verify `SITE_URL` on Render matches Vercel URL exactly
3. Check backend CORS configuration includes your Vercel domain
4. Try clearing browser cache and hard refresh (Ctrl+Shift+R)

### API Calls Not Reaching Backend

**Symptom:** API calls fail with network errors

**Solutions:**
1. Verify `VITE_API_URL` is set correctly on Vercel
2. Check Render service is running (visit https://c2c-site.onrender.com/health)
3. Verify Render build completed successfully
4. Check Render logs for errors

### Authentication Issues

**Symptom:** Users can't sign up or login

**Solutions:**
1. Verify Supabase redirect URLs include your Vercel domain
2. Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on Vercel
3. Verify backend has correct Supabase credentials
4. Check Supabase logs for authentication attempts

### Environment Variables Not Working

**Symptom:** App behaves like environment variables are missing

**Solutions:**
1. Rebuild/redeploy after changing environment variables
2. Verify variable names match exactly (case-sensitive)
3. Check variables are set for correct environment (production vs preview)
4. For Vercel, ensure all frontend vars start with `VITE_`

## Local Development

For local development, use your `.env` file:

```env
VITE_API_URL=http://localhost:8787
VITE_SUPABASE_URL=https://dltscjplwbvtlgguwsbb.supabase.co
VITE_SUPABASE_ANON_KEY=<your-key>
# ... other variables
```

Run both servers:
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server:dev
```

The Vite proxy will forward `/api/*` requests to `http://localhost:8787`.

## Verification Checklist

Before going live, verify:

- [ ] Vercel environment variables are set
- [ ] Render environment variables are set
- [ ] Supabase redirect URLs include Vercel domain
- [ ] CORS allows Vercel domain
- [ ] Health check works: https://c2c-site.onrender.com/health
- [ ] Frontend loads: https://c2c-site.vercel.app
- [ ] User can sign up/login
- [ ] Resources load from database
- [ ] API calls show in Render logs
- [ ] No CORS errors in browser console
- [ ] Stripe checkout works (if configured)

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Render logs for backend errors
3. Check Vercel deployment logs
4. Verify all environment variables are set correctly
5. Test each component separately (frontend, backend, database)

The application is now configured for production deployment across Vercel, Render, and Supabase.
