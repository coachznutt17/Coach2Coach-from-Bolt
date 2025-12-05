import React from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Mail, FileText } from 'lucide-react';

const CopyrightPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Copyright Policy</h1>
            <p className="text-xl text-gray-600">Coach2Coach Platform</p>
          </div>

          {/* Introduction */}
          <div className="mb-8 p-6 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-gray-700 leading-relaxed text-lg">
              Coach2Coach is a marketplace built on trust and originality. We take copyright law seriously 
              and require all sellers to upload only content they have created or have legal permission to distribute.
            </p>
          </div>

          {/* As a Seller Section */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">As a Seller, You Agree That:</h2>
            </div>

            <div className="space-y-4 ml-16">
              <div className="flex items-start p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">You created the content</h3>
                  <p className="text-green-700">The coaching materials, drills, playbooks, or resources are your original work</p>
                </div>
              </div>

              <div className="text-center text-gray-500 font-bold text-lg">OR</div>

              <div className="flex items-start p-4 bg-blue-50 rounded-lg border border-blue-200">
                <FileText className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">You have a license to use and sell the content</h3>
                  <p className="text-blue-700">You have written permission or legal rights to distribute and monetize the materials</p>
                </div>
              </div>

              <div className="flex items-start p-4 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="w-6 h-6 text-red-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">You are NOT uploading copyrighted material from:</h3>
                  <ul className="text-red-700 mt-2 space-y-1">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Textbooks or published manuals
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Commercial websites or platforms
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Third-party platforms (e.g., Hudl, MaxPreps, TpT)
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Any other copyrighted materials without permission
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* We Reserve the Right Section */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">We Reserve the Right To:</h2>
            </div>

            <div className="space-y-4 ml-16">
              <div className="flex items-start p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">Remove infringing content</h3>
                  <p className="text-yellow-700">We can remove any infringing or suspicious content without prior notice</p>
                </div>
              </div>

              <div className="flex items-start p-4 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="w-6 h-6 text-red-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Suspend or ban repeat offenders</h3>
                  <p className="text-red-700">Accounts that repeatedly violate copyright will be permanently removed</p>
                </div>
              </div>

              <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Shield className="w-6 h-6 text-gray-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Cooperate with authorities</h3>
                  <p className="text-gray-700">We will work with copyright holders and legal authorities as required by law</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-slate-900 text-white rounded-xl p-6 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-8 h-8 text-yellow-400 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold mb-2">Important Notice</h3>
                <p className="text-gray-300 leading-relaxed">
                  Copyright infringement is a serious matter. If you're unsure about your rights to use or sell 
                  certain content, consult with a legal professional before uploading. When in doubt, only upload 
                  content you have personally created.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center p-6 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-emerald-600 mr-2" />
              <h3 className="text-xl font-bold text-emerald-800">Questions About Copyright?</h3>
            </div>
            <p className="text-emerald-700 mb-4">
              If you have questions about copyright or need to report infringement, contact us:
            </p>
            <a 
              href="mailto:zach@coach2coachnetwork.com" 
              className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              zach@coach2coachnetwork.com
            </a>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              This policy helps protect the intellectual property rights of all coaches and creators on our platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopyrightPolicy;