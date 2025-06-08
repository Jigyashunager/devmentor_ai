// User and Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'developer' | 'reviewer' | 'admin';
  createdAt: Date;
}

// Code Review Types
export interface CodeReview {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  status: 'pending' | 'in-review' | 'approved' | 'rejected';
  authorId: string;
  reviewerId?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  aiAnalysis?: AIAnalysis;
  comments: Comment[];
}

export interface AIAnalysis {
  id: string;
  codeReviewId: string;
  overallScore: number;
  issues: Issue[];
  suggestions: Suggestion[];
  complexity: 'low' | 'medium' | 'high';
  maintainability: number;
  performance: number;
  security: number;
  createdAt: Date;
}

export interface Issue {
  id: string;
  type: 'bug' | 'performance' | 'security' | 'style' | 'maintainability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  message: string;
  suggestion?: string;
}

export interface Suggestion {
  id: string;
  type: 'improvement' | 'optimization' | 'best-practice';
  line: number;
  message: string;
  codeExample?: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  line?: number;
  createdAt: Date;
  isResolved: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard Types
export interface DashboardStats {
  totalReviews: number;
  pendingReviews: number;
  completedReviews: number;
  averageScore: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'review_created' | 'review_completed' | 'comment_added';
  userId: string;
  codeReviewId: string;
  message: string;
  createdAt: Date;
}