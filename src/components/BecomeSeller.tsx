import React from 'react';
import { Link } from 'react-router-dom';
import { Upload, DollarSign, Users, TrendingUp, CheckCircle, ArrowRight, User } from 'lucide-react';

const BecomeSeller: React.FC = () => {
  const steps = [
    {
      icon: Users,
      title: 'Create Your Profile',
      description: 'Set up your coaching profile with your experience, specialties, and credentials'
    },
    {
      icon: Upload,
      title: 'Upload Resources',
      description: 'Share your best drills, playbooks, training programs, and coaching materials'
    },
    {
      icon: CheckCircle,
      title: 'Get Approved',
      description: 'Our team reviews your content to ensure quality for the coaching community'
    },
    {
      icon: DollarSign,
      title: 'Start Earning',
      description: 'Earn up to 90% commission on every sale with our transparent payout system'
    }
  ];

  const benefits = [
    'Keep 85% of every sale',
    'Reach coaches worldwide',
    'Build your coaching brand',
    'Unlimited uploads',
    'Detailed sales analytics',
    'Marketing support included',
    'Access to subscriber base',
    'Monthly revenue sharing'
  ];

  return (
    <section id="become-seller" className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 text-8xl font-bold">→</div>
        <div className="absolute top-20 right-20 text-6xl font-bold">X</div>
        <div className="absolute bottom-20 left-20 text-6xl font-bold">O</div>
        <div className="absolute bottom-10 right-10 text-8xl font-bold">↗</div>
        
        {/* CTA Button moved up */}
        <div className="text-center mb-16">
          <Link 
            to="/create-profile"
            className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 text-white no-underline"
          >
            Create Your Coach Profile
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Turn Your <span className="text-emerald-400">Expertise</span><br />
            Into <span className="text-emerald-400">Income</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Join thousands of coaches who are monetizing their knowledge and helping others succeed. 
            Share what you know and get rewarded for it.
          </p>
          
          {/* CTA Button moved up */}
          <div className="text-center mb-16">
            <Link 
              to="/create-profile"
              className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 text-white no-underline"
            >
              Create Your Coach Profile
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <IconComponent className="w-10 h-10" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-slate-900 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </div>
            );
          })}
        </div>

        {/* Benefits & CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold mb-6">Why Coaches Choose Our Platform</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-gray-300 mb-6">
              Create your coach profile in just a few minutes and start sharing your expertise with coaches worldwide.
            </p>
            <Link 
              to="/create-profile"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center no-underline"
            >
              <User className="w-4 h-4 mr-2" />
              Create Your Profile Now
            </Link>
            <p className="text-sm text-gray-400 mt-3 text-center">
              Free to create • Start earning immediately
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BecomeSeller;