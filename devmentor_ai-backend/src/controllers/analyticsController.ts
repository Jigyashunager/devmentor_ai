import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get basic stats
    const totalReviews = await prisma.codeReview.count({
      where: { authorId: userId }
    });

    const reviews = await prisma.codeReview.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        overallScore: true,
        language: true,
        createdAt: true,
        maintainability: true,
        performance: true,
        security: true
      }
    });

    // Calculate average score
    const averageScore = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.overallScore, 0) / reviews.length
      : 0;

    // Calculate improvement rate (compare first half vs second half)
    let improvementRate = 0;
    if (reviews.length >= 4) {
      const midPoint = Math.floor(reviews.length / 2);
      const recentReviews = reviews.slice(0, midPoint);
      const olderReviews = reviews.slice(midPoint);
      
      const recentAvg = recentReviews.reduce((sum, review) => sum + review.overallScore, 0) / recentReviews.length;
      const olderAvg = olderReviews.reduce((sum, review) => sum + review.overallScore, 0) / olderReviews.length;
      
      improvementRate = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    }

    // Get total issues fixed (count of issues)
    const totalIssues = await prisma.reviewIssue.count({
      where: {
        codeReview: {
          authorId: userId
        }
      }
    });

    // Recent activity (last 10 reviews)
    const recentActivity = reviews.slice(0, 10).map(review => ({
      id: review.id,
      title: review.title,
      score: Math.round(review.overallScore),
      language: review.language,
      createdAt: review.createdAt.toISOString()
    }));

    // Score history (weekly aggregation)
    const scoreHistory = generateScoreHistory(reviews);

    // Language distribution
    const languageDistribution = generateLanguageDistribution(reviews);

    // Performance metrics (averages)
    const performanceMetrics = {
      maintainability: reviews.length > 0 
        ? Math.round(reviews.reduce((sum, review) => sum + review.maintainability, 0) / reviews.length)
        : 0,
      performance: reviews.length > 0 
        ? Math.round(reviews.reduce((sum, review) => sum + review.performance, 0) / reviews.length)
        : 0,
      security: reviews.length > 0 
        ? Math.round(reviews.reduce((sum, review) => sum + review.security, 0) / reviews.length)
        : 0
    };

    const dashboardStats = {
      totalReviews,
      averageScore: Math.round(averageScore * 100) / 100,
      improvementRate: Math.round(improvementRate * 100) / 100,
      totalIssuesFixed: totalIssues,
      recentActivity,
      scoreHistory,
      languageDistribution,
      performanceMetrics
    };

    res.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getProgressAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const reviews = await prisma.codeReview.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'asc' },
      select: {
        overallScore: true,
        maintainability: true,
        performance: true,
        security: true,
        createdAt: true,
        language: true
      }
    });

    // Generate progress trends
    const progressTrends = reviews.map((review, index) => ({
      review: index + 1,
      overallScore: review.overallScore,
      maintainability: review.maintainability,
      performance: review.performance,
      security: review.security,
      date: review.createdAt.toISOString().split('T')[0]
    }));

    // Language improvement trends
    const languageProgress = generateLanguageProgress(reviews);

    res.json({
      progressTrends,
      languageProgress,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error fetching progress analytics:', error);
    res.status(500).json({ error: 'Failed to fetch progress analytics' });
  }
};

export const getInsights = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const reviews = await prisma.codeReview.findMany({
      where: { authorId: userId },
      include: {
        issues: true,
        suggestions: true
      }
    });

    // Generate insights
    const insights = generateInsights(reviews);

    res.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
};

// Helper functions
function generateScoreHistory(reviews: any[]) {
  if (reviews.length === 0) return [];

  // Group reviews by week
  const weeklyData: { [key: string]: { scores: number[], count: number } } = {};
  
  reviews.forEach(review => {
    const date = new Date(review.createdAt);
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { scores: [], count: 0 };
    }
    
    weeklyData[weekKey].scores.push(review.overallScore);
    weeklyData[weekKey].count++;
  });

  // Convert to array and sort by date
  const sortedWeeks = Object.entries(weeklyData)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(-8); // Last 8 weeks

  return sortedWeeks.map(([date, data], index) => ({
    date: `Week ${index + 1}`,
    score: Math.round((data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length) * 100) / 100,
    reviews: data.count
  }));
}

function generateLanguageDistribution(reviews: any[]) {
  const languageCounts: { [key: string]: number } = {};
  
  reviews.forEach(review => {
    const lang = review.language || 'unknown';
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  });

  const colors = {
    javascript: '#F7DF1E',
    typescript: '#3178C6',
    python: '#3776AB',
    java: '#ED8B00',
    cpp: '#00599C',
    csharp: '#239120',
    go: '#00ADD8',
    rust: '#000000',
    php: '#777BB4',
    ruby: '#CC342D',
    unknown: '#6B7280'
  };

  return Object.entries(languageCounts)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[name as keyof typeof colors] || colors.unknown
    }))
    .sort((a, b) => b.value - a.value);
}

function generateLanguageProgress(reviews: any[]) {
  const languageProgress: { [key: string]: any[] } = {};
  
  reviews.forEach((review, index) => {
    const lang = review.language || 'unknown';
    
    if (!languageProgress[lang]) {
      languageProgress[lang] = [];
    }
    
    languageProgress[lang].push({
      review: index + 1,
      score: review.overallScore,
      date: review.createdAt.toISOString().split('T')[0]
    });
  });

  return languageProgress;
}

function generateInsights(reviews: any[]) {
  const insights = [];
  
  if (reviews.length === 0) {
    return [
      {
        type: 'welcome',
        title: 'Welcome to DevMentor AI!',
        message: 'Submit your first code review to start getting personalized insights.',
        priority: 'high'
      }
    ];
  }

  // Calculate average scores
  const avgOverall = reviews.reduce((sum, r) => sum + r.overallScore, 0) / reviews.length;
  const avgMaintainability = reviews.reduce((sum, r) => sum + r.maintainability, 0) / reviews.length;
  const avgPerformance = reviews.reduce((sum, r) => sum + r.performance, 0) / reviews.length;
  const avgSecurity = reviews.reduce((sum, r) => sum + r.security, 0) / reviews.length;

  // Generate insights based on scores
  if (avgOverall >= 80) {
    insights.push({
      type: 'achievement',
      title: 'Excellent Code Quality!',
      message: `Your average score of ${avgOverall.toFixed(1)}% shows consistently high-quality code.`,
      priority: 'high'
    });
  } else if (avgOverall < 60) {
    insights.push({
      type: 'improvement',
      title: 'Focus on Code Quality',
      message: 'Your code quality has room for improvement. Focus on the suggestions from recent reviews.',
      priority: 'high'
    });
  }

  // Security insights
  if (avgSecurity < 70) {
    insights.push({
      type: 'security',
      title: 'Security Enhancement Needed',
      message: 'Consider implementing better security practices like input validation and error handling.',
      priority: 'high'
    });
  }

  // Performance insights
  if (avgPerformance < 70) {
    insights.push({
      type: 'performance',
      title: 'Performance Optimization',
      message: 'Look into optimizing your code for better performance - consider async patterns and efficient algorithms.',
      priority: 'medium'
    });
  }

  // Trend analysis
  if (reviews.length >= 3) {
    const recent = reviews.slice(0, Math.ceil(reviews.length / 3));
    const older = reviews.slice(Math.ceil(reviews.length / 3));
    
    const recentAvg = recent.reduce((sum, r) => sum + r.overallScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.overallScore, 0) / older.length;
    
    if (recentAvg > olderAvg + 5) {
      insights.push({
        type: 'trend',
        title: 'Great Progress!',
        message: `Your recent code quality has improved by ${((recentAvg - olderAvg) / olderAvg * 100).toFixed(1)}%`,
        priority: 'medium'
      });
    }
  }

  return insights.slice(0, 5); // Return top 5 insights
}