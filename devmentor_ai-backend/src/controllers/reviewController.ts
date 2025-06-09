import { Response, NextFunction } from 'express';
import { reviewService } from '../services/reviewService';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const submitCodeReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('📝 Code review submission from user:', req.user?.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  const { title, description, code, language } = req.body;

  // Validation
  if (!title || !code || !language) {
    return res.status(400).json({
      success: false,
      error: { message: 'Title, code, and language are required' }
    });
  }

  if (code.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Code cannot be empty' }
    });
  }

  if (code.length > 50000) {
    return res.status(400).json({
      success: false,
      error: { message: 'Code is too long. Maximum 50,000 characters allowed.' }
    });
  }

  const validLanguages = ['javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'go', 'rust', 'php', 'ruby'];
  if (!validLanguages.includes(language.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: { message: `Language '${language}' is not supported. Supported languages: ${validLanguages.join(', ')}` }
    });
  }

  try {
    const result = await reviewService.createCodeReview({
      title: title.trim(),
      description: description?.trim(),
      code: code.trim(),
      language: language.toLowerCase(),
      userId: req.user.id,
    });

    res.status(201).json(result);

  } catch (error: any) {
    console.error('Review submission error:', error);
    
    // Handle specific errors
    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        error: { 
          message: 'Rate limit exceeded. Please wait before submitting another review.',
          retryAfter: 300 // 5 minutes
        }
      });
    }

    if (error.statusCode === 503) {
      return res.status(503).json({
        success: false,
        error: { 
          message: 'AI service temporarily unavailable. Please try again in a few minutes.' 
        }
      });
    }

    // Generic error
    next(error);
  }
});

export const getUserReviews = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('📖 Getting reviews for user:', req.user?.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  // Validate pagination
  if (page < 1 || limit < 1 || limit > 50) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid pagination parameters. Page must be >= 1, limit must be 1-50.' }
    });
  }

  const result = await reviewService.getUserReviews(req.user.id, page, limit);

  res.status(200).json(result);
});

export const getReviewById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('🔍 Getting review by ID:', req.params.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  const reviewId = req.params.id;

  if (!reviewId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Review ID is required' }
    });
  }

  const result = await reviewService.getReviewById(reviewId, req.user.id);

  res.status(200).json(result);
});

export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('🗑️ Deleting review:', req.params.id);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  const reviewId = req.params.id;

  if (!reviewId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Review ID is required' }
    });
  }

  // First check if review exists and belongs to user
  const existingReview = await reviewService.getReviewById(reviewId, req.user.id);
  
  if (!existingReview.success) {
    return res.status(404).json({
      success: false,
      error: { message: 'Review not found' }
    });
  }

  // Delete the review (Prisma will cascade delete related issues and suggestions)
  await prisma.codeReview.delete({
    where: { id: reviewId }
  });

  console.log(`✅ Review deleted: ${reviewId}`);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
});