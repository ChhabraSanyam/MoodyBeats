/**
 * Tests for ArchiveManager service
 * Requirements: 12.1, 12.2, 12.3, 14.1, 14.2, 14.3, 14.4, 14.5, 17.1, 17.2, 17.3, 17.4, 17.5, 18.1
 */

// Mock Platform to use 'web' in tests (so we use native blob.arrayBuffer())
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (obj: any) => obj.web,
  },
}));

import JSZip from 'jszip';
import { Mixtape } from '../../models';
import { ArchiveManager } from '../ArchiveManager';
import { BackendClient } from '../BackendClient';

// Mock the repositories and backend client
jest.mock('../BackendClient');
jest.mock('../../repositories/adapters/StorageFactory', () => ({
  createMixtapeRepository: jest.fn(() => ({
    exists: jest.fn().mockResolvedValue(false),
    save: jest.fn().mockResolvedValue(undefined),
    getById: jest.fn().mockResolvedValue(null),
    getAll: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue(undefined)
  })),
  createAudioRepository: jest.fn(() => ({
    saveAudioFile: jest.fn().mockResolvedValue('saved-uri'),
    getAudioFile: jest.fn().mockResolvedValue(null),
    deleteAudioFile: jest.fn().mockResolvedValue(undefined),
    validateAudioSource: jest.fn().mockResolvedValue(true)
  })),
  createThemeRepository: jest.fn(() => ({
    getPresetTheme: jest.fn(),
    saveCustomAsset: jest.fn().mockResolvedValue('saved-asset-uri'),
    getCustomAsset: jest.fn().mockResolvedValue(null)
  }))
}));

describe('ArchiveManager', () => {
  let archiveManager: ArchiveManager;

  beforeEach(() => {
    archiveManager = new ArchiveManager();
  });

  const createMockMixtape = (): Mixtape => ({
    id: 'test-mixtape-1',
    title: 'Test Mixtape',
    note: 'A test note',
    sideA: [
      {
        id: 'track-1',
        title: 'Track 1',
        artist: 'Artist 1',
        duration: 180,
        source: {
          type: 'local',
          uri: 'file://audio/track-1.mp3'
        }
      }
    ],
    sideB: [
      {
        id: 'track-2',
        title: 'Track 2',
        duration: 240,
        source: {
          type: 'url',
          uri: 'https://example.com/track-2.mp3',
          metadata: {
            provider: 'direct'
          }
        }
      }
    ],
    theme: {
      preset: 'pumpkin-orange',
      pattern: 'retro-lines',
      texture: 'crt-scan',
      overlay: 'vhs-static'
    },
    envelope: {
      color: '#FFE4B5',
      sigil: 'moon-stars'
    },
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z')
  });

  const createMockAudioBlob = (name: string): Blob => {
    return new Blob(['mock audio data'], { type: 'audio/mpeg' });
  };

  const createMockAssetBlob = (name: string): Blob => {
    return new Blob(['mock asset data'], { type: 'image/png' });
  };

  describe('createArchive', () => {
    it('should create a valid .mixblues archive blob', async () => {
      // Requirements: 12.1, 18.1
      const mixtape = createMockMixtape();
      const audioFiles = new Map<string, Blob>();
      audioFiles.set('track-1', createMockAudioBlob('track-1'));
      audioFiles.set('track-2', createMockAudioBlob('track-2'));

      const archiveBlob = await archiveManager.createArchive(mixtape, audioFiles);

      expect(archiveBlob).toBeInstanceOf(Blob);
      expect(archiveBlob.size).toBeGreaterThan(0);
    });

    it('should include metadata.json with all mixtape data', async () => {
      // Requirements: 12.2
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);

      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.metadata).toBeDefined();
      expect(extractedData.metadata.version).toBe('1.0.0');
      expect(extractedData.metadata.mixtape.id).toBe(mixtape.id);
      expect(extractedData.metadata.mixtape.title).toBe(mixtape.title);
      expect(extractedData.metadata.mixtape.note).toBe(mixtape.note);
      expect(extractedData.metadata.mixtape.sideA).toHaveLength(1);
      expect(extractedData.metadata.mixtape.sideB).toHaveLength(1);
      expect(extractedData.metadata.mixtape.theme.preset).toBe('pumpkin-orange');
      expect(extractedData.metadata.mixtape.envelope.color).toBe('#FFE4B5');
    });

    it('should include audio files in the archive', async () => {
      // Requirements: 12.3
      const mixtape = createMockMixtape();
      const audioFiles = new Map<string, Blob>();
      audioFiles.set('track-1', createMockAudioBlob('track-1'));
      audioFiles.set('track-2', createMockAudioBlob('track-2'));

      const archiveBlob = await archiveManager.createArchive(mixtape, audioFiles);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.audioFiles.size).toBe(2);
      expect(extractedData.audioFiles.has('track-1')).toBe(true);
      expect(extractedData.audioFiles.has('track-2')).toBe(true);
    });

    it('should include theme assets in the archive', async () => {
      // Requirements: 12.3
      const mixtape = createMockMixtape();
      const themeAssets = new Map<string, Blob>();
      themeAssets.set('pattern-retro-lines', createMockAssetBlob('pattern'));
      themeAssets.set('texture-crt-scan', createMockAssetBlob('texture'));
      themeAssets.set('overlay-vhs-static', createMockAssetBlob('overlay'));

      const archiveBlob = await archiveManager.createArchive(mixtape, new Map(), themeAssets);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.themeAssets.size).toBe(3);
      expect(extractedData.themeAssets.has('pattern-retro-lines')).toBe(true);
      expect(extractedData.themeAssets.has('texture-crt-scan')).toBe(true);
      expect(extractedData.themeAssets.has('overlay-vhs-static')).toBe(true);
    });

    it('should create archive without audio files or theme assets', async () => {
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);

      expect(archiveBlob).toBeInstanceOf(Blob);
      expect(archiveBlob.size).toBeGreaterThan(0);

      const extractedData = await archiveManager.extractArchive(archiveBlob);
      expect(extractedData.metadata).toBeDefined();
      expect(extractedData.audioFiles.size).toBe(0);
      expect(extractedData.themeAssets.size).toBe(0);
    });
  });

  describe('extractArchive', () => {
    it('should extract a valid archive', async () => {
      // Requirements: 14.1, 14.2
      const mixtape = createMockMixtape();
      const audioFiles = new Map<string, Blob>();
      audioFiles.set('track-1', createMockAudioBlob('track-1'));

      const archiveBlob = await archiveManager.createArchive(mixtape, audioFiles);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData).toBeDefined();
      expect(extractedData.metadata).toBeDefined();
      expect(extractedData.audioFiles).toBeDefined();
      expect(extractedData.themeAssets).toBeDefined();
    });

    it('should throw error for archive without metadata.json', async () => {
      // Requirements: 14.3
      const zip = new JSZip();
      zip.file('some-other-file.txt', 'content');
      const invalidArchiveBlob = await zip.generateAsync({ type: 'blob' });

      await expect(archiveManager.extractArchive(invalidArchiveBlob)).rejects.toThrow(
        'Invalid archive: missing metadata.json'
      );
    });

    it('should throw error for archive with invalid metadata structure', async () => {
      // Requirements: 14.3
      const zip = new JSZip();
      
      // Create invalid metadata
      zip.file('metadata.json', JSON.stringify({ invalid: 'structure' }));
      
      const invalidArchiveBlob = await zip.generateAsync({ type: 'blob' });

      await expect(archiveManager.extractArchive(invalidArchiveBlob)).rejects.toThrow(
        'Invalid archive: metadata.json has invalid structure'
      );
    });

    it('should extract all tracks from both sides', async () => {
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.metadata.mixtape.sideA).toHaveLength(1);
      expect(extractedData.metadata.mixtape.sideA[0].id).toBe('track-1');
      expect(extractedData.metadata.mixtape.sideB).toHaveLength(1);
      expect(extractedData.metadata.mixtape.sideB[0].id).toBe('track-2');
    });
  });

  describe('validateArchive', () => {
    it('should return true for valid archive', async () => {
      // Requirements: 14.3, 18.5
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);

      const isValid = await archiveManager.validateArchive(archiveBlob);

      expect(isValid).toBe(true);
    });

    it('should return false for archive without metadata.json', async () => {
      // Requirements: 14.3
      const zip = new JSZip();
      zip.file('some-file.txt', 'content');
      const invalidArchiveBlob = await zip.generateAsync({ type: 'blob' });

      const isValid = await archiveManager.validateArchive(invalidArchiveBlob);

      expect(isValid).toBe(false);
    });

    it('should return false for archive with invalid metadata', async () => {
      // Requirements: 14.3
      const zip = new JSZip();
      zip.file('metadata.json', JSON.stringify({ invalid: 'data' }));
      const invalidArchiveBlob = await zip.generateAsync({ type: 'blob' });

      const isValid = await archiveManager.validateArchive(invalidArchiveBlob);

      expect(isValid).toBe(false);
    });

    it('should return false for corrupted blob', async () => {
      const corruptedBlob = new Blob(['not a zip file'], { type: 'application/zip' });

      const isValid = await archiveManager.validateArchive(corruptedBlob);

      expect(isValid).toBe(false);
    });

    it('should return false for archive with missing required fields', async () => {
      const zip = new JSZip();
      
      // Missing title field
      const incompleteMetadata = {
        version: '1.0.0',
        mixtape: {
          id: 'test-id',
          sideA: [],
          sideB: [],
          theme: { preset: 'pumpkin-orange' },
          envelope: { color: '#FFE4B5' }
        }
      };
      
      zip.file('metadata.json', JSON.stringify(incompleteMetadata));
      const invalidArchiveBlob = await zip.generateAsync({ type: 'blob' });

      const isValid = await archiveManager.validateArchive(invalidArchiveBlob);

      expect(isValid).toBe(false);
    });
  });

  describe('Metadata validation', () => {
    it('should validate correct track structure', async () => {
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      const track = extractedData.metadata.mixtape.sideA[0];
      expect(track.id).toBeDefined();
      expect(track.title).toBeDefined();
      expect(track.duration).toBeDefined();
      expect(track.source).toBeDefined();
      expect(track.source.type).toMatch(/local|url/);
      expect(track.source.uri).toBeDefined();
    });

    it('should validate theme preset values', async () => {
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      const validPresets = ['vhs-static-grey', 'pumpkin-orange', 'ghostly-green'];
      expect(validPresets).toContain(extractedData.metadata.mixtape.theme.preset);
    });

    it('should validate envelope structure', async () => {
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.metadata.mixtape.envelope.color).toBeDefined();
      expect(typeof extractedData.metadata.mixtape.envelope.color).toBe('string');
    });
  });

  describe('Round-trip consistency', () => {
    it('should preserve all mixtape data through create and extract', async () => {
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.metadata.mixtape.id).toBe(mixtape.id);
      expect(extractedData.metadata.mixtape.title).toBe(mixtape.title);
      expect(extractedData.metadata.mixtape.note).toBe(mixtape.note);
      expect(extractedData.metadata.mixtape.sideA[0].title).toBe(mixtape.sideA[0].title);
      expect(extractedData.metadata.mixtape.sideB[0].title).toBe(mixtape.sideB[0].title);
      expect(extractedData.metadata.mixtape.theme.preset).toBe(mixtape.theme.preset);
      expect(extractedData.metadata.mixtape.envelope.color).toBe(mixtape.envelope.color);
    });

    it('should preserve audio files through create and extract', async () => {
      const mixtape = createMockMixtape();
      const audioFiles = new Map<string, Blob>();
      const originalBlob = createMockAudioBlob('track-1');
      audioFiles.set('track-1', originalBlob);

      const archiveBlob = await archiveManager.createArchive(mixtape, audioFiles);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.audioFiles.has('track-1')).toBe(true);
      const extractedBlob = extractedData.audioFiles.get('track-1');
      expect(extractedBlob).toBeDefined();
      expect(extractedBlob!.size).toBe(originalBlob.size);
    });
  });

  describe('Edge cases', () => {
    it('should handle mixtape with empty sides', async () => {
      const mixtape: Mixtape = {
        ...createMockMixtape(),
        sideA: [],
        sideB: []
      };

      const archiveBlob = await archiveManager.createArchive(mixtape);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.metadata.mixtape.sideA).toHaveLength(0);
      expect(extractedData.metadata.mixtape.sideB).toHaveLength(0);
    });

    it('should handle mixtape without optional note', async () => {
      const mixtape: Mixtape = {
        ...createMockMixtape(),
        note: undefined
      };

      const archiveBlob = await archiveManager.createArchive(mixtape);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.metadata.mixtape.note).toBeUndefined();
    });

    it('should handle tracks without optional artist', async () => {
      const mixtape = createMockMixtape();
      mixtape.sideA[0].artist = undefined;

      const archiveBlob = await archiveManager.createArchive(mixtape);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.metadata.mixtape.sideA[0].artist).toBeUndefined();
    });

    it('should handle theme without optional customizations', async () => {
      const mixtape: Mixtape = {
        ...createMockMixtape(),
        theme: {
          preset: 'vhs-static-grey'
        }
      };

      const archiveBlob = await archiveManager.createArchive(mixtape);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.metadata.mixtape.theme.preset).toBe('vhs-static-grey');
      expect(extractedData.metadata.mixtape.theme.pattern).toBeUndefined();
    });

    it('should handle envelope without optional sigil', async () => {
      const mixtape: Mixtape = {
        ...createMockMixtape(),
        envelope: {
          color: '#FFE4B5'
        }
      };

      const archiveBlob = await archiveManager.createArchive(mixtape);
      const extractedData = await archiveManager.extractArchive(archiveBlob);

      expect(extractedData.metadata.mixtape.envelope.color).toBe('#FFE4B5');
      expect(extractedData.metadata.mixtape.envelope.sigil).toBeUndefined();
    });
  });

  describe('importFromURL', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should import from shareable URL using BackendClient', async () => {
      // Requirements: 14.1, 14.3, 14.4
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);

      // Mock BackendClient
      const mockDownloadArchive = jest.fn().mockResolvedValue(archiveBlob);
      const MockedBackendClient = BackendClient as jest.MockedClass<typeof BackendClient>;
      MockedBackendClient.mockImplementation(() => ({
        downloadArchive: mockDownloadArchive,
        uploadArchive: jest.fn(),
        isBackendReachable: jest.fn()
      } as any));

      const shareableUrl = 'https://share.moodybeats.sanyamchhabra.in/t/test-id-123';
      const importedMixtape = await archiveManager.importFromURL(shareableUrl);

      expect(mockDownloadArchive).toHaveBeenCalledWith('test-id-123');
      expect(importedMixtape).toBeDefined();
      expect(importedMixtape.id).toBe(mixtape.id);
      expect(importedMixtape.title).toBe(mixtape.title);
    });

    it('should import from direct URL using fetch', async () => {
      // Requirements: 14.1, 14.3, 14.4
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(archiveBlob)
      } as Response);

      const directUrl = 'https://example.com/mixtape.mixblues';
      const importedMixtape = await archiveManager.importFromURL(directUrl);

      expect(global.fetch).toHaveBeenCalledWith(directUrl);
      expect(importedMixtape).toBeDefined();
      expect(importedMixtape.id).toBe(mixtape.id);
      expect(importedMixtape.title).toBe(mixtape.title);
    });

    it('should throw error for invalid archive from URL', async () => {
      // Requirements: 14.5
      const invalidBlob = new Blob(['invalid data'], { type: 'text/plain' });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(invalidBlob)
      } as Response);

      const url = 'https://example.com/invalid.mixblues';

      await expect(archiveManager.importFromURL(url)).rejects.toThrow(
        'Failed to import from URL'
      );
    });

    it('should throw error when URL download fails', async () => {
      // Requirements: 14.5
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
      } as Response);

      const url = 'https://example.com/notfound.mixblues';

      await expect(archiveManager.importFromURL(url)).rejects.toThrow(
        'Failed to import from URL'
      );
    });

    it('should throw error when BackendClient download fails', async () => {
      // Requirements: 14.5
      const mockDownloadArchive = jest.fn().mockRejectedValue(new Error('Network error'));
      const MockedBackendClient = BackendClient as jest.MockedClass<typeof BackendClient>;
      MockedBackendClient.mockImplementation(() => ({
        downloadArchive: mockDownloadArchive,
        uploadArchive: jest.fn(),
        isBackendReachable: jest.fn()
      } as any));

      const shareableUrl = 'https://share.moodybeats.sanyamchhabra.in/t/test-id-123';

      await expect(archiveManager.importFromURL(shareableUrl)).rejects.toThrow(
        'Failed to import from URL'
      );
    });
  });

  describe('importFromFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should import from local file', async () => {
      // Requirements: 14.2, 14.3, 14.4
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);

      const importedMixtape = await archiveManager.importFromFile(archiveBlob);

      expect(importedMixtape).toBeDefined();
      expect(importedMixtape.id).toBe(mixtape.id);
      expect(importedMixtape.title).toBe(mixtape.title);
    });

    it('should import from File object', async () => {
      // Requirements: 14.2, 14.3, 14.4
      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);
      
      // Create a File object from the blob
      const file = new File([archiveBlob], 'mixtape.mixblues', { type: 'application/zip' });

      const importedMixtape = await archiveManager.importFromFile(file);

      expect(importedMixtape).toBeDefined();
      expect(importedMixtape.id).toBe(mixtape.id);
      expect(importedMixtape.title).toBe(mixtape.title);
    });

    it('should throw error for invalid file', async () => {
      // Requirements: 14.5
      const invalidBlob = new Blob(['invalid data'], { type: 'text/plain' });

      await expect(archiveManager.importFromFile(invalidBlob)).rejects.toThrow(
        'Failed to import from file'
      );
    });

    it('should throw error for corrupted file', async () => {
      // Requirements: 14.5
      const corruptedBlob = new Blob(['corrupted zip data'], { type: 'application/zip' });

      await expect(archiveManager.importFromFile(corruptedBlob)).rejects.toThrow(
        'Failed to import from file'
      );
    });
  });

  describe('Import with audio and theme assets', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should save audio files during import', async () => {
      // Requirements: 14.4
      const mixtape = createMockMixtape();
      const audioFiles = new Map<string, Blob>();
      audioFiles.set('track-1', createMockAudioBlob('track-1'));
      audioFiles.set('track-2', createMockAudioBlob('track-2'));

      const archiveBlob = await archiveManager.createArchive(mixtape, audioFiles);
      const importedMixtape = await archiveManager.importFromFile(archiveBlob);

      expect(importedMixtape).toBeDefined();
      // Audio files should be saved through the repository
    });

    it('should save theme assets during import', async () => {
      // Requirements: 14.4
      const mixtape = createMockMixtape();
      const themeAssets = new Map<string, Blob>();
      themeAssets.set('pattern-retro', createMockAssetBlob('pattern'));
      themeAssets.set('texture-crt', createMockAssetBlob('texture'));

      const archiveBlob = await archiveManager.createArchive(mixtape, new Map(), themeAssets);
      const importedMixtape = await archiveManager.importFromFile(archiveBlob);

      expect(importedMixtape).toBeDefined();
      // Theme assets should be saved through the repository
    });

    it('should continue import even if some audio files fail to save', async () => {
      // Requirements: 14.4
      const StorageFactory = jest.requireMock('../../repositories/adapters/StorageFactory');
      
      // Mock audio repository to fail on one file
      StorageFactory.createAudioRepository.mockReturnValue({
        saveAudioFile: jest.fn()
          .mockResolvedValueOnce('saved-uri')
          .mockRejectedValueOnce(new Error('Save failed')),
        getAudioFile: jest.fn().mockResolvedValue(null),
        deleteAudioFile: jest.fn().mockResolvedValue(undefined),
        validateAudioSource: jest.fn().mockResolvedValue(true)
      });

      const mixtape = createMockMixtape();
      const audioFiles = new Map<string, Blob>();
      audioFiles.set('track-1', createMockAudioBlob('track-1'));
      audioFiles.set('track-2', createMockAudioBlob('track-2'));

      const archiveBlob = await archiveManager.createArchive(mixtape, audioFiles);
      
      // Should not throw, should continue with import
      const importedMixtape = await archiveManager.importFromFile(archiveBlob);
      expect(importedMixtape).toBeDefined();
    });
  });

  describe('Import error handling', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw error if mixtape already exists', async () => {
      // Requirements: 14.5
      const StorageFactory = jest.requireMock('../../repositories/adapters/StorageFactory');
      
      // Mock repository to indicate mixtape exists
      StorageFactory.createMixtapeRepository.mockReturnValue({
        exists: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(undefined),
        getById: jest.fn().mockResolvedValue(null),
        getAll: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue(undefined)
      });

      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);

      await expect(archiveManager.importFromFile(archiveBlob)).rejects.toThrow(
        'already exists in library'
      );
    });

    it('should handle repository save errors gracefully', async () => {
      // Requirements: 14.5
      const StorageFactory = jest.requireMock('../../repositories/adapters/StorageFactory');
      
      // Mock repository to fail on save
      StorageFactory.createMixtapeRepository.mockReturnValue({
        exists: jest.fn().mockResolvedValue(false),
        save: jest.fn().mockRejectedValue(new Error('Storage full')),
        getById: jest.fn().mockResolvedValue(null),
        getAll: jest.fn().mockResolvedValue([]),
        delete: jest.fn().mockResolvedValue(undefined)
      });

      const mixtape = createMockMixtape();
      const archiveBlob = await archiveManager.createArchive(mixtape);

      await expect(archiveManager.importFromFile(archiveBlob)).rejects.toThrow();
    });
  });
});
