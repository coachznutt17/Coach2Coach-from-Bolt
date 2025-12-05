import React from 'react';
import { Shield, Mail, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const DMCAPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">DMCA Takedown Policy</h1>
            <p className="text-xl text-gray-600">Digital Millennium Copyright Act (DMCA) Policy</p>
          </div>

          {/* Introduction */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-700 leading-relaxed text-lg">
              If you believe your copyrighted work has been uploaded or distributed on Coach2Coach 
              without your permission, you may file a DMCA takedown request.
            </p>
          </div>

          {/* How to Submit Section */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">📥 To Submit a Takedown Request:</h2>
            </div>

            {/* Contact Info */}
            <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200 mb-6">
              <div className="flex items-center mb-4">
                <Mail className="w-6 h-6 text-emerald-600 mr-3" />
                <div>
                  <h3 className="text-lg font-bold text-emerald-800">Email:</h3>
                  <a 
                    href="mailto:zach@coach2coachnetwork.com?subject=DMCA Takedown Notice" 
                    className="text-emerald-600 hover:text-emerald-700 font-semibold text-lg"
                  >
                    zach@coach2coachnetwork.com
                  </a>
                </div>
              </div>
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-emerald-600 mr-3" />
                <div>
                  <h3 className="text-lg font-bold text-emerald-800">Subject Line:</h3>
                  <span className="text-emerald-700 font-semibold">"DMCA Takedown Notice"</span>
                </div>
              </div>
            </div>

            {/* Required Information */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">📋 Include the following information:</h3>
              <div className="space-y-4">
                <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Your full name and contact information</h4>
                    <p className="text-gray-600">Include your name, address, phone number, and email address</p>
                  </div>
                </div>

                <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">The exact URL(s) where the infringing content appears</h4>
                    <p className="text-gray-600">Provide specific links to the content on Coach2Coach</p>
                  </div>
                </div>

                <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">A description of your original copyrighted work</h4>
                    <p className="text-gray-600">Describe the work that you believe has been infringed</p>
                  </div>
                </div>

                <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">A good-faith statement that you believe the use is unauthorized</h4>
                    <p className="text-gray-600">State that you believe the use is not authorized by you, your agent, or the law</p>
                  </div>
                </div>

                <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">A statement under penalty of perjury that your complaint is accurate</h4>
                    <p className="text-gray-600">Confirm that the information is accurate and you are authorized to act</p>
                  </div>
                </div>

                <div className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Your physical or electronic signature</h4>
                    <p className="text-gray-600">Sign the notice physically or electronically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Our Process Section */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">Our Review Process</h2>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <p className="text-blue-800 leading-relaxed text-lg mb-4">
                Coach2Coach will review all claims and respond in a timely manner. If appropriate, we may 
                notify the uploader and give them a chance to file a counter-notice.
              </p>
              <div className="flex items-start">
                <AlertTriangle className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <p className="text-blue-700">
                  We take all copyright claims seriously and will investigate each request thoroughly 
                  while following proper DMCA procedures.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-yellow-800 mb-2">Important Notice</h3>
                <p className="text-yellow-700 leading-relaxed">
                  Filing a false DMCA claim may result in legal consequences. Only submit takedown requests 
                  if you are the copyright owner or authorized to act on their behalf.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="text-center p-6 bg-slate-900 text-white rounded-lg">
            <div className="flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-emerald-400 mr-2" />
              <h3 className="text-xl font-bold">Questions About DMCA?</h3>
            </div>
            <p className="text-gray-300 mb-4">
              If you have questions about the DMCA process or need assistance with your request:
            </p>
            <a 
              href="mailto:zach@coach2coachnetwork.com?subject=DMCA Question" 
              className="inline-flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Our DMCA Agent
            </a>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Coach2Coach complies with the Digital Millennium Copyright Act and respects the intellectual property rights of others.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DMCAPolicy;