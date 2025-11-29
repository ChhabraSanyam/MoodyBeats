/**
 * Tests for Mixtape Library Screen
 * Requirements: 3.4, 3.5
 */

import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import MixtapeLibraryScreen from '../library';

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  File: jest.fn(),
  Directory: jest.fn(),
  Paths: { document: '/mock/document' },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    canGoBack: () => false,
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock EnvelopeIntro component
jest.mock('../../components', () => ({
  EnvelopeIntro: () => null,
}));

// Mock ArchiveManager
jest.mock('../../services/ArchiveManager', () => ({
  ArchiveManager: jest.fn().mockImplementation(() => ({
    importFromURL: jest.fn(),
    importFromFile: jest.fn(),
  })),
}));

// Mock the repositories
jest.mock('../../repositories/adapters/StorageFactory', () => ({
  createAudioRepository: () => ({
    deleteAudioFile: jest.fn().mockResolvedValue(undefined),
  }),
  createMixtapeRepository: () => ({
    getAll: jest.fn().mockResolvedValue([
      {
        id: 'test-id-1',
        title: 'Summer Vibes',
        sideA: [
          {
            id: 'track-1',
            title: 'Track 1',
            duration: 180,
            source: { type: 'local', uri: 'file://test.mp3' },
          },
        ],
        sideB: [],
        theme: { preset: 'vhs-static-grey' },
        envelope: { color: '#FFE4B5' },
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      },
      {
        id: 'test-id-2',
        title: 'Winter Chill',
        sideA: [],
        sideB: [
          {
            id: 'track-2',
            title: 'Track 2',
            duration: 200,
            source: { type: 'url', uri: 'https://example.com/track.mp3' },
          },
        ],
        theme: { preset: 'pumpkin-orange' },
        envelope: { color: '#FF8C42' },
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date('2025-01-04'),
        note: 'A cozy winter mixtape',
      },
    ]),
    getById: jest.fn().mockImplementation((id: string) => {
      const mixtapes = [
        {
          id: 'test-id-1',
          title: 'Summer Vibes',
          sideA: [{ id: 'track-1', title: 'Track 1', duration: 180, source: { type: 'local', uri: 'file://test.mp3' } }],
          sideB: [],
          theme: { preset: 'vhs-static-grey' },
          envelope: { color: '#FFE4B5' },
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-02'),
        },
        {
          id: 'test-id-2',
          title: 'Winter Chill',
          sideA: [],
          sideB: [{ id: 'track-2', title: 'Track 2', duration: 200, source: { type: 'url', uri: 'https://example.com/track.mp3' } }],
          theme: { preset: 'pumpkin-orange' },
          envelope: { color: '#FF8C42' },
          createdAt: new Date('2025-01-03'),
          updatedAt: new Date('2025-01-04'),
          note: 'A cozy winter mixtape',
        },
      ];
      return Promise.resolve(mixtapes.find(m => m.id === id) || null);
    }),
    delete: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('MixtapeLibraryScreen', () => {
  it('should render library header', async () => {
    const { getByText } = render(<MixtapeLibraryScreen />);
    
    await waitFor(() => {
      expect(getByText('My Library')).toBeTruthy();
    });
  });

  it('should display all mixtape titles (Requirement 3.5)', async () => {
    const { getByText } = render(<MixtapeLibraryScreen />);
    
    await waitFor(() => {
      expect(getByText('Summer Vibes')).toBeTruthy();
      expect(getByText('Winter Chill')).toBeTruthy();
    });
  });

  it('should display mixtape count', async () => {
    const { getByText } = render(<MixtapeLibraryScreen />);
    
    await waitFor(() => {
      expect(getByText('2 mixtapes')).toBeTruthy();
    });
  });

  it('should display mixtape titles and dates', async () => {
    const { getByText, getAllByText } = render(<MixtapeLibraryScreen />);
    
    await waitFor(() => {
      expect(getByText('Winter Chill')).toBeTruthy();
      expect(getByText('Summer Vibes')).toBeTruthy();
      // Dates are formatted, so we check at least one exists
      const dates = getAllByText(/\d+\/\d+\/\d+/);
      expect(dates.length).toBeGreaterThan(0);
    });
  });

  it('should display note preview when available', async () => {
    const { getByText } = render(<MixtapeLibraryScreen />);
    
    await waitFor(() => {
      expect(getByText(/A cozy winter mixtape/)).toBeTruthy();
    });
  });
});
