'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import CodeViewer from '@/components/CodeViewer';
import ReviewDetailsModal from '@/components/ReviewDetailsModal';
import { 
  Code, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit2, 
  Trash2, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  FileCode,
  TrendingUp,
  Calendar,
  Zap,
  Star
} from 'lucide-react';

interface CodeReview {
  id: string;
  title: string;
  description: string;
  language: string;
  status: string;
  overallScore: number;
  complexity: string;
  createdAt: string;
  updatedAt: string;
  issuesCount: number;
  suggestionsCount: number;
}

interface SubmissionData {
  title: string;
  description: string;
  code: string;
  language: string;
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [showReviewDetails, setShowReviewDetails] = useState(false);
  
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    title: '',
    description: '',
    code: '',
    language: 'javascript'
  });

  const languages = [
    { value: 'javascript', label: 'JavaScript', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'typescript', label: 'TypeScript', color: 'bg-blue-100 text-blue-800' },
    { value: 'python', label: 'Python', color: 'bg-green-100 text-green-800' },
    { value: 'java', label: 'Java', color: 'bg-orange-100 text-orange-800' },
    { value: 'cpp', label: 'C++', color: 'bg-purple-100 text-purple-800' },
    { value: 'go', label: 'Go', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'rust', label: 'Rust', color: 'bg-red-100 text-red-800' },
    { value: 'php', label: 'PHP', color: 'bg-indigo-100 text-indigo-800' },
  ];

  const sampleCodes = {
    javascript: `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}

const products = [
  { name: "Laptop", price: 999 },
  { name: "Mouse", price: 25 },
  { name: "Keyboard", price: 75 }
];

console.log(calculateTotal(products));`,
    
    typescript: `interface User {
  id: string;
  name: string;
  email: string;
}

async function getUser(id: string): Promise<User | null> {
  try {
    const response = await fetch(\`/api/users/\${id}\`);
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}`,

    python: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def main():
    number = 10
    result = fibonacci(number)
    print(f"Fibonacci of {number} is {result}")

if __name__ == "__main__":
    main()`,

    java: `public class Calculator {
    public static int add(int a, int b) {
        return a + b;
    }
    
    public static void main(String[] args) {
        int result = add(5, 3);
        System.out.println("Result: " + result);
    }
}`
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/reviews', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReviews(result.reviews);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submissionData.code.trim()) {
      alert('Please enter some code to review');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Code review submitted successfully! 🎉');
          setShowSubmitForm(false);
          setSubmissionData({ title: '', description: '', code: '', language: 'javascript' });
          fetchReviews(); // Refresh the list
        }
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadSampleCode = () => {
    const sample = sampleCodes[submissionData.language as keyof typeof sampleCodes];
    if (sample) {
      setSubmissionData(prev => ({ 
        ...prev, 
        code: sample,
        title: `Sample ${languages.find(l => l.value === submissionData.language)?.label} Code`
      }));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLanguageStyle = (language: string) => {
    return languages.find(l => l.value === language)?.color || 'bg-gray-100 text-gray-800';
  };

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(review => {
      const matchesSearch = review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          review.language.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLanguage = languageFilter === 'all' || review.language === languageFilter;
      return matchesSearch && matchesLanguage;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'score-high':
          return b.overallScore - a.overallScore;
        case 'score-low':
          return a.overallScore - b.overallScore;
        default:
          return 0;
      }
    });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Code Reviews</h1>
            <p className="text-gray-600">Submit code for AI-powered analysis and track your progress</p>
          </div>
          <button
            onClick={() => setShowSubmitForm(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Review
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <FileCode className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full mr-4">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviews.length > 0 
                  ? (reviews.reduce((sum, r) => sum + r.overallScore, 0) / reviews.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full mr-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Issues Found</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviews.reduce((sum, r) => sum + r.issuesCount, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full mr-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Suggestions</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviews.reduce((sum, r) => sum + r.suggestionsCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Languages</option>
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="score-high">Highest Score</option>
            <option value="score-low">Lowest Score</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border text-center">
          <FileCode className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {reviews.length === 0 ? 'No reviews yet' : 'No reviews found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {reviews.length === 0 
              ? 'Submit your first code review to get started with AI-powered analysis.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {reviews.length === 0 && (
            <button
              onClick={() => setShowSubmitForm(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Submit First Review
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{review.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLanguageStyle(review.language)}`}>
                      {languages.find(l => l.value === review.language)?.label || review.language}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(review.complexity)}`}>
                      {review.complexity} complexity
                    </span>
                  </div>
                  
                  {review.description && (
                    <p className="text-gray-600 mb-3">{review.description}</p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(review.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {review.issuesCount} issues
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      {review.suggestionsCount} suggestions
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getScoreColor(review.overallScore)}`}>
                      {review.overallScore.toFixed(1)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Score</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedReviewId(review.id);
                        setShowReviewDetails(true);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Submit Code Review</h2>
                <button
                  onClick={() => setShowSubmitForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={submissionData.title}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., User Authentication Function"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={submissionData.language}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {languages.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={submissionData.description}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what this code does..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Code *
                    </label>
                    <button
                      type="button"
                      onClick={loadSampleCode}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Load Sample Code
                    </button>
                  </div>
                  <CodeViewer
                    code={submissionData.code}
                    language={submissionData.language}
                    readOnly={false}
                    height="400px"
                    onCodeChange={(code) => setSubmissionData(prev => ({ ...prev, code }))}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {submissionData.code.length}/50,000 characters
                  </p>
                </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Submit for AI Review
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmitForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Details Modal */}
      <ReviewDetailsModal
        reviewId={selectedReviewId || ''}
        isOpen={showReviewDetails}
        onClose={() => {
          setShowReviewDetails(false);
          setSelectedReviewId(null);
        }}
      />
    </div>
  );
}