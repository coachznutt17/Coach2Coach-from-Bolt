# Profile API Testing Guide

This guide explains how to test the coach profiles API implementation.

## Prerequisites

1. **Environment Setup**
   - Supabase project configured in `.env`
   - All required environment variables set
   - Dependencies installed: `npm install`

2. **Server Running**
   - Backend server must be running: `npm run server:dev`
   - Server should be accessible at `http://localhost:8787`

## Testing Methods

### Method 1: Interactive Browser Testing (Recommended)

The easiest way to test all features with a visual interface.

1. **Start the server:**
   ```bash
   npm run server:dev
   ```

2. **Open the test page:**
   ```bash
   open test-profiles-api.html
   ```
   Or navigate to `test-profiles-api.html` in your browser.

3. **Run tests interactively:**
   - Click "Sign Up New User" or "Login" to authenticate
   - Use individual test buttons to test each endpoint
   - Click "Run Full Test Suite" to run all tests automatically
   - View real-time results and JSON responses

**Features:**
- ✅ Visual interface with color-coded results
- ✅ See authentication status in real-time
- ✅ Test individual endpoints one by one
- ✅ View full JSON responses
- ✅ Test RLS security policies
- ✅ Run full automated test suite

### Method 2: Automated Script Testing

Automated testing from the command line.

1. **Start the server:**
   ```bash
   npm run server:dev
   ```

2. **Run the test script:**
   ```bash
   node scripts/test-profiles.js
   ```

**Features:**
- ✅ Fully automated test execution
- ✅ Tests all endpoints in sequence
- ✅ Validates RLS security
- ✅ Clean output with pass/fail indicators
- ✅ Exit codes for CI/CD integration

### Method 3: Manual API Testing

Use curl or any API client (Postman, Insomnia, etc.)

1. **Get an auth token:**
   ```bash
   # Sign up or login via Supabase to get an access token
   ```

2. **Test endpoints:**

   **GET your profile:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8787/api/coach-profiles/me
   ```

   **Create profile:**
   ```bash
   curl -X POST \
        -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","first_name":"Test","last_name":"Coach"}' \
        http://localhost:8787/api/coach-profiles
   ```

   **Update profile:**
   ```bash
   curl -X PUT \
        -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"title":"Senior Coach","bio":"Updated bio"}' \
        http://localhost:8787/api/coach-profiles/me
   ```

   **Check profile by ID:**
   ```bash
   curl http://localhost:8787/api/coach-profiles/check/USER_ID
   ```

## Test Coverage

All testing methods cover:

### 1. Server Health
- ✅ Server is running and accessible
- ✅ Health endpoint responds correctly

### 2. Authentication
- ✅ User signup works
- ✅ User login works
- ✅ Session management works
- ✅ Token is valid

### 3. Profile Operations
- ✅ GET /api/coach-profiles/me (fetch own profile)
- ✅ POST /api/coach-profiles (create profile)
- ✅ PUT /api/coach-profiles/me (update profile)
- ✅ GET /api/coach-profiles/check/:userId (public read)

### 4. Row Level Security (RLS)
- ✅ Unauthenticated GET requests are blocked
- ✅ Unauthenticated POST requests are blocked
- ✅ Unauthenticated PUT requests are blocked
- ✅ Users can only modify their own profiles

### 5. Data Validation
- ✅ Required fields are enforced
- ✅ Invalid data is rejected
- ✅ Updates only modify specified fields

## Expected Results

### Successful Test Run

```
✅ Server health check
✅ User signup
✅ GET my profile
✅ POST create profile
✅ PUT update profile
✅ GET check profile
✅ Block unauthenticated GET
✅ Block unauthenticated POST
✅ Block unauthenticated PUT

📊 Passed: 9 | Failed: 0 | Total: 9
🎉 All tests passed!
```

## Troubleshooting

### Server not responding
```bash
# Check if server is running
ps aux | grep node

# Start server
npm run server:dev
```

### Authentication errors
- Verify Supabase credentials in `.env`
- Check that email confirmation is disabled in Supabase settings
- Try with a fresh test account

### RLS errors
- Verify RLS policies are enabled on the profiles table
- Check migration files were applied correctly
- Review Supabase dashboard for RLS policy details

### Connection errors
- Ensure API_URL is set correctly (http://localhost:8787)
- Check CORS settings allow your origin
- Verify firewall isn't blocking the connection

## Next Steps

After successful testing:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to production**
   - Verify all environment variables are set in production
   - Test with production Supabase instance
   - Monitor logs for any errors

3. **Integration testing**
   - Test with the frontend application
   - Verify profile creation flow end-to-end
   - Test profile updates from the UI

## Support

If tests fail:
1. Check server logs for errors
2. Verify database migrations are applied
3. Confirm RLS policies are correct
4. Review the error messages carefully
5. Check Supabase dashboard for insights
