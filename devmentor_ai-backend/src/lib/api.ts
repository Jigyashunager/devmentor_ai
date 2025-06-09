// Frontend API Client - src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types
export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export interface CodeReviewResponse {
  success: boolean;
  review: any;
  analysis: any;
  metadata: any;
}

class ApiClient {
  private getHeaders(includeAuth: boolean = false) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('devmentor_token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Authentication
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    const result = await this.handleResponse<AuthResponse>(response);
    
    // Store token
    if (result.success && result.token) {
      localStorage.setItem('devmentor_token', result.token);
    }
    
    return result;
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    
    const result = await this.handleResponse<AuthResponse>(response);
    
    // Store token
    if (result.success && result.token) {
      localStorage.setItem('devmentor_token', result.token);
    }
    
    return result;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('devmentor_token');
    
    // Call backend logout (optional, for logging purposes)
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(true),
      });
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }
  }

  async getProfile(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(true),
    });
    
    return this.handleResponse(response);
  }

  // Code Reviews
  async submitCodeReview(data: {
    title: string;
    description?: string;
    code: string;
    language: string;
  }): Promise<CodeReviewResponse> {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    
    return this.handleResponse<CodeReviewResponse>(response);
  }

  async getUserReviews(page: number = 1, limit: number = 10): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/reviews?page=${page}&limit=${limit}`,
      {
        headers: this.getHeaders(true),
      }
    );
    
    return this.handleResponse(response);
  }

  async getReviewById(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      headers: this.getHeaders(true),
    });
    
    return this.handleResponse(response);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('devmentor_token');
  }

  getToken(): string | null {
    return localStorage.getItem('devmentor_token');
  }
}

export const apiClient = new ApiClient();