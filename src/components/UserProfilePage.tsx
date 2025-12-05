import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FileText, Star, Eye, Plus } from 'lucide-react';

type CoachProfile = {
  id?: string;
  first_name: string;
  last_name: string;
  title: string;
  location: string;
  years_experience: number | string;
  bio: string;
  sports: string[];
  levels: string[];
  social_links?: { twitter?: string; instagram?: string };
};

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [profile, setProfile] = useState<CoachProfile>({
    first_name: '',
    last_name: '',
    title: '',
    location: '',
    years_experience: '',
    bio: '',
    sports: [],
    levels: [],
    social_links: {},
  });

  async function fetchProfile() {
    if (!user) {
      toast.error('You must be logged in to view your profile.');
      navigate('/');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
        return;
      }

      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          title: data.title || '',
          location: data.location || '',
          years_experience: data.years_experience ?? '',
          bio: data.bio || '',
          sports: data.sports || [],
          levels: data.levels || [],
          social_links: data.social_links || {},
        });
      }
    } catch (err) {
      console.error('Network error fetching profile:', err);
      toast.error('Network error loading profile.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchResources() {
    if (!user) return;

    setLoadingResources(true);

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError);
        setLoadingResources(false);
        return;
      }

      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('owner_id', profileData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resources:', error);
        return;
      }

      setResources(data || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setLoadingResources(false);
    }
  }

  async function saveProfile(e?: React.FormEvent) {
    if (e && e.preventDefault) e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to update your profile.');
      navigate('/');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          title: profile.title,
          location: profile.location,
          years_experience:
            typeof profile.years_experience === 'string'
              ? Number(profile.years_experience) || 0
              : profile.years_experience,
          bio: profile.bio,
          sports: profile.sports,
          levels: profile.levels,
          social_links: profile.social_links,
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
        return;
      }

      toast.success('Profile updated!');
    } catch (err) {
      console.error('Network error saving profile:', err);
      toast.error('Network error saving profile.');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    fetchProfile();
    fetchResources();
  }, []);

  function handleChange(
    field: keyof CoachProfile,
    value: string | number
  ) {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-4">Coach Profile</h1>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Coach Profile</h1>
      <p className="text-gray-600 mb-6">
        This is what other coaches see on Coach2Coach. Keep it up to date so they know who they&apos;re learning from.
      </p>

      <form onSubmit={saveProfile} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={profile.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={profile.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Head Coach, Assistant Coach, Skills Trainer..."
            value={profile.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2"
            placeholder="City, State, Country"
            value={profile.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Years of Coaching Experience</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded-lg px-3 py-2"
            value={profile.years_experience}
            onChange={(e) => handleChange('years_experience', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Coaching Bio</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
            placeholder="Your coaching philosophy, key accomplishments, teams you've worked with..."
            value={profile.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Twitter / X Handle</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="@CoachZ"
              value={profile.social_links?.twitter || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                social_links: { ...prev.social_links, twitter: e.target.value }
              }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instagram Handle</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="@CoachZBaseball"
              value={profile.social_links?.instagram || ''}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                social_links: { ...prev.social_links, instagram: e.target.value }
              }))}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 inline-flex items-center px-4 py-2 rounded-lg border border-transparent bg-black text-white font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Update Profile'}
        </button>
      </form>

      {/* My Uploaded Resources Section */}
      <div className="mt-12 border-t pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Uploaded Resources</h2>
            <p className="text-gray-600 mt-1">Resources you've shared with the Coach2Coach community</p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors no-underline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload New Resource
          </Link>
        </div>

        {loadingResources ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your resources...</p>
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <div key={resource.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {resource.preview_images && resource.preview_images.length > 0 ? (
                  <img
                    src={resource.preview_images[0]}
                    alt={resource.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                    <FileText className="w-16 h-16 text-white" />
                  </div>
                )}

                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                    {resource.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {resource.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {resource.rating > 0 && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm font-medium">{resource.rating.toFixed(1)}</span>
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        {resource.downloads || 0} downloads
                      </div>
                    </div>

                    <div className="text-lg font-bold text-emerald-600">
                      {resource.is_free ? 'Free' : `$${resource.price}`}
                    </div>
                  </div>

                  {resource.sports && resource.sports.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.sports.slice(0, 2).map((sport: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                        >
                          {sport}
                        </span>
                      ))}
                      {resource.sports.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          +{resource.sports.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  <Link
                    to={`/resource/${resource.id}`}
                    className="flex items-center justify-center w-full px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors no-underline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources uploaded yet</h3>
            <p className="text-gray-600 mb-6">
              Share your coaching expertise by uploading your first resource
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors no-underline"
            >
              <Plus className="w-5 h-5 mr-2" />
              Upload Your First Resource
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
