// Search results grid with highlighting and pagination
import React from 'react';
import { Star, Download, Eye, User, Calendar, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchResult, SearchHit } from '../lib/search/types';
import { profileStorage } from '../lib/localStorage';

interface SearchResultsProps {
  searchResult: SearchResult;
  onPageChange: (page: number) => void;
  onResourceClick: (resourceId: string, query?: string) => void;
  viewMode?: 'grid' | 'list';
  className?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  searchResult,
  onPageChange,
  onResourceClick,
  viewMode = 'grid',
  className = ""
}) => {
  const { hits, totalHits, page, totalPages, processingTimeMS } = searchResult;

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const renderHighlightedText = (text: string, highlight?: { value: string; matchLevel: string }) => {
    if (highlight?.value) {
      return <span dangerouslySetInnerHTML={{ __html: highlight.value }} />;
    }
    return text;
  };

  const SearchResultCard: React.FC<{ hit: SearchHit }> = ({ hit }) => {
    if (viewMode === 'list') {
      return (
        <div 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
          onClick={() => onResourceClick(hit.id)}
        >
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Tag className="w-8 h-8 text-emerald-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold text-slate-900">
                  {renderHighlightedText(hit.title, hit._highlightResult?.title)}
                </h3>
                <span className="text-2xl font-bold text-emerald-600 ml-4">
                  {formatPrice(hit.price_cents)}
                </span>
              </div>
              
              <p className="text-gray-600 mb-3 line-clamp-2">
                {renderHighlightedText(hit.description, hit._highlightResult?.description)}
              </p>
              
              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-sm text-gray-600">{hit.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center">
                  <Download className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-600">{hit.purchase_count}</span>
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-600">{hit.view_count}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                  <span className="text-sm text-gray-600">{formatTimeAgo(hit.uploaded_at)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                    {hit.sport}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {hit.level}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    {hit.file_type.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                    <User className="w-3 h-3 text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-600">{hit.coach_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Grid view
    return (
      <div 
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
        onClick={() => onResourceClick(hit.id)}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                {renderHighlightedText(hit.title, hit._highlightResult?.title)}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                {renderHighlightedText(hit.description, hit._highlightResult?.description)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-sm text-gray-600">{hit.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center">
                <Download className="w-4 h-4 text-gray-400 mr-1" />
                <span className="text-sm text-gray-600">{hit.purchase_count}</span>
              </div>
            </div>
            <span className="text-xl font-bold text-emerald-600">
              {formatPrice(hit.price_cents)}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
              {hit.sport}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {hit.level}
            </span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              {hit.file_type.toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                <User className="w-3 h-3 text-gray-600" />
              </div>
              <span className="text-sm text-gray-600">{hit.coach_name}</span>
            </div>
            
            <span className="text-xs text-gray-500">{formatTimeAgo(hit.uploaded_at)}</span>
          </div>
        </div>
      </div>
    );
  };

  if (hits.length === 0) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="text-4xl">🔍</div>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-4">No Results Found</h3>
        <p className="text-gray-600 mb-6">
          Try adjusting your search terms or filters to find what you're looking for.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>💡 <strong>Try:</strong> "basketball drills", "football playbook", "soccer training"</p>
          <p>🏷️ <strong>Filter by:</strong> Sport, level, or file type</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-600">
            <span className="font-semibold">{totalHits.toLocaleString()}</span> results
            {processingTimeMS > 0 && (
              <span className="text-gray-400 ml-2">({processingTimeMS}ms)</span>
            )}
          </p>
        </div>
        
        <div className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </div>
      </div>

      {/* Results Grid/List */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
      } mb-8`}>
        {hits.map((hit) => (
          <SearchResultCard key={hit.id} hit={hit} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages, page - 2 + i));
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pageNum === page
                      ? 'bg-emerald-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;