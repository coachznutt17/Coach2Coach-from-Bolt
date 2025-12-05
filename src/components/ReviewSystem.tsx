import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Flag, User, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { profileStorage, generateId } from '../lib/localStorage';

interface Review {
  id: string;
  resourceId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  helpful: number;
  notHelpful: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReviewSystemProps {
  resourceId: string;
  averageRating: number;
  totalReviews: number;
  onRatingUpdate?: (newRating: number, newCount: number) => void;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({
  resourceId,
  averageRating,
  totalReviews,
  onRatingUpdate
}) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([
    // Mock reviews for demonstration
    {
      id: '1',
      resourceId,
      userId: 'user1',
      rating: 5,
      title: 'Excellent resource for youth basketball!',
      comment: 'These drills really helped my team improve their ball handling skills. The instructions are clear and the progressions make sense. Highly recommend for any youth coach.',
      helpful: 12,
      notHelpful: 1,
      verified: true,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z'
    },
    {
      id: '2',
      resourceId,
      userId: 'user2',
      rating: 4,
      title: 'Good content, could use more variations',
      comment: 'Solid fundamentals covered here. My players responded well to these drills. Would love to see some advanced variations in a future update.',
      helpful: 8,
      notHelpful: 0,
      verified: true,
      createdAt: '2024-01-08T14:30:00Z',
      updatedAt: '2024-01-08T14:30:00Z'
    },
    {
      id: '3',
      resourceId,
      userId: 'user3',
      rating: 5,
      title: 'Perfect for high school level',
      comment: 'Used these drills with my varsity team and saw immediate improvement. The video demonstrations are particularly helpful.',
      helpful: 15,
      notHelpful: 2,
      verified: false,
      createdAt: '2024-01-05T09:15:00Z',
      updatedAt: '2024-01-05T09:15:00Z'
    }
  ]);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    comment: ''
  });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'helpful' | 'rating'>('newest');

  // Get user profiles for review display
  const getUserProfile = (userId: string) => {
    // Mock user data - in real app, this would come from your user system
    const mockUsers: { [key: string]: any } = {
      'user1': { firstName: 'Mike', lastName: 'Johnson', title: 'Youth Basketball Coach' },
      'user2': { firstName: 'Sarah', lastName: 'Williams', title: 'High School Coach' },
      'user3': { firstName: 'Tom', lastName: 'Davis', title: 'Varsity Coach' }
    };
    return mockUsers[userId] || { firstName: 'Coach', lastName: '', title: 'Coach' };
  };

  const handleSubmitReview = () => {
    if (!user || newReview.rating === 0 || !newReview.title.trim()) return;

    const review: Review = {
      id: generateId(),
      resourceId,
      userId: user.id,
      rating: newReview.rating,
      title: newReview.title.trim(),
      comment: newReview.comment.trim(),
      helpful: 0,
      notHelpful: 0,
      verified: true, // Mock verification
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setReviews([review, ...reviews]);
    setNewReview({ rating: 0, title: '', comment: '' });
    setShowReviewForm(false);

    // Update parent component with new rating
    const newTotalReviews = totalReviews + 1;
    const newAverageRating = ((averageRating * totalReviews) + newReview.rating) / newTotalReviews;
    onRatingUpdate?.(newAverageRating, newTotalReviews);
  };

  const handleHelpfulVote = (reviewId: string, isHelpful: boolean) => {
    setReviews(reviews.map(review => {
      if (review.id === reviewId) {
        return {
          ...review,
          helpful: isHelpful ? review.helpful + 1 : review.helpful,
          notHelpful: !isHelpful ? review.notHelpful + 1 : review.notHelpful
        };
      }
      return review;
    }));
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'helpful':
        return b.helpful - a.helpful;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRatingChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Reviews & Ratings</h3>
          <div className="flex items-center mt-2">
            {renderStars(averageRating)}
            <span className="ml-2 text-lg font-semibold text-slate-900">{averageRating.toFixed(1)}</span>
            <span className="ml-2 text-gray-600">({totalReviews} reviews)</span>
          </div>
        </div>
        
        {user && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Write Review
          </button>
        )}
      </div>

      {/* Rating Distribution */}
      <div className="mb-8">
        <h4 className="font-semibold text-slate-900 mb-4">Rating Distribution</h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviews.filter(r => r.rating === rating).length;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center">
                <span className="text-sm text-gray-600 w-8">{rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-2" />
                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h4 className="font-semibold text-slate-900 mb-4">Write Your Review</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
              {renderStars(newReview.rating, true, (rating) => 
                setNewReview({ ...newReview, rating })
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Review Title *</label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                placeholder="Summarize your experience..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="Share your thoughts about this resource..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleSubmitReview}
                disabled={newReview.rating === 0 || !newReview.title.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Submit Review
              </button>
              <button
                onClick={() => setShowReviewForm(false)}
                className="border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-semibold text-slate-900">Reviews ({reviews.length})</h4>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="helpful">Most Helpful</option>
          <option value="rating">Highest Rating</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {sortedReviews.map((review) => {
          const userProfile = getUserProfile(review.userId);
          const reviewDate = new Date(review.createdAt).toLocaleDateString();
          
          return (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="font-semibold text-slate-900">
                        {userProfile.firstName} {userProfile.lastName}
                      </span>
                      {review.verified && (
                        <CheckCircle className="w-4 h-4 text-emerald-500 ml-2" title="Verified Purchase" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{userProfile.title}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  {renderStars(review.rating)}
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    {reviewDate}
                  </div>
                </div>
              </div>
              
              <h5 className="font-semibold text-slate-900 mb-2">{review.title}</h5>
              {review.comment && (
                <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleHelpfulVote(review.id, true)}
                    className="flex items-center text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Helpful ({review.helpful})
                  </button>
                  <button
                    onClick={() => handleHelpfulVote(review.id, false)}
                    className="flex items-center text-sm text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    Not Helpful ({review.notHelpful})
                  </button>
                </div>
                
                <button className="flex items-center text-sm text-gray-500 hover:text-red-600 transition-colors">
                  <Flag className="w-4 h-4 mr-1" />
                  Report
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-900 mb-2">No Reviews Yet</h4>
          <p className="text-gray-600">Be the first to review this resource!</p>
        </div>
      )}
    </div>
  );
};

export default ReviewSystem;