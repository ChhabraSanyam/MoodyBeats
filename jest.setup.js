// Jest setup file for MoodyBeats
// Additional mocks will be added as needed when we implement services and components

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => {
    // Generate a simple UUID v4 for testing
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text, ScrollView } = require('react-native');
  
  return {
    __esModule: true,
    default: {
      View: View,
      Text: Text,
      ScrollView: ScrollView,
      createAnimatedComponent: (component) => component,
    },
    useSharedValue: jest.fn((initial) => ({ value: initial })),
    useAnimatedStyle: jest.fn((callback) => callback()),
    withTiming: jest.fn((value) => value),
    withRepeat: jest.fn((value) => value),
    runOnUI: jest.fn((callback) => () => callback()),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
    },
    cancelAnimation: jest.fn(),
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    __esModule: true,
    GestureHandlerRootView: View,
    GestureDetector: View,
    Gesture: {
      Pan: jest.fn(() => ({
        onStart: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      })),
    },
    PanGestureHandler: View,
    State: {},
    Directions: {},
  };
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  __esModule: true,
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
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
}));
