import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Search, ArrowRight, Bell, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal';
import NotificationCenter from './NotificationCenter';
import Logo from './Logo';

interface HeaderProps {
  cartItems?: number;
}

const Header: React.FC<HeaderProps> = ({ cartItems = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [hasCompleteProfile, setHasCompleteProfile] = useState(true);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.email === 'admin@coach2coachnetwork.com' || user?.email === 'zach@coach2coachnetwork.com';

  useEffect(() => {
    async function checkProfile() {
      if (!user) {
        setHasCompleteProfile(true);
        return;
      }
      try {
        const { data } = await supabase
          .from('profiles')
          .select('bio, title, sports, levels')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          const isComplete = data.bio && data.title && data.sports?.length > 0 && data.levels?.length > 0;
          setHasCompleteProfile(!!isComplete);
        } else {
          setHasCompleteProfile(false);
        }
      } catch (err) {
        console.error('Error checking profile:', err);
      }
    }
    checkProfile();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/browse?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };
  return (
    <>
      {user && !hasCompleteProfile && location.pathname !== '/complete-profile' && (
        <div className="bg-yellow-500 text-slate-900 py-2 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Complete your profile to start uploading resources</span>
            </div>
            <button
              onClick={() => navigate('/complete-profile')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-1 rounded-lg font-semibold transition-colors text-sm"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}
      <header className="bg-slate-900 text-white shadow-lg relative z-50">
        <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-4">
            <Link to="/" className="flex items-center space-x-4">
              <Logo className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold">Coach2Coach</h1>
                <p className="text-sm text-gray-300">Made for Coaches, by Coaches</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-12 flex-1 justify-center ml-32">
            <Link to="/" className={`hover:text-emerald-400 transition-colors ${location.pathname === '/' ? 'text-emerald-400' : ''}`}>
              Home
            </Link>
            <Link to="/browse" className={`hover:text-emerald-400 transition-colors ${location.pathname === '/browse' ? 'text-emerald-400' : ''}`}>
              Browse
            </Link>
            <Link to="/become-seller" className={`hover:text-emerald-400 transition-colors ${location.pathname === '/become-seller' ? 'text-emerald-400' : ''}`}>
              Content Creators
            </Link>
            <Link to="/community-hub" className={`hover:text-emerald-400 transition-colors ${location.pathname === '/community-hub' ? 'text-emerald-400' : ''}`}>
              Coaching Network
            </Link>
            <Link to="/about" className={`hover:text-emerald-400 transition-colors ${location.pathname === '/about' ? 'text-emerald-400' : ''}`}>
              About
            </Link>
            {isAdmin && (
              <Link to="/admin" className="hover:text-emerald-400 transition-colors bg-red-600 px-3 py-1 rounded text-sm">
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications */}
            {user && (
              <NotificationCenter />
            )}
            
            {/* Search */}
            <div className="relative">
              {showSearchInput ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => {
                        if (!searchQuery.trim()) {
                          setTimeout(() => setShowSearchInput(false), 100);
                        }
                      }}
                      placeholder="Search resources..."
                      className="pl-10 pr-4 py-2 w-64 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="ml-2 p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button 
                  onClick={() => setShowSearchInput(true)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              {cartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems}
                </span>
              )}
            </button>
            
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">
                  Welcome, {user.firstName || user.email}
                </span>
                <Link
                  to="/profile"
                  className="border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-lg font-semibold transition-colors text-white no-underline"
                >
                  My Profile
                </Link>
                <Link
                  to="/upload"
                  className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-semibold transition-colors text-white no-underline"
                >
                  Upload
                </Link>
              </div>
            ) : (
              <>
                <div className="text-xs text-gray-400 bg-slate-800 px-2 py-1 rounded">
                  💡 Try: mike.johnson@email.com
                </div>
                <div className="text-xs text-gray-400 bg-slate-800 px-2 py-1 rounded">
                  🆕 Or create new account
                </div>
                <button 
                  onClick={() => {
                    setAuthMode('signin');
                    setIsAuthModalOpen(true);
                  }}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-900 border-t border-slate-800 py-4">
            <nav className="flex flex-col space-y-2 px-4">
              {/* Mobile Search */}
              <div className="py-2 border-b border-slate-800 mb-2">
                <form onSubmit={handleSearch} className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search resources..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
              
              <Link to="/" className="py-2 hover:text-emerald-400 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <Link to="/browse" className="py-2 hover:text-emerald-400 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Browse Resources
              </Link>
              <Link to="/profile" className="py-2 hover:text-emerald-400 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Your Profile
              </Link>
              <Link to="/community" className="py-2 hover:text-emerald-400 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Community
              </Link>
              <Link to="/become-seller" className="py-2 hover:text-emerald-400 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Become a Seller
              </Link>
              <Link to="/about" className="py-2 hover:text-emerald-400 transition-colors" onClick={() => setIsMenuOpen(false)}>
                About
              </Link>
              <Link to="/community-hub" className="py-2 hover:text-emerald-400 transition-colors" onClick={() => setIsMenuOpen(false)}>
                Community Hub
              </Link>
              {user && (
                <Link to="/account" className="py-2 hover:text-emerald-400 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Account Settings
                </Link>
              )}
              {isAdmin && (
                <>
                  <Link to="/admin" className="hover:text-emerald-400 transition-colors bg-red-600 px-3 py-1 rounded text-sm">
                    Admin
                  </Link>
                  <Link to="/moderation" className="hover:text-emerald-400 transition-colors bg-orange-600 px-3 py-1 rounded text-sm">
                    Moderation
                  </Link>
                </>
              )}
              <div className="pt-4 border-t border-slate-800 flex space-x-4">
                {user ? (
                  <button 
                    onClick={() => signOut()}
                    className="border border-slate-600 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors w-full"
                  >
                    Sign Out
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setAuthMode('signup');
                        setIsAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-semibold transition-colors flex-1"
                    >
                      Sign Up
                    </button>
                    <button 
                      onClick={() => {
                        setAuthMode('signin');
                        setIsAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="border border-slate-600 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors flex-1"
                    >
                      Login
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </header>
    </>
  );
};

export default Header;