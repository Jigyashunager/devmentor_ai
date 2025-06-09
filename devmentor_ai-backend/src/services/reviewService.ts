import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
    'X-Title': 'DevMentor AI - Code Review Platform',
  },
});

export interface CodeReviewRequest {
  title: string;
  description?: string;
  code: string;
  language: string;
  userId: string;
}

export interface ReviewAnalysis {
  overallScore: number;
  issues: Array<{
    type: 'bug' | 'performance' | 'security' | 'style' | 'maintainability';
    severity: 'low' | 'medium' | 'high' | 'critical';
    line: number;
    message: string;
    suggestion?: string;
  }>;
  suggestions: Array<{
    type: 'improvement' | 'optimization' | 'best-practice';
    message: string;
    codeExample?: string;
  }>;
  complexity: 'low' | 'medium' | 'high';
  maintainability: number;
  performance: number;
  security: number;
}

class ReviewService {
  async createCodeReview(data: CodeReviewRequest) {
    console.log(`🚀 Starting code review for user: ${data.userId}`);
    console.log(`📝 Code details: ${data.language}, ${data.code.length} characters`);

    try {
      // 1. Get AI analysis from OpenRouter
      const aiAnalysis = await this.getAIAnalysis(data);
      
      // 2. Parse the analysis into structured data
      const parsedAnalysis = this.parseAIAnalysis(aiAnalysis.review);
      
      // 3. Save to database
      const savedReview = await this.saveReviewToDatabase(data, parsedAnalysis, aiAnalysis.review);
      
      console.log(`✅ Code review completed and saved: ${savedReview.id}`);
      
      return {
        success: true,
        review: savedReview,
        analysis: parsedAnalysis,
        metadata: aiAnalysis.metadata
      };

    } catch (error: any) {
      console.error('❌ Review service error:', error);
      throw error;
    }
  }

  private async getAIAnalysis(data: CodeReviewRequest) {
    console.log('🤖 Calling OpenRouter API...');

    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OpenRouter API key not configured', 500);
    }
    

    try {
      const completion = await openai.chat.completions.create({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: `You are a senior software engineer and expert code reviewer. Provide detailed, actionable feedback on code quality, security, performance, and best practices. Focus on helping developers improve their skills for technical interviews and professional development.`
          },
          {
            role: 'user',
            content: `Please review this ${data.language} code and provide comprehensive feedback:

Title: ${data.title}
Description: ${data.description || 'No description provided'}

Code to review:
\`\`\`${data.language}
${data.code}
\`\`\`

Please provide detailed analysis including:

1. **Overall Assessment**: Rate the code quality (1-10)
2. **Critical Issues**: Any bugs, security vulnerabilities, or major problems
3. **Performance**: Optimization opportunities and bottlenecks
4. **Code Quality**: Style, readability, maintainability concerns
5. **Best Practices**: Industry standards and ${data.language} specific recommendations
6. **Suggestions**: Specific improvements with code examples
7. **Complexity**: Overall complexity level (low/medium/high)

Format your response with clear sections and be specific about line numbers where applicable. This is for a developer preparing for 20+ LPA technical interviews.`
          },
        ],
        temperature: 0.3,
        max_tokens: 2500,
      });

      const reviewContent = completion.choices[0]?.message?.content;
      
      if (!reviewContent) {
        throw new AppError('No response content received from AI', 503);
      }

      console.log('✅ OpenRouter analysis completed');

      return {
        review: reviewContent,
        metadata: {
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          provider: 'OpenRouter',
          timestamp: new Date().toISOString(),
          codeLength: data.code.length,
          language: data.language,
          tokenCount: completion.usage?.total_tokens || 0
        }
      };

    } catch (apiError: any) {
      console.error('❌ OpenRouter API Error:', apiError);
      
      // Handle specific API errors
      if (apiError.status === 429) {
        throw new AppError('Rate limit exceeded. Please try again in a few minutes.', 429);
      } else if (apiError.status === 401) {
        throw new AppError('Invalid API key configuration', 401);
      } else if (apiError.status >= 500) {
        throw new AppError('AI service temporarily unavailable. Please try again later.', 503);
      } else {
        throw new AppError(`AI analysis failed: ${apiError.message}`, apiError.status || 500);
      }
    }
  }

  private parseAIAnalysis(reviewText: string): ReviewAnalysis {
    console.log('🔍 Parsing AI analysis...');

    // This is a simplified parser - in production, you might want more sophisticated parsing
    // or ask the AI to return structured JSON
    
    const defaultAnalysis: ReviewAnalysis = {
      overallScore: 7.0,
      issues: [],
      suggestions: [],
      complexity: 'medium',
      maintainability: 75,
      performance: 80,
      security: 70
    };

    try {
      // Extract overall score (look for patterns like "7/10", "8.5/10", etc.)
      const scoreMatch = reviewText.match(/(\d+(?:\.\d+)?)\s*\/\s*10|rate.*?(\d+(?:\.\d+)?)|score.*?(\d+(?:\.\d+)?)/i);
      if (scoreMatch) {
        const score = parseFloat(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
        if (score >= 1 && score <= 10) {
          defaultAnalysis.overallScore = score;
        }
      }

      // Extract complexity level
      if (reviewText.toLowerCase().includes('high complexity') || reviewText.toLowerCase().includes('complex')) {
        defaultAnalysis.complexity = 'high';
      } else if (reviewText.toLowerCase().includes('low complexity') || reviewText.toLowerCase().includes('simple')) {
        defaultAnalysis.complexity = 'low';
      }

      // Look for security issues
      if (reviewText.toLowerCase().includes('security') || reviewText.toLowerCase().includes('vulnerability')) {
        defaultAnalysis.issues.push({
          type: 'security',
          severity: 'medium',
          line: 1,
          message: 'Security concerns identified in the analysis',
          suggestion: 'Review the detailed feedback for security recommendations'
        });
        defaultAnalysis.security = 60;
      }

      // Look for performance issues
      if (reviewText.toLowerCase().includes('performance') || reviewText.toLowerCase().includes('optimization')) {
        defaultAnalysis.issues.push({
          type: 'performance',
          severity: 'low',
          line: 1,
          message: 'Performance optimization opportunities identified',
          suggestion: 'See detailed analysis for performance improvements'
        });
        defaultAnalysis.performance = 70;
      }

      // Add general suggestions based on content
      if (reviewText.toLowerCase().includes('error handling')) {
        defaultAnalysis.suggestions.push({
          type: 'best-practice',
          message: 'Improve error handling for better robustness',
          codeExample: 'try { /* your code */ } catch (error) { /* handle error */ }'
        });
      }

      if (reviewText.toLowerCase().includes('type') && reviewText.toLowerCase().includes('script')) {
        defaultAnalysis.suggestions.push({
          type: 'improvement',
          message: 'Consider using TypeScript for better type safety',
        });
      }

    } catch (parseError) {
      console.warn('⚠️ Could not parse some analysis details, using defaults');
    }

    return defaultAnalysis;
  }

  private async saveReviewToDatabase(data: CodeReviewRequest, analysis: ReviewAnalysis, fullReview: string) {
    console.log('💾 Saving review to database...');

    try {
      const savedReview = await prisma.codeReview.create({
        data: {
          title: data.title,
          description: data.description,
          code: data.code,
          language: data.language,
          authorId: data.userId,
          overallScore: analysis.overallScore,
          complexity: analysis.complexity,
          maintainability: analysis.maintainability,
          performance: analysis.performance,
          security: analysis.security,
          fullReview: fullReview, // Store the complete AI analysis
          issues: {
            create: analysis.issues.map(issue => ({
              type: issue.type,
              severity: issue.severity,
              line: issue.line,
              message: issue.message,
              suggestion: issue.suggestion,
            }))
          },
          suggestions: {
            create: analysis.suggestions.map(suggestion => ({
              type: suggestion.type,
              message: suggestion.message,
              codeExample: suggestion.codeExample,
            }))
          }
        },
        include: {
          issues: true,
          suggestions: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      return savedReview;

    } catch (dbError: any) {
      console.error('💥 Database save error:', dbError);
      throw new AppError('Failed to save review to database', 500);
    }
  }

  async getUserReviews(userId: string, page: number = 1, limit: number = 10) {
    console.log(`📖 Getting reviews for user: ${userId}`);

    const skip = (page - 1) * limit;

    const [reviews, totalCount] = await Promise.all([
      prisma.codeReview.findMany({
        where: { authorId: userId },
        include: {
          issues: true,
          suggestions: true,
          _count: {
            select: {
              issues: true,
              suggestions: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.codeReview.count({
        where: { authorId: userId }
      })
    ]);

    return {
      success: true,
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: skip + limit < totalCount,
        hasPrev: page > 1,
      }
    };
  }

  async getReviewById(reviewId: string, userId: string) {
    console.log(`🔍 Getting review: ${reviewId} for user: ${userId}`);

    const review = await prisma.codeReview.findFirst({
      where: { 
        id: reviewId,
        authorId: userId  // Ensure user can only access their own reviews
      },
      include: {
        issues: true,
        suggestions: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    return {
      success: true,
      review
    };
  }
}

export const reviewService = new ReviewService();