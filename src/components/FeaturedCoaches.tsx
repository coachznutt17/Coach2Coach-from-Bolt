import React from 'react';
import { Star, Award, Users, MapPin, TrendingUp, Clock, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeaturedCoaches: React.FC = () => {
  // Featured coaches data
  const topRatedCoaches = [
    {
      id: '1',
      name: 'Chan Brown',
      sport: 'Baseball',
      school: 'Atlanta Baseball Academy',
      rating: 4.9,
      resources: 12,
      downloads: 245,
      experience: '8 years',
      bio: 'Baseball Coach & Skills Development Specialist with expertise in hitting mechanics and player development.'
    },
    {
      id: '2',
      name: 'Robby Gilbert',
      sport: 'Baseball',
      school: 'Birmingham Baseball Club',
      rating: 4.8,
      resources: 8,
      downloads: 189,
      experience: '12 years',
      bio: 'Baseball Coach & Pitching Specialist with expertise in pitching mechanics and arm care.'
    },
    {
      id: '3',
      name: 'Jamie Suggs',
      sport: 'Baseball',
      school: 'Nashville Baseball Academy',
      rating: 4.9,
      resources: 15,
      downloads: 312,
      experience: '8 years',
      bio: 'Baseball Coach & Hitting Instructor focused on hitting instruction and offensive strategy.'
    },
    {
      id: '4',
      name: 'Willie Hildebrand',
      sport: 'Swimming',
      school: 'Austin Aquatic Center',
      rating: 4.7,
      resources: 10,
      downloads: 198,
      experience: '9 years',
      bio: 'Swimming Coach & Technique Specialist with expertise in stroke technique and training programs.'
    },
    {
      id: '5',
      name: 'P.J. Katz',
      sport: 'Football',
      school: 'Dallas Football Academy',
      rating: 4.6,
      resources: 18,
      downloads: 456,
      experience: '11 years',
      bio: 'Football Coach & Offensive Coordinator specializing in offensive strategy and quarterback development.'
    },
    {
      id: '6',
      name: 'Trae Owens',
      sport: 'Football',
      school: 'Houston Football Club',
      rating: 4.7,
      resources: 16,
      downloads: 423,
      experience: '7 years',
      bio: 'Football Coach & Defensive Specialist focused on defensive strategy and player development.'
    },
    {
      id: '7',
      name: 'Ryan Sutton',
      sport: 'Soccer',
      school: 'Seattle Soccer Academy',
      rating: 4.8,
      resources: 14,
      downloads: 287,
      experience: '9 years',
      bio: 'Soccer Coach & Tactical Specialist with expertise in tactical training and technical skills development.'
    }
  ];

  // Reuse the same coaches for other sections
  const mostPopularCoaches = topRatedCoaches.slice(0, 3);
  const newestCoaches = topRatedCoaches.slice(3, 6);

  const featuredSections = [
    {
      title: 'Top Rated Coaches',
      icon: Star,
      coaches: topRatedCoaches,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      gridCols: 'grid-cols-1 md:grid-cols-2' // 2 across for top rated
    },
    {
      title: 'Most Popular',
      icon: TrendingUp,
      coaches: mostPopularCoaches,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // 3 across for others
    },
    {
      title: 'Newest Coaches',
      icon: Clock,
      coaches: newestCoaches,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      gridCols: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // 3 across for others
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Meet Our <span className="text-emerald-600">Expert Coaches</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover talented coaches from around the world who are sharing their knowledge and helping others succeed
          </p>
        </div>

        <div className="space-y-16">
          {featuredSections.map((section, sectionIndex) => {
            const IconComponent = section.icon;
            
            return (
              <div key={sectionIndex}>
                <div className="flex items-center mb-8">
                  <div className={`w-12 h-12 rounded-full ${section.bgColor} flex items-center justify-center mr-4`}>
                    <IconComponent className={`w-6 h-6 ${section.color}`} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{section.title}</h3>
                    <p className="text-gray-600">Outstanding coaches making a difference</p>
                  </div>
                </div>

                <div className={`grid ${section.gridCols} gap-6`}>
                  {section.coaches.map((coach) => (
                    <div key={coach.id} className={`bg-white rounded-xl shadow-lg border-2 ${section.borderColor} overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
                      <div className="p-6">
                        {/* Coach Header */}
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-bold text-slate-900 truncate">
                              {coach.name}
                            </h4>
                            <p className="text-emerald-600 font-semibold text-sm truncate">{coach.sport}</p>
                            <div className="flex items-center text-gray-500 text-sm mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate">{coach.school}</span>
                            </div>
                          </div>
                        </div>

                        {/* Coach Bio */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {coach.bio}
                        </p>

                        {/* Sports & Specialties */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                              {coach.sport}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {coach.experience}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-slate-900">{coach.resources}</div>
                            <div className="text-xs text-gray-600">Resources</div>
                          </div>
                          <div>
                            <div className="flex items-center justify-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="text-lg font-bold text-slate-900">
                                {coach.rating}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">Rating</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-slate-900">{coach.downloads}</div>
                            <div className="text-xs text-gray-600">Downloads</div>
                          </div>
                        </div>

                        {/* Experience Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-600">
                            <Award className="w-4 h-4 mr-1" />
                            <span>{coach.experience}</span>
                          </div>
                          <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                            View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8">
            <Trophy className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Join Our Community of Expert Coaches
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Share your expertise, build your coaching brand, and connect with coaches worldwide. 
              Create your profile today and start making an impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/create-profile"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-block no-underline"
              >
                Create Your Profile
              </Link>
              <Link 
                to="/browse"
                className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-block no-underline"
              >
                Browse All Coaches
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCoaches;