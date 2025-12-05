// Advanced search bar with debounced input and suggestions
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Clock, Filter } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  className?: string;
}

interface SearchSuggestion {
  type: 'query' | 'sport' | 'coach' | 'trending';
  text: string;
  icon?: React.ReactNode;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search for drills, playbooks, training programs...",
  showSuggestions = true,
  className = ""
}) => {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Popular search suggestions
  const popularSuggestions: SearchSuggestion[] = [
    { type: 'trending', text: 'basketball drills', icon: <TrendingUp className="w-4 h-4" /> },
    { type: 'trending', text: 'football playbooks', icon: <TrendingUp className="w-4 h-4" /> },
    { type: 'trending', text: 'soccer training', icon: <TrendingUp className="w-4 h-4" /> },
    { type: 'trending', text: 'youth coaching', icon: <TrendingUp className="w-4 h-4" /> },
    { type: 'sport', text: 'baseball', icon: <Filter className="w-4 h-4" /> },
    { type: 'sport', text: 'volleyball', icon: <Filter className="w-4 h-4" /> },
    { type: 'query', text: 'practice plans', icon: <Clock className="w-4 h-4" /> },
    { type: 'query', text: 'conditioning', icon: <Clock className="w-4 h-4" /> }
  ];

  useEffect(() => {
    if (value.length > 2) {
      // Debounce search suggestions
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions(popularSuggestions);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    if (!showSuggestions) return;
    
    setLoading(true);
    
    try {
      // In a real implementation, you might call an autocomplete API
      // For now, filter popular suggestions
      const filtered = popularSuggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(query.toLowerCase())
      );
      
      setSuggestions(filtered);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch?.(value.trim());
      setFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    onSearch?.(suggestion.text);
    setFocused(false);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-12 pr-12 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm bg-white"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {focused && showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            {value.length <= 2 && (
              <div className="px-3 py-2 text-sm font-medium text-gray-500 border-b border-gray-100">
                Popular Searches
              </div>
            )}
            
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center flex-1">
                  {suggestion.icon && (
                    <div className="mr-3 text-gray-400">
                      {suggestion.icon}
                    </div>
                  )}
                  <span className="text-gray-700">{suggestion.text}</span>
                </div>
                
                {suggestion.type === 'trending' && (
                  <span className="text-xs text-emerald-600 font-medium">Trending</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;