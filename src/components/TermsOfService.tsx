import React from 'react';
import { Shield, FileText, DollarSign, Users, AlertTriangle, Mail } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
            <p className="text-xl text-gray-600">Coach2Coach Platform</p>
            <p className="text-sm text-gray-500 mt-2">Effective Date: August 1, 2025</p>
          </div>

          {/* Introduction */}
          <div className="mb-8 p-6 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-gray-700 leading-relaxed">
              Welcome to Coach2Coach, a digital marketplace for coaching resources. By using our platform, 
              you agree to the following terms:
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-emerald-600 font-bold">1</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Acceptance of Terms</h2>
              </div>
              <p className="text-gray-700 leading-relaxed ml-11">
                By accessing or using Coach2Coach, you confirm that you are at least 18 years old and agree 
                to these Terms of Service and our Privacy Policy.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">User Accounts</h2>
              </div>
              <p className="text-gray-700 leading-relaxed ml-11">
                To access certain features (like uploading or purchasing resources), you must create an account. 
                You are responsible for maintaining the confidentiality of your login and all activity under your account.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Content Ownership and Responsibility</h2>
              </div>
              <div className="ml-11 space-y-3">
                <p className="text-gray-700 leading-relaxed">
                  You retain ownership of any materials you upload, but by uploading, you grant Coach2Coach 
                  a non-exclusive, worldwide license to host, market, and sell your content on our platform.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  You must own or have the appropriate rights to any content you upload. You are solely 
                  responsible for your content.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Commission and Subscription Terms</h2>
              </div>
              <div className="ml-11">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Coach2Coach offers multiple seller tiers:
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Free:</span>
                    <span className="text-red-600 font-semibold">50% commission paid to Coach2Coach</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Premium ($9.99/month):</span>
                    <span className="text-orange-600 font-semibold">20% commission paid to Coach2Coach</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Pro ($14.99/month):</span>
                    <span className="text-green-600 font-semibold">10% commission paid to Coach2Coach</span>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed mt-4">
                  By becoming a seller, you agree to these commission structures. All fees are non-refundable.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-emerald-600 font-bold">5</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">License to Buyers</h2>
              </div>
              <p className="text-gray-700 leading-relaxed ml-11">
                Buyers receive a limited, non-transferable license to use purchased resources for personal, 
                team, or school use only. Resale or redistribution is strictly prohibited.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Prohibited Conduct</h2>
              </div>
              <div className="ml-11">
                <p className="text-gray-700 leading-relaxed mb-3">You agree not to:</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Upload plagiarized, copied, or unauthorized content
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Violate copyright or trademark laws
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Share or sell someone else's intellectual property
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Attempt to reverse-engineer or misuse the platform
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-emerald-600 font-bold">7</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Copyright Policy and DMCA</h2>
              </div>
              <p className="text-gray-700 leading-relaxed ml-11">
                Coach2Coach complies with the DMCA. See our Copyright Policy and DMCA Takedown Policy for details.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-emerald-600 font-bold">8</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Termination</h2>
              </div>
              <p className="text-gray-700 leading-relaxed ml-11">
                We reserve the right to suspend or terminate accounts at our discretion, especially in the 
                case of repeat copyright violations or abuse of the platform.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Limitation of Liability</h2>
              </div>
              <p className="text-gray-700 leading-relaxed ml-11">
                Coach2Coach is not liable for damages or losses related to the use or misuse of user-uploaded 
                content. Use the platform at your own risk.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  <Mail className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Contact</h2>
              </div>
              <p className="text-gray-700 leading-relaxed ml-11">
                For questions or legal notices, email: 
                <a href="mailto:zach@coach2coachnetwork.com" className="text-emerald-600 hover:text-emerald-700 ml-1">
                  zach@coach2coachnetwork.com
                </a>
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Last updated: August 1, 2025
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Questions about these terms? <a href="mailto:zach@coach2coachnetwork.com" className="text-emerald-600 hover:text-emerald-700">Contact us</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;