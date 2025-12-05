/**
 * Haptics Utility Tests
 */

import { Platform } from 'react-native';

import * as Haptics from 'expo-haptics';
import {
    triggerErrorHaptic,
    triggerHeavyHaptic,
    triggerLightHaptic,
    triggerMediumHaptic,
    triggerSelectionHaptic,
    triggerSuccessHaptic,
    triggerWarningHaptic,
} from '../haptics';

// Mock expo-haptics before importing
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

describe('Haptics Utility', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original platform
    Object.defineProperty(Platform, 'OS', {
      value: originalPlatform,
      writable: true,
    });
  });

  describe('on iOS', () => {
    beforeAll(() => {
      Object.defineProperty(Platform, 'OS', {
        value: 'ios',
        writable: true,
      });
    });

    it('triggers light haptic feedback', async () => {
      await triggerLightHaptic();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    });

    it('triggers medium haptic feedback', async () => {
      await triggerMediumHaptic();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    });

    it('triggers heavy haptic feedback', async () => {
      await triggerHeavyHaptic();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
    });

    it('triggers success haptic feedback', async () => {
      await triggerSuccessHaptic();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    });

    it('triggers warning haptic feedback', async () => {
      await triggerWarningHaptic();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
    });

    it('triggers error haptic feedback', async () => {
      await triggerErrorHaptic();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
    });

    it('triggers selection haptic feedback', async () => {
      await triggerSelectionHaptic();
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });
  });

  describe('on Android', () => {
    beforeAll(() => {
      Object.defineProperty(Platform, 'OS', {
        value: 'android',
        writable: true,
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('triggers light haptic feedback on Android', async () => {
      await triggerLightHaptic();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    });

    it('triggers medium haptic feedback on Android', async () => {
      await triggerMediumHaptic();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    });

    it('triggers heavy haptic feedback on Android', async () => {
      await triggerHeavyHaptic();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
    });

    it('triggers success haptic feedback on Android', async () => {
      await triggerSuccessHaptic();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    });

    it('triggers warning haptic feedback on Android', async () => {
      await triggerWarningHaptic();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
    });

    it('triggers error haptic feedback on Android', async () => {
      await triggerErrorHaptic();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
    });

    it('triggers selection haptic feedback on Android', async () => {
      await triggerSelectionHaptic();
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });
  });

  describe('on Web', () => {
    beforeAll(() => {
      Object.defineProperty(Platform, 'OS', {
        value: 'web',
        writable: true,
      });
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('does not trigger haptic feedback on Web', async () => {
      await triggerLightHaptic();
      await triggerMediumHaptic();
      await triggerHeavyHaptic();
      await triggerSuccessHaptic();
      await triggerWarningHaptic();
      await triggerErrorHaptic();
      await triggerSelectionHaptic();

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeAll(() => {
      Object.defineProperty(Platform, 'OS', {
        value: 'ios',
        writable: true,
      });
    });

    it('handles errors gracefully', async () => {
      const mockError = new Error('Haptic failed');
      (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(mockError);

      // Should not throw
      await expect(triggerLightHaptic()).resolves.not.toThrow();
    });
  });
});
