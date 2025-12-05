import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, DollarSign, Star, Calendar } from 'lucide-react';

interface SearchFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
}

export interface FilterState {
  searchTerm: string;
  sports: string[];
  levels: string[];
  categories: string[];
  priceRange: [number, number];
  rating: number;
  sortBy: string;
  dateRange: string;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onFiltersChange, totalResults }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    sports: [],
    levels: [],
    categories: [],
    priceRange: [0, 100],
    rating: 0,
    sortBy: 'newest',
    dateRange: 'all'
  });

  const sports = [
    'Basketball', 'Football', 'Baseball', 'Soccer', 'Volleyball', 
    'Tennis', 'Track & Field', 'Swimming', 'Wrestling', 'Golf',
    'Softball', 'Cross Country', 'Lacrosse', 'Hockey'
  ];

  const levels = [
    'Youth (Ages 6-12)', 'Middle School', 'High School', 
    'Travel/Club', 'Collegiate', 'Professional', 'Adult Recreation'
  ];

  const categories = [
    'Practice Plans', 'Drill Collections', 'Playbooks', 'Training Programs',
    'Strategy Guides', 'Skill Development', 'Conditioning Plans', 'Game Analysis',
    'Player Development', 'Team Building', 'Mental Training', 'Recruiting Guides'
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'title', label: 'Alphabetical' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'Past Week' },
    { value: 'month', label: 'Past Month' },
    { value: '3months', label: 'Past 3 Months' },
    { value: 'year', label: 'Past Year' }
  ];

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const toggleArrayFilter = (array: string[], value: string, key: keyof FilterState) => {
    const newArray = array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
    updateFilters({ [key]: newArray });
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      searchTerm: '',
      sports: [],
      levels: [],
      categories: [],
      priceRange: [0, 100],
      rating: 0,
      sortBy: 'newest',
      dateRange: 'all'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFilterCount = filters.sports.length + filters.levels.length + filters.categories.length + (filters.rating > 0 ? 1 : 0) + (filters.dateRange !== 'all' ? 1 : 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 animate-in slide-in-from-top duration-300">
      {/* Search Bar */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Advanced Filters</h3>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Clear all ({activeFilterCount})
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Sports Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sports</h3>
            <div className="flex flex-wrap gap-2">
              {sports.map(sport => (
                <button
                  key={sport}
                  onClick={() => toggleArrayFilter(filters.sports, sport, 'sports')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.sports.includes(sport)
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          {/* Levels Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Coaching Levels</h3>
            <div className="flex flex-wrap gap-2">
              {levels.map(level => (
                <button
                  key={level}
                  onClick={() => toggleArrayFilter(filters.levels, level, 'levels')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.levels.includes(level)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleArrayFilter(filters.categories, category, 'categories')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.categories.includes(category)
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price Range */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Price Range
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">$</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.priceRange[0]}
                    onChange={(e) => updateFilters({ 
                      priceRange: [parseInt(e.target.value), filters.priceRange[1]] 
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600">${filters.priceRange[0]}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">$</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.priceRange[1]}
                    onChange={(e) => updateFilters({ 
                      priceRange: [filters.priceRange[0], parseInt(e.target.value)] 
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600">${filters.priceRange[1]}+</span>
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Star className="w-4 h-4 mr-1" />
                Minimum Rating
              </h3>
              <div className="space-y-2">
                {[4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    onClick={() => updateFilters({ rating: filters.rating === rating ? 0 : rating })}
                    className={`flex items-center w-full p-2 rounded-lg text-sm transition-colors ${
                      filters.rating === rating
                        ? 'bg-yellow-50 border border-yellow-300'
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-gray-700">{rating}+ stars</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Upload Date
              </h3>
              <select
                value={filters.dateRange}
                onChange={(e) => updateFilters({ dateRange: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;