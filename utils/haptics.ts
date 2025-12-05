/**
 * Haptic Feedback Utility
 * Provides haptic feedback for iOS and Android interactions
 * Requirements: Add haptic feedback for mobile interactions
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Trigger light haptic feedback for subtle interactions
 * Use for: button taps, selections, toggles
 */
export const triggerLightHaptic = async () => {
  if (Platform.OS !== 'web') {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
};

/**
 * Trigger medium haptic feedback for standard interactions
 * Use for: confirmations, state changes
 */
export const triggerMediumHaptic = async () => {
  if (Platform.OS !== 'web') {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
};

/**
 * Trigger heavy haptic feedback for important interactions
 * Use for: errors, warnings, critical actions
 */
export const triggerHeavyHaptic = async () => {
  if (Platform.OS !== 'web') {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
};

/**
 * Trigger success haptic feedback
 * Use for: successful operations, completions
 */
export const triggerSuccessHaptic = async () => {
  if (Platform.OS !== 'web') {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
};

/**
 * Trigger warning haptic feedback
 * Use for: warnings, cautions
 */
export const triggerWarningHaptic = async () => {
  if (Platform.OS !== 'web') {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
};

/**
 * Trigger error haptic feedback
 * Use for: errors, failures
 */
export const triggerErrorHaptic = async () => {
  if (Platform.OS !== 'web') {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
};

/**
 * Trigger selection haptic feedback
 * Use for: picker selections, scrolling through options
 */
export const triggerSelectionHaptic = async () => {
  if (Platform.OS !== 'web') {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
};
