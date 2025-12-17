import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';

export default function ContactUsScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const router = useRouter();
  const { user } = useAuth();
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setIsLoading(true);
    // Simulate sending message
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Message Sent',
        'Thank you for contacting us! We will get back to you within 24-48 hours.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1500);
  };

  const contactOptions = [
    { icon: 'mail-outline', label: 'Email', value: 'support@socialpublisher.app', action: () => Linking.openURL('mailto:support@socialpublisher.app') },
    { icon: 'logo-twitter', label: 'Twitter', value: '@socialpublisher', action: () => Linking.openURL('https://twitter.com/socialpublisher') },
    { icon: 'chatbubbles-outline', label: 'Live Chat', value: 'Available 9am-5pm', action: () => Alert.alert('Live Chat', 'Live chat is not available in this demo') },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Contact Us</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Contact Options */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {contactOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.contactRow,
                index < contactOptions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
              ]}
              onPress={option.action}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name={option.icon as any} size={20} color={Colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactLabel, { color: colors.textMuted }]}>{option.label}</Text>
                <Text style={[styles.contactValue, { color: colors.text }]}>{option.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or send us a message</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Contact Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Subject</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="What's this about?"
                placeholderTextColor={colors.textMuted}
                value={subject}
                onChangeText={setSubject}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Message</Text>
            <View style={[styles.textareaWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <TextInput
                style={[styles.textarea, { color: colors.text }]}
                placeholder="Tell us how we can help..."
                placeholderTextColor={colors.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>

          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Sending as {user?.email}
          </Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.sendButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="white" />
                <Text style={styles.sendButtonText}>Send Message</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: FontSize.xs,
  },
  contactValue: {
    fontSize: FontSize.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: FontSize.sm,
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
  },
  textareaWrapper: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  textarea: {
    fontSize: FontSize.md,
    minHeight: 120,
  },
  hint: {
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  sendButton: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
  },
  sendButtonText: {
    color: 'white',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
