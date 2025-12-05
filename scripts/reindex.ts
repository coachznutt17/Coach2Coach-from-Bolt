// Reindex script for search engine
import { createClient } from '@supabase/supabase-js';
import { getSearchClient } from '../src/lib/search';
import { refreshTrendingCache } from '../src/lib/trending';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use anon key for read-only operations
// Note: This script only reads public data, so service role is not required
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
);

async function reindexAll() {
  console.log('🚀 Starting full reindex...');
  
  try {
    // Get all active, listed resources
    const { data: resources, error } = await supabase
      .from('resources')
      .select(`
        id,
        title,
        description,
        tags,
        sports,
        levels,
        category,
        file_type,
        price,
        uploaded_at,
        created_at,
        purchase_count,
        view_count,
        rating,
        status,
        is_listed,
        coach_profiles!inner(id, first_name, last_name)
      `)
      .eq('status', 'active')
      .eq('is_listed', true);

    if (error) {
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }

    console.log(`📊 Found ${resources?.length || 0} resources to index`);

    if (!resources || resources.length === 0) {
      console.log('✅ No resources to index');
      return;
    }

    // Transform to search documents
    const documents = resources.map(resource => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      tags: resource.tags || [],
      sport: resource.sports[0] || '',
      level: resource.levels[0] || '',
      file_type: resource.file_type || 'pdf',
      price_cents: Math.round(resource.price * 100),
      uploaded_at: resource.uploaded_at || resource.created_at,
      purchase_count: resource.purchase_count || 0,
      view_count: resource.view_count || 0,
      rating: resource.rating || 0,
      is_listed: true,
      coach_name: `${resource.coach_profiles.first_name} ${resource.coach_profiles.last_name}`,
      coach_id: resource.coach_profiles.id
    }));

    // Get search client and reindex
    const searchClient = getSearchClient();
    
    console.log('🔍 Checking search engine health...');
    const isHealthy = await searchClient.isHealthy();
    
    if (!isHealthy) {
      throw new Error('Search engine is not healthy');
    }

    console.log('📝 Reindexing all documents...');
    await searchClient.reindexAll(documents);
    
    console.log('📈 Refreshing trending cache...');
    await refreshTrendingCache();
    
    console.log(`✅ Reindex completed successfully! Indexed ${documents.length} resources`);
    
    // Log some stats
    const sportCounts = documents.reduce((acc, doc) => {
      acc[doc.sport] = (acc[doc.sport] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📊 Resources by sport:', sportCounts);
    
  } catch (error) {
    console.error('❌ Reindex failed:', error);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'reindex':
      await reindexAll();
      break;
    case 'trending':
      console.log('📈 Refreshing trending cache...');
      await refreshTrendingCache();
      console.log('✅ Trending cache refreshed');
      break;
    default:
      console.log('Usage: npm run reindex [reindex|trending]');
      console.log('  reindex  - Full reindex of all resources');
      console.log('  trending - Refresh trending cache only');
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});