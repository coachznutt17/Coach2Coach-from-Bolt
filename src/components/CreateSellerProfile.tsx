import React, { useState } from 'react';
import { User, Camera, MapPin, Award, Plus, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const CreateSellerProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Basic Info
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    location: '',
    
    // Professional Info
    title: '',
    yearsExperience: '',
    bio: '',
    
    // Specialties & Sports
    sports: [] as string[],
    levels: [] as string[],
    specialties: [] as string[],
    
    // Achievements
    achievements: [''],
    
    // Social Links
    website: '',
    twitter: '',
    instagram: '',
    linkedin: ''
  });

  const totalSteps = 4;

  const sportsOptions = [
    'Basketball', 'Football', 'Baseball', 'Soccer', 'Volleyball', 
    'Tennis', 'Track & Field', 'Swimming', 'Wrestling', 'Golf',
    'Softball', 'Cross Country', 'Lacrosse', 'Hockey'
  ];

  const levelOptions = [
    'Youth (Ages 6-12)', 'Middle School', 'High School', 
    'Travel/Club', 'Collegiate', 'Professional', 'Adult Recreation'
  ];

  const specialtyOptions = [
    'Player Development', 'Team Strategy', 'Skill Training', 
    'Conditioning', 'Mental Training', 'Leadership', 'Recruiting',
    'Game Planning', 'Practice Planning', 'Injury Prevention'
  ];

  const handleArrayToggle = (array: string[], value: string, field: keyof typeof formData) => {
    const newArray = array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
    setFormData({ ...formData, [field]: newArray });
  };

  const addAchievement = () => {
    setFormData({
      ...formData,
      achievements: [...formData.achievements, '']
    });
  };

  const updateAchievement = (index: number, value: string) => {
    const newAchievements = [...formData.achievements];
    newAchievements[index] = value;
    setFormData({ ...formData, achievements: newAchievements });
  };

  const removeAchievement = (index: number) => {
    const newAchievements = formData.achievements.filter((_, i) => i !== index);
    setFormData({ ...formData, achievements: newAchievements });
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to create a profile');
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.title.trim() ||
        !formData.bio.trim() || !formData.location.trim() || !formData.yearsExperience) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.sports.length === 0) {
      setError('Please select at least one sport you coach');
      return;
    }

    if (formData.levels.length === 0) {
      setError('Please select at least one coaching level');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profileData = {
        user_id: user.id,
        email: user.email,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        title: formData.title.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        years_experience: formData.yearsExperience,
        sports: formData.sports,
        levels: formData.levels,
        specialties: formData.specialties,
        achievements: formData.achievements.filter(a => a.trim() !== ''),
        website: formData.website.trim(),
        social_links: {
          twitter: formData.twitter.trim(),
          instagram: formData.instagram.trim(),
          linkedin: formData.linkedin.trim()
        }
      };

      console.log('Creating profile for:', formData.firstName, formData.lastName);

      try {
        const result = await db.createCoachProfile(profileData);

        if (!result || !result.data) {
          throw new Error('Profile creation returned no data');
        }

        console.log('SUCCESS! Profile created:', result.data);
        alert('Profile created successfully!');
        navigate('/profile');
      } catch (dbError: any) {
        if (dbError.message?.includes('duplicate') || dbError.code === '23505') {
          setError('You already have a profile. Redirecting...');
          setTimeout(() => navigate('/profile'), 2000);
        } else {
          throw dbError;
        }
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Complete Your Coach Profile</h1>
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
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <button className="text-emerald-600 hover:text-emerald-700 flex items-center mx-auto">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Profile Photo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="City, State"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Professional Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Professional Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Basketball Coach & Skills Trainer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Coaching Experience *</label>
                <select
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select experience level</option>
                  <option value="1-2">1-2 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="6-10">6-10 years</option>
                  <option value="11-15">11-15 years</option>
                  <option value="16-20">16-20 years</option>
                  <option value="20+">20+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio *</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell other coaches about your background, coaching philosophy, and what makes you unique..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">This will be displayed on your public profile</p>
              </div>
            </div>
          )}

          {/* Step 3: Specialties & Expertise */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Coaching Expertise</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Sports You Coach *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-3">Levels You Coach *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-3">Coaching Specialties</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {specialtyOptions.map((specialty) => (
                    <label key={specialty} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.specialties.includes(specialty)}
                        onChange={() => handleArrayToggle(formData.specialties, specialty, 'specialties')}
                        className="sr-only"
                      />
                      <div className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        formData.specialties.includes(specialty)
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}>
                        {specialty}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Achievements & Social Links */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Achievements & Links</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Achievements & Accomplishments</label>
                <div className="space-y-3">
                  {formData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={achievement}
                        onChange={(e) => updateAchievement(index, e.target.value)}
                        placeholder="e.g., State Championship Winner 2023"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {formData.achievements.length > 1 && (
                        <button
                          onClick={() => removeAchievement(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addAchievement}
                    className="flex items-center text-emerald-600 hover:text-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Achievement
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                  <input
                    type="text"
                    value={formData.twitter}
                    onChange={(e) => setFormData({...formData, twitter: e.target.value})}
                    placeholder="@yourusername"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                    placeholder="@yourusername"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
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
                {loading ? 'Creating Profile...' : 'Create Profile'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSellerProfile;