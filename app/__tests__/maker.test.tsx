/**
 * Tests for MixtapeCreatorScreen
 * Requirements: 1.1, 1.2, 1.3
 */

import { render, screen } from '@testing-library/react-native';
import React from 'react';
import MixtapeCreatorScreen from '../maker';

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }),
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const View = require('react-native').View;
  return {
    Gesture: {
      Pan: () => ({
        onStart: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      }),
    },
    GestureDetector: View,
    GestureHandlerRootView: View,
  };
});

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const View = require('react-native').View;
  return {
    default: {
      View,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((value) => value),
    runOnJS: jest.fn((fn) => fn),
  };
});

// Mock storage factory
jest.mock('../../repositories/adapters/StorageFactory', () => ({
  createMixtapeRepository: jest.fn(() => ({
    getAll: jest.fn().mockResolvedValue([]),
    getById: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(false),
  })),
  createAudioRepository: jest.fn(() => ({
    saveAudioFile: jest.fn().mockResolvedValue('saved-uri'),
    getAudioFile: jest.fn().mockResolvedValue(null),
    deleteAudioFile: jest.fn().mockResolvedValue(undefined),
    validateAudioSource: jest.fn().mockResolvedValue(true),
  })),
}));

// Test helper to wrap components with ToastProvider
const renderWithProviders = (component: React.ReactElement) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ToastProvider } = require('../../components/ToastProvider');
  return render(<ToastProvider>{component}</ToastProvider>);
};

describe('MixtapeCreatorScreen', () => {
  it('renders the screen with header', () => {
    renderWithProviders(<MixtapeCreatorScreen />);
    
    expect(screen.getByText('Create Mixtape')).toBeTruthy();
    expect(screen.getByText('Maker Mode')).toBeTruthy();
  });

  it('displays track pool section', () => {
    renderWithProviders(<MixtapeCreatorScreen />);
    
    expect(screen.getByText('Track Pool')).toBeTruthy();
  });

  it('shows add track buttons', () => {
    renderWithProviders(<MixtapeCreatorScreen />);
    
    expect(screen.getByText('📁 Upload Local File')).toBeTruthy();
    expect(screen.getByText('🔗 Add from URL')).toBeTruthy();
  });

  it('displays empty state when no tracks are added', () => {
    renderWithProviders(<MixtapeCreatorScreen />);
    
    expect(screen.getByText('No tracks in pool')).toBeTruthy();
    expect(screen.getByText('Add tracks from local files or URLs')).toBeTruthy();
  });

  it('displays Side A and Side B sections', () => {
    renderWithProviders(<MixtapeCreatorScreen />);
    
    expect(screen.getByText('Side A')).toBeTruthy();
    expect(screen.getByText('Side B')).toBeTruthy();
  });
});
