// Recommendation engine for Coach2Coach
import { supabase } from './supabase';
import { RecommendationResult } from './search/types';

export interface CoPurchaseData {
  resourceId: string;
  coResourceId: string;
  count: number;
  recentWeight: number;
}

// Get "also bought" recommendations based on co-purchase data
export async function getAlsoBoughtRecommendations(
  resourceId: string,
  limit: number = 12
): Promise<RecommendationResult[]> {
  try {
    // Find users who bought this resource
    const { data: buyers, error: buyersError } = await supabase
      .from('purchases')
      .select('buyer_id')
      .eq('resource_id', resourceId)
      .eq('status', 'succeeded');

    if (buyersError || !buyers || buyers.length === 0) {
      return getFallbackRecommendations(resourceId, limit);
    }

    const buyerIds = buyers.map(b => b.buyer_id);

    // Find other resources these buyers purchased
    const { data: coPurchases, error: coPurchasesError } = await supabase
      .from('purchases')
      .select(`
        resource_id,
        created_at,
        resources!inner(
          id,
          title,
          sports,
          levels,
          price,
          rating,
          purchase_count,
          status,
          is_listed
        )
      `)
      .in('buyer_id', buyerIds)
      .neq('resource_id', resourceId)
      .eq('status', 'succeeded')
      .eq('resources.status', 'active')
      .eq('resources.is_listed', true);

    if (coPurchasesError || !coPurchases) {
      return getFallbackRecommendations(resourceId, limit);
    }

    // Count co-purchases and apply recency weighting
    const coPurchaseCounts = new Map<string, { count: number; recentWeight: number; resource: any }>();
    
    coPurchases.forEach(purchase => {
      const resourceId = purchase.resource_id;
      const daysSincePurchase = Math.floor(
        (new Date().getTime() - new Date(purchase.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Recent purchases get higher weight (decay over 30 days)
      const recentWeight = Math.max(0.1, 1.0 - (daysSincePurchase / 30));
      
      if (coPurchaseCounts.has(resourceId)) {
        const existing = coPurchaseCounts.get(resourceId)!;
        existing.count += 1;
        existing.recentWeight += recentWeight;
      } else {
        coPurchaseCounts.set(resourceId, {
          count: 1,
          recentWeight,
          resource: purchase.resources
        });
      }
    });

    // Convert to recommendations and sort by score
    const recommendations: RecommendationResult[] = Array.from(coPurchaseCounts.entries())
      .map(([resourceId, data]) => ({
        id: resourceId,
        title: data.resource.title,
        sport: data.resource.sports[0] || '',
        level: data.resource.levels[0] || '',
        price_cents: Math.round(data.resource.price * 100),
        rating: data.resource.rating || 0,
        purchase_count: data.resource.purchase_count || 0,
        similarity_score: data.count * 1.0 + data.recentWeight * 0.25,
        reason: 'co_purchase' as const
      }))
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);

    // If we don't have enough co-purchase recommendations, fill with fallback
    if (recommendations.length < limit) {
      const fallbackRecs = await getFallbackRecommendations(resourceId, limit - recommendations.length);
      recommendations.push(...fallbackRecs);
    }

    return recommendations;
  } catch (error) {
    console.error('Error getting also bought recommendations:', error);
    return getFallbackRecommendations(resourceId, limit);
  }
}

// Fallback recommendations based on content similarity
export async function getFallbackRecommendations(
  resourceId: string,
  limit: number = 12
): Promise<RecommendationResult[]> {
  try {
    // Get source resource details
    const { data: sourceResource, error: sourceError } = await supabase
      .from('resources')
      .select('sports, levels, category, coach_id')
      .eq('id', resourceId)
      .maybeSingle();

    if (sourceError || !sourceResource) {
      return [];
    }

    // Find similar resources by sport, level, and category
    const { data: similarResources, error: similarError } = await supabase
      .from('resources')
      .select(`
        id,
        title,
        sports,
        levels,
        category,
        price,
        rating,
        purchase_count,
        coach_id,
        coach_profiles!inner(first_name, last_name)
      `)
      .eq('status', 'active')
      .eq('is_listed', true)
      .neq('id', resourceId)
      .overlaps('sports', sourceResource.sports)
      .order('purchase_count', { ascending: false })
      .limit(limit * 2); // Get more to filter and rank

    if (similarError || !similarResources) {
      return [];
    }

    // Score recommendations based on similarity
    const recommendations: RecommendationResult[] = similarResources
      .map(resource => {
        let similarityScore = 0;
        let reason: RecommendationResult['reason'] = 'similar_content';

        // Same coach bonus
        if (resource.coach_id === sourceResource.coach_id) {
          similarityScore += 2.0;
          reason = 'same_coach';
        }

        // Sport overlap
        const sportOverlap = resource.sports.filter(sport => 
          sourceResource.sports.includes(sport)
        ).length;
        similarityScore += sportOverlap * 1.5;

        // Level overlap
        const levelOverlap = resource.levels.filter(level => 
          sourceResource.levels.includes(level)
        ).length;
        similarityScore += levelOverlap * 1.0;

        // Category match
        if (resource.category === sourceResource.category) {
          similarityScore += 1.0;
        }

        // Popularity boost
        similarityScore += Math.log(1 + (resource.purchase_count || 0)) * 0.1;

        return {
          id: resource.id,
          title: resource.title,
          sport: resource.sports[0] || '',
          level: resource.levels[0] || '',
          price_cents: Math.round(resource.price * 100),
          rating: resource.rating || 0,
          purchase_count: resource.purchase_count || 0,
          similarity_score: similarityScore,
          reason
        };
      })
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);

    return recommendations;
  } catch (error) {
    console.error('Error getting fallback recommendations:', error);
    return [];
  }
}

// Get recommendations for a specific coach's other resources
export async function getCoachOtherResources(
  resourceId: string,
  coachId: string,
  limit: number = 6
): Promise<RecommendationResult[]> {
  try {
    const { data: resources, error } = await supabase
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
      .eq('coach_id', coachId)
      .eq('status', 'active')
      .eq('is_listed', true)
      .neq('id', resourceId)
      .order('purchase_count', { ascending: false })
      .limit(limit);

    if (error || !resources) {
      return [];
    }

    return resources.map((resource, index) => ({
      id: resource.id,
      title: resource.title,
      sport: resource.sports[0] || '',
      level: resource.levels[0] || '',
      price_cents: Math.round(resource.price * 100),
      rating: resource.rating || 0,
      purchase_count: resource.purchase_count || 0,
      similarity_score: 1.0 - (index * 0.1),
      reason: 'same_coach' as const
    }));
  } catch (error) {
    console.error('Error getting coach other resources:', error);
    return [];
  }
}

// Refresh recommendations cache (call after purchases)
export async function refreshRecommendationsForResource(resourceId: string): Promise<void> {
  try {
    // This would typically update a recommendations cache table
    // For now, we'll just log that recommendations should be refreshed
    console.log(`Recommendations refresh queued for resource: ${resourceId}`);
    
    // In a production system, you might:
    // 1. Update a recommendations_cache table
    // 2. Trigger a background job to recompute
    // 3. Invalidate CDN cache for the resource page
  } catch (error) {
    console.error('Error refreshing recommendations:', error);
  }
}