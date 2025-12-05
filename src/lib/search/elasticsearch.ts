// Elasticsearch client implementation (alternative to Algolia)
import { SearchClient, SearchDocument, SearchQuery, SearchResult, SearchHit, TrendingResult, RecommendationResult } from './types';

interface ElasticConfig {
  nodeUrl: string;
  username: string;
  password: string;
  indexName: string;
}

export class ElasticSearchClient implements SearchClient {
  private baseUrl: string;
  private auth: string;
  private indexName: string;

  constructor(private config: ElasticConfig) {
    this.baseUrl = config.nodeUrl;
    this.auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    this.indexName = config.indexName;
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${this.auth}`
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`Elasticsearch error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    try {
      const { q = '', page = 1, perPage = 20, filters = {}, sort = 'relevance' } = query;
      
      const searchBody = {
        query: this.buildElasticQuery(q, filters),
        sort: this.buildElasticSort(sort),
        from: (page - 1) * perPage,
        size: perPage,
        highlight: {
          fields: {
            title: {},
            description: {},
            tags: {}
          }
        },
        aggs: {
          sports: { terms: { field: 'sport.keyword' } },
          levels: { terms: { field: 'level.keyword' } },
          file_types: { terms: { field: 'file_type.keyword' } }
        }
      };

      const result = await this.request('POST', `/${this.indexName}/_search`, searchBody);
      
      return {
        hits: result.hits.hits.map(this.transformElasticHit),
        totalHits: result.hits.total.value,
        page,
        totalPages: Math.ceil(result.hits.total.value / perPage),
        processingTimeMS: result.took,
        facets: this.transformElasticAggregations(result.aggregations)
      };
    } catch (error) {
      console.error('Elasticsearch search error:', error);
      throw new Error('Search temporarily unavailable');
    }
  }

  private buildElasticQuery(q: string, filters: any): any {
    const must: any[] = [];
    const filter: any[] = [];

    // Always filter to listed resources
    filter.push({ term: { is_listed: true } });

    // Text search
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ['title^3', 'description^2', 'tags^2', 'sport', 'level'],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    } else {
      must.push({ match_all: {} });
    }

    // Filters
    if (filters.sports?.length > 0) {
      filter.push({ terms: { 'sport.keyword': filters.sports } });
    }
    
    if (filters.levels?.length > 0) {
      filter.push({ terms: { 'level.keyword': filters.levels } });
    }
    
    if (filters.file_types?.length > 0) {
      filter.push({ terms: { 'file_type.keyword': filters.file_types } });
    }
    
    if (filters.price_min !== undefined || filters.price_max !== undefined) {
      const range: any = {};
      if (filters.price_min !== undefined) range.gte = filters.price_min;
      if (filters.price_max !== undefined) range.lte = filters.price_max;
      filter.push({ range: { price_cents: range } });
    }

    return {
      bool: {
        must,
        filter
      }
    };
  }

  private buildElasticSort(sort: string): any[] {
    switch (sort) {
      case 'newest':
        return [{ uploaded_at: { order: 'desc' } }];
      case 'price_asc':
        return [{ price_cents: { order: 'asc' } }];
      case 'price_desc':
        return [{ price_cents: { order: 'desc' } }];
      case 'rating':
        return [{ rating: { order: 'desc' } }];
      case 'popular':
        return [{ purchase_count: { order: 'desc' } }];
      case 'trending':
        return [
          { purchase_count: { order: 'desc' } },
          { view_count: { order: 'desc' } }
        ];
      default:
        return ['_score']; // Relevance
    }
  }

  private transformElasticHit(hit: any): SearchHit {
    return {
      id: hit._id,
      title: hit._source.title,
      description: hit._source.description,
      sport: hit._source.sport,
      level: hit._source.level,
      file_type: hit._source.file_type,
      price_cents: hit._source.price_cents,
      rating: hit._source.rating || 0,
      purchase_count: hit._source.purchase_count || 0,
      view_count: hit._source.view_count || 0,
      uploaded_at: hit._source.uploaded_at,
      coach_name: hit._source.coach_name,
      coach_id: hit._source.coach_id,
      _highlightResult: hit.highlight ? {
        title: hit.highlight.title?.[0] ? { value: hit.highlight.title[0], matchLevel: 'full' } : undefined,
        description: hit.highlight.description?.[0] ? { value: hit.highlight.description[0], matchLevel: 'full' } : undefined
      } : undefined
    };
  }

  private transformElasticAggregations(aggs: any): any {
    if (!aggs) return {};
    
    const result: any = {};
    
    if (aggs.sports) {
      result.sports = {};
      aggs.sports.buckets.forEach((bucket: any) => {
        result.sports[bucket.key] = bucket.doc_count;
      });
    }
    
    if (aggs.levels) {
      result.levels = {};
      aggs.levels.buckets.forEach((bucket: any) => {
        result.levels[bucket.key] = bucket.doc_count;
      });
    }
    
    if (aggs.file_types) {
      result.file_types = {};
      aggs.file_types.buckets.forEach((bucket: any) => {
        result.file_types[bucket.key] = bucket.doc_count;
      });
    }
    
    return result;
  }

  async indexResource(document: SearchDocument): Promise<void> {
    try {
      await this.request('PUT', `/${this.indexName}/_doc/${document.id}`, document);
    } catch (error) {
      console.error('Elasticsearch index error:', error);
      throw error;
    }
  }

  async removeResource(resourceId: string): Promise<void> {
    try {
      await this.request('DELETE', `/${this.indexName}/_doc/${resourceId}`);
    } catch (error) {
      console.error('Elasticsearch delete error:', error);
      throw error;
    }
  }

  async reindexAll(documents: SearchDocument[]): Promise<void> {
    try {
      // Delete index
      try {
        await this.request('DELETE', `/${this.indexName}`);
      } catch (error) {
        // Index might not exist, continue
      }
      
      // Create index with mapping
      await this.request('PUT', `/${this.indexName}`, {
        mappings: {
          properties: {
            title: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            tags: { type: 'text', analyzer: 'standard' },
            sport: { 
              type: 'text',
              fields: { keyword: { type: 'keyword' } }
            },
            level: { 
              type: 'text',
              fields: { keyword: { type: 'keyword' } }
            },
            file_type: { 
              type: 'text',
              fields: { keyword: { type: 'keyword' } }
            },
            price_cents: { type: 'integer' },
            uploaded_at: { type: 'date' },
            purchase_count: { type: 'integer' },
            view_count: { type: 'integer' },
            rating: { type: 'float' },
            is_listed: { type: 'boolean' }
          }
        }
      });
      
      // Bulk index documents
      if (documents.length > 0) {
        const bulkBody = documents.flatMap(doc => [
          { index: { _index: this.indexName, _id: doc.id } },
          doc
        ]);
        
        await this.request('POST', '/_bulk', bulkBody.map(item => JSON.stringify(item)).join('\n') + '\n');
      }
    } catch (error) {
      console.error('Elasticsearch reindex error:', error);
      throw error;
    }
  }

  async getTrending(limit: number = 12): Promise<TrendingResult[]> {
    // Fallback to simple sort for Elasticsearch
    return [];
  }

  async getRecommendations(resourceId: string, limit: number = 12): Promise<RecommendationResult[]> {
    // Fallback to simple recommendations for Elasticsearch
    return [];
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.request('GET', '/_cluster/health');
      return true;
    } catch (error) {
      return false;
    }
  }
}