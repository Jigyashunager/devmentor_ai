import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { reviewService } from '../services/reviewService'; // Import your actual service

// Submit Code Review with External AI Analysis
export const submitCodeReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('📝 Code review submission:', { userId: req.user?.id });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' }
    });
  }

  const { title, description, code, language } = req.body;

  // Validation
  if (!code || !language) {
    return res.status(400).json({
      success: false,
      error: { message: 'Code and language are required' }
    });
  }

  if (code.length > 50000) {
    return res.status(400).json({
      success: false,
      error: { message: 'Code is too long. Maximum 50,000 characters allowed.' }
    });
  }

  try {
    // Use your external API service instead of local analysis
    console.log('🚀 Using external AI service for analysis...');
    
    const reviewResult = await reviewService.createCodeReview({
      title: title || 'Untitled Review',
      description: description || '',
      code,
      language,
      userId: req.user.id
    });

    if (!reviewResult.success) {
      throw new Error('AI analysis failed');
    }

    console.log(`✅ Review created with external AI analysis: ${reviewResult.review.id}`);

    // Return the result from the external service
    res.status(201).json({
      success: true,
      review: {
        ...reviewResult.review,
        issuesCount: reviewResult.review.issues?.length || 0,
        suggestionsCount: reviewResult.review.suggestions?.length || 0,
        analysisComplete: true,
        message: 'Code review completed successfully with external AI analysis!',
        metadata: reviewResult.metadata // Include AI metadata
      }
    });

  } catch (error: any) {
    console.error('❌ Code review submission error:', error);
    
    // Handle specific API errors
    if (error.message?.includes('Rate limit')) {
      return res.status(429).json({
        success: false,
        error: { message: 'AI service rate limit exceeded. Please try again in a few minutes.' }
      });
    }
    
    if (error.message?.includes('API key')) {
      return res.status(500).json({
        success: false,
        error: { message: 'AI service configuration error. Please contact support.' }
      });
    }
    
    res.status(500).json({
      success: false,
      error: { message: 'Failed to submit code review. Please try again.' }
    });
  }
});

// Get User Reviews with Pagination
export const getUserReviews = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('📋 Getting user reviews:', { userId: req.user?.id });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' }
    });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Use the service method instead of direct Prisma calls
    const result = await reviewService.getUserReviews(req.user.id, page, limit);

    res.status(200).json({
      success: true,
      reviews: result.reviews.map(review => ({
        ...review,
        issuesCount: review.issues?.length || 0,
        suggestionsCount: review.suggestions?.length || 0,
      })),
      pagination: result.pagination
    });

  } catch (error) {
    console.error('❌ Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch reviews' }
    });
  }
});

// Get Review by ID with Complete Details
export const getReviewById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('🔍 Getting review by ID:', { reviewId: req.params.id, userId: req.user?.id });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' }
    });
  }

  const reviewId = req.params.id;

  try {
    // Use the service method
    const result = await reviewService.getReviewById(reviewId, req.user.id);

    res.status(200).json({
      success: true,
      review: result.review
    });

  } catch (error: any) {
    console.error('❌ Get review error:', error);
    
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: { message: 'Review not found' }
      });
    }
    
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch review' }
    });
  }
});

// Update Review
export const updateReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('✏️ Updating review:', { reviewId: req.params.id, userId: req.user?.id });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' }
    });
  }

  const reviewId = req.params.id;
  const { title, description } = req.body;

  try {
    // Check if review exists and belongs to user
    const existingReview = await prisma.codeReview.findFirst({
      where: {
        id: reviewId,
        authorId: req.user.id,
      }
    });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        error: { message: 'Review not found' }
      });
    }

    const review = await prisma.codeReview.update({
      where: { id: reviewId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        description: true,
        language: true,
        status: true,
        overallScore: true,
        complexity: true,
        updatedAt: true,
      }
    });

    console.log(`✅ Review updated: ${reviewId}`);

    res.status(200).json({
      success: true,
      review
    });

  } catch (error) {
    console.error('❌ Update review error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update review' }
    });
  }
});

// Delete Review
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log('🗑️ Deleting review:', { reviewId: req.params.id, userId: req.user?.id });

  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Not authenticated' }
    });
  }

  const reviewId = req.params.id;

  try {
    // Check if review exists and belongs to user
    const review = await prisma.codeReview.findFirst({
      where: {
        id: reviewId,
        authorId: req.user.id,
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: { message: 'Review not found' }
      });
    }

    // Delete review (cascade will handle related records)
    await prisma.codeReview.delete({
      where: { id: reviewId }
    });

    console.log(`✅ Review deleted: ${reviewId}`);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete review error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete review' }
    });
  }
});