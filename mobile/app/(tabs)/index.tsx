import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/Colors';
import { statsApi, accountsApi, ConnectedAccount } from '../../services/api';
import { getPlatformById } from '../../constants/platforms';

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

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, accountsData, activityData] = await Promise.all([
        statsApi.getDashboardStats(),
        accountsApi.getConnectedAccounts(),
        statsApi.getRecentActivity(),
      ]);
      setStats(statsData);
      setAccounts(accountsData);
      setActivities(activityData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
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

  const statCards = [
    { label: 'Total Posts', value: stats?.totalPosts || 0, icon: 'flash', color: Colors.primary },
    { label: 'Published', value: stats?.publishedCount || 0, icon: 'checkmark-circle', color: Colors.success },
    { label: 'Pending', value: stats?.pendingCount || 0, icon: 'time', color: Colors.warning },
    { label: 'Failed', value: stats?.failedCount || 0, icon: 'close-circle', color: Colors.error },
  ];

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Ready to publish?</Text>
          <Text style={styles.heroText}>
            Create and share content across all your connected platforms.
          </Text>
        </View>
        <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/(tabs)/create')}>
          <Ionicons name="add-circle" size={20} color={Colors.primary} />
          <Text style={styles.heroButtonText}>Create Post</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {statCards.map((stat) => (
          <View
            key={stat.label}
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Connected Accounts */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Connected Accounts</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/accounts')}>
            <Text style={styles.sectionLink}>Manage</Text>
          </TouchableOpacity>
        </View>
        {accounts.length > 0 ? (
          <View style={styles.accountsList}>
            {accounts.slice(0, 4).map((account) => {
              const platform = getPlatformById(account.platformId);
              return (
                <View key={account.id} style={styles.accountItem}>
                  <View style={[styles.accountIcon, { backgroundColor: platform?.color || colors.textMuted }]}>
                    <Ionicons name={platform?.icon || 'globe'} size={18} color="white" />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={[styles.accountName, { color: colors.text }]}>{account.platformName}</Text>
                    <Text style={[styles.accountUsername, { color: colors.textMuted }]}>{account.username}</Text>
                  </View>
                  <View style={[styles.badge, account.isActive ? styles.badgeSuccess : styles.badgeDefault]}>
                    <Text style={[styles.badgeText, { color: account.isActive ? Colors.success : colors.textMuted }]}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No accounts connected yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/accounts')}
            >
              <Text style={styles.emptyButtonText}>Connect Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent Activity */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>
        {activities.length > 0 ? (
          <View style={styles.activityList}>
            {activities.slice(0, 5).map((activity) => {
              const platform = activity.platformId ? getPlatformById(activity.platformId) : null;
              const isSuccess = activity.type === 'publish_success';
              return (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: isSuccess ? Colors.successBg : Colors.errorBg }]}>
                    <Ionicons
                      name={isSuccess ? 'checkmark-circle' : 'close-circle'}
                      size={16}
                      color={isSuccess ? Colors.success : Colors.error}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityMessage, { color: colors.text }]} numberOfLines={1}>
                      {activity.message}
                    </Text>
                    <Text style={[styles.activityTime, { color: colors.textMuted }]}>
                      {formatTimeAgo(activity.timestamp)}
                    </Text>
                  </View>
                  {platform && (
                    <Ionicons name={platform.icon} size={16} color={platform.color} />
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No recent activity</Text>
          </View>
        )}
      </View>

      {/* Performance */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.md }]}>
          Performance
        </Text>
        <View style={styles.performanceRow}>
          <View style={styles.performanceRing}>
            <Text style={[styles.ringValue, { color: colors.text }]}>{stats?.successRate || 0}%</Text>
            <Text style={[styles.ringLabel, { color: colors.textMuted }]}>Success Rate</Text>
          </View>
          <View style={styles.performanceLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Published</Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>{stats?.publishedCount || 0}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Failed</Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>{stats?.failedCount || 0}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Pending</Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>{stats?.pendingCount || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  heroTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: 'white',
    marginBottom: Spacing.xs,
  },
  heroText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'white',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  heroButtonText: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  section: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  sectionLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  accountsList: {
    gap: Spacing.sm,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  accountUsername: {
    fontSize: FontSize.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeSuccess: {
    backgroundColor: Colors.successBg,
  },
  badgeDefault: {
    backgroundColor: 'rgba(100,100,100,0.1)',
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  activityList: {
    gap: Spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: FontSize.sm,
  },
  activityTime: {
    fontSize: FontSize.xs,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  ringValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  ringLabel: {
    fontSize: FontSize.xs,
  },
  performanceLegend: {
    flex: 1,
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    flex: 1,
    fontSize: FontSize.sm,
  },
  legendValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
