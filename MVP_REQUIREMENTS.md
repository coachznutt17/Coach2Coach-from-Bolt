# Coach2Coach MVP - Requirements & Implementation Plan

## 🎯 MVP Goal
Coaches can create profiles, upload PDF/Word resources, and users can purchase and download them.

## ✅ WHAT WORKS NOW

### 1. Profile Creation ✓
- **API Route**: `POST /api/coach-profiles`
- **Database Table**: `coach_profiles` exists with all fields
- **Frontend Component**: `CreateSellerProfile.tsx` complete
- **Status**: ✅ **READY** (routes fixed, no fallbacks)

### 2. Authentication ✓
- **System**: localStorage-based (works immediately)
- **Signup/Login**: Fully functional
- **Session**: Persists across refreshes
- **Status**: ✅ **READY FOR MVP**

### 3. Database Schema ✓
- **Tables**: All 22 tables exist (resources, purchases, etc.)
- **Test Data**: 8 sample resources, 3 coaches
- **Status**: ✅ **READY**

## ❌ WHAT'S BROKEN/MISSING

### 1. File Storage 🔴 **CRITICAL**
**Problem**: Files upload to "demo mode" - not actually stored!

**What happens now**:
```typescript
// fileUpload.ts lines 138-151
if (!supabase) {
  return {
    success: true,
    url: `https://demo-storage.coach2coach.com/${bucket}/${file.name}`, // FAKE!
    filePath: `demo/${bucket}/${file.name}` // FAKE!
  };
}
```

**Impact**:
- ❌ Files are NOT uploaded to real storage
- ❌ Users can't download actual files
- ❌ MVP is broken without this

**Fix Required**: Set up Supabase Storage buckets

---

### 2. Resource Upload Flow 🔴 **CRITICAL**
**Problem**: Upload component creates resource metadata but files aren't stored

**Current Flow**:
1. ✅ User fills form
2. ✅ Files "upload" (fake demo mode)
3. ✅ Resource metadata saved to DB
4. ❌ File URLs point to fake demo storage
5. ❌ Downloads will fail

**Fix Required**: Connect real storage + update resource creation

---

### 3. Purchase Flow 🟡 **NEEDED**
**Status**: Code exists but untested

**What's there**:
- ✅ `purchases` table in DB
- ✅ API routes in `server/routes/purchase.ts`
- ✅ Checkout components

**What's missing**:
- Payment processing (Stripe not configured)
- Free downloads for testing

**Fix Required**: Either add Stripe OR create "free purchase" bypass for MVP

---

### 4. Download System 🔴 **CRITICAL**
**Problem**: Download API returns fake URLs

**Current code**:
```typescript
// fileUpload.ts getSecureDownloadUrl
if (!supabase) {
  return {
    url: `https://demo-storage.coach2coach.com/...` // FAKE!
  };
}
```

**Fix Required**: Connect to real storage

---

## 🛠️ MVP IMPLEMENTATION STEPS

### Step 1: Set Up Supabase Storage ⚡ CRITICAL
**Time**: 15 minutes

**Action**:
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('resources-original', 'resources-original', false),  -- Private: purchased files
  ('resources-preview', 'resources-preview', true),     -- Public: preview images
  ('temp-uploads', 'temp-uploads', false);              -- Private: temp storage

-- Set up RLS policies for resources bucket
CREATE POLICY "Users can upload their own resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resources-original' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read files they purchased"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resources-original'
  AND EXISTS (
    SELECT 1 FROM purchases p
    JOIN resources r ON r.id = p.resource_id
    WHERE r.file_url LIKE '%' || storage.objects.name || '%'
    AND p.user_id = auth.uid()
  )
);

-- Public access to preview images
CREATE POLICY "Anyone can view previews"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resources-preview');
```

**Deliverable**: Storage buckets ready for uploads

---

### Step 2: Remove File Upload Demo Fallbacks ⚡ CRITICAL
**Time**: 10 minutes

**Files to change**:
1. `src/lib/fileUpload.ts`

**Changes**:
```typescript
// REMOVE lines 138-151 (demo fallback)
// REMOVE lines 209-226 (supabase error fallback)
// REMOVE lines 317-322 (getSecureDownloadUrl fallback)

// Make it FAIL LOUDLY if storage not configured:
if (!supabase) {
  throw new Error('File storage not configured. Cannot upload files.');
}
```

**Deliverable**: Uploads fail visibly if storage broken

---

### Step 3: Fix Resource Creation API ⚡ CRITICAL
**Time**: 15 minutes

**File**: `server/routes/resources.ts`

**Current issue**: Needs to verify files were actually uploaded

**Add**:
```typescript
router.post('/', async (req, res) => {
  const { file_urls, preview_image_urls, ...resourceData } = req.body;

  // Verify files were uploaded (not demo URLs)
  if (file_urls.some(url => url.includes('demo-storage'))) {
    return res.status(400).json({
      error: 'File upload failed - demo URLs detected'
    });
  }

  // Create resource with real file URLs
  const result = await query(
    `INSERT INTO resources (...) VALUES (...) RETURNING *`,
    [...]
  );

  res.json({ data: result.rows[0], error: null });
});
```

**Deliverable**: Resources only created with real file URLs

---

### Step 4: Implement Free Purchase for MVP 🟡 OPTIONAL
**Time**: 10 minutes
**Alternative to Stripe setup**

**File**: `server/routes/purchase.ts`

**Add bypass**:
```typescript
router.post('/free', async (req, res) => {
  const { user_id, resource_id } = req.body;

  // Create free purchase (MVP testing only)
  const result = await query(
    `INSERT INTO purchases (user_id, resource_id, amount, status, created_at)
     VALUES ($1, $2, 0, 'completed', NOW())
     RETURNING *`,
    [user_id, resource_id]
  );

  res.json({ data: result.rows[0], error: null });
});
```

**Deliverable**: Users can "purchase" for free to test downloads

---

### Step 5: Test Complete MVP Flow ⚡ CRITICAL
**Time**: 15 minutes

**Test Script**:
```bash
#!/bin/bash
# test-mvp.sh

echo "Testing MVP Flow..."

# 1. Sign up
echo "1. Sign up..."
curl -X POST localhost:8787/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","first_name":"Test","last_name":"User"}'

# 2. Create profile
echo "2. Create profile..."
curl -X POST localhost:8787/api/coach-profiles \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-id","first_name":"Test","last_name":"Coach",...}'

# 3. Upload resource (with REAL PDF file)
echo "3. Upload resource..."
# Upload file to storage first
# Then create resource with real file URL

# 4. Make free purchase
echo "4. Purchase resource..."
curl -X POST localhost:8787/api/purchase/free \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test-id","resource_id":"resource-id"}'

# 5. Download file
echo "5. Download file..."
curl -X GET localhost:8787/api/download/resource-id/test-id \
  -o downloaded-file.pdf

echo "✓ MVP flow complete!"
```

**Deliverable**: End-to-end flow works

---

## 📋 MVP CHECKLIST (In Order)

### Must Complete (Blocking)
- [ ] **Step 1**: Create Supabase Storage buckets + RLS policies
- [ ] **Step 2**: Remove demo fallbacks from fileUpload.ts
- [ ] **Step 3**: Fix resource creation API to verify real uploads
- [ ] **Step 4 (Option A)**: Add Stripe OR **Step 4 (Option B)**: Add free purchase endpoint
- [ ] **Step 5**: Test signup → profile → upload → purchase → download

### Success Criteria
✅ Coach signs up
✅ Coach creates profile (saves to DB)
✅ Coach uploads PDF (file stored in Supabase Storage)
✅ Resource created with real file URL
✅ User can purchase (free or paid)
✅ User can download actual PDF file

---

## ⏱️ TIME ESTIMATE

| Task | Time | Priority |
|------|------|----------|
| Storage setup | 15 min | 🔴 Critical |
| Remove fallbacks | 10 min | 🔴 Critical |
| Fix resource API | 15 min | 🔴 Critical |
| Free purchase | 10 min | 🟡 Nice-to-have |
| Test MVP flow | 15 min | 🔴 Critical |
| **TOTAL** | **65 min** | |

---

## 🚫 WHAT'S OUT OF SCOPE

These are NOT needed for MVP:
- ❌ Stripe payments (use free purchases instead)
- ❌ Email verification
- ❌ Password reset
- ❌ Advanced search/filtering (basic works)
- ❌ Reviews/ratings
- ❌ Messaging system
- ❌ Analytics dashboard
- ❌ Admin panel

---

## 🎯 NEXT ACTIONS

**Start with Step 1**:
```sql
-- Run this in Supabase SQL editor or via MCP tool:
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('resources-original', 'resources-original', false),
  ('resources-preview', 'resources-preview', true),
  ('temp-uploads', 'temp-uploads', false);
```

Then proceed through Steps 2-5 in order.

---

**Last Updated**: MVP requirements analysis - October 3, 2025
