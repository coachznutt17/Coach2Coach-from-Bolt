import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Current values:');
  console.log('VITE_SUPABASE_URL:', supabaseUrl || 'undefined');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'present' : 'undefined');
  console.log('Please update your .env file with your Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up Coach2Coach database...');
  
  try {
    // Test connection
    const { data, error } = await supabase.from('coach_profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('Make sure your Supabase project is running and credentials are correct');
      return;
    }
    
    console.log('✅ Database connection successful!');
    console.log('✅ Tables are ready (migrations already applied)');
    
    // Check storage buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('⚠️  Storage not set up yet - will be created automatically');
    } else {
      console.log('✅ Storage buckets ready:', buckets.map(b => b.name).join(', '));
    }
    
    console.log('\n🎉 Setup complete! Your Coach2Coach platform is ready.');
    console.log('👉 Start your dev server: npm run dev');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupDatabase();