import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../../constants/Colors';
import { publishApi, postsApi, PublishResult, Post } from '../../../services/api';
import { getPlatformById } from '../../../constants/platforms';

export default function PublishStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [results, setResults] = useState<PublishResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    
    try {
      const [postData, resultsData] = await Promise.all([
        postsApi.getPostById(id),
        publishApi.getPublishResults(id),
      ]);
      setPost(postData || null);
      setResults(resultsData);
    } catch (error) {
      console.error('Failed to fetch publish status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!id) return;
    
    // Subscribe to updates
    const unsubscribe = publishApi.subscribeToPublishUpdates(id, (newResults) => {
      setResults(newResults);
    });

    return unsubscribe;
  }, [id]);

  const handleRetry = async (platformId: string) => {
    if (!id) return;
    
    try {
      const result = await publishApi.retryPublish(id, platformId);
      setResults(prev => prev.map(r => r.platformId === platformId ? result : r));
    } catch (error) {
      console.error('Failed to retry publish:', error);
    }
  };

  const getStatusConfig = (status: PublishResult['status']) => {
    switch (status) {
      case 'published':
        return { icon: 'checkmark-circle', color: Colors.success, label: 'Published' };
      case 'failed':
        return { icon: 'close-circle', color: Colors.error, label: 'Failed' };
      case 'in_progress':
        return { icon: 'sync', color: Colors.warning, label: 'Publishing...' };
      default:
        return { icon: 'time', color: colors.textMuted, label: 'Pending' };
    }
  };

  const allDone = results.every(r => r.status === 'published' || r.status === 'failed');
  const successCount = results.filter(r => r.status === 'published').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

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
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Card */}
      <LinearGradient
        colors={allDone 
          ? (failedCount === 0 ? [Colors.success, Colors.successLight] : [Colors.warning, Colors.warningLight])
          : [Colors.primary, Colors.primaryLight]
        }
        style={styles.summaryCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons 
          name={allDone ? (failedCount === 0 ? 'checkmark-circle' : 'alert-circle') : 'sync'} 
          size={48} 
          color="white" 
        />
        <Text style={styles.summaryTitle}>
          {allDone 
            ? (failedCount === 0 ? 'All Published!' : `${successCount} Published, ${failedCount} Failed`)
            : 'Publishing...'}
        </Text>
        <Text style={styles.summarySubtitle}>
          {results.length} platform{results.length !== 1 ? 's' : ''}
        </Text>
      </LinearGradient>

      {/* Post Preview */}
      {post && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Post Preview</Text>
          <Text style={[styles.postCaption, { color: colors.textSecondary }]} numberOfLines={3}>
            {post.caption || '(No caption)'}
          </Text>
          {post.mediaFiles.length > 0 && (
            <View style={styles.mediaBadge}>
              <Ionicons name="image-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.mediaCount, { color: colors.textMuted }]}>
                {post.mediaFiles.length} media file{post.mediaFiles.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Platform Results */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Status</Text>
        <View style={styles.resultsList}>
          {results.map((result) => {
            const platform = getPlatformById(result.platformId);
            const statusConfig = getStatusConfig(result.status);
            
            return (
              <View
                key={result.platformId}
                style={[styles.resultItem, { borderColor: colors.border }]}
              >
                <View style={[styles.resultIcon, { backgroundColor: platform?.color || colors.textMuted }]}>
                  <Ionicons name={platform?.icon || 'globe'} size={20} color="white" />
                </View>
                
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultPlatform, { color: colors.text }]}>
                    {platform?.name || result.platformId}
                  </Text>
                  <View style={styles.resultStatus}>
                    {result.status === 'in_progress' ? (
                      <ActivityIndicator size="small" color={statusConfig.color} />
                    ) : (
                      <Ionicons name={statusConfig.icon as any} size={16} color={statusConfig.color} />
                    )}
                    <Text style={[styles.resultStatusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                  {result.error && (
                    <Text style={styles.resultError} numberOfLines={2}>{result.error}</Text>
                  )}
                </View>

                <View style={styles.resultActions}>
                  {result.status === 'published' && result.postUrl && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: Colors.primaryGlow }]}
                      onPress={() => Linking.openURL(result.postUrl!)}
                    >
                      <Ionicons name="open-outline" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                  {result.status === 'failed' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: Colors.warningBg }]}
                      onPress={() => handleRetry(result.platformId)}
                    >
                      <Ionicons name="refresh" size={18} color={Colors.warning} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)/history')}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>View History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(tabs)/create')}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.primaryBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.primaryBtnText}>Create New Post</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  summaryCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: 'white',
    marginTop: Spacing.sm,
  },
  summarySubtitle: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  postCaption: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  mediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  mediaCount: {
    fontSize: FontSize.xs,
  },
  resultsList: {
    gap: Spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultPlatform: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    marginBottom: 4,
  },
  resultStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultStatusText: {
    fontSize: FontSize.sm,
  },
  resultError: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: 4,
  },
  resultActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  primaryBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: 'white',
  },
});
