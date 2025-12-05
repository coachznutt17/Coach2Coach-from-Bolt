// Fallback search using Supabase when search engine is unavailable
import { supabase } from '../supabase';
import { SearchQuery, SearchResult, SearchHit, TrendingResult, RecommendationResult, SearchDocument } from './types';

export class FallbackSearchClient {
  async search(query: SearchQuery): Promise<SearchResult> {
    try {
      const { q = '', page = 1, perPage = 20, filters = {}, sort = 'relevance' } = query;
      
      let dbQuery = supabase
        .from('resources')
        .select(`
          id,
          title,
          description,
          sports,
          levels,
          category,
          price,
          rating,
          purchase_count,
          view_count,
          uploaded_at,
          created_at,
          coach_profiles!inner(first_name, last_name, id)
        `)
        .eq('status', 'active')
        .eq('is_listed', true);

      // Text search using ILIKE (basic but functional)
      if (q) {
        dbQuery = dbQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
      }

      // Apply filters
      if (filters.sports?.length > 0) {
        dbQuery = dbQuery.overlaps('sports', filters.sports);
      }
      
      if (filters.levels?.length > 0) {
        dbQuery = dbQuery.overlaps('levels', filters.levels);
      }
      
      if (filters.price_min !== undefined) {
        dbQuery = dbQuery.gte('price', filters.price_min / 100);
      }
      
      if (filters.price_max !== undefined) {
        dbQuery = dbQuery.lte('price', filters.price_max / 100);
      }

      // Apply sorting
      switch (sort) {
        case 'newest':
          dbQuery = dbQuery.order('uploaded_at', { ascending: false });
          break;
        case 'price_asc':
          dbQuery = dbQuery.order('price', { ascending: true });
          break;
        case 'price_desc':
          dbQuery = dbQuery.order('price', { ascending: false });
          break;
        case 'rating':
          dbQuery = dbQuery.order('rating', { ascending: false });
          break;
        case 'popular':
          dbQuery = dbQuery.order('purchase_count', { ascending: false });
          break;
        case 'trending':
          dbQuery = dbQuery.order('purchase_count', { ascending: false });
          break;
        default:
          dbQuery = dbQuery.order('created_at', { ascending: false });
      }

      // Pagination
      const from = (page - 1) * perPage;
      dbQuery = dbQuery.range(from, from + perPage - 1);

      const { data, error, count } = await dbQuery;
      
      if (error) throw error;

      const hits: SearchHit[] = (data || []).map(resource => ({
        id: resource.id,
        title: resource.title,
        description: resource.description,
        sport: resource.sports[0] || '',
        level: resource.levels[0] || '',
        file_type: 'pdf', // Default fallback
        price_cents: Math.round(resource.price * 100),
        rating: resource.rating || 0,
        purchase_count: resource.purchase_count || 0,
        view_count: resource.view_count || 0,
        uploaded_at: resource.uploaded_at || resource.created_at,
        coach_name: `${resource.coach_profiles.first_name} ${resource.coach_profiles.last_name}`,
        coach_id: resource.coach_profiles.id
      }));

      return {
        hits,
        totalHits: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / perPage),
        processingTimeMS: 0
      };
    } catch (error) {
      console.error('Fallback search error:', error);
      throw error;
    }
  }

  async getTrending(limit: number = 12): Promise<TrendingResult[]> {
    try {
      const { data, error } = await supabase
        .from('trending_cache')
        .select(`
          resource_id,
          trending_score,
          rank_position,
          resources!inner(title, sports, price, coach_profiles!inner(first_name, last_name))
        `)
        .order('rank_position', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.resource_id,
        title: item.resources.title,
        sport: item.resources.sports[0] || '',
        price_cents: Math.round(item.resources.price * 100),
        trending_score: item.trending_score,
        rank_position: item.rank_position,
        coach_name: `${item.resources.coach_profiles.first_name} ${item.resources.coach_profiles.last_name}`
      }));
    } catch (error) {
      console.error('Fallback trending error:', error);
      return [];
    }
  }

  async getRecommendations(resourceId: string, limit: number = 12): Promise<RecommendationResult[]> {
    try {
      // Simple recommendations based on same sport/category
      const { data: sourceResource } = await supabase
        .from('resources')
        .select('sports, levels, category')
        .eq('id', resourceId)
        .maybeSingle();

      if (!sourceResource) return [];

      const { data, error } = await supabase
        .from('resources')
        .select(`
          id,
          title,
          sports,
          levels,
          price,
          rating,
          purchase_count
        `)
        .eq('status', 'active')
        .eq('is_listed', true)
        .neq('id', resourceId)
        .overlaps('sports', sourceResource.sports)
        .order('purchase_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((resource, index) => ({
        id: resource.id,
        title: resource.title,
        sport: resource.sports[0] || '',
        level: resource.levels[0] || '',
        price_cents: Math.round(resource.price * 100),
        rating: resource.rating || 0,
        purchase_count: resource.purchase_count || 0,
        similarity_score: 1.0 - (index * 0.1),
        reason: 'same_sport' as const
      }));
    } catch (error) {
      console.error('Fallback recommendations error:', error);
      return [];
    }
  }

  // Stub implementations for indexing (not used in fallback mode)
  async indexResource(document: SearchDocument): Promise<void> {
    // No-op for fallback
  }

  async removeResource(resourceId: string): Promise<void> {
    // No-op for fallback
  }

  async reindexAll(documents: SearchDocument[]): Promise<void> {
    // No-op for fallback
  }

  async isHealthy(): Promise<boolean> {
    return true; // Fallback is always "healthy"
  }
}