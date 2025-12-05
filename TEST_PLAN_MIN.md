# Coach2Coach MVP - Minimal E2E Test Plan

## Prerequisites

1. **Environment Setup**
   ```bash
   cp .env.example .env
   # Fill in your Stripe test keys:
   # - STRIPE_SECRET_KEY=sk_test_...
   # - MEMBERSHIP_PRICE_ID=price_... (create in Stripe Dashboard)
   # - STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe CLI or Dashboard)
   ```

2. **Start Services**
   ```bash
   # Terminal 1: Start API server
   npm run server:start
   # Should see: "Server listening on port 8787"

   # Terminal 2: Start frontend
   npm run dev
   # Should see: "Local: http://localhost:5173"

   # Terminal 3 (optional): Stripe webhook forwarding
   stripe listen --forward-to localhost:8787/api/webhooks/stripe
   # Copy the webhook signing secret to .env as STRIPE_WEBHOOK_SECRET
   ```

---

## Test 1: Creator Flow (Upload & Sell)

### 1.1 Sign Up & Subscribe

1. Navigate to `http://localhost:5173`
2. Click **"Sign Up"** (top right)
3. Enter:
   - Email: `coach1@test.com`
   - Password: `TestPassword123!`
4. Click **"Create Account"**
5. ✅ **Verify**: You're redirected to homepage, signed in

### 1.2 Start Membership Trial

1. Click **"Upload Resource"** or **"Become a Seller"**
2. You should see: **"Active membership required"**
3. Click **"Start 7-Day Free Trial"** or navigate to `/pricing`
4. Click **"Start Free Trial"**
5. You're redirected to Stripe Checkout
6. Use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
7. Click **"Subscribe"**
8. ✅ **Verify**: Redirected to `/account`
9. ✅ **Verify**: Account page shows:
   - Status: **"Trial"** or **"Active"**
   - Trial ends: Date 7 days from now

### 1.3 Connect Stripe (Optional - for payouts)

1. On Account page, click **"Connect Stripe Account"**
2. Fill out Stripe Connect onboarding (use test data)
3. ✅ **Verify**: Account shows "Stripe Connected"

### 1.4 Upload Resource

1. Click **"Upload Resource"** (top nav or sidebar)
2. **Step 1: Basic Information**
   - Title: `Elite Basketball Drills`
   - Description: `Professional-level ball handling drills for guards`
   - Price: `19.99`
   - Category: `Drill Collections`
   - Click **"Next"**

3. **Step 2: Target Audience**
   - Sports: Select **"Basketball"**
   - Levels: Select **"High School"**, **"Collegiate"**
   - Click **"Next"**

4. **Step 3: File Upload**
   - Upload a PDF file (any test PDF, < 50MB)
   - Wait for upload progress to complete
   - ✅ **Verify**: File shows as uploaded (green checkmark)
   - Click **"Next"**

5. **Step 4: Review & Submit**
   - Review summary
   - Click **"Upload Resource"**

6. ✅ **Verify**:
   - Success message appears
   - Redirected to `/browse`
   - Your resource appears in the list

---

## Test 2: Buyer Flow (Purchase & Download)

### 2.1 Sign Up as Buyer

1. **Sign out** (top right menu)
2. Click **"Sign Up"**
3. Enter:
   - Email: `buyer1@test.com`
   - Password: `BuyerPass123!`
4. Create account
5. ✅ **Verify**: Signed in as buyer

### 2.2 Subscribe as Member

1. Navigate to `/pricing` or try to buy a resource
2. Click **"Start 7-Day Free Trial"**
3. Complete Stripe checkout (same test card as before)
4. ✅ **Verify**: Subscription active, trial status shown

### 2.3 Purchase Resource

1. Navigate to `/browse`
2. Find the resource uploaded by `coach1@test.com`
   - Title: "Elite Basketball Drills"
   - Price: $19.99
3. Click on the resource card to view details
4. Click **"Buy Now"** or **"Purchase"**
5. Complete Stripe checkout (test card: `4242 4242 4242 4242`)
6. ✅ **Verify**:
   - Redirected to `/purchase-success` or resource detail page
   - Success message: "Purchase complete!"
   - Resource now shows **"Download"** button instead of "Buy Now"

### 2.4 Download Resource

1. On the resource detail page, click **"Download"**
2. ✅ **Verify**:
   - File downloads immediately (5-minute signed URL)
   - File is the correct PDF uploaded by coach
   - Download works when opened

---

## Test 3: Free Resource Access

### 3.1 Upload Free Resource

1. **Sign in** as `coach1@test.com`
2. Upload a new resource:
   - Title: `Free Basketball Tips`
   - Price: `0.00` (or leave blank)
   - Upload a PDF
3. ✅ **Verify**: Resource appears with "Free" badge

### 3.2 Download Free Resource (Trial Member)

1. **Sign in** as `buyer1@test.com` (already has trial membership)
2. Navigate to the free resource
3. Click **"Get for Free"** or **"Download"**
4. ✅ **Verify**:
   - No Stripe checkout
   - File downloads immediately
   - Purchase record created (amount: $0)

### 3.3 Non-Member Cannot Download

1. **Sign out**
2. Try to access free resource download
3. ✅ **Verify**: Redirected to login or pricing page

---

## Test 4: Badge Display

### 4.1 Assign Founding Coach Badge (Admin)

**Manual Database Update** (use Supabase Dashboard or SQL):
```sql
UPDATE profiles
SET is_founding_coach = true
WHERE email = 'coach1@test.com';
```

### 4.2 Verify Badge Display

1. Navigate to `/browse`
2. Find resource by `coach1@test.com`
3. ✅ **Verify**: "Founding Coach" badge visible on resource card

4. Click on coach's profile
5. ✅ **Verify**: "Founding Coach" badge on profile header

---

## Test 5: Membership Gating

### 5.1 Upload Restricted (No Membership)

1. Create new account: `coach2@test.com`
2. **DO NOT subscribe**
3. Try to access `/upload`
4. ✅ **Verify**: Blocked with message "Active membership required"

### 5.2 Download Restricted (No Membership)

1. **Sign in** as user without membership
2. Try to download any resource
3. ✅ **Verify**: Error "Active membership required for downloads"

### 5.3 Purchase Restricted (No Membership)

1. Try to purchase a paid resource
2. ✅ **Verify**: Blocked or redirected to pricing

---

## Success Criteria

✅ **PASS** if all these work:
1. Creator can upload → resource appears in Browse
2. Buyer can purchase → download works
3. Free resources downloadable by trial/active members
4. Non-members blocked from uploads/downloads
5. Founding Coach badge displays correctly
6. Stripe webhook creates purchase record
7. Files download with valid signed URLs

❌ **FAIL** if any:
- Upload saves to localStorage (not DB)
- Purchase doesn't create database record
- Download returns 403 for purchased resource
- Membership fallbacks to "active" without payment
- File URLs return 404

---

## Troubleshooting

### Issue: Webhooks not firing
```bash
# Check stripe listen is running:
stripe listen --forward-to localhost:8787/api/webhooks/stripe

# Check webhook events in Stripe Dashboard:
# https://dashboard.stripe.com/test/webhooks
```

### Issue: File upload fails
- Verify Supabase Storage bucket `resources` exists and is private
- Check RLS policies allow uploads for authenticated users
- Verify file size < 50MB

### Issue: Download returns 404
- Verify file was uploaded to Supabase Storage (check in Dashboard)
- Verify `file_url` or `storage_path_original` in resources table has correct path
- Verify purchase record exists in purchases table

### Issue: Membership shows "none" after payment
- Check webhook fired (stripe listen should show event)
- Verify STRIPE_WEBHOOK_SECRET matches
- Check profiles table: `membership_status` should be 'trial' or 'active'

---

## Database Verification Queries

After tests, run these to verify data:

```sql
-- Check resources uploaded
SELECT id, title, price_cents, owner_id, is_free, created_at
FROM resources
ORDER BY created_at DESC LIMIT 10;

-- Check purchases
SELECT p.id, p.amount_cents, p.status, r.title, prof.email
FROM purchases p
JOIN resources r ON p.resource_id = r.id
JOIN profiles prof ON p.buyer_id = prof.id
ORDER BY p.created_at DESC;

-- Check memberships
SELECT email, membership_status, membership_trial_ends_at, is_creator_enabled, is_founding_coach
FROM profiles
ORDER BY created_at DESC;

-- Check founding coaches
SELECT email, first_name, last_name, is_founding_coach
FROM profiles
WHERE is_founding_coach = true;
```

---

**Test Duration:** ~15-20 minutes for full E2E flow
**Required:** Stripe test account, Supabase project, test PDF files
