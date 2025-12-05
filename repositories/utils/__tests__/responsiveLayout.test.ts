/**
 * Tests for responsive layout utility
 * Requirements: 19.5
 */

import { Dimensions } from 'react-native';
import {
    getColumnCount,
    getContainerWidth,
    getResponsivePadding,
    getResponsiveValue,
    getScreenSize,
    getTapeDeckDimensions,
    scaleSize
} from '../responsiveLayout';

// Mock Dimensions
jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('Responsive Layout Utility', () => {
  beforeEach(() => {
    // Reset to default dimensions
    (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
  });

  describe('getScreenSize', () => {
    it('should return small for width < 375', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 320, height: 568 });
      expect(getScreenSize()).toBe('small');
    });

    it('should return small for width 375-767', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      expect(getScreenSize()).toBe('small');
    });

    it('should return medium for width 768-1023', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 768, height: 1024 });
      expect(getScreenSize()).toBe('medium');
    });

    it('should return large for width 1024-1439', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1024, height: 768 });
      expect(getScreenSize()).toBe('large');
    });

    it('should return xlarge for width >= 1440', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1920, height: 1080 });
      expect(getScreenSize()).toBe('xlarge');
    });
  });

  describe('scaleSize', () => {
    it('should scale proportionally to screen width', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 750, height: 1334 });
      const scaled = scaleSize(100, 375);
      expect(scaled).toBe(200); // 750/375 * 100
    });

    it('should return same size when screen matches base width', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const scaled = scaleSize(100, 375);
      expect(scaled).toBe(100);
    });
  });

  describe('getResponsiveValue', () => {
    it('should return small value for small screens', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const value = getResponsiveValue({
        small: 10,
        medium: 20,
        large: 30,
        default: 15,
      });
      expect(value).toBe(10);
    });

    it('should return medium value for medium screens', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 768, height: 1024 });
      const value = getResponsiveValue({
        small: 10,
        medium: 20,
        large: 30,
        default: 15,
      });
      expect(value).toBe(20);
    });

    it('should return default value when specific size not provided', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const value = getResponsiveValue({
        medium: 20,
        default: 15,
      });
      expect(value).toBe(15);
    });
  });

  describe('getContainerWidth', () => {
    it('should return 100% for small screens', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      expect(getContainerWidth()).toBe('100%');
    });

    it('should return fixed width for medium screens', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 768, height: 1024 });
      expect(getContainerWidth()).toBe(720);
    });

    it('should return larger fixed width for large screens', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1024, height: 768 });
      expect(getContainerWidth()).toBe(960);
    });

    it('should return largest fixed width for xlarge screens', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1920, height: 1080 });
      expect(getContainerWidth()).toBe(1200);
    });
  });

  describe('getColumnCount', () => {
    it('should return at least 1 column', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 200, height: 400 });
      expect(getColumnCount(300)).toBe(1);
    });

    it('should calculate correct column count based on width', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 900, height: 600 });
      expect(getColumnCount(300)).toBe(3); // 900 / 300 = 3
    });

    it('should floor the column count', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 850, height: 600 });
      expect(getColumnCount(300)).toBe(2); // floor(850 / 300) = 2
    });
  });

  describe('getResponsivePadding', () => {
    it('should return padding object', () => {
      const padding = getResponsivePadding();
      expect(padding).toHaveProperty('horizontal');
      expect(padding).toHaveProperty('vertical');
    });

    it('should return smaller padding for small screens', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      const smallPadding = getResponsivePadding();
      
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1024, height: 768 });
      const largePadding = getResponsivePadding();
      
      expect(smallPadding.horizontal).toBeLessThan(largePadding.horizontal);
      expect(smallPadding.vertical).toBeLessThan(largePadding.vertical);
    });
  });

  describe('getTapeDeckDimensions', () => {
    it('should return dimensions object', () => {
      const dimensions = getTapeDeckDimensions();
      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
      expect(dimensions).toHaveProperty('reelSize');
    });

    it('should maintain aspect ratio of 1.6', () => {
      const dimensions = getTapeDeckDimensions();
      const aspectRatio = dimensions.width / dimensions.height;
      expect(aspectRatio).toBeCloseTo(1.6, 1);
    });

    it('should not exceed 400px width', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1920, height: 1080 });
      const dimensions = getTapeDeckDimensions();
      expect(dimensions.width).toBeLessThanOrEqual(400);
    });

    it('should scale down for small screens', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 320, height: 568 });
      const dimensions = getTapeDeckDimensions();
      expect(dimensions.width).toBeLessThan(320);
    });

    it('should return smaller reel size for small screens', () => {
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 320, height: 568 });
      const smallDimensions = getTapeDeckDimensions();
      
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 768, height: 1024 });
      const largeDimensions = getTapeDeckDimensions();
      
      expect(smallDimensions.reelSize).toBeLessThan(largeDimensions.reelSize);
    });
  });
});
