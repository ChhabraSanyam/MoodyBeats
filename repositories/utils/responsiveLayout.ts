/**
 * Responsive layout utility for cross-platform consistency
 * Requirements: 19.5
 */

import { Dimensions, ScaledSize } from 'react-native';

// Breakpoints based on common device sizes
export const BREAKPOINTS = {
  small: 375,   // iPhone SE, small phones
  medium: 768,  // iPad mini, tablets
  large: 1024,  // iPad Pro, desktop
  xlarge: 1440, // Large desktop
};

export type ScreenSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Get current screen size category
 */
export function getScreenSize(): ScreenSize {
  const { width } = Dimensions.get('window');
  
  if (width < BREAKPOINTS.small) {
    return 'small';
  } else if (width < BREAKPOINTS.medium) {
    return 'small';
  } else if (width < BREAKPOINTS.large) {
    return 'medium';
  } else if (width < BREAKPOINTS.xlarge) {
    return 'large';
  } else {
    return 'xlarge';
  }
}

/**
 * Scale value based on screen width
 * Useful for maintaining proportions across different screen sizes
 */
export function scaleSize(size: number, baseWidth: number = 375): number {
  const { width } = Dimensions.get('window');
  return (width / baseWidth) * size;
}

/**
 * Get responsive value based on screen size
 */
export function getResponsiveValue<T>(values: {
  small?: T;
  medium?: T;
  large?: T;
  xlarge?: T;
  default: T;
}): T {
  const screenSize = getScreenSize();
  return values[screenSize] ?? values.default;
}

/**
 * Get responsive container width
 * Ensures content doesn't stretch too wide on large screens
 */
export function getContainerWidth(): number | string {
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case 'small':
      return '100%';
    case 'medium':
      return 720;
    case 'large':
      return 960;
    case 'xlarge':
      return 1200;
    default:
      return '100%';
  }
}

/**
 * Get responsive column count for grid layouts
 */
export function getColumnCount(minColumnWidth: number = 300): number {
  const { width } = Dimensions.get('window');
  return Math.max(1, Math.floor(width / minColumnWidth));
}

/**
 * Listen to dimension changes for responsive updates
 */
export function useDimensionListener(callback: (dimensions: ScaledSize) => void): () => void {
  const subscription = Dimensions.addEventListener('change', ({ window }) => {
    callback(window);
  });
  
  return () => {
    subscription?.remove();
  };
}

/**
 * Get responsive padding based on screen size
 */
export function getResponsivePadding(): {
  horizontal: number;
  vertical: number;
} {
  const screenSize = getScreenSize();
  
  switch (screenSize) {
    case 'small':
      return { horizontal: 16, vertical: 12 };
    case 'medium':
      return { horizontal: 24, vertical: 16 };
    case 'large':
      return { horizontal: 32, vertical: 20 };
    case 'xlarge':
      return { horizontal: 40, vertical: 24 };
    default:
      return { horizontal: 20, vertical: 16 };
  }
}

/**
 * Get responsive tape deck size
 * Ensures tape deck scales appropriately on different screens
 */
export function getTapeDeckDimensions(): {
  width: number;
  height: number;
  reelSize: number;
} {
  const { width } = Dimensions.get('window');
  const screenSize = getScreenSize();
  
  // Calculate tape deck width (max 400px, but responsive to screen)
  const tapeDeckWidth = Math.min(400, width - 40);
  const tapeDeckHeight = tapeDeckWidth / 1.6; // Maintain aspect ratio
  
  // Scale reel size based on tape deck size
  const reelSize = screenSize === 'small' ? 60 : 80;
  
  return {
    width: tapeDeckWidth,
    height: tapeDeckHeight,
    reelSize,
  };
}
