# Supabase Setup Instructions

## Critical: Disable Email Confirmation (Required for Development)

Your Coach2Coach platform is trying to use Supabase authentication, but **email confirmation is enabled** by default in Supabase. This means users can't log in until they click a confirmation link sent to their email.

### How to Disable Email Confirmation:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `0ec90b57d6e95fcbda19832f`
3. Click **Authentication** in the left sidebar
4. Click **Providers** tab
5. Find **Email** provider
6. Click the **Edit** button
7. **UNCHECK** "Confirm email"
8. Click **Save**

### After Disabling Email Confirmation:

Users will be able to:
- ✅ Sign up immediately without email confirmation
- ✅ Create coach profiles right away
- ✅ Upload resources and use all features
- ✅ Full database persistence

### Alternative: Use Test Accounts

If you can't disable email confirmation right now, I can create test accounts for you via SQL.

### Current Status:

- ✅ Supabase database connected
- ✅ All tables and migrations applied
- ✅ Storage buckets created
- ✅ Row Level Security configured
- ⚠️  Email confirmation blocking signups

Once email confirmation is disabled, everything will work perfectly!
