import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../context/AuthContext';
import { authApi, setToken } from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/Colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { login, error, clearError } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch {
      // Error handled by context
    } finally {
      setIsLoading(false);
    }
  };

  const [ssoLoading, setSsoLoading] = useState<string | null>(null);

  const handleSSO = async (provider: string) => {
    setSsoLoading(provider);
    try {
      // Get the OAuth URL from the backend
      const authUrl = await authApi.getOAuthUrl(provider);
      
      // Open the OAuth page in browser
      // The backend will redirect to socialpublisher://auth/callback?token=xxx
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'socialpublisher://auth/callback'
      );
      
      if (result.type === 'success' && result.url) {
        // Parse the callback URL for the token
        const url = new URL(result.url);
        const token = url.searchParams.get('token');
        const error = url.searchParams.get('error');
        
        if (error) {
          Alert.alert('Login Failed', error);
          return;
        }
        
        if (token) {
          // Save the token and navigate to main app
          await setToken(token);
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      Alert.alert('Login Failed', `Could not sign in with ${provider}. Please try again or use email/password.`);
      console.error('SSO error:', error);
    } finally {
      setSsoLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryLight]}
              style={styles.logoGradient}
            >
              <Ionicons name="flash" size={32} color="white" />
            </LinearGradient>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Social Publisher</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Welcome back! Sign in to continue.
          </Text>
        </View>

        {/* SSO Buttons */}
        <View style={styles.ssoContainer}>
          <TouchableOpacity
            style={[styles.ssoButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={() => handleSSO('google')}
            disabled={ssoLoading !== null}
          >
            {ssoLoading === 'google' ? (
              <ActivityIndicator size="small" color="#DB4437" />
            ) : (
              <Ionicons name="logo-google" size={20} color="#DB4437" />
            )}
            <Text style={[styles.ssoText, { color: colors.text }]}>Google</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.ssoButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={() => handleSSO('facebook')}
            disabled={ssoLoading !== null}
          >
            {ssoLoading === 'facebook' ? (
              <ActivityIndicator size="small" color="#1877F2" />
            ) : (
              <Ionicons name="logo-facebook" size={20} color="#1877F2" />
            )}
            <Text style={[styles.ssoText, { color: colors.text }]}>Facebook</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>or continue with email</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) clearError();
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) clearError();
                }}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={colors.textMuted} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Multi-Platform</Text>
            <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
              Publish to all networks
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Track Status</Text>
            <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
              Real-time updates
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🚀</Text>
            <Text style={[styles.featureTitle, { color: colors.text }]}>Save Time</Text>
            <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
              Automate workflow
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    marginBottom: Spacing.md,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  ssoContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  ssoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  ssoText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.sm,
  },
  form: {
    gap: Spacing.md,
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
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
  },
  button: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
  },
  buttonText: {
    color: 'white',
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    fontSize: FontSize.sm,
  },
  footerLink: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  feature: {
    flex: 1,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  featureTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
});
