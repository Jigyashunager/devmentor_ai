import express, { Response, NextFunction } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// Dashboard analytics
router.get('/dashboard', asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('📈 Getting dashboard analytics for:', req.user?.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' }
    });
  }

  try {
    // Get user's review statistics using correct field names
    const [
      totalReviews,
      pendingReviews,
      completedReviews,
      recentReviews,
      averageScore
    ] = await Promise.all([
      // Total reviews count
      prisma.codeReview.count({
        where: { authorId: req.user.id }
      }),
      
      // Pending reviews count  
      prisma.codeReview.count({
        where: { authorId: req.user.id, status: 'pending' }
      }),
      
      // Completed reviews count
      prisma.codeReview.count({
        where: { authorId: req.user.id, status: 'completed' }
      }),
      
      // Recent reviews (last 5)
      prisma.codeReview.findMany({
        where: { authorId: req.user.id },
        select: {
          id: true,
          title: true,
          language: true,
          status: true,
          overallScore: true,
          complexity: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Average score
      prisma.codeReview.aggregate({
        where: { 
          authorId: req.user.id,
          overallScore: { gt: 0 }
        },
        _avg: {
          overallScore: true
        }
      })
    ]);

    // Calculate additional stats
    const issuesCount = await prisma.reviewIssue.count({
      where: {
        codeReview: {
          authorId: req.user.id
        }
      }
    });

    const stats = {
      totalReviews,
      pendingReviews,
      completedReviews,
      averageScore: averageScore._avg.overallScore ? Number(averageScore._avg.overallScore.toFixed(1)) : 0,
      issuesFound: issuesCount,
      recentReviews,
      trends: {
        reviewsThisWeek: Math.floor(totalReviews * 0.1), // Mock calculation
        improvementRate: '+0.3', // Mock data
      }
    };

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch dashboard analytics' }
    });
  }
}));

// Progress analytics
router.get('/progress', asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('📊 Getting progress analytics for:', req.user?.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' }
    });
  }

  try {
    // Get reviews over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const reviewsOverTime = await prisma.codeReview.findMany({
      where: {
        authorId: req.user.id,
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true,
        language: true,
        overallScore: true,
        complexity: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by month
    const monthlyData = reviewsOverTime.reduce((acc: any, review) => {
      const month = review.createdAt.toISOString().slice(0, 7); // YYYY-MM format
      
      if (!acc[month]) {
        acc[month] = {
          month,
          reviews: 0,
          averageScore: 0,
          scores: []
        };
      }
      
      acc[month].reviews++;
      if (review.overallScore > 0) {
        acc[month].scores.push(review.overallScore);
      }
      
      return acc;
    }, {});

    // Calculate average scores for each month
    Object.values(monthlyData).forEach((data: any) => {
      if (data.scores.length > 0) {
        data.averageScore = data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length;
      }
      delete data.scores; // Remove intermediate data
    });

    // Language distribution
    const languageStats = reviewsOverTime.reduce((acc: any, review) => {
      acc[review.language] = (acc[review.language] || 0) + 1;
      return acc;
    }, {});

    // Complexity distribution
    const complexityStats = reviewsOverTime.reduce((acc: any, review) => {
      acc[review.complexity] = (acc[review.complexity] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      analytics: {
        progressOverTime: Object.values(monthlyData),
        languageDistribution: languageStats,
        complexityDistribution: complexityStats,
        totalReviewsAnalyzed: reviewsOverTime.length,
      }
    });

  } catch (error) {
    console.error('Progress analytics error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch progress analytics' }
    });
  }
}));

// AI Insights
router.get('/insights', asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('🔍 Getting AI insights for:', req.user?.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' }
    });
  }

  try {
    // Get user's recent review data for insights
    const recentReviews = await prisma.codeReview.findMany({
      where: { authorId: req.user.id },
      select: {
        language: true,
        complexity: true,
        maintainability: true,
        performance: true,
        security: true,
        overallScore: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get common issues
    const commonIssues = await prisma.reviewIssue.groupBy({
      by: ['type'],
      where: {
        codeReview: {
          authorId: req.user.id
        }
      },
      _count: {
        type: true
      },
      orderBy: {
        _count: {
          type: 'desc'
        }
      },
      take: 3
    });

    // Generate insights based on data
    const insights = [];

    // Security insight
    if (recentReviews.length > 0) {
      const avgSecurity = recentReviews.reduce((sum, r) => sum + r.security, 0) / recentReviews.length;
      if (avgSecurity < 8) {
        insights.push({
          type: 'security',
          title: 'Security Focus Needed',
          message: `Your average security score is ${avgSecurity.toFixed(1)}/10. Consider reviewing security best practices.`,
          priority: 'high',
          actionable: true
        });
      }
    }

    // Performance insight
    if (recentReviews.length > 0) {
      const avgPerformance = recentReviews.reduce((sum, r) => sum + r.performance, 0) / recentReviews.length;
      insights.push({
        type: 'performance',
        title: 'Performance Tracking',
        message: `Your average performance score is ${avgPerformance.toFixed(1)}/10. ${avgPerformance > 8 ? 'Great job!' : 'Room for improvement.'}`,
        priority: avgPerformance > 8 ? 'low' : 'medium',
        actionable: avgPerformance <= 8
      });
    }

    // Common issue insight
    if (commonIssues.length > 0) {
      const topIssue = commonIssues[0];
      insights.push({
        type: 'quality',
        title: 'Common Issue Pattern',
        message: `Your most common issue type is "${topIssue.type}" (${topIssue._count.type} occurrences). Focus on improving this area.`,
        priority: 'medium',
        actionable: true
      });
    }

    // Default insights if no data
    if (insights.length === 0) {
      insights.push(
        {
          type: 'quality',
          title: 'Getting Started',
          message: 'Submit more code reviews to get personalized insights and recommendations.',
          priority: 'info',
          actionable: true
        }
      );
    }

    res.status(200).json({
      success: true,
      insights
    });

  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch AI insights' }
    });
  }
}));

export default router;  