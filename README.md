# Coach2Coach Network

A digital marketplace where coaching expertise meets opportunity. Create, sell, and discover game-changing resources for every sport and level.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Update the following in your `.env` file:

#### Supabase Setup (Required for production)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings > API in your Supabase dashboard
3. Copy your Project URL and anon public key
4. Update `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Stripe Setup (Required for payments)
1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your publishable key from the Stripe dashboard
3. Update `.env`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
```

### 3. Run Database Migrations (If using Supabase)
The migrations will run automatically when you connect to Supabase. They include:
- User authentication tables
- Coach profiles
- Resources and file storage
- Purchase tracking
- Storage buckets for file uploads

### 4. Start Development Server
```bash
npm run dev
```

### 5. Start Payment Server (Required for Stripe)
```bash
npm run server:dev
```

### 6. Set Up Stripe Webhooks (For Testing)
```bash
stripe listen --forward-to http://localhost:8787/stripe/webhook
```

### 7. Start Preview Worker (For File Processing)
```bash
cd preview-worker
npm install
npm run dev
```

The preview worker handles:
- PDF → watermarked preview images
- Video → 30-second preview clips
- Document conversion → PDF → preview

### 7. Set Up Search Engine (Algolia Recommended)

#### Option A: Algolia (Recommended)
1. Create account at [algolia.com](https://algolia.com)
2. Create a new application
3. Get your App ID and API keys from the dashboard
4. Update `.env`:
```
SEARCH_VENDOR=algolia
ALGOLIA_APP_ID=your_app_id
ALGOLIA_ADMIN_API_KEY=your_admin_key
ALGOLIA_SEARCH_API_KEY=your_search_key
ALGOLIA_INDEX_RESOURCES=coach2coach_resources
```

#### Option B: Elasticsearch (Alternative)
1. Install and run Elasticsearch locally or use cloud service
2. Update `.env`:
```
SEARCH_VENDOR=elastic
ELASTIC_NODE_URL=http://localhost:9200
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=your_password
```

### 8. Initial Search Index
```bash
npm run reindex
```

## 🎯 Features

### Search & Discovery
- **Fast Search** - Typo-tolerant search with Algolia/Elasticsearch
- **Advanced Filters** - Sport, level, price, rating, upload date
- **Trending Algorithm** - Time-decayed popularity scoring
- **Recommendations** - "Also bought" and similar content suggestions
- **Search Analytics** - Track queries and click-through rates

### For Coaches (Sellers)
- **Create Professional Profiles** - Showcase your expertise and experience
- **Upload Resources** - Share drills, playbooks, training programs
- **Flexible Pricing** - Set your own prices for resources
- **Commission Tiers** - Keep 50-90% of sales based on membership level
- **Analytics Dashboard** - Track sales, earnings, and performance
- **File Management** - Secure upload and delivery system

### For Buyers
- **Browse Resources** - Advanced search and filtering
- **Secure Payments** - Stripe-powered checkout
- **Instant Downloads** - Immediate access after purchase
- **Review System** - Rate and review resources
- **Purchase History** - Access all your resources anytime

### Platform Features
- **Multi-Sport Support** - Basketball, Football, Soccer, Baseball, and more
- **Level-Specific Content** - Youth, High School, College, Professional
- **Content Moderation** - Quality review process
- **Mobile Responsive** - Works on all devices
- **Secure File Storage** - Cloud-based file management

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Payments:** Stripe
- **File Storage:** Supabase Storage
- **Deployment:** Netlify/Vercel ready

## 📁 Project Structure

```
src/
├── components/          # React components
├── contexts/           # React contexts (Auth, etc.)
├── lib/               # Utilities and configurations
├── pages/             # Page components
└── styles/            # CSS and styling

supabase/
├── migrations/        # Database schema migrations
└── functions/         # Edge functions (if needed)
```

## 🔧 Development

### Running Locally
The app works in two modes:

1. **Demo Mode** (default) - Uses localStorage, no backend required
2. **Production Mode** - Uses Supabase when environment variables are set

### Testing File Uploads
- In demo mode: Files are validated but not actually uploaded
- With Supabase: Files are uploaded to secure cloud storage

### Testing Payments
- Use Stripe test mode with test card numbers
- Test card: 4242 4242 4242 4242

### Testing Webhooks
- Install Stripe CLI: https://stripe.com/docs/stripe-cli
- Run: `stripe listen --forward-to http://localhost:8787/stripe/webhook`
- Copy webhook signing secret to your .env file

### Testing Flows
1. **Membership Trial**: Sign up → 7-day trial starts → upgrade to paid
2. **Seller Onboarding**: Complete profile → become seller → Stripe Connect setup
3. **Product Sales**: Upload product → buyer purchases → 85/15 split via Connect
4. **Referrals**: Sign up with referrer → 5 qualified referrals → 10% discount applied

## 🚀 Deployment

### Prerequisites
- Supabase project set up
- Stripe account configured
- Environment variables configured

### Deploy to Netlify
1. Connect your GitHub repository
2. Set environment variables in Netlify dashboard
3. Deploy!

### Deploy to Vercel
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy!

## 📧 Support

For questions or support:
- Email: zach@coach2coachnetwork.com
- Phone: 678-343-5084

## 📄 License

© 2024 Coach2Coach Network, LLC. All rights reserved.