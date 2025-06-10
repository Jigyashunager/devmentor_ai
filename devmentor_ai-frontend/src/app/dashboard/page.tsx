'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Code, 
  CheckCircle, 
  Award,
  Activity
} from 'lucide-react';

interface DashboardStats {
  totalReviews: number;
  averageScore: number;
  improvementRate: number;
  totalIssuesFixed: number;
  recentActivity: Array<{
    id: string;
    title: string;
    score: number;
    language: string;
    createdAt: string;
  }>;
  scoreHistory: Array<{
    date: string;
    score: number;
    reviews: number;
  }>;
  languageDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  performanceMetrics: {
    maintainability: number;
    performance: number;
    security: number;
  };
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    totalReviews: 0,
    averageScore: 0,
    improvementRate: 0,
    totalIssuesFixed: 0
  });

  // Handle authentication check - only run once
  useEffect(() => {
    if (!authLoading) {
      setAuthChecked(true);
      if (!user) {
        console.log('❌ User not authenticated, redirecting to login');
        window.location.href = '/login';
      }
    }
  }, [authLoading, user]);

  // Fetch data only when user is confirmed to be authenticated
  useEffect(() => {
    if (authChecked && user) {
      fetchDashboardData();
    }
  }, [authChecked, user]);

  // Animate numbers when stats load
  useEffect(() => {
    if (stats) {
      animateNumbers();
    }
  }, [stats]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Debug localStorage thoroughly
      console.log('🔍 Debugging localStorage:');
      console.log('All localStorage keys:', Object.keys(localStorage));
      console.log('localStorage.token:', localStorage.getItem('token'));
      console.log('localStorage.authToken:', localStorage.getItem('authToken'));
      console.log('localStorage.accessToken:', localStorage.getItem('accessToken'));
      console.log('localStorage.jwt:', localStorage.getItem('jwt'));
      
      // Try different possible token keys
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('authToken') || 
                   localStorage.getItem('accessToken') || 
                   localStorage.getItem('jwt');
      
      if (!token) {
        console.log('❌ No token found in any format');
        console.log('🔍 Full localStorage:', localStorage);
        setLoading(false);
        return;
      }

      console.log('🔑 Token found:', token.substring(0, 20) + '...');
      console.log('🌐 Making request to:', 'http://localhost:5000/api/analytics/dashboard');
      
      // Fetch dashboard stats from your existing API
      const response = await fetch('http://localhost:5000/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (response.status === 401) {
        // Token is expired or invalid - just log and use fallback data
        console.log('🔄 Token expired, using fallback data');
        localStorage.removeItem('token');
        // Don't redirect here, let the auth check handle it
        throw new Error('Token expired');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Transform your existing API response to match the new dashboard format
        const backendStats = result.stats;
        
        // Create score history from recent reviews
        const scoreHistory = backendStats.recentReviews
          .reverse()
          .map((review: any, index: number) => ({
            date: `Review ${index + 1}`,
            score: review.overallScore || 0,
            reviews: 1
          }));

        // Create language distribution from recent reviews
        const languageCounts: { [key: string]: number } = {};
        backendStats.recentReviews.forEach((review: any) => {
          const lang = review.language || 'unknown';
          languageCounts[lang] = (languageCounts[lang] || 0) + 1;
        });

        const languageColors: { [key: string]: string } = {
          javascript: '#F7DF1E',
          typescript: '#3178C6',
          python: '#3776AB',
          java: '#ED8B00',
          cpp: '#00599C',
          go: '#00ADD8',
          php: '#777BB4',
          unknown: '#6B7280'
        };

        const languageDistribution = Object.entries(languageCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: languageColors[name] || languageColors.unknown
        }));

        // Transform to new format
        const transformedStats = {
          totalReviews: backendStats.totalReviews,
          averageScore: backendStats.averageScore,
          improvementRate: parseFloat(backendStats.trends?.improvementRate?.replace('+', '') || '0'),
          totalIssuesFixed: backendStats.issuesFound,
          recentActivity: backendStats.recentReviews.map((review: any) => ({
            id: review.id,
            title: review.title,
            score: Math.round(review.overallScore || 0),
            language: review.language,
            createdAt: review.createdAt
          })),
          scoreHistory: scoreHistory.length > 0 ? scoreHistory : [
            { date: 'Getting Started', score: 0, reviews: 0 }
          ],
          languageDistribution: languageDistribution.length > 0 ? languageDistribution : [
            { name: 'No Data Yet', value: 1, color: '#E5E7EB' }
          ],
          performanceMetrics: {
            maintainability: Math.round(backendStats.averageScore * 0.9) || 0,
            performance: Math.round(backendStats.averageScore * 0.8) || 0,
            security: Math.round(backendStats.averageScore * 0.95) || 0
          }
        };

        setStats(transformedStats);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Fallback demo data for development
      console.log('📊 Using fallback demo data');
      setStats({
        totalReviews: 24,
        averageScore: 78.5,
        improvementRate: 15.2,
        totalIssuesFixed: 142,
        recentActivity: [
          { id: '1', title: 'React Hook Optimization', score: 85, language: 'javascript', createdAt: '2025-06-10T10:30:00Z' },
          { id: '2', title: 'API Route Handler', score: 72, language: 'typescript', createdAt: '2025-06-09T15:45:00Z' },
          { id: '3', title: 'Database Query', score: 90, language: 'javascript', createdAt: '2025-06-08T09:15:00Z' },
          { id: '4', title: 'Authentication Logic', score: 68, language: 'typescript', createdAt: '2025-06-07T14:20:00Z' }
        ],
        scoreHistory: [
          { date: 'Week 1', score: 65, reviews: 4 },
          { date: 'Week 2', score: 70, reviews: 6 },
          { date: 'Week 3', score: 75, reviews: 8 },
          { date: 'Week 4', score: 78.5, reviews: 6 }
        ],
        languageDistribution: [
          { name: 'JavaScript', value: 45, color: '#F7DF1E' },
          { name: 'TypeScript', value: 35, color: '#3178C6' },
          { name: 'Python', value: 15, color: '#3776AB' },
          { name: 'Java', value: 5, color: '#ED8B00' }
        ],
        performanceMetrics: {
          maintainability: 82,
          performance: 75,
          security: 88
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const animateNumbers = () => {
    if (!stats) return;
    
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        totalReviews: Math.floor(stats.totalReviews * easeOut),
        averageScore: Math.floor(stats.averageScore * easeOut * 100) / 100,
        improvementRate: Math.floor(stats.improvementRate * easeOut * 100) / 100,
        totalIssuesFixed: Math.floor(stats.totalIssuesFixed * easeOut)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          totalReviews: stats.totalReviews,
          averageScore: stats.averageScore,
          improvementRate: stats.improvementRate,
          totalIssuesFixed: stats.totalIssuesFixed
        });
      }
    }, stepDuration);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Show loading while checking authentication
  if (authLoading || !authChecked) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show data loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || 'Developer'}! 👋
        </h1>
        <p className="text-gray-600">Here's your code quality journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{animatedStats.totalReviews}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Code className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{animatedStats.averageScore}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Award className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Improvement</p>
              <p className="text-2xl font-bold text-green-600">+{animatedStats.improvementRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Issues Fixed</p>
              <p className="text-2xl font-bold text-gray-900">{animatedStats.totalIssuesFixed}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {stats && stats.totalReviews === 0 ? (
        // Getting Started Section for new users
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border border-blue-200 mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Code className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to DevMentor AI! 🚀</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              You're all set up! Submit your first code review to start getting AI-powered insights and track your coding progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/reviews"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Code className="h-5 w-5 mr-2" />
                Submit Your First Review
              </a>
              <a
                href="/reviews"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <Activity className="h-5 w-5 mr-2" />
                View Examples
              </a>
            </div>
          </div>
        </div>
      ) : (
        // Regular Charts Section for users with data
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Score Progress Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Progress</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'score' ? `${value}%` : value,
                      name === 'score' ? 'Score' : 'Reviews'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Language Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.languageDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats?.languageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics - Always show */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats && Object.entries(stats.performanceMetrics).map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-2">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={value >= 80 ? "#10B981" : value >= 60 ? "#F59E0B" : "#EF4444"}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - value / 100)}`}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-semibold text-gray-900">{value}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 capitalize">{key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity - Only show if there are reviews */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Code className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.language} • {formatDate(activity.createdAt)}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBadge(activity.score)}`}>
                  {activity.score}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}