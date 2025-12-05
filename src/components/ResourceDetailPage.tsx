import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Star, ShoppingCart, FileText, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { getApiUrl } from '../lib/apiConfig';

interface Resource {
  id: string;
  title: string;
  description: string;
  price: number;
  is_free: boolean;
  sports: string[];
  levels: string[];
  category: string;
  downloads: number;
  rating: number;
  file_url: string;
  preview_images: string[];
  owner_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadResource();
    if (user) {
      checkPurchaseStatus();
    }
  }, [id, user]);

  const loadResource = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          profiles:owner_id (first_name, last_name)
        `)
        .eq('id', id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setResource({
          ...data,
          price: (data.price_cents || 0) / 100,
        });
      }
    } catch (error) {
      console.error('Error loading resource:', error);
      toast.error('Failed to load resource');
    } finally {
      setLoading(false);
    }
  };

  const checkPurchaseStatus = async () => {
    if (!user || !id) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return;

      const { data } = await supabase
        .from('purchases')
        .select('id, status')
        .eq('buyer_id', profile.id)
        .eq('resource_id', id)
        .eq('status', 'completed')
        .maybeSingle();

      setHasPurchased(!!data);
    } catch (error) {
      console.error('Error checking purchase:', error);
    }
  };

  const handleFreePurchase = async () => {
    if (!user) {
      toast.error('Please sign in to get this resource');
      navigate('/');
      return;
    }

    setPurchasing(true);

    try {
      const response = await fetch(getApiUrl('/api/purchase/free'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          resourceId: id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Resource acquired! You can now download it.');
        setHasPurchased(true);
      } else {
        toast.error(result.error || 'Failed to acquire resource');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to acquire resource');
    } finally {
      setPurchasing(false);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      toast.error('Please sign in to download');
      return;
    }

    setDownloading(true);

    try {
      window.location.href = getApiUrl(`/api/resources/${id}/download?userId=${user.id}`);
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to start download');
    } finally {
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Resource Not Found</h2>
          <p className="text-gray-600 mb-6">This resource may have been removed or is no longer available.</p>
          <button
            onClick={() => navigate('/browse')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Browse Resources
          </button>
        </div>
      </div>
    );
  }

  const coachName = `${resource.profiles.first_name} ${resource.profiles.last_name}`;
  const isFree = resource.is_free || resource.price === 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                    {resource.category}
                  </span>
                  {isFree && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Free
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">{resource.title}</h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <span>By {coachName}</span>
                  <span>•</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span>{resource.rating || 4.5}</span>
                  </div>
                  <span>•</span>
                  <span>{resource.downloads || 0} downloads</span>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{resource.description}</p>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-3">Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Sports</h3>
                    <div className="flex flex-wrap gap-2">
                      {resource.sports.map((sport, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Levels</h3>
                    <div className="flex flex-wrap gap-2">
                      {resource.levels.map((level, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <div className="mb-6">
                {isFree ? (
                  <div className="text-3xl font-bold text-emerald-600 mb-2">Free</div>
                ) : (
                  <div className="text-3xl font-bold text-slate-900 mb-2">${resource.price}</div>
                )}
                <p className="text-gray-600 text-sm">One-time purchase</p>
              </div>

              {hasPurchased ? (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-4 rounded-lg font-semibold mb-3 flex items-center justify-center transition-colors"
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download Now
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleFreePurchase}
                  disabled={purchasing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-4 rounded-lg font-semibold mb-3 flex items-center justify-center transition-colors"
                >
                  {purchasing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : isFree ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Get For Free
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Purchase Now
                    </>
                  )}
                </button>
              )}

              {!user && (
                <p className="text-center text-sm text-gray-600 mb-4">
                  Sign in to download this resource
                </p>
              )}

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-3">What's included</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <FileText className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Full digital download</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Lifetime access</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Ready to use immediately</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailPage;
