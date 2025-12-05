import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image, Video, X, Plus, ArrowLeft, ArrowRight, DollarSign, Tag, Users, Target, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMembership } from '../hooks/useMembership';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { canUploadOrSell, needsUpgrade } from '../lib/membership';
import FileUploadZone from './FileUploadZone';
import { FILE_VALIDATIONS, UploadResult } from '../lib/fileUpload';
import MembershipGate from './MembershipGate';
import toast from 'react-hot-toast';

const UploadResource: React.FC = () => {
  const { user } = useAuth();
  const { membership, loading: membershipLoading } = useMembership();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadResult[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    sports: [] as string[],
    levels: [] as string[],
    tags: [] as string[],
    requirements: '',
    whatYouGet: [''],
    targetAudience: ''
  });

  const totalSteps = 4;

  const categories = [
    'Practice Plans', 'Drill Collections', 'Playbooks', 'Training Programs',
    'Strategy Guides', 'Skill Development', 'Conditioning Plans', 'Game Analysis',
    'Player Development', 'Team Building', 'Mental Training', 'Recruiting Guides'
  ];

  const sportsOptions = [
    'Basketball', 'Football', 'Baseball', 'Soccer', 'Volleyball', 
    'Tennis', 'Track & Field', 'Swimming', 'Wrestling', 'Golf',
    'Softball', 'Cross Country', 'Lacrosse', 'Hockey'
  ];

  const levelOptions = [
    'Youth (Ages 6-12)', 'Middle School', 'High School', 
    'Travel/Club', 'Collegiate', 'Professional', 'Adult Recreation'
  ];

  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setProfile(data);
        } else {
          console.log('No profile found for user:', user.id);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to upload resources.</p>
        </div>
      </div>
    );
  }

  // Temporarily disabled membership checks for testing
  // if (membershipLoading) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
  //         <div className="animate-pulse">
  //           <div className="h-4 bg-gray-200 rounded w-1/2 mb-2 mx-auto"></div>
  //           <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // // Membership gating
  // if (!membership || needsUpgrade(membership, 'upload')) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 py-8">
  //       <div className="max-w-2xl mx-auto px-4">
  //         <MembershipGate
  //           membership={membership || { membershipStatus: 'none', isCreatorEnabled: false }}
  //           action="upload"
  //         >
  //           {/* This won't render due to gate */}
  //           <div></div>
  //         </MembershipGate>
  //       </div>
  //     </div>
  //   );
  // }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Complete Your Profile First</h2>
          <p className="text-gray-600 mb-6">Complete your coach profile to start uploading and selling resources.</p>
          <button 
            onClick={() => navigate('/complete-profile')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  const handleArrayToggle = (array: string[], value: string, field: keyof typeof formData) => {
    const newArray = array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
    setFormData({ ...formData, [field]: newArray });
  };

  const handleResourceFilesUploaded = (results: UploadResult[]) => {
    const successfulUploads = results.filter(r => r.success);
    setUploadedFiles(prev => [...prev, ...successfulUploads]);
  };

  const handlePreviewImagesUploaded = (results: UploadResult[]) => {
    const successfulUploads = results.filter(r => r.success);
    setUploadedImages(prev => [...prev, ...successfulUploads]);
  };

  const removeUploadedFile = (index: number, type: 'files' | 'images') => {
    if (type === 'files') {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addWhatYouGet = () => {
    setFormData(prev => ({
      ...prev,
      whatYouGet: [...prev.whatYouGet, '']
    }));
  };

  const updateWhatYouGet = (index: number, value: string) => {
    const newItems = [...formData.whatYouGet];
    newItems[index] = value;
    setFormData({ ...formData, whatYouGet: newItems });
  };

  const removeWhatYouGet = (index: number) => {
    const newItems = formData.whatYouGet.filter((_, i) => i !== index);
    setFormData({ ...formData, whatYouGet: newItems });
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && !formData.tags.includes(value)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, value]
        }));
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a resource title');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please enter a resource description');
      return;
    }

    const price = parseFloat(formData.price || '0');
    if (price < 0) {
      setError('Please enter a valid price');
      return;
    }

    if (!formData.category) {
      setError('Please select a category');
      return;
    }

    if (formData.sports.length === 0) {
      setError('Please select at least one sport');
      return;
    }

    if (formData.levels.length === 0) {
      setError('Please select at least one coaching level');
      return;
    }

    if (uploadedFiles.length === 0) {
      setError('Please upload at least one resource file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isFree = price === 0;
      const mainFile = uploadedFiles[0];

      // Get user's profile id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error('PROFILE_REQUIRED: Please complete your coaching profile before uploading resources.');
      }

      // Insert directly into Supabase using profile.id as owner_id
      const { data, error: insertError } = await supabase
        .from('resources')
        .insert([{
          owner_id: profile.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: price,
          is_free: isFree,
          sports: formData.sports,
          levels: formData.levels,
          category: formData.category,
          tags: formData.tags,
          file_url: mainFile.filePath || mainFile.url,
          file_mime: mainFile.file?.type || 'application/octet-stream',
          file_size: mainFile.file?.size || 0,
          preview_images: uploadedImages.map(img => img.url).filter(Boolean),
          status: 'active',
          is_listed: true,
          moderation_status: 'pending',
          processing_status: 'ready',
          is_preview_ready: true,
          downloads: 0,
          purchase_count: 0,
          view_count: 0,
          preview_count: uploadedImages.length
        }])
        .select()
        .maybeSingle();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Show success toast
      toast.success('Resource uploaded successfully!', {
        duration: 4000,
        position: 'top-center',
      });

      // Navigate to browse page after a short delay for UX
      setTimeout(() => {
        navigate('/browse');
      }, 500);
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Failed to upload resource. Please try again.';
      setError(errorMessage);

      // Also show error toast for immediate feedback
      toast.error(errorMessage.includes('PROFILE_REQUIRED')
        ? errorMessage.replace('PROFILE_REQUIRED: ', '')
        : errorMessage, {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Upload New Resource</h1>
            <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-700">
                    {error.includes('PROFILE_REQUIRED')
                      ? error.replace('PROFILE_REQUIRED: ', '')
                      : error}
                  </p>
                  {error.includes('PROFILE_REQUIRED') && (
                    <button
                      onClick={() => navigate('/account?tab=profile')}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Complete Your Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <FileText className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Basic Information</h2>
                <p className="text-gray-600">Tell coaches about your resource</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Advanced Ball Handling Drills for Guards"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe what coaches will get, how it helps their team, and what makes it unique..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="9.99"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Tags</label>
                <input
                  type="text"
                  onKeyDown={handleTagInput}
                  placeholder="Add tags (press Enter or comma to add)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-emerald-600 hover:text-emerald-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Sports & Levels */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Target className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Target Audience</h2>
                <p className="text-gray-600">Who is this resource designed for?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Sports *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {sportsOptions.map((sport) => (
                    <label key={sport} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sports.includes(sport)}
                        onChange={() => handleArrayToggle(formData.sports, sport, 'sports')}
                        className="sr-only"
                      />
                      <div className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        formData.sports.includes(sport)
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}>
                        {sport}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Levels *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {levelOptions.map((level) => (
                    <label key={level} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.levels.includes(level)}
                        onChange={() => handleArrayToggle(formData.levels, level, 'levels')}
                        className="sr-only"
                      />
                      <div className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        formData.levels.includes(level)
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}>
                        {level}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience Description</label>
                <textarea
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                  placeholder="e.g., Perfect for high school basketball coaches looking to improve their team's ball handling skills..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: File Upload */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Upload className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Files</h2>
                <p className="text-gray-600">Add your resource files and preview images</p>
              </div>

              {/* Main Files */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Resource Files *</label>
                <FileUploadZone
                  onFilesUploaded={handleResourceFilesUploaded}
                  bucket="resources"
                  userId={user.id}
                  validation={FILE_VALIDATIONS.resources}
                  title="Upload Resource Files"
                  description="Upload your coaching materials (PDFs, documents, presentations)"
                />
                
                {/* Show uploaded files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Uploaded Files ({uploadedFiles.length})</h4>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-green-600 mr-3" />
                            <span className="text-sm font-medium text-green-800">{file.fileName || 'Uploaded file'}</span>
                          </div>
                          <button
                            onClick={() => removeUploadedFile(index, 'files')}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Preview Images (Optional)</label>
                <FileUploadZone
                  onFilesUploaded={handlePreviewImagesUploaded}
                  bucket="images"
                  userId={user.id}
                  validation={FILE_VALIDATIONS.images}
                  title="Upload Preview Images"
                  description="Add images to showcase your resource (optional)"
                />
                
                {/* Show uploaded images */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">Uploaded Images ({uploadedImages.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-green-200"
                          />
                          <button
                            onClick={() => removeUploadedFile(index, 'images')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Additional Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Users className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Final Details</h2>
                <p className="text-gray-600">Help coaches understand what they'll receive</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">What You Get</label>
                <div className="space-y-3">
                  {formData.whatYouGet.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateWhatYouGet(index, e.target.value)}
                        placeholder="e.g., 25 detailed drill diagrams with instructions"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {formData.whatYouGet.length > 1 && (
                        <button
                          onClick={() => removeWhatYouGet(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addWhatYouGet}
                    className="flex items-center text-emerald-600 hover:text-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements (Optional)</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  placeholder="e.g., Basic understanding of basketball fundamentals, access to a gym with hoops..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Resource Summary</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Title:</strong> {formData.title || 'Not set'}</div>
                  <div><strong>Category:</strong> {formData.category || 'Not set'}</div>
                  <div><strong>Price:</strong> ${formData.price || '0.00'}</div>
                  <div><strong>Sports:</strong> {formData.sports.join(', ') || 'None selected'}</div>
                  <div><strong>Levels:</strong> {formData.levels.join(', ') || 'None selected'}</div>
                  <div><strong>Files:</strong> {uploadedFiles.length} file(s)</div>
                  <div><strong>Images:</strong> {uploadedImages.length} image(s)</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-semibold transition-colors"
              >
                {loading ? 'Uploading...' : 'Upload Resource'}
                <Upload className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadResource;