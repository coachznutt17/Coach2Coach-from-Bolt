import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Pin, 
  Lock, 
  ThumbsUp, 
  ThumbsDown,
  Reply,
  User,
  Calendar,
  Eye,
  TrendingUp,
  Clock,
  Award,
  Tag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { discussions, DiscussionBoard, DiscussionPost, DiscussionReply, initializeMessagingData } from '../lib/messaging';
import { profileStorage, userStorage } from '../lib/localStorage';

const DiscussionBoards: React.FC = () => {
  const { user } = useAuth();
  const [boards, setBoards] = useState<DiscussionBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<DiscussionBoard | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<DiscussionPost | null>(null);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [view, setView] = useState<'boards' | 'posts' | 'post'>('boards');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    initializeMessagingData();
    loadBoards();
  }, []);

  useEffect(() => {
    if (selectedBoard) {
      loadPosts(selectedBoard.id);
    }
  }, [selectedBoard]);

  useEffect(() => {
    if (selectedPost) {
      loadReplies(selectedPost.id);
    }
  }, [selectedPost]);

  const loadBoards = async () => {
    try {
      const boardsData = await discussions.getBoards();
      setBoards(boardsData);
    } catch (error) {
      console.error('Error loading boards:', error);
    }
  };

  const loadPosts = async (boardId: string) => {
    try {
      const postsData = await discussions.getPosts(boardId);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadReplies = async (postId: string) => {
    try {
      const repliesData = await discussions.getReplies(postId);
      setReplies(repliesData);
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const getAuthorName = (authorId: string) => {
    const profile = profileStorage.getProfileByUserId(authorId);
    const userProfile = userStorage.getUserById(authorId);
    
    if (profile) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (userProfile) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return 'Coach';
  };

  const getAuthorTitle = (authorId: string) => {
    const profile = profileStorage.getProfileByUserId(authorId);
    return profile?.title || 'Coach';
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const categories = ['General', 'Sport Specific', 'Age Group', 'Strategy', 'Training', 'Equipment'];

  const filteredBoards = boards.filter(board => {
    const matchesSearch = searchTerm === '' || 
      board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      board.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || board.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Discussion Boards</h2>
          <p className="text-gray-600">Sign in to join coaching discussions and share knowledge.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Discussion Boards</h1>
              <p className="text-gray-600">Connect with coaches, share knowledge, and learn from the community</p>
            </div>
            
            {view === 'boards' && (
              <button
                onClick={() => setShowNewBoard(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Board
              </button>
            )}
            
            {view === 'posts' && selectedBoard && (
              <button
                onClick={() => setShowNewPost(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </button>
            )}
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {view !== 'boards' && (
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => {
                  setView('boards');
                  setSelectedBoard(null);
                  setSelectedPost(null);
                }}
                className="text-emerald-600 hover:text-emerald-700"
              >
                Discussion Boards
              </button>
              {selectedBoard && (
                <>
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => {
                      setView('posts');
                      setSelectedPost(null);
                    }}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    {selectedBoard.title}
                  </button>
                </>
              )}
              {selectedPost && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">{selectedPost.title}</span>
                </>
              )}
            </nav>
          </div>
        )}

        {/* Boards View */}
        {view === 'boards' && (
          <div>
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search discussion boards..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Boards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBoards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => {
                    setSelectedBoard(board);
                    setView('posts');
                  }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {board.isPinned && <Pin className="w-4 h-4 text-emerald-600 mr-2" />}
                        {board.isLocked && <Lock className="w-4 h-4 text-red-600 mr-2" />}
                        <h3 className="text-lg font-bold text-slate-900">{board.title}</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{board.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                        {board.category}
                      </span>
                      {board.sport && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {board.sport}
                        </span>
                      )}
                      {board.level && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {board.level}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{board.postCount}</div>
                      <div className="text-xs text-gray-600">posts</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts View */}
        {view === 'posts' && selectedBoard && (
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedBoard.title}</h2>
                  <p className="text-gray-600">{selectedBoard.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">{posts.length}</div>
                  <div className="text-sm text-gray-600">posts</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => {
                    setSelectedPost(post);
                    setView('post');
                  }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {post.isPinned && <Pin className="w-4 h-4 text-emerald-600 mr-2" />}
                        <h3 className="text-lg font-bold text-slate-900">{post.title}</h3>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          post.postType === 'question' ? 'bg-blue-100 text-blue-800' :
                          post.postType === 'resource_share' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.postType}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{post.content}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          <span>{getAuthorName(post.authorId)}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{formatTimeAgo(post.createdAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <Reply className="w-4 h-4 mr-1" />
                          <span>{post.replyCount} replies</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="flex items-center">
                        <ThumbsUp className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-sm text-gray-600">{post.upvotes}</span>
                      </div>
                      <div className="flex items-center">
                        <ThumbsDown className="w-4 h-4 text-red-600 mr-1" />
                        <span className="text-sm text-gray-600">{post.downvotes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Post View */}
        {view === 'post' && selectedPost && (
          <div className="space-y-6">
            {/* Post Content */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {selectedPost.isPinned && <Pin className="w-4 h-4 text-emerald-600 mr-2" />}
                    <h1 className="text-2xl font-bold text-slate-900">{selectedPost.title}</h1>
                    <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                      selectedPost.postType === 'question' ? 'bg-blue-100 text-blue-800' :
                      selectedPost.postType === 'resource_share' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedPost.postType}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      <span>{getAuthorName(selectedPost.authorId)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>{formatTimeAgo(selectedPost.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{selectedPost.content}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-2 ml-6">
                  <button className="flex flex-col items-center p-2 hover:bg-green-50 rounded-lg transition-colors">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">{selectedPost.upvotes}</span>
                  </button>
                  <button className="flex flex-col items-center p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <ThumbsDown className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-gray-600">{selectedPost.downvotes}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Replies */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">
                Replies ({replies.length})
              </h3>
              
              {/* Reply Form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <textarea
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <div className="flex justify-end mt-3">
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                    Post Reply
                  </button>
                </div>
              </div>

              {/* Replies List */}
              <div className="space-y-4">
                {replies.map((reply) => (
                  <div key={reply.id} className="border-l-4 border-emerald-200 pl-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="font-semibold text-slate-900">{getAuthorName(reply.authorId)}</span>
                          <span className="text-sm text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{reply.content}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="flex items-center text-sm text-gray-600 hover:text-green-600">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {reply.upvotes}
                        </button>
                        <button className="flex items-center text-sm text-gray-600 hover:text-red-600">
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          {reply.downvotes}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* New Board Modal */}
        {showNewBoard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Create Discussion Board</h3>
                  <button
                    onClick={() => setShowNewBoard(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Basketball Coaching Tips"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      placeholder="Describe what this board is for..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowNewBoard(false)}
                      className="flex-1 border border-gray-300 hover:bg-gray-50 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      Create Board
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionBoards;