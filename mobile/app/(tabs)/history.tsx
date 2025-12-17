import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/Colors';
import { postsApi, Post } from '../../services/api';
import { getPlatformById } from '../../constants/platforms';

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await postsApi.getPosts();
      setPosts(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchPosts();
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await postsApi.deletePost(id);
              setPosts(prev => prev.filter(p => p.id !== id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusConfig = (status: Post['status']) => {
    switch (status) {
      case 'completed':
        return { icon: 'checkmark-circle', color: Colors.success, label: 'Published' };
      case 'failed':
        return { icon: 'close-circle', color: Colors.error, label: 'Failed' };
      case 'publishing':
        return { icon: 'sync', color: Colors.warning, label: 'Publishing' };
      case 'scheduled':
        return { icon: 'calendar', color: Colors.primary, label: 'Scheduled' };
      default:
        return { icon: 'document', color: colors.textMuted, label: 'Draft' };
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const statusConfig = getStatusConfig(item.status);
    
    return (
      <TouchableOpacity
        style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          if (item.status === 'publishing' || item.status === 'completed' || item.status === 'failed') {
            router.push(`/publish/status/${item.id}`);
          }
        }}
      >
        <View style={styles.postHeader}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.postCaption, { color: colors.text }]} numberOfLines={3}>
          {item.caption || '(No caption)'}
        </Text>

        <View style={styles.postPlatforms}>
          {item.platforms.map(platformId => {
            const platform = getPlatformById(platformId);
            if (!platform) return null;
            return (
              <View key={platformId} style={[styles.platformBadge, { backgroundColor: platform.color }]}>
                <Ionicons name={platform.icon} size={12} color="white" />
              </View>
            );
          })}
        </View>

        <View style={styles.postFooter}>
          <View style={styles.postMeta}>
            {item.mediaFiles.length > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="image-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>{item.mediaFiles.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.postDate, { color: colors.textMuted }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No posts yet</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Start by creating your first post
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/create')}
            >
              <Text style={styles.emptyButtonText}>Create Post</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  postCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  postCaption: {
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  postPlatforms: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  platformBadge: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
  },
  postDate: {
    fontSize: FontSize.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
});
