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
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/Colors';
import { accountsApi, ConnectedAccount } from '../../services/api';
import { platforms, getPlatformById } from '../../constants/platforms';

export default function AccountsScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await accountsApi.getConnectedAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAccounts();
  };

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);
    try {
      const authUrl = await accountsApi.getConnectUrl(platformId);
      await WebBrowser.openBrowserAsync(authUrl);
      // Refresh accounts after returning
      fetchAccounts();
    } catch (error) {
      Alert.alert('Error', 'Failed to connect account');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = (account: ConnectedAccount) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect ${account.username} from ${account.platformName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await accountsApi.disconnectAccount(account.id);
              setAccounts(prev => prev.filter(a => a.id !== account.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect account');
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (account: ConnectedAccount) => {
    try {
      const updated = await accountsApi.toggleAccountStatus(account.id);
      setAccounts(prev => prev.map(a => a.id === account.id ? updated : a));
    } catch (error) {
      Alert.alert('Error', 'Failed to update account status');
    }
  };

  const connectedPlatformIds = accounts.map(a => a.platformId);
  const availablePlatforms = platforms.filter(p => !connectedPlatformIds.includes(p.id));

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
      {/* Connected Accounts */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Connected Accounts</Text>
        {accounts.length > 0 ? (
          <View style={styles.accountsList}>
            {accounts.map(account => {
              const platform = getPlatformById(account.platformId);
              return (
                <View
                  key={account.id}
                  style={[styles.accountCard, { borderColor: colors.border }]}
                >
                  <View style={[styles.accountIcon, { backgroundColor: platform?.color || colors.textMuted }]}>
                    <Ionicons name={platform?.icon || 'globe'} size={24} color="white" />
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={[styles.accountPlatform, { color: colors.text }]}>
                      {account.platformName}
                    </Text>
                    <Text style={[styles.accountUsername, { color: colors.textSecondary }]}>
                      @{account.username}
                    </Text>
                  </View>
                  <View style={styles.accountActions}>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        { backgroundColor: account.isActive ? Colors.successBg : colors.backgroundSecondary }
                      ]}
                      onPress={() => handleToggle(account)}
                    >
                      <Ionicons
                        name={account.isActive ? 'checkmark-circle' : 'pause-circle'}
                        size={20}
                        color={account.isActive ? Colors.success : colors.textMuted}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.disconnectBtn, { backgroundColor: Colors.errorBg }]}
                      onPress={() => handleDisconnect(account)}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No accounts connected yet
            </Text>
          </View>
        )}
      </View>

      {/* Available Platforms */}
      {availablePlatforms.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Connect More Platforms</Text>
          <View style={styles.platformGrid}>
            {availablePlatforms.map(platform => (
              <TouchableOpacity
                key={platform.id}
                style={[styles.platformCard, { borderColor: colors.border }]}
                onPress={() => handleConnect(platform.id)}
                disabled={connectingPlatform !== null}
              >
                <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
                  {connectingPlatform === platform.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name={platform.icon} size={24} color="white" />
                  )}
                </View>
                <Text style={[styles.platformName, { color: colors.text }]}>{platform.name}</Text>
                <Text style={[styles.platformDesc, { color: colors.textMuted }]} numberOfLines={2}>
                  {platform.description}
                </Text>
                <View style={styles.connectBtnWrapper}>
                  <Text style={styles.connectBtnText}>Connect</Text>
                  <Ionicons name="add" size={16} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
  accountsList: {
    gap: Spacing.sm,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountPlatform: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  accountUsername: {
    fontSize: FontSize.sm,
  },
  accountActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
  platformGrid: {
    gap: Spacing.md,
  },
  platformCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  platformIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  platformName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: 4,
  },
  platformDesc: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  connectBtnWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.primary,
  },
});
