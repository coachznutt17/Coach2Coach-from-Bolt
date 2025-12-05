# CRITICAL: Fix Render Service Type

## ⚠️ YOUR RENDER SERVICE IS CONFIGURED WRONG

Your Render is set up as a **Static Site** instead of a **Web Service**.
This is why the React app loads but `/api/healthz` returns 404.

Static Sites can't run Node.js servers. You need a Web Service.

---

## Fix in 3 Steps

### Step 1: Go to Render Dashboard

https://dashboard.render.com

Find your `c2c-site` service.

**Check the service type at the top of the page.**

If it says **"Static Site"** → You found the problem!

### Step 2: Create a New Web Service

You can't change a Static Site to a Web Service. You must create a new one.

1. Click **"New +"** → **"Web Service"**
2. Select your GitHub repo
3. Fill in:
   - **Name:** `c2c-api`
   - **Region:** Oregon (or closest to you)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run server:start`
4. Click **"Create Web Service"**

### Step 3: Add Environment Variables

In the new Web Service, go to **Environment** tab and add:

```
NODE_ENV=production
SITE_URL=https://c2c-site.vercel.app
SUPABASE_URL=https://xkjidqfsenjrcabsagoi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhramlkcWZzZW5qcmNhYnNhZ29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTkwNDAsImV4cCI6MjA2OTg5NTA0MH0.-nYhzrPUuURnGK74jOCBHj7K7WHH7_WxX6NO8NrAtIA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhramlkcWZzZW5qcmNhYnNhZ29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMxOTA0MCwiZXhwIjoyMDY5ODk1MDQwfQ.7qLzkd-DZY8vN-NIEJrc2yKEMNbbhxKJPB1PCpzZA6o
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_51SKLLBFXWZpRxSAWT2RSJXr5VFXUw0aYx0EDkrvtA3PCHEB4QbDsGTv9ehAYjNAjtCrqC1XazSfHoA1XUnr5taon00FWkYwFlu
MEMBERSHIP_PRICE_ID=price_1SKLozFXWZpRxSAWFJKF7xwE
PLATFORM_FEE_PERCENT=15
ADMIN_API_KEY=my-super-secret-admin-key-938472
```

**DO NOT set PORT** - Render injects it automatically.

---

## Verify It Works

Wait 2-3 minutes for deployment, then:

```bash
curl https://YOUR-NEW-SERVICE-URL.onrender.com/api/healthz
```

**Expected:** `ok`

If you see `ok`, you're done! ✅

---

## What's the Difference?

| Static Site | Web Service |
|-------------|-------------|
| Only serves HTML/CSS/JS | Runs Node.js server |
| No backend code | Handles `/api/*` routes |
| Can't run `npm start` | Full server capabilities |
| ❌ Can't handle API routes | ✅ Handles everything |

---

## After This Works

Update Vercel to point to your new Render URL:

### 1. Vercel Environment Variables

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these variables for **Production** environment:

```
VITE_API_URL = https://c2c-site.onrender.com
VITE_SUPABASE_URL = https://dltscjplwbvtlgguwsbb.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdHNjanBsd2J2dGxnZ3V3c2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjU0NzgsImV4cCI6MjA3NTAwMTQ3OH0.-d2tfOD7N5QgWhJOSpPsti4nF2vp2Nx_4IkZMVsfGKY
VITE_STRIPE_PUBLISHABLE_KEY = pk_test_51SKLLBFXWZpRxSAWT2RSJXr5VFXUw0aYx0EDkrvtA3PCHEB4QbDsGTv9ehAYjNAjtCrqC1XazSfHoA1XUnr5taon00FWkYwFlu
VITE_SITE_URL = https://c2c-site.vercel.app
VITE_APP_URL = https://c2c-site.vercel.app
VITE_ENABLE_PAID = true
```

✅ Also add these to **Preview** environment

## 2. Render Environment Variables

Go to: https://render.com/dashboard → Your Service → Environment

Add these variables:

```
SITE_URL = https://c2c-site.vercel.app
PORT = 8787
NODE_ENV = production

SUPABASE_URL = https://xkjidqfsenjrcabsagoi.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhramlkcWZzZW5qcmNhYnNhZ29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTkwNDAsImV4cCI6MjA2OTg5NTA0MH0.-nYhzrPUuURnGK74jOCBHj7K7WHH7_WxX6NO8NrAtIA
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhramlkcWZzZW5qcmNhYnNhZ29pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMxOTA0MCwiZXhwIjoyMDY5ODk1MDQwfQ.7qLzkd-DZY8vN-NIEJrc2yKEMNbbhxKJPB1PCpzZA6o

STRIPE_SECRET_KEY = sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET = whsec_placeholder
MEMBERSHIP_PRICE_ID = price_1SKLozFXWZpRxSAWFJKF7xwE
PLATFORM_FEE_PERCENT = 15

ADMIN_API_KEY = my-super-secret-admin-key-938472
```

## 3. Supabase Configuration

Go to: https://supabase.com/dashboard/project/dltscjplwbvtlgguwsbb/auth/url-configuration

**Add Redirect URLs:**
- https://c2c-site.vercel.app
- https://c2c-site.vercel.app/**
- https://*.vercel.app/**

**Set Site URL:**
- https://c2c-site.vercel.app

## 4. Deploy

```bash
git add .
git commit -m "Configure production deployment"
git push origin main
```

Both Vercel and Render will auto-deploy.

## 5. Verify

1. **Health Check**: Visit https://c2c-site.onrender.com/health
   - Should return: `{"ok":true,"service":"v1",...}`

2. **Frontend**: Visit https://c2c-site.vercel.app
   - Should load without errors

3. **Browser Console** (F12):
   - No CORS errors
   - API calls go to c2c-site.onrender.com
   - No 404 or 500 errors

4. **Test Authentication**:
   - Try to sign up
   - Check Render logs for `/api/auth/...` requests

5. **Test Resource Loading**:
   - Browse resources
   - Check Render logs for `/api/resources` requests

## Common Issues

### "CORS policy blocked"
→ Check `SITE_URL` on Render matches Vercel URL exactly

### "Network Error" on API calls
→ Verify `VITE_API_URL` is set on Vercel
→ Check Render service is running

### Authentication fails
→ Verify Supabase redirect URLs include Vercel domain
→ Check Supabase keys on both platforms

### Changes not appearing
→ Redeploy after changing environment variables
→ Clear browser cache (Ctrl+Shift+R)

## Quick Test Commands

```bash
# Test backend health
curl https://c2c-site.onrender.com/health

# Test backend CORS
curl -H "Origin: https://c2c-site.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://c2c-site.onrender.com/api/resources

# Check Vercel deployment
vercel inspect <deployment-url>

# Check Render logs
# Go to Render dashboard → Logs tab
```

## That's It!

Your app should now be live at:
- **Frontend**: https://c2c-site.vercel.app
- **Backend API**: https://c2c-site.onrender.com
- **Database**: Supabase (already configured)

For detailed troubleshooting, see `DEPLOYMENT_GUIDE.md`.
