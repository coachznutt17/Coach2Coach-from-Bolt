import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV !== 'production';

function requireEnv(name: string, required: boolean = true): string {
  const value = process.env[name];

  if (!value) {
    if (required && !isDevelopment) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    if (isDevelopment) {
      console.warn(`⚠️  Missing environment variable: ${name}`);
    }
  }

  return value || '';
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isDevelopment,
  isProduction: !isDevelopment,

  port: parseInt(process.env.PORT || process.env.SERVER_PORT || '8787', 10),

  supabase: {
    url: requireEnv('SUPABASE_URL'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY', false),
    anonKey: requireEnv('VITE_SUPABASE_ANON_KEY'),
  },

  stripe: {
    secretKey: requireEnv('STRIPE_SECRET_KEY'),
    webhookSecret: requireEnv('STRIPE_WEBHOOK_SECRET'),
    connectAppFeeBps: parseInt(process.env.STRIPE_CONNECT_APP_FEE_BPS || '150', 10),
  },

  site: {
    url: requireEnv('SITE_URL', false) || requireEnv('VITE_SITE_URL', false) || 'http://localhost:4173',
    appUrl: requireEnv('VITE_APP_URL', false) || 'http://localhost:5173',
  },

  features: {
    enablePaid: process.env.VITE_ENABLE_PAID === 'true',
  },

  upload: {
    maxFileSizeBytes: 50 * 1024 * 1024,
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: ['pdf', 'docx']
  }
};

export function validateConfig(): void {
  const requiredVars = [
    'SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ];

  const missing = requiredVars.filter(name => !process.env[name]);

  if (missing.length > 0) {
    if (isDevelopment) {
      console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
      console.warn('   Some features may not work correctly.');
    } else {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not configured');
    console.warn('   Server will use anon key with user authentication');
    console.warn('   Some admin/background operations may have limited functionality');
  }

  console.log('✅ Configuration validated');
  console.log(`   Environment: ${config.env}`);
  console.log(`   Site URL: ${config.site.url}`);
  console.log(`   Paid features: ${config.features.enablePaid ? 'enabled' : 'disabled'}`);
  console.log(`   Platform fee: ${config.stripe.connectAppFeeBps / 100}%`);
}
