// API Client for DevMentor AI Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
  message?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  totalReviews?: number;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface CodeReview {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  status: string;
  overallScore: number;
  complexity: string;
  maintainability: number;
  performance: number;
  security: number;
  fullReview: string;
  createdAt: string;
  updatedAt: string;
  issuesCount?: number;
  suggestionsCount?: number;
  issues?: ReviewIssue[];
  suggestions?: ReviewSuggestion[];
}

export interface ReviewIssue {
  id: string;
  type: string;
  severity: string;
  line: number;
  message: string;
  suggestion?: string;
}

export interface ReviewSuggestion {
  id: string;
  type: string;
  message: string;
  codeExample?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getProfile(): Promise<{ success: boolean; user: User }> {
    return this.request<{ success: boolean; user: User }>('/api/auth/me');
  }

  async updateProfile(data: {
    name?: string;
    email?: string;
  }): Promise<{ success: boolean; user: User }> {
    return this.request<{ success: boolean; user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Code Review endpoints
  async submitCodeReview(reviewData: {
    title: string;
    description?: string;
    code: string;
    language: string;
  }): Promise<{ success: boolean; review: CodeReview }> {
    return this.request<{ success: boolean; review: CodeReview }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async getReviews(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    success: boolean;
    reviews: CodeReview[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    const endpoint = `/api/reviews${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  async getReview(id: string): Promise<{ success: boolean; review: CodeReview }> {
    return this.request<{ success: boolean; review: CodeReview }>(`/api/reviews/${id}`);
  }

  async updateReview(
    id: string,
    data: { title?: string; description?: string }
  ): Promise<{ success: boolean; review: CodeReview }> {
    return this.request<{ success: boolean; review: CodeReview }>(`/api/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReview(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getDashboardStats(): Promise<{
    success: boolean;
    stats: {
      totalReviews: number;
      pendingReviews: number;
      completedReviews: number;
      averageScore: number;
      issuesFound: number;
      recentReviews: CodeReview[];
    };
  }> {
    return this.request('/api/analytics/dashboard');
  }

  async getProgressAnalytics(): Promise<{
    success: boolean;
    analytics: {
      progressOverTime: any[];
      languageDistribution: Record<string, number>;
      complexityDistribution: Record<string, number>;
      totalReviewsAnalyzed: number;
    };
  }> {
    return this.request('/api/analytics/progress');
  }

  async getInsights(): Promise<{
    success: boolean;
    insights: {
      type: string;
      title: string;
      message: string;
      priority: string;
      actionable: boolean;
    }[];
  }> {
    return this.request('/api/analytics/insights');
  }

  // User stats
  async getUserStats(): Promise<{
    success: boolean;
    stats: {
      totalReviews: number;
      completedReviews: number;
      pendingReviews: number;
      averageScore: number;
      averageMaintainability: number;
      averagePerformance: number;
      averageSecurity: number;
      languageBreakdown: { language: string; count: number }[];
      complexityBreakdown: { complexity: string; count: number }[];
      totalIssuesFound: number;
      completionRate: number;
      issuesPerReview: number;
    };
  }> {
    return this.request('/api/users/stats');
  }

  async getUserProfile(): Promise<{ success: boolean; user: User }> {
    return this.request('/api/users/profile');
  }

  async updateUserProfile(data: {
    name?: string;
    email?: string;
  }): Promise<{ success: boolean; user: User }> {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types for use in components
