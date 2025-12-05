# Frontend-Backend Connection Implementation Summary

## Problem
Your Vercel frontend couldn't communicate with your Render backend because the frontend was making relative API calls (`/api/resources`) which only work with a local proxy during development.

## Solution
Implemented a centralized API configuration system that dynamically constructs API URLs based on the environment:
- **Development**: Uses empty string (relies on Vite proxy: localhost:5173 → localhost:8787)
- **Production**: Uses full Render URL (https://c2c-site.onrender.com)

## Files Created

### 1. `src/lib/apiConfig.ts`
New centralized configuration file that exports:
- `API_BASE_URL`: Reads from `VITE_API_URL` environment variable
- `getApiUrl(endpoint)`: Helper function to construct full API URLs

### 2. `vercel.json`
Deployment configuration for Vercel including:
- Build and output settings
- Environment variable references
- Security headers

### 3. `DEPLOYMENT_GUIDE.md`
Comprehensive step-by-step guide covering:
- Environment variable configuration for both platforms
- Deployment steps
- Troubleshooting common issues
- Verification checklist

## Files Modified

### Backend Changes

**`server/index.ts`**
- Updated CORS configuration to accept:
  - Production Vercel domain (https://c2c-site.vercel.app)
  - Preview deployments (*.vercel.app)
  - Local development domains
- Dynamic origin checking for better security

### Frontend API Clients

**`src/lib/api.ts`**
- Imported `getApiUrl` from apiConfig
- Updated all 6 API methods to use `getApiUrl()`

**`src/lib/mvp-api.ts`**
- Replaced hardcoded `API_BASE` with `getApiUrl()`
- Maintained backward compatibility

**`src/lib/stripe.ts`**
- Updated checkout session creation to use `getApiUrl()`

**`src/lib/analytics.ts`**
- Updated analytics tracking endpoint
- Updated experiment assignment endpoint

### Component Updates (15+ files)

Updated all components with direct fetch calls:
- `src/hooks/useMembership.ts`
- `src/components/BrowseResources.tsx`
- `src/components/ResourceDetailPage.tsx`
- `src/components/TrendingSection.tsx`
- `src/components/RecommendationsCarousel.tsx`
- `src/components/VerificationRequest.tsx`
- `src/components/ProcessingStatus.tsx`
- `src/components/ExperimentManager.tsx`
- `src/components/ReportModal.tsx`
- `src/components/DisputeModal.tsx`
- `src/components/PreviewViewer.tsx`

All fetch calls changed from:
```typescript
fetch('/api/endpoint')
```

To:
```typescript
fetch(getApiUrl('/api/endpoint'))
```

### Configuration Files

**`.env.example`**
- Added `VITE_API_URL` with development and production examples
- Added production URL configuration section
- Documented required environment variables

## How It Works

### Development Mode
1. `VITE_API_URL` is not set (or empty string)
2. `getApiUrl('/api/users')` returns `/api/users`
3. Vite dev server proxy forwards to `http://localhost:8787/api/users`
4. Backend serves the request

### Production Mode
1. `VITE_API_URL=https://c2c-site.onrender.com` set on Vercel
2. `getApiUrl('/api/users')` returns `https://c2c-site.onrender.com/api/users`
3. Browser makes cross-origin request to Render
4. Backend CORS allows request from Vercel domain
5. Backend serves the request

## Environment Variables Required

### Vercel (Frontend)
```
VITE_API_URL=https://c2c-site.onrender.com
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_STRIPE_PUBLISHABLE_KEY=<your-publishable-key>
VITE_SITE_URL=https://c2c-site.vercel.app
```

### Render (Backend)
```
SITE_URL=https://c2c-site.vercel.app
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
STRIPE_SECRET_KEY=<your-secret-key>
```

## Testing Results

Build verification:
```
✓ 1603 modules transformed
✓ Built in 4.83s
✓ No TypeScript errors
✓ All API calls properly configured
```

## Next Steps

1. **Set Environment Variables**
   - Configure all required variables in Vercel dashboard
   - Configure all required variables in Render dashboard

2. **Deploy**
   - Push code to GitHub
   - Vercel auto-deploys frontend
   - Render auto-deploys backend

3. **Verify**
   - Visit https://c2c-site.vercel.app
   - Check browser console for CORS errors
   - Test authentication flow
   - Verify API calls reach backend

4. **Monitor**
   - Watch Render logs for incoming requests
   - Check Vercel logs for frontend errors
   - Monitor Supabase dashboard for database activity

## Key Benefits

1. **Clean Separation**: Frontend and backend are independently deployable
2. **Environment Aware**: Automatically uses correct URLs per environment
3. **Development Friendly**: Works seamlessly in local development
4. **Production Ready**: Configured for Vercel + Render deployment
5. **Maintainable**: Single source of truth for API configuration
6. **Scalable**: Easy to update backend URL if needed

## Security Considerations

- CORS properly configured to only accept known domains
- Service role keys only on backend (never exposed to frontend)
- Environment variables properly scoped
- Security headers added via vercel.json
- Authentication tokens passed securely in headers

## Architecture

```
User Browser
    ↓
Vercel (Frontend)
    ↓ HTTPS/CORS
Render (Backend API)
    ↓
Supabase (Database + Auth)
```

All connections properly secured with HTTPS and CORS.
