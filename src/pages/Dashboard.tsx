import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui';
import { usePlatforms } from '../context/PlatformContext';
import { statsApi } from '../services/mockApi';
import { platforms, getPlatformById } from '../data/platforms';
import './Dashboard.css';

interface DashboardStats {
  totalPosts: number;
  publishedCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
}

interface Activity {
  id: string;
  type: 'publish_success' | 'publish_failed' | 'account_connected' | 'account_disconnected';
  platformId?: string;
  message: string;
  timestamp: Date;
}

export function Dashboard() {
  const { accounts, isLoading: accountsLoading } = usePlatforms();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, activityData] = await Promise.all([
          statsApi.getDashboardStats(),
          statsApi.getRecentActivity(),
        ]);
        setStats(statsData);
        setActivities(activityData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      label: 'Total Posts',
      value: stats?.totalPosts || 0,
      icon: Zap,
      color: 'var(--color-primary)',
      bgColor: 'var(--color-primary-glow)',
    },
    {
      label: 'Published',
      value: stats?.publishedCount || 0,
      icon: CheckCircle,
      color: 'var(--color-success)',
      bgColor: 'var(--color-success-bg)',
    },
    {
      label: 'Pending',
      value: stats?.pendingCount || 0,
      icon: Clock,
      color: 'var(--color-warning)',
      bgColor: 'var(--color-warning-bg)',
    },
    {
      label: 'Failed',
      value: stats?.failedCount || 0,
      icon: XCircle,
      color: 'var(--color-error)',
      bgColor: 'var(--color-error-bg)',
    },
  ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'publish_success':
        return <CheckCircle size={16} className="activity-icon-success" />;
      case 'publish_failed':
        return <XCircle size={16} className="activity-icon-error" />;
      default:
        return <Zap size={16} />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <div className="dashboard">
      {/* Quick Action */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <h2 className="dashboard-hero-title">Ready to publish?</h2>
          <p className="dashboard-hero-text">
            Create and share content across all your connected platforms in one click.
          </p>
        </div>
        <Link to="/create">
          <Button variant="primary" size="lg" rightIcon={<PlusCircle size={20} />}>
            Create New Post
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats">
        {statCards.map((stat) => (
          <Card key={stat.label} className="dashboard-stat-card" variant="interactive">
            <div className="dashboard-stat-content">
              <div
                className="dashboard-stat-icon"
                style={{ background: stat.bgColor, color: stat.color }}
              >
                <stat.icon size={24} />
              </div>
              <div className="dashboard-stat-info">
                <span className="dashboard-stat-value">{stat.value}</span>
                <span className="dashboard-stat-label">{stat.label}</span>
              </div>
            </div>
            {stat.label === 'Published' && stats && (
              <div className="dashboard-stat-badge">
                <Badge variant="success">{stats.successRate}% success</Badge>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Connected Accounts */}
        <Card className="dashboard-accounts">
          <CardHeader
            action={
              <Link to="/accounts">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={16} />}>
                  Manage
                </Button>
              </Link>
            }
          >
            <CardTitle>Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {accountsLoading ? (
              <div className="dashboard-accounts-loading">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 56, marginBottom: 8 }} />
                ))}
              </div>
            ) : accounts.length > 0 ? (
              <div className="dashboard-accounts-list">
                {accounts.map((account) => {
                  const platform = getPlatformById(account.platformId);
                  const Icon = platform?.icon;
                  return (
                    <div key={account.id} className="dashboard-account-item">
                      <div
                        className="dashboard-account-icon"
                        style={{ background: platform?.color }}
                      >
                        {Icon && <Icon size={20} />}
                      </div>
                      <div className="dashboard-account-info">
                        <span className="dashboard-account-name">{account.platformName}</span>
                        <span className="dashboard-account-username">{account.username}</span>
                      </div>
                      <Badge variant={account.isActive ? 'success' : 'default'} size="sm">
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-accounts-empty">
                <p>No accounts connected yet</p>
                <Link to="/accounts">
                  <Button variant="secondary" size="sm">
                    Connect Account
                  </Button>
                </Link>
              </div>
            )}

            {/* Available platforms to connect */}
            {accounts.length > 0 && accounts.length < platforms.length && (
              <div className="dashboard-accounts-add">
                <span className="dashboard-accounts-add-label">Add more:</span>
                <div className="dashboard-accounts-add-list">
                  {platforms
                    .filter((p) => !accounts.some((a) => a.platformId === p.id))
                    .slice(0, 3)
                    .map((platform) => (
                      <Link
                        key={platform.id}
                        to="/accounts"
                        className="dashboard-accounts-add-item"
                        style={{ background: platform.color }}
                      >
                        <platform.icon size={16} />
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="dashboard-activity">
          <CardHeader
            action={
              <Link to="/history">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={16} />}>
                  View All
                </Button>
              </Link>
            }
          >
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="dashboard-activity-loading">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }} />
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="dashboard-activity-list">
                {activities.map((activity) => {
                  const platform = activity.platformId
                    ? getPlatformById(activity.platformId)
                    : null;
                  return (
                    <div key={activity.id} className="dashboard-activity-item">
                      <div className="dashboard-activity-icon">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="dashboard-activity-content">
                        <span className="dashboard-activity-message">{activity.message}</span>
                        <span className="dashboard-activity-time">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                      {platform && (
                        <div
                          className="dashboard-activity-platform"
                          style={{ color: platform.color }}
                        >
                          <platform.icon size={16} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-activity-empty">
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Rate Chart Placeholder */}
        <Card className="dashboard-performance">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="dashboard-performance-chart">
              <div className="dashboard-performance-ring">
                <svg viewBox="0 0 100 100" className="dashboard-ring-svg">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--color-bg-elevated)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#performanceGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(stats?.successRate || 0) * 2.51} 251`}
                    transform="rotate(-90 50 50)"
                    className="dashboard-ring-progress"
                  />
                  <defs>
                    <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="var(--color-success)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="dashboard-ring-content">
                  <span className="dashboard-ring-value">{stats?.successRate || 0}%</span>
                  <span className="dashboard-ring-label">Success Rate</span>
                </div>
              </div>
              <div className="dashboard-performance-legend">
                <div className="dashboard-legend-item">
                  <span className="dashboard-legend-dot" style={{ background: 'var(--color-success)' }} />
                  <span>Published</span>
                  <strong>{stats?.publishedCount || 0}</strong>
                </div>
                <div className="dashboard-legend-item">
                  <span className="dashboard-legend-dot" style={{ background: 'var(--color-error)' }} />
                  <span>Failed</span>
                  <strong>{stats?.failedCount || 0}</strong>
                </div>
                <div className="dashboard-legend-item">
                  <span className="dashboard-legend-dot" style={{ background: 'var(--color-warning)' }} />
                  <span>Pending</span>
                  <strong>{stats?.pendingCount || 0}</strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
