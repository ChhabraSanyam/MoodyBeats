/**
 * Platform-specific styles utility for cross-platform consistency
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

import { Dimensions, Platform, StyleSheet } from 'react-native';

/**
 * Get platform-specific shadow styles
 * iOS uses shadowColor/shadowOffset/shadowOpacity/shadowRadius
 * Android uses elevation
 * Web uses box-shadow
 */
export function getPlatformShadow(elevation: number = 4) {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.3,
      shadowRadius: elevation,
    };
  } else if (Platform.OS === 'android') {
    return {
      elevation,
    };
  } else {
    // Web
    return {
      boxShadow: `0px ${elevation / 2}px ${elevation}px rgba(0, 0, 0, 0.3)`,
    };
  }
}

/**
 * Get platform-specific font family
 * Ensures consistent monospace rendering across platforms
 */
export function getMonospaceFont(): string {
  if (Platform.OS === 'ios') {
    return 'Courier';
  } else if (Platform.OS === 'android') {
    return 'monospace';
  } else {
    // Web
    return 'Courier New, monospace';
  }
}

/**
 * Get responsive dimensions based on screen size
 * Requirements: 19.5
 */
export function getResponsiveDimensions() {
  const { width, height } = Dimensions.get('window');
  
  // Determine if we're on a small, medium, or large screen
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;
  
  return {
    width,
    height,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isPortrait: height > width,
    isLandscape: width > height,
  };
}

/**
 * Get platform-specific safe area padding
 * Requirements: 19.5
 */
export function getSafeAreaPadding() {
  const dimensions = getResponsiveDimensions();
  
  if (Platform.OS === 'ios') {
    return {
      paddingTop: dimensions.height > 800 ? 60 : 40, // Account for notch
      paddingBottom: 20,
    };
  } else if (Platform.OS === 'android') {
    return {
      paddingTop: 40,
      paddingBottom: 16,
    };
  } else {
    // Web
    return {
      paddingTop: 20,
      paddingBottom: 20,
    };
  }
}

/**
 * Get responsive font sizes
 * Requirements: 19.5
 */
export function getResponsiveFontSizes() {
  const { isSmallScreen, isMediumScreen } = getResponsiveDimensions();
  
  if (isSmallScreen) {
    return {
      title: 24,
      heading: 20,
      body: 14,
      caption: 12,
    };
  } else if (isMediumScreen) {
    return {
      title: 28,
      heading: 22,
      body: 16,
      caption: 13,
    };
  } else {
    return {
      title: 32,
      heading: 24,
      body: 18,
      caption: 14,
    };
  }
}

/**
 * Get platform-specific button styles
 * Ensures consistent touch targets across platforms
 */
export function getPlatformButtonStyles() {
  const minTouchTarget = 44; // iOS HIG minimum
  
  return {
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
    paddingHorizontal: 16,
    paddingVertical: 12,
  };
}

/**
 * Get platform-specific animation configuration
 * Requirements: 19.3
 */
export function getPlatformAnimationConfig() {
  // Ensure 60fps animations across all platforms
  // Note: useNativeDriver is not supported on web, so we disable it there
  return {
    duration: 300,
    useNativeDriver: Platform.OS !== 'web', // Use native driver on mobile for better performance
    // For web, we'll rely on CSS transitions which are hardware-accelerated
  };
}

/**
 * Check if platform supports specific features
 */
export function getPlatformCapabilities() {
  return {
    supportsHaptics: Platform.OS === 'ios' || Platform.OS === 'android',
    supportsFileSystem: Platform.OS === 'ios' || Platform.OS === 'android',
    supportsIndexedDB: Platform.OS === 'web',
    supportsNativeAudio: Platform.OS === 'ios' || Platform.OS === 'android',
  };
}

/**
 * Get platform-specific gap/spacing values
 * React Native doesn't support 'gap' on all platforms consistently
 */
export function getPlatformSpacing(gap: number) {
  if (Platform.OS === 'web') {
    return { gap };
  } else {
    // For iOS/Android, we need to use margins instead
    return {
      marginBottom: gap,
    };
  }
}

/**
 * Create platform-consistent styles
 * Combines all platform-specific adjustments
 */
export function createPlatformStyles<T extends StyleSheet.NamedStyles<T>>(
  styles: T | StyleSheet.NamedStyles<T>
): T {
  return StyleSheet.create(styles) as T;
}
