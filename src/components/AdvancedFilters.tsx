// Advanced filters panel for search
import React, { useState } from 'react';
import { Filter, X, DollarSign, Star, Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { SearchFilters } from '../lib/search/types';

interface AdvancedFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  facets?: {
    sports: { [key: string]: number };
    levels: { [key: string]: number };
    file_types: { [key: string]: number };
    price_ranges: { [key: string]: number };
  };
  className?: string;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  facets,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sports', 'levels']));

  const sports = [
    'Basketball', 'Football', 'Baseball', 'Soccer', 'Volleyball', 
    'Tennis', 'Track & Field', 'Swimming', 'Wrestling', 'Golf',
    'Softball', 'Cross Country', 'Lacrosse', 'Hockey'
  ];

  const levels = [
    'Youth (Ages 6-12)', 'Middle School', 'High School', 
    'Travel/Club', 'Collegiate', 'Professional', 'Adult Recreation'
  ];

  const fileTypes = [
    { value: 'pdf', label: 'PDF Documents', icon: '📄' },
    { value: 'video', label: 'Video Files', icon: '🎥' },
    { value: 'pptx', label: 'Presentations', icon: '📊' },
    { value: 'docx', label: 'Word Documents', icon: '📝' },
    { value: 'xlsx', label: 'Spreadsheets', icon: '📈' },
    { value: 'image', label: 'Images', icon: '🖼️' }
  ];

  const priceRanges = [
    { min: 0, max: 499, label: 'Under $5' },
    { min: 500, max: 999, label: '$5 - $10' },
    { min: 1000, max: 1999, label: '$10 - $20' },
    { min: 2000, max: 4999, label: '$20 - $50' },
    { min: 5000, max: 999999, label: '$50+' }
  ];

  const updateFilters = (updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleArrayFilter = (array: string[] = [], value: string, key: keyof SearchFilters) => {
    const newArray = array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
    updateFilters({ [key]: newArray });
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const activeFilterCount = (filters.sports?.length || 0) + 
                          (filters.levels?.length || 0) + 
                          (filters.file_types?.length || 0) + 
                          (filters.price_min !== undefined || filters.price_max !== undefined ? 1 : 0) +
                          (filters.rating_min ? 1 : 0);

  const FilterSection: React.FC<{ 
    title: string; 
    sectionKey: string; 
    children: React.ReactNode;
    count?: number;
  }> = ({ title, sectionKey, children, count }) => {
    const isOpen = expandedSections.has(sectionKey);
    
    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between py-4 px-6 text-left hover:bg-gray-50"
        >
          <div className="flex items-center">
            <span className="font-medium text-gray-900">{title}</span>
            {count !== undefined && count > 0 && (
              <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                {count}
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        {isOpen && (
          <div className="px-6 pb-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <Filter className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-slate-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Sections */}
      <div>
        {/* Sports */}
        <FilterSection 
          title="Sports" 
          sectionKey="sports"
          count={filters.sports?.length}
        >
          <div className="grid grid-cols-2 gap-2">
            {sports.map(sport => {
              const count = facets?.sports?.[sport];
              return (
                <button
                  key={sport}
                  onClick={() => toggleArrayFilter(filters.sports, sport, 'sports')}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.sports?.includes(sport)
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>{sport}</span>
                  {count !== undefined && (
                    <span className="text-xs text-gray-500">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Levels */}
        <FilterSection 
          title="Coaching Levels" 
          sectionKey="levels"
          count={filters.levels?.length}
        >
          <div className="space-y-2">
            {levels.map(level => {
              const count = facets?.levels?.[level];
              return (
                <button
                  key={level}
                  onClick={() => toggleArrayFilter(filters.levels, level, 'levels')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.levels?.includes(level)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>{level}</span>
                  {count !== undefined && (
                    <span className="text-xs text-gray-500">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* File Types */}
        <FilterSection 
          title="File Types" 
          sectionKey="file_types"
          count={filters.file_types?.length}
        >
          <div className="space-y-2">
            {fileTypes.map(fileType => {
              const count = facets?.file_types?.[fileType.value];
              return (
                <button
                  key={fileType.value}
                  onClick={() => toggleArrayFilter(filters.file_types, fileType.value, 'file_types')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.file_types?.includes(fileType.value)
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{fileType.icon}</span>
                    <span>{fileType.label}</span>
                  </div>
                  {count !== undefined && (
                    <span className="text-xs text-gray-500">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range" sectionKey="price">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={filters.price_min ? (filters.price_min / 100).toFixed(2) : ''}
                    onChange={(e) => updateFilters({ 
                      price_min: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined 
                    })}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={filters.price_max ? (filters.price_max / 100).toFixed(2) : ''}
                    onChange={(e) => updateFilters({ 
                      price_max: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined 
                    })}
                    placeholder="100.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">Quick Select</label>
              <div className="flex flex-wrap gap-2">
                {priceRanges.map(range => (
                  <button
                    key={`${range.min}-${range.max}`}
                    onClick={() => updateFilters({ 
                      price_min: range.min, 
                      price_max: range.max === 999999 ? undefined : range.max 
                    })}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filters.price_min === range.min && 
                      (filters.price_max === range.max || (range.max === 999999 && !filters.price_max))
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection title="Minimum Rating" sectionKey="rating">
          <div className="space-y-2">
            {[4, 3, 2, 1].map(rating => (
              <button
                key={rating}
                onClick={() => updateFilters({ 
                  rating_min: filters.rating_min === rating ? undefined : rating 
                })}
                className={`w-full flex items-center p-2 rounded-lg text-sm transition-colors ${
                  filters.rating_min === rating
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
        </FilterSection>

        {/* Upload Date */}
        <FilterSection title="Upload Date" sectionKey="date">
          <div className="space-y-2">
            {[
              { value: 'week', label: 'Past Week' },
              { value: 'month', label: 'Past Month' },
              { value: '3months', label: 'Past 3 Months' },
              { value: 'year', label: 'Past Year' }
            ].map(period => {
              const isSelected = filters.uploaded_from === period.value;
              return (
                <button
                  key={period.value}
                  onClick={() => {
                    if (isSelected) {
                      updateFilters({ uploaded_from: undefined, uploaded_to: undefined });
                    } else {
                      const now = new Date();
                      let fromDate: Date;
                      
                      switch (period.value) {
                        case 'week':
                          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                          break;
                        case 'month':
                          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                          break;
                        case '3months':
                          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                          break;
                        case 'year':
                          fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                          break;
                        default:
                          fromDate = new Date(0);
                      }
                      
                      updateFilters({ 
                        uploaded_from: fromDate.toISOString(),
                        uploaded_to: now.toISOString()
                      });
                    }
                  }}
                  className={`w-full flex items-center p-2 rounded-lg text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-300 text-blue-800'
                      : 'hover:bg-gray-50 border border-gray-200 text-gray-700'
                  }`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {period.label}
                </button>
              );
            })}
          </div>
        </FilterSection>
      </div>
    </div>
  );
};

export default AdvancedFilters;