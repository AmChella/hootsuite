import { v4 as uuidv4 } from 'uuid';

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
  publishedAt?: Date;
  postUrl?: string;
  error?: string;
  progress?: number;
}

// Simulated delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock data
let mockUser: User | null = null;
let mockAccounts: ConnectedAccount[] = [];
let mockPosts: Post[] = [];
let mockPublishResults: PublishResult[] = [];

// Auth API
export const authApi = {
  async login(email: string, _password: string): Promise<User> {
    await delay(1000);
    
    mockUser = {
      id: uuidv4(),
      email,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    };
    
    // Create some default connected accounts
    mockAccounts = [
      {
        id: uuidv4(),
        platformId: 'twitter',
        platformName: 'Twitter',
        username: '@business_account',
        displayName: 'Business Account',
        connectedAt: new Date(),
        isActive: true,
      },
      {
        id: uuidv4(),
        platformId: 'facebook',
        platformName: 'Facebook',
        username: 'Business Page',
        displayName: 'Business Page',
        connectedAt: new Date(),
        isActive: true,
      },
    ];

    // Create some mock posts with history
    const now = new Date();
    mockPosts = [
      {
        id: uuidv4(),
        caption: '🚀 Exciting news! Our new product launch is just around the corner. Stay tuned for updates! #launch #product #exciting',
        mediaFiles: [],
        mediaTypes: [],
        platforms: ['twitter', 'facebook'],
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: 'completed',
      },
      {
        id: uuidv4(),
        caption: 'Behind the scenes at our latest photoshoot 📸 Our team is working hard to bring you the best content!',
        mediaFiles: [],
        mediaTypes: [],
        platforms: ['instagram', 'facebook'],
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        status: 'completed',
      },
      {
        id: uuidv4(),
        caption: 'Join us this weekend for an exclusive webinar on digital marketing trends. Register now! 🎯',
        mediaFiles: [],
        mediaTypes: [],
        platforms: ['linkedin', 'twitter'],
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        status: 'failed',
      },
    ];

    // Create publish results for existing posts
    mockPublishResults = [
      { postId: mockPosts[0].id, platformId: 'twitter', status: 'published', publishedAt: mockPosts[0].createdAt, postUrl: 'https://twitter.com/...' },
      { postId: mockPosts[0].id, platformId: 'facebook', status: 'published', publishedAt: mockPosts[0].createdAt, postUrl: 'https://facebook.com/...' },
      { postId: mockPosts[1].id, platformId: 'instagram', status: 'published', publishedAt: mockPosts[1].createdAt, postUrl: 'https://instagram.com/...' },
      { postId: mockPosts[1].id, platformId: 'facebook', status: 'published', publishedAt: mockPosts[1].createdAt, postUrl: 'https://facebook.com/...' },
      { postId: mockPosts[2].id, platformId: 'linkedin', status: 'failed', error: 'Rate limit exceeded. Please try again later.' },
      { postId: mockPosts[2].id, platformId: 'twitter', status: 'published', publishedAt: mockPosts[2].createdAt, postUrl: 'https://twitter.com/...' },
    ];

    return mockUser;
  },

  async loginWithSSO(provider: string): Promise<User> {
    await delay(1500);
    
    mockUser = {
      id: uuidv4(),
      email: `user@${provider}.com`,
      name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
    };
    
    mockAccounts = [];
    mockPosts = [];
    mockPublishResults = [];
    
    return mockUser;
  },

  async logout(): Promise<void> {
    await delay(500);
    mockUser = null;
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(300);
    return mockUser;
  },
};

// Accounts API
export const accountsApi = {
  async getConnectedAccounts(): Promise<ConnectedAccount[]> {
    await delay(500);
    return [...mockAccounts];
  },

  async connectAccount(platformId: string): Promise<ConnectedAccount> {
    await delay(2000); // Simulate OAuth flow
    
    const platformNames: Record<string, string> = {
      twitter: 'Twitter',
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      youtube: 'YouTube',
    };

    const newAccount: ConnectedAccount = {
      id: uuidv4(),
      platformId,
      platformName: platformNames[platformId] || platformId,
      username: `@${platformId}_account`,
      displayName: `${platformNames[platformId]} Business`,
      connectedAt: new Date(),
      isActive: true,
    };

    mockAccounts.push(newAccount);
    return newAccount;
  },

  async disconnectAccount(accountId: string): Promise<void> {
    await delay(800);
    mockAccounts = mockAccounts.filter((a) => a.id !== accountId);
  },

  async toggleAccountStatus(accountId: string): Promise<ConnectedAccount> {
    await delay(300);
    const account = mockAccounts.find((a) => a.id === accountId);
    if (account) {
      account.isActive = !account.isActive;
    }
    return account!;
  },
};

// Posts API
export const postsApi = {
  async getPosts(): Promise<Post[]> {
    await delay(500);
    return [...mockPosts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'status'>): Promise<Post> {
    await delay(800);
    
    const newPost: Post = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      status: data.scheduledFor ? 'scheduled' : 'publishing',
    };

    mockPosts.unshift(newPost);
    return newPost;
  },

  async getPostById(id: string): Promise<Post | undefined> {
    await delay(300);
    return mockPosts.find((p) => p.id === id);
  },

  async deletePost(id: string): Promise<void> {
    await delay(500);
    mockPosts = mockPosts.filter((p) => p.id !== id);
    mockPublishResults = mockPublishResults.filter((r) => r.postId !== id);
  },
};

// Publishing API
export const publishApi = {
  async getPublishResults(postId: string): Promise<PublishResult[]> {
    await delay(300);
    return mockPublishResults.filter((r) => r.postId === postId);
  },

  async publishPost(postId: string, platformIds: string[]): Promise<PublishResult[]> {
    const results: PublishResult[] = platformIds.map((platformId) => ({
      postId,
      platformId,
      status: 'pending' as const,
      progress: 0,
    }));

    mockPublishResults.push(...results);

    // Simulate publishing process
    for (const result of results) {
      result.status = 'in_progress';
      result.progress = 0;
      
      // Simulate progress updates
      for (let i = 1; i <= 10; i++) {
        await delay(300 + Math.random() * 400);
        result.progress = i * 10;
      }

      // Randomly succeed or fail
      const success = Math.random() > 0.15; // 85% success rate
      
      if (success) {
        result.status = 'published';
        result.publishedAt = new Date();
        result.postUrl = `https://${result.platformId}.com/post/${postId.slice(0, 8)}`;
      } else {
        result.status = 'failed';
        result.error = getRandomError();
      }
    }

    // Update post status
    const post = mockPosts.find((p) => p.id === postId);
    if (post) {
      const allResults = mockPublishResults.filter((r) => r.postId === postId);
      const allFailed = allResults.every((r) => r.status === 'failed');
      const allPublished = allResults.every((r) => r.status === 'published');
      
      post.status = allFailed ? 'failed' : allPublished ? 'completed' : 'completed';
    }

    return results;
  },

  async retryPublish(postId: string, platformId: string): Promise<PublishResult> {
    const existingResult = mockPublishResults.find(
      (r) => r.postId === postId && r.platformId === platformId
    );

    if (existingResult) {
      existingResult.status = 'in_progress';
      existingResult.error = undefined;
      existingResult.progress = 0;

      for (let i = 1; i <= 10; i++) {
        await delay(300 + Math.random() * 400);
        existingResult.progress = i * 10;
      }

      const success = Math.random() > 0.3; // 70% success on retry

      if (success) {
        existingResult.status = 'published';
        existingResult.publishedAt = new Date();
        existingResult.postUrl = `https://${platformId}.com/post/${postId.slice(0, 8)}`;
      } else {
        existingResult.status = 'failed';
        existingResult.error = getRandomError();
      }

      return existingResult;
    }

    throw new Error('Publish result not found');
  },

  subscribeToPublishUpdates(postId: string, callback: (results: PublishResult[]) => void): () => void {
    const interval = setInterval(() => {
      const results = mockPublishResults.filter((r) => r.postId === postId);
      callback(results);
    }, 500);

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
    await delay(400);
    
    const published = mockPublishResults.filter((r) => r.status === 'published').length;
    const failed = mockPublishResults.filter((r) => r.status === 'failed').length;
    const pending = mockPublishResults.filter((r) => r.status === 'pending' || r.status === 'in_progress').length;
    const total = mockPublishResults.length;

    return {
      totalPosts: mockPosts.length,
      publishedCount: published,
      failedCount: failed,
      pendingCount: pending,
      successRate: total > 0 ? Math.round((published / total) * 100) : 0,
    };
  },

  async getRecentActivity(): Promise<Array<{
    id: string;
    type: 'publish_success' | 'publish_failed' | 'account_connected' | 'account_disconnected';
    platformId?: string;
    message: string;
    timestamp: Date;
  }>> {
    await delay(300);

    const activities = [];
    
    // Generate from publish results
    for (const result of mockPublishResults.slice(0, 5)) {
      activities.push({
        id: uuidv4(),
        type: result.status === 'published' ? 'publish_success' as const : 'publish_failed' as const,
        platformId: result.platformId,
        message: result.status === 'published' 
          ? `Post published to ${result.platformId}` 
          : `Failed to publish to ${result.platformId}`,
        timestamp: result.publishedAt || new Date(),
      });
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },
};

function getRandomError(): string {
  const errors = [
    'Rate limit exceeded. Please try again in 15 minutes.',
    'Authentication token expired. Please reconnect your account.',
    'Media file too large for this platform.',
    'Caption contains restricted content.',
    'Network error. Please check your connection.',
    'Platform API temporarily unavailable.',
  ];
  return errors[Math.floor(Math.random() * errors.length)];
}
