# Coach2Coach - Production Ready Status

## ✅ CRITICAL FIXES COMPLETED

### 1. Route Consistency Fixed
**Problem**: Server mounted routes at `/api/profiles` but routes file used `/coach-profiles`, creating `/api/profiles/coach-profiles` (404s)

**Fixed**:
- ✅ Server now mounts at `/api/coach-profiles`
- ✅ Routes use `/`, `/:userId` relative paths
- ✅ Final URLs: `POST /api/coach-profiles`, `GET /api/coach-profiles/:userId`, `PATCH /api/coach-profiles/:userId`

### 2. localStorage Fallbacks Removed
**Problem**: Silent fallbacks to localStorage masked API failures

**Fixed**:
- ✅ `db.createCoachProfile()` - throws error on failure (no silent fallback)
- ✅ `db.getCoachProfile()` - throws error on failure (no silent fallback)
- ✅ `db.updateCoachProfile()` - throws error on failure (no silent fallback)
- ✅ All errors logged to console and displayed to user

### 3. Proper Error Handling
**Problem**: Errors were caught and returned as `{ error }` but not checked properly

**Fixed**:
- ✅ HTTP status codes checked (`!response.ok` throws)
- ✅ Response JSON checked for `error` field
- ✅ Descriptive error messages with HTTP status
- ✅ All errors propagate to UI (no silent failures)

### 4. ID Field Standardization
**Fixed**:
- ✅ Database uses `user_id` (UUID from auth.users)
- ✅ All API routes use `user_id` consistently
- ✅ Frontend sends `user_id` in all requests

## 🧪 TESTING

### Smoke Test Script
Created `scripts/smoke.sh` that tests:
1. Health endpoint (`GET /health`)
2. Create profile (`POST /api/coach-profiles`)
3. Read profile (`GET /api/coach-profiles/:userId`)
4. Resources endpoint (`GET /api/resources`)
5. Membership endpoint (`GET /api/membership/:userId`)

**Run it**:
```bash
# Start server first
npm run server:start &

# Run smoke test
./scripts/smoke.sh

# Or against custom API
API=http://your-api.com ./scripts/smoke.sh
```

### Manual Testing Checklist
```bash
# 1. Health check
curl http://localhost:8787/health

# 2. Create profile
curl -X POST http://localhost:8787/api/coach-profiles \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-123",
    "first_name": "Test",
    "last_name": "Coach",
    "title": "Basketball Coach",
    "bio": "Test bio",
    "location": "Test City",
    "years_experience": "5-10",
    "sports": ["Basketball"],
    "levels": ["High School"],
    "specialties": ["Shooting"]
  }'

# 3. Read profile
curl http://localhost:8787/api/coach-profiles/test-123

# 4. Update profile
curl -X PATCH http://localhost:8787/api/coach-profiles/test-123 \
  -H "Content-Type: application/json" \
  -d '{"title": "Elite Basketball Coach"}'
```

## 📋 PUBLISH CHECKLIST

### Required (MUST complete before publishing)
- [x] Route consistency fixed (`/api/coach-profiles`)
- [x] localStorage fallbacks removed
- [x] Error handling added (fail loudly)
- [x] ID field standardized (`user_id`)
- [x] Build succeeds (0 errors)
- [ ] Smoke test passes locally
- [ ] Profile E2E works: Create → Refresh → Read returns same data
- [ ] No 404/500 in browser Network tab during profile creation

### Environment Variables Needed
```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# Or for Supabase
SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Frontend Supabase (optional - auth falls back to localStorage)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe (optional - only if accepting payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
MEMBERSHIP_PRICE_ID=price_...

# App URL (for redirects)
VITE_APP_URL=https://your-domain.com
```

### Deployment Steps
1. **Set environment variables** in hosting platform
2. **Run database migrations**:
   ```bash
   # Apply all migrations in supabase/migrations/
   ```
3. **Build frontend**:
   ```bash
   npm run build
   ```
4. **Start API server**:
   ```bash
   npm run server:start
   # Or: node server/index.js
   ```
5. **Serve frontend** from `dist/`
6. **Run smoke test**:
   ```bash
   API=https://your-api.com ./scripts/smoke.sh
   ```

### Recommended Platforms

**Option A: Vercel (frontend) + Railway (API)**
- Vercel: Deploy `dist/` folder
- Railway: Deploy with Dockerfile or Node.js
- Set `VITE_API_BASE_URL` in Vercel to Railway URL

**Option B: Render (full-stack)**
- Single service runs both API and serves static files
- Simplest option (no CORS issues)

**Option C: DigitalOcean/AWS**
- Traditional VPS hosting
- Most control, requires more setup

## 🔍 HOW TO VERIFY IT WORKS

### Test Profile Creation Flow (Critical Path)

1. **Start servers**:
   ```bash
   npm run server:start   # API on :8787
   npm run dev            # Frontend on :5173
   ```

2. **Sign up** as a new user in browser

3. **Create profile** via UI (Complete Profile form)

4. **Check console** - should see:
   ```
   Creating profile for: [Name]
   SUCCESS! Profile created: { data: {...} }
   ```

5. **Check Network tab** - should see:
   ```
   POST /api/coach-profiles → 200 OK
   Response: { data: {...}, error: null }
   ```

6. **Refresh page** - profile should persist

7. **Check database**:
   ```sql
   SELECT * FROM coach_profiles WHERE user_id = '[user_id]';
   ```

### What "Working" Looks Like

✅ **Success indicators**:
- POST request returns HTTP 200
- Response has `{ data: {...}, error: null }`
- Console shows success message
- Page redirects to `/profile`
- Data persists after refresh
- Database has row with correct `user_id`

❌ **Failure indicators** (any of these = NOT ready):
- HTTP 404 (route not found)
- HTTP 500 (server error)
- Response has `{ error: "..." }`
- Console shows error
- Data doesn't persist
- Silent failure (no error shown to user)

## 🎯 CURRENT STATUS

**Mode**: Real Backend (production mode)
**Database**: PostgreSQL via direct connection
**Authentication**: localStorage (will work, but add Supabase for production)
**File Storage**: Not connected (metadata only)
**Payments**: Not connected (Stripe keys needed)

**Build Status**: ✅ Passes (0 errors, 5.20s)
**Smoke Test**: ⏳ Needs verification (run `./scripts/smoke.sh`)

## 📝 NOTES

### What Changed (Git Diff Summary)
1. `server/index.ts` - Changed mount point from `/api/profiles` to `/api/coach-profiles`
2. `server/routes/profiles.ts` - Changed routes from `/coach-profiles` to `/` (relative)
3. `src/lib/supabase.ts` - Removed silent fallbacks, added proper error handling
4. `src/components/CreateSellerProfile.tsx` - Removed debug alerts, improved error display
5. `scripts/smoke.sh` - Created automated smoke test

### Breaking Changes
- None (only fixes)

### Migration Required
- None (database schema unchanged)

## 🚀 READY TO PUBLISH?

**YES** - if smoke test passes and profile E2E works

**NO** - if any endpoint returns 404/500 or data doesn't persist

**Next Step**: Run smoke test and verify profile creation works end-to-end.

---

Last updated: October 3, 2025 (Post-critical-fixes)
