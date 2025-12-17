import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Switch,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../../constants/Colors';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [postSuccess, setPostSuccess] = useState(true);
  const [postFailed, setPostFailed] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  const sections = [
    {
      title: 'Push Notifications',
      items: [
        { label: 'Enable Push Notifications', value: pushEnabled, onChange: setPushEnabled },
      ],
    },
    {
      title: 'Post Notifications',
      items: [
        { label: 'Post Published Successfully', value: postSuccess, onChange: setPostSuccess },
        { label: 'Post Failed to Publish', value: postFailed, onChange: setPostFailed },
      ],
    },
    {
      title: 'Email Notifications',
      items: [
        { label: 'Enable Email Notifications', value: emailEnabled, onChange: setEmailEnabled },
        { label: 'Weekly Performance Report', value: weeklyReport, onChange: setWeeklyReport },
        { label: 'Marketing & Promotions', value: marketingEnabled, onChange: setMarketingEnabled },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Sections */}
      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {section.items.map((item, itemIndex) => (
              <View
                key={itemIndex}
                style={[
                  styles.row,
                  itemIndex < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
                ]}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
                <Switch
                  value={item.value}
                  onValueChange={item.onChange}
                  trackColor={{ false: colors.border, true: Colors.primaryLight }}
                  thumbColor={item.value ? Colors.primary : colors.background}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Info */}
      <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
        <Text style={[styles.infoText, { color: colors.textMuted }]}>
          Notification preferences are saved locally on this device.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  rowLabel: {
    fontSize: FontSize.md,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
  },
});
