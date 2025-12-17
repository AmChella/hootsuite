import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../../constants/Colors';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];

export default function LanguageScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleSelectLanguage = (code: string) => {
    setSelectedLanguage(code);
    // In a real app, you'd save this and reload translations
  };

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
        <Text style={[styles.title, { color: colors.text }]}>Language</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info */}
      <View style={[styles.infoBox, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="globe-outline" size={20} color={Colors.primary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Select your preferred language for the app interface.
        </Text>
      </View>

      {/* Language List */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {languages.map((lang, index) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.row,
              index < languages.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
            ]}
            onPress={() => handleSelectLanguage(lang.code)}
          >
            <View style={styles.langInfo}>
              <Text style={[styles.langName, { color: colors.text }]}>{lang.name}</Text>
              <Text style={[styles.nativeName, { color: colors.textMuted }]}>{lang.nativeName}</Text>
            </View>
            {selectedLanguage === lang.code && (
              <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
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
    paddingBottom: Spacing.xxl,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
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
  langInfo: {
    gap: 2,
  },
  langName: {
    fontSize: FontSize.md,
  },
  nativeName: {
    fontSize: FontSize.sm,
  },
});
