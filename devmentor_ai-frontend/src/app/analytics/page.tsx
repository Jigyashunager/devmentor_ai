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
  BarChart,
  Bar,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, 
  Code, 
  CheckCircle, 
  AlertTriangle,
  Award,
  Activity,
  Target,
  Brain,
  Zap,
  Shield,
  Wrench,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Lightbulb
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalReviews: number;
    averageScore: number;
    improvementRate: number;
    totalIssuesFixed: number;
    weeklyReviews: number;
    monthlyGrowth: number;
  };
  scoreHistory: Array<{
    date: string;
    overallScore: number;
    maintainability: number;
    performance: number;
    security: number;
    reviewCount: number;
  }>;
  languageAnalytics: Array<{
    language: string;
    reviews: number;
    avgScore: number;
    issues: number;
    color: string;
  }>;
  complexityTrends: Array<{
    month: string;
    low: number;
    medium: number;
    high: number;
  }>;
  issueCategories: Array<{
    category: string;
    count: number;
    severity: string;
    trend: number;
  }>;
  skillRadar: Array<{
    skill: string;
    current: number;
    target: number;
  }>;
  topIssues: Array<{
    type: string;
    count: number;
    impact: number;
    suggestions: string[];
  }>;
}

export default function AdvancedAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('3months');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/analytics/advanced?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.analytics);
        }
      } else {
        // Fallback to demo data for development
        setData(generateDemoData());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setData(generateDemoData());
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const generateDemoData = (): AnalyticsData => ({
    overview: {
      totalReviews: 47,
      averageScore: 7.8,
      improvementRate: 23.5,
      totalIssuesFixed: 142,
      weeklyReviews: 8,
      monthlyGrowth: 15.2
    },
    scoreHistory: [
      { date: 'Week 1', overallScore: 6.2, maintainability: 6.5, performance: 5.8, security: 6.0, reviewCount: 4 },
      { date: 'Week 2', overallScore: 6.8, maintainability: 7.0, performance: 6.2, security: 6.8, reviewCount: 6 },
      { date: 'Week 3', overallScore: 7.2, maintainability: 7.5, performance: 6.8, security: 7.2, reviewCount: 8 },
      { date: 'Week 4', overallScore: 7.8, maintainability: 8.0, performance: 7.4, security: 7.9, reviewCount: 7 },
      { date: 'Week 5', overallScore: 8.1, maintainability: 8.2, performance: 7.8, security: 8.2, reviewCount: 9 },
      { date: 'Week 6', overallScore: 8.4, maintainability: 8.5, performance: 8.0, security: 8.6, reviewCount: 8 },
    ],
    languageAnalytics: [
      { language: 'JavaScript', reviews: 18, avgScore: 7.9, issues: 45, color: '#F7DF1E' },
      { language: 'TypeScript', reviews: 15, avgScore: 8.2, issues: 32, color: '#3178C6' },
      { language: 'Python', reviews: 8, avgScore: 7.6, issues: 28, color: '#3776AB' },
      { language: 'Java', reviews: 6, avgScore: 7.4, issues: 37, color: '#ED8B00' },
    ],
    complexityTrends: [
      { month: 'Jan', low: 12, medium: 8, high: 3 },
      { month: 'Feb', low: 15, medium: 10, high: 2 },
      { month: 'Mar', low: 18, medium: 12, high: 4 },
      { month: 'Apr', low: 20, medium: 15, high: 3 },
    ],
    issueCategories: [
      { category: 'Performance', count: 28, severity: 'medium', trend: -12 },
      { category: 'Security', count: 34, severity: 'high', trend: -8 },
      { category: 'Maintainability', count: 52, severity: 'low', trend: -15 },
      { category: 'Style', count: 28, severity: 'low', trend: -20 },
    ],
    skillRadar: [
      { skill: 'Code Quality', current: 82, target: 90 },
      { skill: 'Performance', current: 75, target: 85 },
      { skill: 'Security', current: 88, target: 95 },
      { skill: 'Maintainability', current: 85, target: 90 },
      { skill: 'Best Practices', current: 78, target: 88 },
      { skill: 'Testing', current: 65, target: 80 },
    ],
    topIssues: [
      { 
        type: 'Missing Error Handling', 
        count: 12, 
        impact: 8, 
        suggestions: ['Add try-catch blocks', 'Implement error boundaries', 'Add input validation'] 
      },
      { 
        type: 'Performance Bottlenecks', 
        count: 8, 
        impact: 7, 
        suggestions: ['Use async/await', 'Optimize loops', 'Implement caching'] 
      },
      { 
        type: 'Security Vulnerabilities', 
        count: 6, 
        impact: 9, 
        suggestions: ['Sanitize inputs', 'Use HTTPS', 'Implement authentication'] 
      },
    ]
  });

  const exportReport = () => {
    if (!data) return;
    
    const report = {
      generatedAt: new Date().toISOString(),
      timeRange,
      overview: data.overview,
      analytics: {
        scoreHistory: data.scoreHistory,
        languageAnalytics: data.languageAnalytics,
        issueCategories: data.issueCategories,
        topIssues: data.topIssues
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devmentor-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Analytics</h1>
            <p className="text-gray-600">Deep insights into your coding journey and skill development</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
            
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={exportReport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Reviews</p>
              <p className="text-3xl font-bold">{data?.overview.totalReviews || 0}</p>
              <p className="text-blue-100 text-sm">+{data?.overview.weeklyReviews || 0} this week</p>
            </div>
            <div className="p-3 bg-blue-400 rounded-full">
              <Code className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Average Score</p>
              <p className="text-3xl font-bold">{data?.overview.averageScore.toFixed(1) || '0.0'}</p>
              <p className="text-green-100 text-sm">+{data?.overview.improvementRate.toFixed(1) || '0'}% improvement</p>
            </div>
            <div className="p-3 bg-green-400 rounded-full">
              <Award className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Issues Resolved</p>
              <p className="text-3xl font-bold">{data?.overview.totalIssuesFixed || 0}</p>
              <p className="text-purple-100 text-sm">+{data?.overview.monthlyGrowth.toFixed(1) || '0'}% this month</p>
            </div>
            <div className="p-3 bg-purple-400 rounded-full">
              <CheckCircle className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Score Progress Over Time */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Development Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data?.scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" domain={[0, 10]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(1) : value,
                    name === 'reviewCount' ? 'Reviews' : name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="overallScore" 
                  fill="#3B82F6" 
                  fillOpacity={0.1}
                  stroke="#3B82F6"
                  strokeWidth={3}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="maintainability" 
                  stroke="#10B981" 
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="performance" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="security" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="reviewCount" 
                  fill="#8B5CF6" 
                  fillOpacity={0.7}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.languageAnalytics} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 10]} />
                <YAxis dataKey="language" type="category" width={80} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'avgScore' ? `${value}/10` : value,
                    name === 'avgScore' ? 'Avg Score' : 
                    name === 'reviews' ? 'Reviews' : 'Issues'
                  ]}
                />
                <Bar dataKey="avgScore" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Skills Radar and Issue Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Skills Radar Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Assessment</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data?.skillRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis domain={[0, 100]} tickCount={5} />
                <Radar
                  name="Current"
                  dataKey="current"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Target"
                  dataKey="target"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Categories */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Categories</h3>
          <div className="space-y-4">
            {data?.issueCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    category.severity === 'high' ? 'bg-red-100' :
                    category.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    {category.severity === 'high' ? 
                      <AlertTriangle className="h-5 w-5 text-red-600" /> :
                      category.severity === 'medium' ?
                      <AlertTriangle className="h-5 w-5 text-yellow-600" /> :
                      <AlertTriangle className="h-5 w-5 text-blue-600" />
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{category.category}</p>
                    <p className="text-sm text-gray-500">{category.count} issues found</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${category.trend < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {category.trend < 0 ? '↓' : '↑'} {Math.abs(category.trend)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Issues and Recommendations */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Issues & AI Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.topIssues.map((issue, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{issue.type}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {issue.count} occurrences
                  </span>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">Impact Level</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${issue.impact >= 8 ? 'bg-red-500' : issue.impact >= 6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${issue.impact * 10}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium">{issue.impact}/10</span>
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">AI Suggestions:</h5>
                <ul className="space-y-1">
                  {issue.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                      <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}