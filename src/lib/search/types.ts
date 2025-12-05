// Search types and interfaces for Coach2Coach

export interface SearchDocument {
  id: string;
  title: string;
  description: string;
  tags: string[];
  sport: string;
  level: string;
  file_type: string;
  price_cents: number;
  uploaded_at: string;
  purchase_count: number;
  view_count: number;
  rating: number;
  is_listed: boolean;
  coach_name?: string;
  coach_id?: string;
}

export interface SearchFilters {
  sports?: string[];
  levels?: string[];
  file_types?: string[];
  price_min?: number;
  price_max?: number;
  uploaded_from?: string;
  uploaded_to?: string;
  rating_min?: number;
  tags?: string[];
}

export interface SearchQuery {
  q?: string;
  page?: number;
  perPage?: number;
  filters?: SearchFilters;
  sort?: 'relevance' | 'newest' | 'trending' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
}

export interface SearchHit {
  id: string;
  title: string;
  description: string;
  sport: string;
  level: string;
  file_type: string;
  price_cents: number;
  rating: number;
  purchase_count: number;
  view_count: number;
  uploaded_at: string;
  coach_name?: string;
  coach_id?: string;
  _highlightResult?: {
    title?: { value: string; matchLevel: string };
    description?: { value: string; matchLevel: string };
    tags?: Array<{ value: string; matchLevel: string }>;
  };
}

export interface SearchResult {
  hits: SearchHit[];
  totalHits: number;
  page: number;
  totalPages: number;
  processingTimeMS: number;
  facets?: {
    sports: { [key: string]: number };
    levels: { [key: string]: number };
    file_types: { [key: string]: number };
    price_ranges: { [key: string]: number };
  };
}

export interface TrendingResult {
  id: string;
  title: string;
  sport: string;
  price_cents: number;
  trending_score: number;
  rank_position: number;
  coach_name?: string;
}

export interface RecommendationResult {
  id: string;
  title: string;
  sport: string;
  level: string;
  price_cents: number;
  rating: number;
  purchase_count: number;
  similarity_score: number;
  reason: 'co_purchase' | 'similar_content' | 'same_coach' | 'same_sport';
}

export interface SearchClient {
  // Core search
  search(query: SearchQuery): Promise<SearchResult>;
  
  // Indexing
  indexResource(document: SearchDocument): Promise<void>;
  removeResource(resourceId: string): Promise<void>;
  reindexAll(documents: SearchDocument[]): Promise<void>;
  
  // Analytics
  getTrending(limit?: number): Promise<TrendingResult[]>;
  getRecommendations(resourceId: string, limit?: number): Promise<RecommendationResult[]>;
  
  // Health
  isHealthy(): Promise<boolean>;
}

export interface SearchAnalytics {
  query: string;
  filters: SearchFilters;
  resultsCount: number;
  clickedResourceId?: string;
  sessionId?: string;
  userId?: string;
}