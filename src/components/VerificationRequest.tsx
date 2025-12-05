import React, { useState } from 'react';
import { Award, Upload, CheckCircle, Clock, XCircle, FileText, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { profileStorage } from '../lib/localStorage';

const VerificationRequest: React.FC = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const profile = user ? profileStorage.getProfileByUserId(user.id) : null;
  
  // Mock verification status - in real app, this would come from Supabase
  const verificationStatus = 'none'; // 'none' | 'pending' | 'approved' | 'rejected'

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProofFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !credentials.trim()) return;

    setLoading(true);

    try {
      // In real implementation, upload files to verification-docs bucket first
      const proofDocuments = proofFiles.map(file => `verification-docs/${user.id}/${file.name}`);

      const response = await fetch(getApiUrl('/api/verification/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          credentials: credentials.trim(),
          proofDocuments
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        throw new Error(data.error || 'Failed to submit verification request');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert('Failed to submit verification request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Complete Your Profile</h2>
          <p className="text-gray-600">You need a complete coach profile before requesting verification.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Coach Verification</h1>
              <p className="text-gray-600">Get verified to build trust and boost your visibility</p>
            </div>
          </div>
        </div>

        {/* Status Display */}
        <div className="p-6">
          {verificationStatus === 'none' && !submitted && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Why Get Verified?</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Verified badge on your profile and resources</li>
                <li>• Higher ranking in search results</li>
                <li>• Increased buyer trust and confidence</li>
                <li>• Priority support from our team</li>
              </ul>
            </div>
          )}

          {verificationStatus === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Verification Pending</h3>
                  <p className="text-yellow-700 text-sm">
                    Your verification request is under review. We'll email you within 3-5 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-800">Verified Coach ✓</h3>
                  <p className="text-green-700 text-sm">
                    Congratulations! Your coaching credentials have been verified.
                  </p>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-red-800">Verification Declined</h3>
                  <p className="text-red-700 text-sm">
                    We couldn't verify your credentials. Please review our feedback and resubmit.
                  </p>
                </div>
              </div>
            </div>
          )}

          {submitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-800">Request Submitted!</h3>
                  <p className="text-green-700 text-sm">
                    We've received your verification request and will review it within 3-5 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Form */}
          {verificationStatus === 'none' && !submitted && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coaching Credentials & Experience *
                </label>
                <textarea
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  placeholder="Please describe your coaching credentials, certifications, experience, and achievements. Include:&#10;• Coaching licenses or certifications&#10;• Years of experience and teams coached&#10;• Notable achievements or championships&#10;• Education background (if relevant)&#10;• Current coaching positions"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be specific and detailed. This helps us verify your coaching background.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supporting Documents (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-1">Upload supporting documents</p>
                    <p className="text-xs text-gray-500">
                      Coaching licenses, certificates, team photos, etc. (PDF, JPG, PNG, DOC)
                    </p>
                  </label>
                </div>
                
                {proofFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                    {proofFiles.map((file, index) => (
                      <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                        <FileText className="w-4 h-4 text-gray-600 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Requirements */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Verification Requirements</h4>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• Minimum 2 years of coaching experience</li>
                  <li>• Verifiable coaching positions or certifications</li>
                  <li>• Active involvement in coaching community</li>
                  <li>• Professional coaching credentials or education</li>
                  <li>• No history of policy violations</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !credentials.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                {loading ? (
                  'Submitting Request...'
                ) : (
                  <>
                    <Award className="w-5 h-5 mr-2" />
                    Submit Verification Request
                  </>
                )}
              </button>
            </form>
          )}

          {/* Resubmit Option for Rejected */}
          {verificationStatus === 'rejected' && (
            <div className="text-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Submit New Request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationRequest;