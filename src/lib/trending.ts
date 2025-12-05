// Trending algorithm utilities for Coach2Coach
import { supabase } from './supabase';

export interface TrendingScore {
  resourceId: string;
  score: number;
  purchases: number;
  views: number;
  ageDays: number;
}

// Compute trending score for a single resource
export function computeTrendingScore(
  purchases: number,
  views: number,
  uploadedAt: string
): number {
  // Raw engagement score: purchases worth 3x views
  const rawScore = purchases * 3.0 + views * 0.5;
  
  // Age decay: newer content gets boost
  const now = new Date();
  const uploaded = new Date(uploadedAt);
  const ageDays = Math.max(1, Math.floor((now.getTime() - uploaded.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Decay factor: divide by (1 + age_days/7)
  const decayFactor = 1.0 + (ageDays / 7.0);
  
  return rawScore / decayFactor;
}

// Compute trending scores for all resources
export async function computeAllTrendingScores(): Promise<TrendingScore[]> {
  try {
    const { data: resources, error } = await supabase
      .from('resources')
      .select('id, purchase_count, view_count, uploaded_at, created_at')
      .eq('status', 'active')
      .eq('is_listed', true);

    if (error) throw error;

    const scores: TrendingScore[] = (resources || []).map(resource => {
      const uploadedAt = resource.uploaded_at || resource.created_at;
      const score = computeTrendingScore(
        resource.purchase_count || 0,
        resource.view_count || 0,
        uploadedAt
      );

      return {
        resourceId: resource.id,
        score,
        purchases: resource.purchase_count || 0,
        views: resource.view_count || 0,
        ageDays: Math.floor((new Date().getTime() - new Date(uploadedAt).getTime()) / (1000 * 60 * 60 * 24))
      };
    });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    return scores;
  } catch (error) {
    console.error('Error computing trending scores:', error);
    return [];
  }
}

// Refresh the trending cache in database
export async function refreshTrendingCache(): Promise<void> {
  try {
    const { error } = await supabase.rpc('refresh_trending_cache');
    if (error) throw error;
    
    console.log('Trending cache refreshed successfully');
  } catch (error) {
    console.error('Error refreshing trending cache:', error);
    throw error;
  }
}

// Get trending resources from cache
export async function getTrendingFromCache(limit: number = 12): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('trending_cache')
      .select(`
        resource_id,
        trending_score,
        rank_position,
        resources!inner(
          title,
          sports,
          price,
          rating,
          coach_profiles!inner(first_name, last_name)
        )
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
      rating: item.resources.rating || 0,
      coach_name: `${item.resources.coach_profiles.first_name} ${item.resources.coach_profiles.last_name}`
    }));
  } catch (error) {
    console.error('Error getting trending from cache:', error);
    return [];
  }
}

// Schedule trending cache refresh (call this from a cron job)
export async function scheduleTrendingRefresh(): Promise<void> {
  try {
    await refreshTrendingCache();
    console.log('Scheduled trending refresh completed');
  } catch (error) {
    console.error('Scheduled trending refresh failed:', error);
  }
}