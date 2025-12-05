import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole, getAudienceContent } from '../lib/userRole';

const CATEGORIES = ['Baseball', 'Football', 'Basketball', 'Soccer', 'Strength & Conditioning'];

export default function Hero() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCoach, setIsCoach] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserRole() {
      const role = await getUserRole(user?.id || null);
      setIsCoach(role.isCoach);
      setLoading(false);
    }
    loadUserRole();
  }, [user]);

  const content = getAudienceContent(isCoach);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/browse');
    }
  }

  function handleCategoryClick(category: string) {
    navigate(`/browse?sport=${encodeURIComponent(category)}`);
  }

  if (loading) {
    return (
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 text-6xl font-bold">X</div>
        <div className="absolute top-40 right-20 text-6xl font-bold">O</div>
        <div className="absolute bottom-20 left-20 text-4xl">→</div>
        <div className="absolute bottom-40 right-10 text-4xl">↗</div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-5xl md:text-7xl mb-4 text-emerald-400 font-bold whitespace-nowrap">
            {content.hero.subtitle}
          </p>

          <h1 className="text-2xl md:text-4xl font-bold mb-6 leading-tight">
            {content.hero.title}
          </h1>

          <p className="text-lg md:text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            {content.hero.description}
          </p>

          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={content.hero.searchPlaceholder}
                className="w-full px-6 py-4 pr-12 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-emerald-500"
                aria-label="Search coaching resources"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-900"
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(content.ctas.primaryLink)}
              className="bg-emerald-600 hover:bg-emerald-700 px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 flex items-center justify-center text-white focus:outline-none focus:ring-4 focus:ring-emerald-500"
            >
              {content.ctas.primary}
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={() => navigate(content.ctas.secondaryLink)}
              className="border-2 border-white hover:bg-white hover:text-slate-900 px-8 py-4 rounded-lg font-bold text-lg transition-all text-white flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-white"
            >
              {content.ctas.secondary}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
