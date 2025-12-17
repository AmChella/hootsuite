import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };

  const showFeatureAlert = (feature: string) => {
    Alert.alert(feature, `${feature} feature coming soon! This will be implemented in a future update.`);
  };

  const menuItems = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', onPress: () => router.push('/(tabs)/settings/edit-profile') },
        { icon: 'mail-outline', label: 'Email Settings', onPress: () => showFeatureAlert('Email Settings') },
        { icon: 'lock-closed-outline', label: 'Change Password', onPress: () => router.push('/(tabs)/settings/change-password') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/(tabs)/settings/notifications') },
        { icon: 'moon-outline', label: 'Dark Mode', toggle: true },
        { icon: 'language-outline', label: 'Language', value: 'English', onPress: () => router.push('/(tabs)/settings/language') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help Center', onPress: () => showFeatureAlert('Help Center') },
        { icon: 'chatbubble-outline', label: 'Contact Us', onPress: () => router.push('/(tabs)/settings/contact') },
        { icon: 'star-outline', label: 'Rate App', onPress: () => showFeatureAlert('Rate App') },
      ],
    },
    {
      title: 'Legal',
      items: [
        { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => showFeatureAlert('Terms of Service') },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', onPress: () => showFeatureAlert('Privacy Policy') },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
      </LinearGradient>

      {/* Menu Sections */}
      {menuItems.map((section, sectionIndex) => (
        <View
          key={sectionIndex}
          style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title}</Text>
          {section.items.map((item, itemIndex) => (
            <TouchableOpacity
              key={itemIndex}
              style={[
                styles.menuItem,
                itemIndex < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
              ]}
              onPress={item.onPress}
              disabled={item.toggle}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={22} color={colors.textSecondary} />
                <Text style={[styles.menuItemLabel, { color: colors.text }]}>{item.label}</Text>
              </View>
              {item.toggle ? (
                <Switch
                  value={colorScheme === 'dark'}
                  onValueChange={() => {}}
                  trackColor={{ false: colors.border, true: Colors.primaryLight }}
                  thumbColor={colorScheme === 'dark' ? Colors.primary : colors.background}
                />
              ) : item.value ? (
                <View style={styles.menuItemRight}>
                  <Text style={[styles.menuItemValue, { color: colors.textMuted }]}>{item.value}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: Colors.errorBg }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color={Colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={[styles.version, { color: colors.textMuted }]}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: 'white',
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  section: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemLabel: {
    fontSize: FontSize.md,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  menuItemValue: {
    fontSize: FontSize.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  logoutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.error,
  },
  version: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
});
