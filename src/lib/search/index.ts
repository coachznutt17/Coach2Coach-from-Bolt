// Search client adapter pattern for Coach2Coach
import { SearchClient, SearchResult, SearchFilters, TrendingResult, RecommendationResult } from './types';
import { AlgoliaSearchClient } from './algolia';
import { ElasticSearchClient } from './elasticsearch';

// Search configuration
export const SEARCH_CONFIG = {
  vendor: (process.env.SEARCH_VENDOR || 'algolia') as 'algolia' | 'elastic',
  algolia: {
    appId: process.env.ALGOLIA_APP_ID || '',
    adminApiKey: process.env.ALGOLIA_ADMIN_API_KEY || '',
    searchApiKey: process.env.ALGOLIA_SEARCH_API_KEY || '',
    indexName: process.env.ALGOLIA_INDEX_RESOURCES || 'coach2coach_resources'
  },
  elastic: {
    nodeUrl: process.env.ELASTIC_NODE_URL || '',
    username: process.env.ELASTIC_USERNAME || '',
    password: process.env.ELASTIC_PASSWORD || '',
    indexName: process.env.ELASTIC_INDEX_RESOURCES || 'coach2coach_resources'
  }
};

// Create search client based on configuration
export function createSearchClient(): SearchClient {
  switch (SEARCH_CONFIG.vendor) {
    case 'algolia':
      return new AlgoliaSearchClient(SEARCH_CONFIG.algolia);
    case 'elastic':
      return new ElasticSearchClient(SEARCH_CONFIG.elastic);
    default:
      throw new Error(`Unsupported search vendor: ${SEARCH_CONFIG.vendor}`);
  }
}

// Singleton search client
let searchClient: SearchClient | null = null;

export function getSearchClient(): SearchClient {
  if (!searchClient) {
    searchClient = createSearchClient();
  }
  return searchClient;
}

// Re-export types for convenience
export * from './types';