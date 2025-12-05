// Dev stub: disables Algolia calls so the server can run in Bolt
// Swap back to the real client when running locally with proper env keys.

type SearchQuery = {
  q?: string;
  page?: number;
  perPage?: number;
  filters?: Record<string, unknown>;
  sort?: string;
};

export class AlgoliaSearchClient {
  // Keep the constructor signature so the rest of the app compiles
  constructor(config: any) {
    // no-op in dev
  }

  async configureIndex(): Promise<void> {
    // no-op
  }

  async search(query: SearchQuery) {
    // basic empty result so UI renders without errors
    return {
      hits: [],
      totalHits: 0,
      page: 1,
      totalPages: 1,
      processingTimeMS: 1,
      facets: {},
    };
  }

  // The rest are safe no-ops used by reindex/trending/etc.
  async indexResource(_doc: any): Promise<void> {}
  async removeResource(_resourceId: string): Promise<void> {}
  async reindexAll(_documents: any[]): Promise<void> {}
  async getTrending(_limit = 12): Promise<any[]> { return []; }
  async getRecommendations(_resourceId: string, _limit = 12): Promise<any[]> { return []; }
  async isHealthy(): Promise<boolean> { return true; }
}
