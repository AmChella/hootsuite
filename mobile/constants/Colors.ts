// Color palette for the app
export const Colors = {
  // Primary colors
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  primaryGlow: 'rgba(99, 102, 241, 0.2)',
  
  // Semantic colors
  success: '#10b981',
  successLight: '#34d399',
  successBg: 'rgba(16, 185, 129, 0.1)',
  
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningBg: 'rgba(245, 158, 11, 0.1)',
  
  error: '#ef4444',
  errorLight: '#f87171',
  errorBg: 'rgba(239, 68, 68, 0.1)',
  
  // Light theme
  light: {
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundElevated: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    card: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  // Dark theme
  dark: {
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    backgroundElevated: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#334155',
    borderLight: '#1e293b',
    card: '#1e293b',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Social platform colors
  platforms: {
    facebook: '#1877F2',
    instagram: '#E4405F',
    twitter: '#1DA1F2',
    linkedin: '#0A66C2',
    youtube: '#FF0000',
    tiktok: '#000000',
    pinterest: '#E60023',
    threads: '#000000',
  },
};

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Font sizes
export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Font weights
export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
