import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Grid2x2 as Grid, List, Star, TrendingUp, Clock, Award, Loader } from 'lucide-react';
import { resourceStorage } from '../lib/localStorage';
import { useMembership } from '../hooks/useMembership';
import { canDownloadFull, isInTrial } from '../lib/membership';
import ResourceCard from './ResourceCard';
import SearchBar from './SearchBar';
import AdvancedFilters from './AdvancedFilters';
import SearchResults from './SearchResults';
import { SearchFilters, SearchResult } from '../lib/search/types';
import { getApiUrl } from '../lib/apiConfig';

const BrowseResources: React.FC = () => {
  const { membership } = useMembership();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize search from URL params
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [searchParams]);
  // Featured categories for quick filtering
  const featuredCategories = [
    { name: 'Practice Plans', icon: '📋', count: 45 },
    { name: 'Drill Collections', icon: '🏃', count: 32 },
    { name: 'Playbooks', icon: '📖', count: 28 },
    { name: 'Training Programs', icon: '💪', count: 19 }
  ];

  // Get resources from localStorage
  const allResources = resourceStorage.getActiveResources();
  
  // Check user access level
  const canDownload = membership ? canDownloadFull(membership) : false;
  const inTrial = membership ? isInTrial(membership) : false;
  
  // Perform search when query or filters change
  useEffect(() => {
    performSearch();
  }, [searchQuery, filters, sortBy, currentPage]);

  const performSearch = async () => {
    setLoading(true);
    setError('');

    try {
      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filters.sport) params.set('sport', filters.sport);
      if (filters.level) params.set('level', filters.level);
      if (filters.category) params.set('category', filters.category);
      params.set('limit', '20');
      params.set('offset', String((currentPage - 1) * 20));

      const response = await fetch(getApiUrl(`/api/resources?${params.toString()}`));
      const result = await response.json();

      if (result.data) {
        // Transform to SearchResult format
        const searchResult: SearchResult = {
          hits: result.data.map((resource: any) => ({
            id: resource.id,
            title: resource.title,
            description: resource.description,
            sport: resource.sports?.[0] || '',
            level: resource.levels?.[0] || '',
            file_type: 'pdf',
            price_cents: resource.price_cents || 0,
            rating: resource.rating || 0,
            purchase_count: resource.downloads || 0,
            view_count: (resource.downloads || 0) * 2,
            uploaded_at: resource.created_at,
            coach_name: `${resource.profiles?.first_name || ''} ${resource.profiles?.last_name || ''}`.trim() || 'Coach',
            coach_id: resource.owner_id
          })),
          totalHits: result.data.length,
          page: currentPage,
          totalPages: Math.ceil(result.data.length / 20),
          processingTimeMS: 0
        };
        setSearchResult(searchResult);
      } else {
        throw new Error('No data returned');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Unable to load resources. Please try again.');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('q', query);
    } else {
      newParams.delete('q');
    }
    setSearchParams(newParams);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleResourceClick = async (resourceId: string, query?: string) => {
    // Track click for analytics
    try {
      await fetch('/api/search/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query || searchQuery,
          resourceId,
          sessionId: `session_${Date.now()}`
        })
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
    
    // Navigate to resource page
    window.location.href = `/resource/${resourceId}`;
  };

  const handleQuickFilter = (sport: string) => {
    const newSports = filters.sports?.includes(sport) 
      ? filters.sports.filter(s => s !== sport)
      : [...(filters.sports || []), sport];
    
    setFilters(prev => ({ ...prev, sports: newSports }));
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
    setCurrentPage(1);
    // Clear URL params
    setSearchParams(new URLSearchParams());
  };

  return (
    <section id="browse" className="py-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Browse <span className="text-emerald-600">Coaching Resources</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover game-changing resources created by coaches, for coaches across all sports and levels
          </p>
        </div>

        {/* Quick Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          className="max-w-2xl mx-auto mb-8"
        />

        {/* Featured Categories */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Popular Categories</h3>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🎯 <strong>Try this:</strong> Click categories below, search "basketball" or "soccer", or sign in and create your own profile to upload resources!
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => handleQuickFilter(category.name.split(' ')[0])}
                className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  filters.sports?.includes(category.name.split(' ')[0])
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <div className="font-semibold text-sm">{category.name}</div>
                <div className="text-xs text-gray-500">{category.count} resources</div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters & View Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  showFilters || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== undefined)
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="relevance">Most Relevant</option>
                <option value="newest">Newest First</option>
                <option value="trending">Trending</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="popular">Most Downloads</option>
              </select>

              {(searchQuery || Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== undefined)) && (
                <button
                  onClick={clearAllFilters}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {loading ? 'Searching...' : `${searchResult?.totalHits || 0} resources`}
              </span>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <AdvancedFilters 
            filters={filters}
            onFiltersChange={handleFiltersChange}
            facets={searchResult?.facets}
            className="mb-8"
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <Loader className="w-8 h-8 text-emerald-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Searching resources...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Search Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={performSearch}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Search Results */}
        {!loading && !error && searchResult && (
          <SearchResults
            searchResult={searchResult}
            onPageChange={handlePageChange}
            onResourceClick={handleResourceClick}
            viewMode={viewMode}
          />
        )}

        {/* Empty State for No Search */}
        {!loading && !error && !searchResult && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Start Your Search
            </h3>
            <p className="text-gray-600 mb-6">
              Search for coaching resources by sport, level, or keyword
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>💡 <strong>Try:</strong> "basketball drills", "football playbook", "soccer training"</p>
              <p>🏷️ <strong>Filter by:</strong> Sport, level, or file type</p>
            </div>
          </div>
        )}

        {/* Trending & Featured Section */}
        {!searchQuery && !Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== undefined) && (
          <div className="mt-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Trending Resources */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-5 h-5 text-orange-500 mr-2" />
                  <h3 className="text-lg font-semibold text-slate-900">Trending Now</h3>
                </div>
                <div className="space-y-3">
                  {allResources.slice(0, 3).map((resource, index) => (
                    <div key={resource.id} className="flex items-center space-x-3">
                      <span className="text-orange-500 font-bold text-sm">#{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{resource.title}</p>
                        <p className="text-sm text-gray-500">{resource.downloads} downloads</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Rated */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-slate-900">Top Rated</h3>
                </div>
                <div className="space-y-3">
                  {[...allResources].sort((a, b) => b.rating - a.rating).slice(0, 3).map((resource) => (
                    <div key={resource.id} className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{resource.rating}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{resource.title}</p>
                        <p className="text-sm text-gray-500">${resource.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recently Added */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <Clock className="w-5 h-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-slate-900">Recently Added</h3>
                </div>
                <div className="space-y-3">
                  {[...allResources].sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  ).slice(0, 3).map((resource) => (
                    <div key={resource.id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{resource.title}</p>
                        <p className="text-sm text-gray-500">
                          {Math.floor((new Date().getTime() - new Date(resource.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default BrowseResources;