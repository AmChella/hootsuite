// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token management
const TOKEN_KEY = 'auth_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }
  
  // Handle empty responses
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface ConnectedAccount {
  id: string;
  platformId: string;
  platformName: string;
  username: string;
  displayName: string;
  avatar?: string;
  connectedAt: Date;
  isActive: boolean;
}

export interface Post {
  id: string;
  caption: string;
  mediaFiles: string[];
  mediaTypes: string[];
  platforms: string[];
  scheduledFor?: Date;
  createdAt: Date;
  status: 'draft' | 'scheduled' | 'publishing' | 'completed' | 'failed';
}

export interface PublishResult {
  postId: string;
  platformId: string;
  status: 'pending' | 'in_progress' | 'published' | 'failed';
  progress?: number;
  publishedAt?: Date;
  postUrl?: string;
  error?: string;
}

export interface PlatformConfig {
  platform_id: string;
  platform_name: string;
  is_configured: boolean;
  client_id_set: boolean;
  client_secret_set: boolean;
}

// Auth API
export const authApi = {
  async login(email: string, password: string): Promise<User> {
    const response = await apiRequest<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    setToken(response.access_token);
    return response.user;
  },

  async register(email: string, password: string, name: string): Promise<User> {
    const response = await apiRequest<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    
    setToken(response.access_token);
    return response.user;
  },

  async loginWithSSO(provider: string): Promise<User> {
    // Get the SSO authorization URL
    const response = await apiRequest<{ auth_url: string }>(`/auth/sso/${provider}`);
    
    // Redirect to OAuth provider
    window.location.href = response.auth_url;
    
    // This won't actually return, but we need to satisfy TypeScript
    return {} as User;
  },

  async handleSSOCallback(provider: string, code: string, state?: string): Promise<User> {
    const params = new URLSearchParams({ code });
    if (state) params.append('state', state);
    
    const response = await apiRequest<{ access_token: string; user: User }>(
      `/auth/sso/${provider}/callback?${params.toString()}`
    );
    
    setToken(response.access_token);
    return response.user;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const token = getToken();
    if (!token) return null;
    
    try {
      return await apiRequest<User>('/auth/me');
    } catch {
      removeToken();
      return null;
    }
  },
};

// Accounts API
export const accountsApi = {
  async getConnectedAccounts(): Promise<ConnectedAccount[]> {
    const accounts = await apiRequest<ConnectedAccount[]>('/accounts');
    return accounts.map(acc => ({
      ...acc,
      connectedAt: new Date(acc.connectedAt),
    }));
  },

  async connectAccount(platformId: string): Promise<ConnectedAccount> {
    const response = await apiRequest<{ auth_url: string }>(`/accounts/connect/${platformId}`, {
      method: 'POST',
    });
    
    // Open OAuth popup or redirect
    window.location.href = response.auth_url;
    
    // Won't return, but satisfy TypeScript
    return {} as ConnectedAccount;
  },

  async handleConnectCallback(platformId: string, code: string, state: string): Promise<ConnectedAccount> {
    const params = new URLSearchParams({ code, state });
    const account = await apiRequest<ConnectedAccount>(
      `/accounts/callback/${platformId}?${params.toString()}`
    );
    
    return {
      ...account,
      connectedAt: new Date(account.connectedAt),
    };
  },

  async disconnectAccount(accountId: string): Promise<void> {
    await apiRequest(`/accounts/${accountId}`, { method: 'DELETE' });
  },

  async toggleAccountStatus(accountId: string): Promise<ConnectedAccount> {
    const account = await apiRequest<ConnectedAccount>(`/accounts/${accountId}/toggle`, {
      method: 'PATCH',
    });
    
    return {
      ...account,
      connectedAt: new Date(account.connectedAt),
    };
  },

  async getPlatformConfigs(): Promise<PlatformConfig[]> {
    return await apiRequest<PlatformConfig[]>('/accounts/config');
  },
};

// Posts API
export const postsApi = {
  async getPosts(): Promise<Post[]> {
    const posts = await apiRequest<Post[]>('/posts');
    return posts.map(post => ({
      ...post,
      createdAt: new Date(post.createdAt),
      scheduledFor: post.scheduledFor ? new Date(post.scheduledFor) : undefined,
    }));
  },

  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'status'>): Promise<Post> {
    const post = await apiRequest<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify({
        caption: data.caption,
        mediaFiles: data.mediaFiles,
        mediaTypes: data.mediaTypes,
        platforms: data.platforms,
        scheduledFor: data.scheduledFor,
      }),
    });
    
    return {
      ...post,
      createdAt: new Date(post.createdAt),
      scheduledFor: post.scheduledFor ? new Date(post.scheduledFor) : undefined,
    };
  },

  async getPostById(id: string): Promise<Post | undefined> {
    try {
      const post = await apiRequest<Post>(`/posts/${id}`);
      return {
        ...post,
        createdAt: new Date(post.createdAt),
        scheduledFor: post.scheduledFor ? new Date(post.scheduledFor) : undefined,
      };
    } catch {
      return undefined;
    }
  },

  async deletePost(id: string): Promise<void> {
    await apiRequest(`/posts/${id}`, { method: 'DELETE' });
  },
};

// Publish API
export const publishApi = {
  async getPublishResults(postId: string): Promise<PublishResult[]> {
    const results = await apiRequest<PublishResult[]>(`/publish/${postId}`);
    return results.map(r => ({
      ...r,
      publishedAt: r.publishedAt ? new Date(r.publishedAt) : undefined,
    }));
  },

  async publishPost(postId: string, platformIds: string[]): Promise<PublishResult[]> {
    const results = await apiRequest<PublishResult[]>('/publish', {
      method: 'POST',
      body: JSON.stringify({ post_id: postId, platform_ids: platformIds }),
    });
    
    return results.map(r => ({
      ...r,
      publishedAt: r.publishedAt ? new Date(r.publishedAt) : undefined,
    }));
  },

  async retryPublish(postId: string, platformId: string): Promise<PublishResult> {
    const result = await apiRequest<PublishResult>(`/publish/${postId}/retry/${platformId}`, {
      method: 'POST',
    });
    
    return {
      ...result,
      publishedAt: result.publishedAt ? new Date(result.publishedAt) : undefined,
    };
  },

  subscribeToPublishUpdates(postId: string, callback: (results: PublishResult[]) => void): () => void {
    // Poll for updates every 2 seconds
    const interval = setInterval(async () => {
      try {
        const results = await this.getPublishResults(postId);
        callback(results);
        
        // Stop polling if all results are final
        const allDone = results.every(r => 
          r.status === 'published' || r.status === 'failed'
        );
        if (allDone) {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to fetch publish updates:', error);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  },
};

// Stats API
export const statsApi = {
  async getDashboardStats(): Promise<{
    totalPosts: number;
    publishedCount: number;
    failedCount: number;
    pendingCount: number;
    successRate: number;
  }> {
    return await apiRequest('/stats/dashboard');
  },

  async getRecentActivity(): Promise<Array<{
    id: string;
    type: 'publish_success' | 'publish_failed' | 'account_connected' | 'account_disconnected';
    platformId?: string;
    message: string;
    timestamp: Date;
  }>> {
    const activities = await apiRequest<Array<{
      id: string;
      type: 'publish_success' | 'publish_failed' | 'account_connected' | 'account_disconnected';
      platformId?: string;
      message: string;
      timestamp: string;
    }>>('/stats/activity');
    
    return activities.map(a => ({
      ...a,
      timestamp: new Date(a.timestamp),
    }));
  },
};
