import express, { Response, NextFunction } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Get user profile
router.get('/profile', asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('👤 Getting user profile for:', req.user?.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' }
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            codeReviews: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.status(200).json({
      success: true,
      user: {
        ...user,
        totalReviews: user._count.codeReviews,
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user profile' }
    });
  }
}));

// Update user profile
router.put('/profile', asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('✏️ Updating user profile for:', req.user?.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' }
    });
  }

  const { name, email } = req.body;

  try {
    // Basic validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Please provide a valid email address' }
        });
      }

      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: req.user.id }
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: { message: 'Email already in use by another account' }
        });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      }
    });

    console.log(`✅ User profile updated: ${user.email}`);

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update user profile' }
    });
  }
}));

// Get user statistics - UPDATED TO MATCH YOUR SCHEMA
router.get('/stats', asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('📊 Getting user stats for:', req.user?.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' }
    });
  }

  try {
    const [
      totalReviews,
      completedReviews,
      averageScore,
      languageStats,
      complexityStats,
      issuesCount
    ] = await Promise.all([
      // Total reviews count - using correct field name
      prisma.codeReview.count({ 
        where: { authorId: req.user.id } 
      }),
      
      // Completed reviews count
      prisma.codeReview.count({ 
        where: { 
          authorId: req.user.id, 
          status: 'completed' 
        } 
      }),
      
      // Average overall score
      prisma.codeReview.aggregate({
        where: { 
          authorId: req.user.id,
          overallScore: { gt: 0 }
        },
        _avg: { 
          overallScore: true 
        }
      }),
      
      // Language distribution
      prisma.codeReview.groupBy({
        by: ['language'],
        where: { authorId: req.user.id },
        _count: { 
          language: true 
        }
      }),

      // Complexity distribution
      prisma.codeReview.groupBy({
        by: ['complexity'],
        where: { authorId: req.user.id },
        _count: { 
          complexity: true 
        }
      }),

      // Total issues found
      prisma.reviewIssue.count({
        where: {
          codeReview: {
            authorId: req.user.id
          }
        }
      })
    ]);

    // Get performance metrics averages
    const performanceMetrics = await prisma.codeReview.aggregate({
      where: { 
        authorId: req.user.id,
        status: 'completed'
      },
      _avg: {
        maintainability: true,
        performance: true,
        security: true,
      }
    });

    const stats = {
      totalReviews,
      completedReviews,
      pendingReviews: totalReviews - completedReviews,
      averageScore: averageScore._avg.overallScore ? Number(averageScore._avg.overallScore.toFixed(1)) : 0,
      
      // Performance metrics
      averageMaintainability: performanceMetrics._avg.maintainability ? Number(performanceMetrics._avg.maintainability.toFixed(1)) : 0,
      averagePerformance: performanceMetrics._avg.performance ? Number(performanceMetrics._avg.performance.toFixed(1)) : 0,
      averageSecurity: performanceMetrics._avg.security ? Number(performanceMetrics._avg.security.toFixed(1)) : 0,
      
      // Distributions
      languageBreakdown: languageStats.map(stat => ({
        language: stat.language,
        count: stat._count.language
      })),
      
      complexityBreakdown: complexityStats.map(stat => ({
        complexity: stat.complexity,
        count: stat._count.complexity
      })),

      // Additional metrics
      totalIssuesFound: issuesCount,
      completionRate: totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0,
      issuesPerReview: completedReviews > 0 ? Number((issuesCount / completedReviews).toFixed(1)) : 0
    };

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user statistics' }
    });
  }
}));

export default router;