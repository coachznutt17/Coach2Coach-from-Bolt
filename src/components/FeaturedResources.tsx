import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Clock, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ResourceCard from './ResourceCard';

const FeaturedResources: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('status', 'active')
        .order('downloads', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching resources:', error);
        return;
      }

      if (data) {
        const transformed = data.map((r: any) => ({
          id: r.id,
          coachId: r.owner_id,
          title: r.title,
          description: r.description,
          price: Number(r.price) || 0,
          sports: r.sports || [],
          levels: r.levels || [],
          rating: Number(r.rating) || 4.5,
          downloads: r.downloads || 0,
          status: r.status,
          createdAt: r.created_at
        }));
        setResources(transformed);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || resources.length === 0) {
    return null;
  }

  // Get featured resources (highest rated, most popular, newest)
  const featuredSections = [
    {
      title: 'Highest Rated',
      icon: Star,
      resources: [...resources]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3),
      color: 'text-yellow-600'
    },
    {
      title: 'Most Popular',
      icon: TrendingUp,
      resources: [...resources]
        .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
        .slice(0, 3),
      color: 'text-emerald-600'
    },
    {
      title: 'Recently Added',
      icon: Clock,
      resources: [...resources]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3),
      color: 'text-blue-600'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Featured <span className="text-emerald-600">Resources</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the best coaching resources from our community of expert coaches
          </p>
        </div>

        <div className="space-y-16">
          {featuredSections.map((section, sectionIndex) => {
            if (section.resources.length === 0) return null;
            
            const IconComponent = section.icon;
            
            return (
              <div key={sectionIndex}>
                <div className="flex items-center mb-8">
                  <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-4`}>
                    <IconComponent className={`w-6 h-6 ${section.color}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{section.title}</h3>
                    <p className="text-gray-600">Top picks from our coaching community</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.resources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8">
            <Award className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to Share Your Expertise?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join our community of successful coaches and start earning from your knowledge. 
              Upload your first resource and help coaches worldwide improve their game.
            </p>
            <a 
              href="/become-seller"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              Start Selling Today
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedResources;