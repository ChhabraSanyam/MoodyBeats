/**
 * Platform detection utility
 * Requirements: 14.1, 14.2, 15.1, 15.2
 */

import { Platform } from 'react-native';

export type PlatformType = 'ios' | 'android' | 'web';

/**
 * Detects the current platform
 */
export function detectPlatform(): PlatformType {
  if (Platform.OS === 'web') {
    return 'web';
  }
  return Platform.OS as 'ios' | 'android';
}

/**
 * Checks if the current platform is mobile (iOS or Android)
 */
export function isMobilePlatform(): boolean {
  const platform = detectPlatform();
  return platform === 'ios' || platform === 'android';
}

/**
 * Checks if the current platform is web
 */
export function isWebPlatform(): boolean {
  return detectPlatform() === 'web';
}
