import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/Colors';
import { accountsApi, postsApi, ConnectedAccount } from '../../services/api';
import { getPlatformById, platforms } from '../../constants/platforms';

export default function CreatePostScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();

  const [caption, setCaption] = useState('');
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await accountsApi.getConnectedAccounts();
      setAccounts(data.filter(a => a.isActive));
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newFiles = result.assets.map(asset => asset.uri);
      setMediaFiles(prev => [...prev, ...newFiles].slice(0, 10));
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = async () => {
    if (!caption.trim() && mediaFiles.length === 0) {
      Alert.alert('Error', 'Please add a caption or media');
      return;
    }

    if (selectedPlatforms.length === 0) {
      Alert.alert('Error', 'Please select at least one platform');
      return;
    }

    setIsPublishing(true);
    try {
      const post = await postsApi.createPost({
        caption,
        mediaFiles,
        mediaTypes: mediaFiles.map(f => f.includes('.mp4') ? 'video' : 'image'),
        platforms: selectedPlatforms,
      });
      
      // Navigate to publish status
      router.push(`/publish/status/${post.id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setIsPublishing(false);
    }
  };

  const connectedPlatformIds = accounts.map(a => a.platformId);
  const charCount = caption.length;
  const maxChars = 280;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Caption Input */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>What's on your mind?</Text>
        <TextInput
          style={[styles.captionInput, { color: colors.text, borderColor: colors.border }]}
          placeholder="Write your post..."
          placeholderTextColor={colors.textMuted}
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={2200}
        />
        <View style={styles.charCounter}>
          <Text style={[styles.charText, { color: charCount > maxChars ? Colors.error : colors.textMuted }]}>
            {charCount} / {maxChars} (Twitter limit)
          </Text>
        </View>
      </View>

      {/* Media Section */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Media</Text>
        <View style={styles.mediaGrid}>
          {mediaFiles.map((uri, index) => (
            <View key={index} style={styles.mediaItem}>
              <Image source={{ uri }} style={styles.mediaImage} />
              <TouchableOpacity 
                style={styles.removeMediaBtn}
                onPress={() => removeMedia(index)}
              >
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {mediaFiles.length < 10 && (
            <TouchableOpacity 
              style={[styles.addMediaBtn, { borderColor: colors.border }]}
              onPress={pickImage}
            >
              <Ionicons name="add" size={32} color={colors.textMuted} />
              <Text style={[styles.addMediaText, { color: colors.textMuted }]}>Add Media</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Platform Selection */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Post to</Text>
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : connectedPlatformIds.length > 0 ? (
          <View style={styles.platformGrid}>
            {platforms
              .filter(p => connectedPlatformIds.includes(p.id))
              .map(platform => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <TouchableOpacity
                    key={platform.id}
                    style={[
                      styles.platformItem,
                      { 
                        borderColor: isSelected ? platform.color : colors.border,
                        backgroundColor: isSelected ? `${platform.color}20` : colors.backgroundSecondary,
                      }
                    ]}
                    onPress={() => togglePlatform(platform.id)}
                  >
                    <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
                      <Ionicons name={platform.icon} size={20} color="white" />
                    </View>
                    <Text style={[styles.platformName, { color: colors.text }]}>{platform.name}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={platform.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No connected accounts. Connect a platform first.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/accounts')}
            >
              <Text style={styles.emptyButtonText}>Connect Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Publish Button */}
      <TouchableOpacity
        style={[styles.publishButton, (!caption.trim() && mediaFiles.length === 0) && styles.buttonDisabled]}
        onPress={handlePublish}
        disabled={isPublishing || (!caption.trim() && mediaFiles.length === 0)}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.publishGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isPublishing ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="white" />
              <Text style={styles.publishText}>
                Publish to {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
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
  captionInput: {
    fontSize: FontSize.md,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  charCounter: {
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
  },
  charText: {
    fontSize: FontSize.xs,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  addMediaBtn: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaText: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  platformGrid: {
    gap: Spacing.sm,
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  platformIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
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
  publishButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  publishGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
  },
  publishText: {
    color: 'white',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
