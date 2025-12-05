import React from 'react';
import { Target, Heart, Users, Award } from 'lucide-react';

const About: React.FC = () => {
  const values = [
    {
      icon: Target,
      title: 'Coach-Focused',
      description: 'Every feature is designed with coaches in mind, from upload tools to payout systems'
    },
    {
      icon: Heart,
      title: 'Community Driven',
      description: 'We believe in the power of coaches helping coaches succeed and grow together'
    },
    {
      icon: Users,
      title: 'Quality First',
      description: 'All resources are reviewed to ensure they meet our high standards for coaching excellence'
    },
    {
      icon: Award,
      title: 'Fair Compensation',
      description: 'Coaches deserve to be rewarded fairly for sharing their expertise and knowledge'
    }
  ];

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              About <span className="text-emerald-600">Coach2Coach</span>
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Born from the understanding that great coaching knowledge should be shared, not hoarded. 
              We created the first marketplace designed specifically for coaches to monetize their expertise 
              while helping others achieve success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                To empower coaches at every level by providing a platform where they can share their knowledge, 
                build their brand, and create sustainable income streams. We believe that when coaches succeed, 
                athletes and teams everywhere benefit.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Whether you're a youth coach with innovative drills or a professional coach with championship 
                strategies, Coach2Coach gives you the tools to reach coaches worldwide and get fairly compensated 
                for your expertise.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Story</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Founded by coaches who experienced firsthand the challenge of finding quality resources and 
                the frustration of not being able to monetize their hard-earned knowledge. We saw successful 
                models in education and knew coaches deserved the same opportunities.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Today, Coach2Coach connects thousands of coaches across all sports and levels, creating a 
                thriving ecosystem where knowledge flows freely and creators are rewarded for their contributions.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">{value.title}</h4>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;