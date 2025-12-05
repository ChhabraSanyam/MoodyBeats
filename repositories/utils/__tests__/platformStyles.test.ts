/**
 * Tests for platform-specific styles utility
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 */

import { Platform } from 'react-native';
import {
    getMonospaceFont,
    getPlatformAnimationConfig,
    getPlatformButtonStyles,
    getPlatformCapabilities,
    getPlatformShadow,
    getResponsiveDimensions,
    getResponsiveFontSizes,
    getSafeAreaPadding,
} from '../platformStyles';

describe('Platform Styles Utility', () => {
  describe('getPlatformShadow', () => {
    it('should return iOS shadow properties on iOS', () => {
      Platform.OS = 'ios';
      const shadow = getPlatformShadow(4);
      
      expect(shadow).toHaveProperty('shadowColor');
      expect(shadow).toHaveProperty('shadowOffset');
      expect(shadow).toHaveProperty('shadowOpacity');
      expect(shadow).toHaveProperty('shadowRadius');
      expect(shadow).not.toHaveProperty('elevation');
    });

    it('should return Android elevation on Android', () => {
      Platform.OS = 'android';
      const shadow = getPlatformShadow(4);
      
      expect(shadow).toHaveProperty('elevation');
      expect(shadow.elevation).toBe(4);
    });

    it('should return web box-shadow on web', () => {
      Platform.OS = 'web';
      const shadow = getPlatformShadow(4);
      
      expect(shadow).toHaveProperty('boxShadow');
      expect(typeof shadow.boxShadow).toBe('string');
    });
  });

  describe('getMonospaceFont', () => {
    it('should return Courier on iOS', () => {
      Platform.OS = 'ios';
      expect(getMonospaceFont()).toBe('Courier');
    });

    it('should return monospace on Android', () => {
      Platform.OS = 'android';
      expect(getMonospaceFont()).toBe('monospace');
    });

    it('should return Courier New, monospace on web', () => {
      Platform.OS = 'web';
      expect(getMonospaceFont()).toBe('Courier New, monospace');
    });
  });

  describe('getResponsiveDimensions', () => {
    it('should return dimension information', () => {
      const dimensions = getResponsiveDimensions();
      
      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
      expect(dimensions).toHaveProperty('isSmallScreen');
      expect(dimensions).toHaveProperty('isMediumScreen');
      expect(dimensions).toHaveProperty('isLargeScreen');
      expect(dimensions).toHaveProperty('isPortrait');
      expect(dimensions).toHaveProperty('isLandscape');
    });

    it('should correctly identify screen orientation', () => {
      const dimensions = getResponsiveDimensions();
      
      // Either portrait or landscape, but not both
      expect(dimensions.isPortrait !== dimensions.isLandscape).toBe(true);
    });
  });

  describe('getSafeAreaPadding', () => {
    it('should return padding object with top and bottom', () => {
      const padding = getSafeAreaPadding();
      
      expect(padding).toHaveProperty('paddingTop');
      expect(padding).toHaveProperty('paddingBottom');
      expect(typeof padding.paddingTop).toBe('number');
      expect(typeof padding.paddingBottom).toBe('number');
    });

    it('should return different padding for iOS vs Android', () => {
      Platform.OS = 'ios';
      const iosPadding = getSafeAreaPadding();
      
      Platform.OS = 'android';
      const androidPadding = getSafeAreaPadding();
      
      // iOS typically has more top padding due to notch
      expect(iosPadding.paddingTop).toBeGreaterThanOrEqual(androidPadding.paddingTop);
    });
  });

  describe('getResponsiveFontSizes', () => {
    it('should return font size object', () => {
      const fontSizes = getResponsiveFontSizes();
      
      expect(fontSizes).toHaveProperty('title');
      expect(fontSizes).toHaveProperty('heading');
      expect(fontSizes).toHaveProperty('body');
      expect(fontSizes).toHaveProperty('caption');
    });

    it('should have title larger than heading', () => {
      const fontSizes = getResponsiveFontSizes();
      
      expect(fontSizes.title).toBeGreaterThan(fontSizes.heading);
    });

    it('should have heading larger than body', () => {
      const fontSizes = getResponsiveFontSizes();
      
      expect(fontSizes.heading).toBeGreaterThan(fontSizes.body);
    });

    it('should have body larger than caption', () => {
      const fontSizes = getResponsiveFontSizes();
      
      expect(fontSizes.body).toBeGreaterThan(fontSizes.caption);
    });
  });

  describe('getPlatformButtonStyles', () => {
    it('should return minimum touch target sizes', () => {
      const buttonStyles = getPlatformButtonStyles();
      
      expect(buttonStyles.minHeight).toBe(44); // iOS HIG minimum
      expect(buttonStyles.minWidth).toBe(44);
    });

    it('should include padding', () => {
      const buttonStyles = getPlatformButtonStyles();
      
      expect(buttonStyles).toHaveProperty('paddingHorizontal');
      expect(buttonStyles).toHaveProperty('paddingVertical');
    });
  });

  describe('getPlatformAnimationConfig', () => {
    it('should return animation configuration', () => {
      const config = getPlatformAnimationConfig();
      
      expect(config).toHaveProperty('duration');
      expect(config).toHaveProperty('useNativeDriver');
      expect(typeof config.duration).toBe('number');
      expect(typeof config.useNativeDriver).toBe('boolean');
    });

    it('should use native driver on mobile platforms', () => {
      const config = getPlatformAnimationConfig();
      
      // useNativeDriver should be false on web, true on mobile
      expect(typeof config.useNativeDriver).toBe('boolean');
    });
  });

  describe('getPlatformCapabilities', () => {
    it('should return capability flags', () => {
      const capabilities = getPlatformCapabilities();
      
      expect(capabilities).toHaveProperty('supportsHaptics');
      expect(capabilities).toHaveProperty('supportsFileSystem');
      expect(capabilities).toHaveProperty('supportsIndexedDB');
      expect(capabilities).toHaveProperty('supportsNativeAudio');
    });

    it('should correctly identify mobile capabilities', () => {
      Platform.OS = 'ios';
      const iosCapabilities = getPlatformCapabilities();
      
      expect(iosCapabilities.supportsHaptics).toBe(true);
      expect(iosCapabilities.supportsFileSystem).toBe(true);
      expect(iosCapabilities.supportsIndexedDB).toBe(false);
      expect(iosCapabilities.supportsNativeAudio).toBe(true);
    });

    it('should correctly identify web capabilities', () => {
      Platform.OS = 'web';
      const webCapabilities = getPlatformCapabilities();
      
      expect(webCapabilities.supportsHaptics).toBe(false);
      expect(webCapabilities.supportsFileSystem).toBe(false);
      expect(webCapabilities.supportsIndexedDB).toBe(true);
      expect(webCapabilities.supportsNativeAudio).toBe(false);
    });
  });
});
