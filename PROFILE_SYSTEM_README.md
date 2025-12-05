# User Profile Creation System

A complete user profile creation system integrated with Supabase, built with React, TypeScript, and Tailwind CSS.

## Features

- Email/password signup with email verification
- User profile management with avatar uploads
- Secure authentication using Supabase Auth
- Profile data storage in Supabase database
- Avatar storage in Supabase Storage
- Form validation using Formik and Yup
- Toast notifications with react-hot-toast
- Responsive design with Tailwind CSS
- Full TypeScript support

## What's Been Implemented

### 1. Database Setup
- ✅ Profiles table with all required fields (first_name, last_name, email, bio, location, avatar_url)
- ✅ Row Level Security (RLS) policies for secure data access
- ✅ Avatars storage bucket for profile pictures
- ✅ Storage policies for secure file uploads

### 2. Components Created

#### UserSignupForm (`/signup`)
- Collects: first name, last name, email, password, bio, age, location, profile picture
- Client-side validation with Formik and Yup
- Creates Supabase Auth user
- Shows "Check your email" message after signup
- Redirects to `/confirm-email`

#### LoginFormSimple (`/login`)
- Simple email/password login form
- Handles authentication with Supabase
- Shows appropriate error messages (invalid credentials, unverified email)
- Redirects to `/user-profile` on success

#### UserProfilePage (`/user-profile`)
- Protected route (redirects to login if not authenticated)
- Displays current profile data
- Allows editing all profile fields
- Supports avatar upload and replacement
- Updates Supabase database and storage
- Logout functionality

#### ConfirmEmailPage (`/confirm-email`)
- Displays after signup
- Instructions to check email for verification link
- Links to login page and home

### 3. Configuration Files
- `src/lib/supabaseClient.js` - Supabase client initialization
- `sql/setup-profiles.sql` - Database setup script (already executed)
- Routes added to `src/App.tsx`

### 4. Dependencies Installed
- `formik` - Form management
- `yup` - Schema validation
- `react-hot-toast` - Toast notifications

## How to Use

### 1. Access the Signup Form
Navigate to: `http://localhost:5173/signup`

### 2. Create an Account
1. Fill out the signup form
2. Click "Sign Up"
3. You'll see: "Account created! Check your email to verify and log in."
4. Redirected to `/confirm-email`

### 3. Verify Your Email
**IMPORTANT**: Email verification is currently enabled in your Supabase project.

- Check your email inbox for a verification link from Supabase
- Click the link to verify your account
- After verification, you can log in

**To disable email verification (for faster testing):**
1. Go to: https://supabase.com/dashboard/project/xkjidqfsenjrcabsagoi/auth/providers
2. Find "Email" provider
3. Uncheck "Enable email confirmations"
4. Save changes

### 4. Log In
1. Navigate to: `http://localhost:5173/login`
2. Enter your email and password
3. Click "Sign In"
4. Redirected to `/user-profile`

### 5. View/Edit Your Profile
1. After logging in, you're at `/user-profile`
2. Edit any fields (first name, last name, bio, location)
3. Upload a new profile picture (optional)
4. Click "Update Profile"
5. Changes saved to Supabase

### 6. Log Out
Click the "Logout" button on the profile page.

## Database Schema

### Profiles Table
```sql
id                - uuid (primary key)
user_id           - uuid (references auth.users)
first_name        - text (required)
last_name         - text (required)
email             - text (required, unique)
bio               - text (optional, max 500 chars)
location          - text (optional)
avatar_url        - text (optional, stores public URL)
created_at        - timestamp
updated_at        - timestamp
```

### Storage Bucket
- Bucket name: `avatars`
- Public access: Yes
- File path structure: `{user_id}/{timestamp}.{ext}`
- Allowed types: image/jpeg, image/png, image/gif, image/webp
- Max file size: 5MB

## Security Features

### Row Level Security (RLS)
- Users can only create their own profile (INSERT)
- Users can view all profiles (SELECT)
- Users can only update their own profile (UPDATE)

### Storage Policies
- Users can only upload files to their own folder
- Public can view all avatars
- Users can only update/delete their own avatars

### Client-Side Validation
- Email format validation
- Password strength (min 8 characters)
- Password confirmation matching
- File size limits (5MB max)
- File type restrictions (images only)
- Bio character limit (500 chars)
- Age range validation (18-100)

## Troubleshooting

### "Email not verified" error when logging in
- Check your email for the verification link
- Or disable email confirmation in Supabase dashboard (see step 3 above)

### Profile picture not uploading
- Ensure file is under 5MB
- Ensure file is an image (JPEG, PNG, GIF, WebP)
- Check browser console for detailed error messages

### "Failed to load profile" error
- Make sure you're logged in
- Check that the profiles table has data for your user
- Verify RLS policies are set correctly

### Changes not saving
- Check browser console for errors
- Verify you're logged in
- Ensure RLS policies allow your user to update

## Routes

- `/signup` - User signup form
- `/login` - User login form
- `/user-profile` - User profile page (protected)
- `/confirm-email` - Email confirmation instructions
- `/` - Home page

## File Structure

```
src/
├── components/
│   ├── UserSignupForm.jsx       # Signup form
│   ├── LoginFormSimple.jsx      # Login form
│   ├── UserProfilePage.jsx      # Profile management
│   └── ConfirmEmailPage.jsx     # Email confirmation page
├── lib/
│   └── supabaseClient.js        # Supabase client
└── App.tsx                       # Routes and layout

sql/
└── setup-profiles.sql            # Database setup (already run)
```

## Testing the Complete Flow

1. **Signup**: http://localhost:5173/signup
   - Fill form and submit
   - See "Check your email" toast
   - Redirected to `/confirm-email`

2. **Verify Email**: Check inbox, click link

3. **Login**: http://localhost:5173/login
   - Enter credentials
   - Redirected to `/user-profile`

4. **Edit Profile**:
   - Change fields
   - Upload avatar
   - Click "Update Profile"
   - See success toast

5. **Logout**: Click logout button

## Environment Variables

Your `.env` file should contain:

```
VITE_SUPABASE_URL=https://xkjidqfsenjrcabsagoi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These are already configured in your project.

## Next Steps

The profile creation system is fully functional and ready to use. You can:

1. Test the signup flow at `/signup`
2. Customize the form fields as needed
3. Add additional validation rules
4. Customize the UI/styling
5. Add more profile fields to the database and forms

## Support

If you encounter any issues:
1. Check browser console for errors
2. Verify Supabase configuration at: https://supabase.com/dashboard/project/xkjidqfsenjrcabsagoi
3. Check that all RLS policies are active
4. Ensure the avatars bucket exists and has correct policies
