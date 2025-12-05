import React from 'react';
import { Check, Star, Users, MessageCircle, Download, FileText, Crown } from 'lucide-react';

const PricingTable: React.FC = () => {
  const features = [
    'Access to ALL coaching resources',
    'Unlimited downloads',
    'Coach-to-coach messaging',
    'Discussion boards & forums',
    'Coach written articles',
    'Mobile app access',
    'Priority customer support',
    'New content notifications',
    'Advanced search & filters',
    'Bookmark favorite resources'
  ];

  const creatorBenefits = [
    'Keep 85% of every sale',
    'Upload unlimited resources',
    'Professional profile page',
    'Sales analytics dashboard',
    'Direct fan messaging',
    'Community engagement tools',
    'Marketing support',
    'Monthly payouts'
  ];

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Simple, <span className="text-emerald-600">Fair Pricing</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            One affordable price gets you access to everything. No tiers, no limits, no confusion.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Pricing Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-12 ring-4 ring-emerald-500">
            <div className="bg-emerald-600 text-white text-center py-3 font-semibold">
              🎉 Launch Special - Limited Time
            </div>
            
            <div className="p-8 lg:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
                  <Crown className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">Coach2Coach Membership</h3>
                <p className="text-gray-600 mb-6">Everything you need to grow as a coach</p>
                
                <div className="flex items-center justify-center mb-4">
                  <span className="text-5xl font-bold text-slate-900">$5.99</span>
                  <span className="text-gray-600 ml-2 text-xl">/month</span>
                </div>
                
                <div className="inline-block bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-semibold mb-8">
                  Creators keep 85% of sales
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Member Benefits */}
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                    <Users className="w-6 h-6 text-emerald-600 mr-2" />
                    Member Benefits
                  </h4>
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Creator Benefits */}
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
                    <Star className="w-6 h-6 text-emerald-600 mr-2" />
                    Creator Benefits
                  </h4>
                  <ul className="space-y-3">
                    {creatorBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 mb-4">
                  Start Your Membership
                </button>
                <p className="text-sm text-gray-500">
                  Cancel anytime • No long-term contracts • 7-day free trial
                </p>
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Unlimited Access</h3>
              <p className="text-gray-600">Download any resource, anytime. No per-item charges or hidden fees.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Connect & Learn</h3>
              <p className="text-gray-600">Message coaches directly and participate in community discussions.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Support Creators</h3>
              <p className="text-gray-600">Your membership directly supports coaches who share their expertise.</p>
            </div>
          </div>

          {/* Creator Earnings Breakdown */}
          <div className="bg-slate-900 text-white rounded-2xl p-8 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Fair Creator Compensation</h3>
              <p className="text-gray-300">We believe coaches should be rewarded fairly for sharing their knowledge</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-emerald-400 mb-2">85%</div>
                <div className="text-gray-300">Goes to Coach</div>
                <div className="text-sm text-gray-400">Fair compensation for expertise</div>
              </div>
              
              <div>
                <div className="text-3xl font-bold text-gray-400 mb-2">15%</div>
                <div className="text-gray-300">Platform Fee</div>
                <div className="text-sm text-gray-400">Covers hosting, support & development</div>
              </div>
              
              <div>
                <div className="text-3xl font-bold text-emerald-400 mb-2">$5.99</div>
                <div className="text-gray-300">Member Access</div>
                <div className="text-sm text-gray-400">Unlimited downloads for subscribers</div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Frequently Asked Questions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">How does the subscription work?</h4>
                <p className="text-gray-600 text-sm">Start with a 7-day free trial, then $5.99/month for unlimited access to all coaching resources, messaging, and community features.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">How do creators get paid?</h4>
                <p className="text-gray-600 text-sm">Creators earn 85% of revenue generated from their content based on download activity and engagement metrics.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Can I cancel anytime?</h4>
                <p className="text-gray-600 text-sm">Yes! Cancel your subscription anytime. You'll retain access until the end of your billing period.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Is there a free trial?</h4>
                <p className="text-gray-600 text-sm">Yes! New members get a 7-day free trial with limited access - you can browse resources but need a paid subscription for full downloads.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingTable;