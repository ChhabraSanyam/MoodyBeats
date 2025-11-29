/**
 * Tests for Mixtape Export/Sharing Screen
 * Requirements: 3.3, 5.1, 12.4
 */

import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';
import { Mixtape } from '../../models';
import { createMixtapeRepository } from '../../repositories/adapters/StorageFactory';
import MixtapeExportScreen from '../export';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ id: 'test-mixtape-id' })),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock repository
jest.mock('../../repositories/adapters/StorageFactory', () => ({
  createMixtapeRepository: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Test helper to wrap components with ToastProvider
const renderWithProviders = (component: React.ReactElement) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ToastProvider } = require('../../components/ToastProvider');
  return render(<ToastProvider>{component}</ToastProvider>);
};

describe('MixtapeExportScreen', () => {
  const mockMixtape: Mixtape = {
    id: 'test-mixtape-id',
    title: 'Test Mixtape',
    note: 'Test note',
    sideA: [
      {
        id: 'track-1',
        title: 'Track 1',
        duration: 180,
        source: { type: 'local', uri: 'file://test.mp3' },
      },
    ],
    sideB: [],
    theme: {
      preset: 'vhs-static-grey',
    },
    envelope: {
      color: '#FFF8DC',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock repository methods
    const mockRepo = {
      getById: jest.fn().mockResolvedValue(mockMixtape),
      save: jest.fn().mockResolvedValue(undefined),
      getAll: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue(true),
    };
    
    (createMixtapeRepository as jest.Mock).mockReturnValue(mockRepo);
  });

  it('should render export screen with mixtape details', async () => {
    renderWithProviders(<MixtapeExportScreen />);

    await waitFor(() => {
      expect(screen.getByText('Export Mixtape')).toBeTruthy();
      expect(screen.getByText('Test Mixtape')).toBeTruthy();
    });
  });

  it('should display note input field', async () => {
    renderWithProviders(<MixtapeExportScreen />);

    await waitFor(() => {
      expect(screen.getByText('Add a Note (Optional)')).toBeTruthy();
      expect(screen.getByPlaceholderText('Write your message here...')).toBeTruthy();
    });
  });

  it('should display envelope customization section', async () => {
    renderWithProviders(<MixtapeExportScreen />);

    await waitFor(() => {
      expect(screen.getByText('Customize Envelope')).toBeTruthy();
    });
  });

  it('should display export options', async () => {
    renderWithProviders(<MixtapeExportScreen />);

    await waitFor(() => {
      expect(screen.getByText('Export Options')).toBeTruthy();
      expect(screen.getByText('Upload & Share')).toBeTruthy();
      expect(screen.getByText('Save Locally')).toBeTruthy();
    });
  });

  it('should display mixtape title and theme', async () => {
    renderWithProviders(<MixtapeExportScreen />);

    await waitFor(() => {
      expect(screen.getByText('Test Mixtape')).toBeTruthy();
      expect(screen.getByText(/Theme:/)).toBeTruthy();
    });
  });

  it('should display theme information', async () => {
    renderWithProviders(<MixtapeExportScreen />);

    await waitFor(() => {
      expect(screen.getByText(/Theme: vhs-static-grey/)).toBeTruthy();
    });
  });

  it('should show loading state initially', () => {
    renderWithProviders(<MixtapeExportScreen />);
    
    expect(screen.getByText('Loading mixtape...')).toBeTruthy();
  });
});
