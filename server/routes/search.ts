// Search API routes for Coach2Coach
import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { getSearchClient } from '../../src/lib/search';
import { getTrendingFromCache } from '../../src/lib/trending';
import { getAlsoBoughtRecommendations } from '../../src/lib/recommendations';
import { logAuditEvent } from '../lib/api';

const router = Router();

// POST /api/search/query - Main search endpoint
router.post('/query', async (req, res) => {
  try {
    const { q, page = 1, perPage = 20, filters = {}, sort = 'relevance', sessionId, userId } = req.body;
    
    let searchResult;
    
    try {
      // Try search engine first
      const searchClient = getSearchClient();
      searchResult = await searchClient.search({
        q,
        page,
        perPage,
        filters,
        sort
      });
    } catch (searchError) {
      console.warn('Search engine unavailable, falling back to database:', searchError);
      
      // Fallback to direct database query
      const { FallbackSearchClient } = await import('../../src/lib/search/fallback');
      const fallbackClient = new FallbackSearchClient();
      searchResult = await fallbackClient.search({
        q,
        page,
        perPage,
        filters,
        sort
      });
    }

    // Log search analytics
    if (userId || sessionId) {
      await supabase
        .from('search_analytics')
        .insert({
          user_id: userId || null,
          query: q || '',
          filters: filters,
          results_count: searchResult.totalHits,
          session_id: sessionId || null
        });
    }

    res.json({
      success: true,
      ...searchResult
    });
  } catch (error) {
    console.error('Search query error:', error);
    res.status(500).json({ error: 'Search temporarily unavailable' });
  }
});

// GET /api/search/trending - Get trending resources
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 12;
    
    let trendingResults;
    
    try {
      // Try search engine first
      const searchClient = getSearchClient();
      trendingResults = await searchClient.getTrending(limit);
    } catch (searchError) {
      console.warn('Search engine trending unavailable, using cache:', searchError);
      
      // Fallback to trending cache
      trendingResults = await getTrendingFromCache(limit);
    }

    res.json({
      success: true,
      trending: trendingResults
    });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to get trending resources' });
  }
});

// GET /api/search/recommendations/:resourceId - Get recommendations
router.get('/recommendations/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    const limit = parseInt(req.query.limit as string) || 12;
    
    let recommendations;
    
    try {
      // Try search engine first
      const searchClient = getSearchClient();
      recommendations = await searchClient.getRecommendations(resourceId, limit);
    } catch (searchError) {
      console.warn('Search engine recommendations unavailable, using fallback:', searchError);
      
      // Fallback to co-purchase analysis
      recommendations = await getAlsoBoughtRecommendations(resourceId, limit);
    }

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// POST /api/search/track-click - Track search result clicks
router.post('/track-click', async (req, res) => {
  try {
    const { query, resourceId, sessionId, userId } = req.body;
    
    // Update search analytics with click
    await supabase
      .from('search_analytics')
      .insert({
        user_id: userId || null,
        query: query || '',
        clicked_resource_id: resourceId,
        session_id: sessionId || null,
        results_count: 1
      });

    // Increment view count for the resource
    await supabase.rpc('increment_view', { resource_uuid: resourceId });

    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// POST /api/search/index-hook - Webhook for indexing changes (admin only)
router.post('/index-hook', async (req, res) => {
  try {
    const { action, resourceId, userId } = req.body;
    
    // Verify admin access (in production, use proper admin verification)
    const isAdmin = userId && (
      userId === 'admin-user-id' || 
      req.headers.authorization === `Bearer ${process.env.ADMIN_API_KEY}`
    );
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const searchClient = getSearchClient();
    
    switch (action) {
      case 'index':
        await indexSingleResource(resourceId, searchClient);
        break;
      case 'remove':
        await searchClient.removeResource(resourceId);
        break;
      case 'reindex_all':
        await reindexAllResources(searchClient);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Log audit event
    if (userId) {
      await logAuditEvent(userId, `search_${action}`, 'resource', resourceId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Index hook error:', error);
    res.status(500).json({ error: 'Indexing failed' });
  }
});

// POST /api/search/reindex - Full reindex (admin only)
router.post('/reindex', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Verify admin access
    const isAdmin = userId && (
      userId === 'admin-user-id' || 
      req.headers.authorization === `Bearer ${process.env.ADMIN_API_KEY}`
    );
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const searchClient = getSearchClient();
    const startTime = Date.now();
    
    await reindexAllResources(searchClient);
    
    const duration = Date.now() - startTime;
    
    // Log audit event
    await logAuditEvent(userId, 'search_full_reindex', 'system', undefined, {
      duration_ms: duration
    });

    res.json({ 
      success: true, 
      message: 'Reindex completed',
      duration_ms: duration
    });
  } catch (error) {
    console.error('Reindex error:', error);
    res.status(500).json({ error: 'Reindex failed' });
  }
});

// Helper function to index a single resource
async function indexSingleResource(resourceId: string, searchClient: any): Promise<void> {
  const { data: resource, error } = await supabase
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
      purchase_count,
      view_count,
      rating,
      status,
      is_listed,
      profiles!inner(id, first_name, last_name)
    `)
    .eq('id', resourceId)
    .single();

  if (error || !resource) {
    throw new Error(`Resource not found: ${resourceId}`);
  }

  const document = {
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
    is_listed: resource.is_listed && resource.status === 'active',
    coach_name: `${resource.profiles.first_name} ${resource.profiles.last_name}`,
    coach_id: resource.profiles.id
  };

  await searchClient.indexResource(document);
}

// Helper function to reindex all resources
async function reindexAllResources(searchClient: any): Promise<void> {
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
      profiles!inner(id, first_name, last_name)
    `)
    .eq('status', 'active');

  if (error) {
    throw new Error(`Failed to fetch resources: ${error.message}`);
  }

  const documents = (resources || []).map(resource => ({
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
    is_listed: resource.is_listed && resource.status === 'active',
    coach_name: `${resource.profiles.first_name} ${resource.profiles.last_name}`,
    coach_id: resource.profiles.id
  }));

  await searchClient.reindexAll(documents);
  
  console.log(`Reindexed ${documents.length} resources`);
}

export default router;