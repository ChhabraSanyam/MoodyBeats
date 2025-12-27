/**
 * ArchiveManager service for creating and extracting .mixblues archives
 * Requirements: 12.1, 12.2, 12.3, 14.1, 14.2, 14.3, 14.4, 14.5, 17.1, 17.2, 17.3, 17.4, 17.5, 18.1
 */

import JSZip from 'jszip';
import { Platform } from 'react-native';
import { Mixtape } from '../models';
import { createAudioRepository, createMixtapeRepository, createThemeRepository } from '../repositories/adapters/StorageFactory';
import { BackendClient } from './BackendClient';

/**
 * Metadata structure for mixtape archives
 */
export interface MixtapeMetadata {
  version: string;
  mixtape: {
    id: string;
    title: string;
    note?: string;
    sideA: {
      id: string;
      title: string;
      artist?: string;
      duration: number;
      source: {
        type: 'local' | 'url';
        uri: string;
        metadata?: {
          provider?: 'direct';
        };
      };
    }[];
    sideB: {
      id: string;
      title: string;
      artist?: string;
      duration: number;
      source: {
        type: 'local' | 'url';
        uri: string;
        metadata?: {
          provider?: 'direct';
        };
      };
    }[];
    theme: {
      preset: 'vhs-static-grey' | 'pumpkin-orange' | 'ghostly-green';
      pattern?: string;
      texture?: string;
      overlay?: string;
    };
    envelope: {
      color: string;
      sigil?: string;
      signature?: string;
    };
  };
}

/**
 * Extracted archive data structure
 */
export interface MixtapeArchiveData {
  metadata: MixtapeMetadata;
  audioFiles: Map<string, Blob>;
  themeAssets: Map<string, Blob>;
}

/**
 * ArchiveManager handles creation and extraction of .mixblues archive files
 */
export class ArchiveManager {
  private static readonly ARCHIVE_VERSION = '1.0.0';
  private static readonly METADATA_FILENAME = 'metadata.json';
  private static readonly AUDIO_DIR = 'audio';
  private static readonly ASSETS_DIR = 'assets';
  private static readonly PATTERNS_DIR = 'assets/patterns';
  private static readonly TEXTURES_DIR = 'assets/textures';
  private static readonly OVERLAYS_DIR = 'assets/overlays';

  /**
   * Creates a .mixblues archive from a mixtape
   * Requirements: 12.1, 12.2, 12.3, 18.1
   * 
   * @param mixtape - The mixtape to archive
   * @param audioFiles - Map of track IDs to audio file blobs
   * @param themeAssets - Map of asset IDs to theme asset blobs
   * @returns Promise resolving to the archive blob
   */
  async createArchive(
    mixtape: Mixtape,
    audioFiles: Map<string, Blob> = new Map(),
    themeAssets: Map<string, Blob> = new Map()
  ): Promise<Blob> {
    const zip = new JSZip();

    // Create metadata with archive references for included audio files
    const metadata: MixtapeMetadata = this.createMetadata(mixtape);
    
    // Update track sources to use archive references for tracks with included audio
    const updateTrackSourceForArchive = (track: MixtapeMetadata['mixtape']['sideA'][0]) => {
      if (audioFiles.has(track.id)) {
        // Mark this track as having audio in the archive
        track.source = {
          type: 'local',
          uri: `archive://${ArchiveManager.AUDIO_DIR}/${track.id}`,
        };
      }
    };
    
    metadata.mixtape.sideA.forEach(updateTrackSourceForArchive);
    metadata.mixtape.sideB.forEach(updateTrackSourceForArchive);
    
    zip.file(ArchiveManager.METADATA_FILENAME, JSON.stringify(metadata, null, 2));

    // Include audio files in archive
    for (const [trackId, audioBlob] of audioFiles.entries()) {
      const extension = this.getFileExtension(audioBlob.type);
      
      // Convert blob to array buffer (React Native compatible)
      const arrayBuffer = await this.blobToArrayBuffer(audioBlob);
      zip.file(`${ArchiveManager.AUDIO_DIR}/${trackId}${extension}`, arrayBuffer);
    }

    // Include theme assets in archive
    for (const [assetId, assetBlob] of themeAssets.entries()) {
      const assetPath = this.getAssetPath(assetId, assetBlob.type);
      
      // Convert blob to array buffer (React Native compatible)
      const arrayBuffer = await this.blobToArrayBuffer(assetBlob);
      zip.file(assetPath, arrayBuffer);
    }

    // Generate ZIP archive
    if (Platform.OS === 'web') {
      // Web: Use blob type directly
      const archiveBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      return archiveBlob as Blob;
    } else {
      // React Native: Use base64 and create a mock Blob
      const archiveBase64 = await zip.generateAsync({
        type: 'base64',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Create a Blob-like object with base64 data
      // This will be handled specially in the export screen
      const blob = {
        data: archiveBase64,
        type: 'application/zip',
        size: archiveBase64.length,
        // Mark this as a base64 blob for React Native
        _base64: true,
      } as any;
      
      return blob as Blob;
    }
  }

  /**
   * Extracts a .mixblues archive
   * Requirements: 14.1, 14.2, 14.3
   * 
   * @param archiveBlob - The archive blob or ArrayBuffer to extract
   * @returns Promise resolving to extracted archive data
   * @throws Error if archive is invalid
   */
  async extractArchive(archiveBlob: Blob | ArrayBuffer): Promise<MixtapeArchiveData> {
    const zip = new JSZip();
    const arrayBuffer = archiveBlob instanceof ArrayBuffer 
      ? archiveBlob 
      : await archiveBlob.arrayBuffer();
    const loadedZip = await zip.loadAsync(arrayBuffer);

    // Extract and validate metadata.json
    const metadataFile = loadedZip.file(ArchiveManager.METADATA_FILENAME);
    if (!metadataFile) {
      throw new Error('Invalid archive: missing metadata.json');
    }

    const metadataText = await metadataFile.async('text');
    const metadata: MixtapeMetadata = JSON.parse(metadataText);

    // Validate metadata structure
    if (!this.isValidMetadata(metadata)) {
      throw new Error('Invalid archive: metadata.json has invalid structure');
    }

    // Extract audio files
    const audioFiles = new Map<string, Blob>();
    const audioFolder = loadedZip.folder(ArchiveManager.AUDIO_DIR);
    if (audioFolder) {
      const audioFilePromises: Promise<void>[] = [];
      audioFolder.forEach((relativePath, file) => {
        if (!file.dir) {
          audioFilePromises.push(
            (async () => {
              const trackId = this.getTrackIdFromPath(relativePath);
              // Use arraybuffer for React Native compatibility
              if (Platform.OS === 'web') {
                const blob = await file.async('blob');
                audioFiles.set(trackId, blob);
              } else {
                const arrayBuffer = await file.async('arraybuffer');
                // Create a mock Blob-like object for React Native
                const blob = {
                  arrayBuffer: () => Promise.resolve(arrayBuffer),
                  size: arrayBuffer.byteLength,
                  type: 'audio/mpeg',
                } as Blob;
                audioFiles.set(trackId, blob);
              }
            })()
          );
        }
      });
      await Promise.all(audioFilePromises);
    }

    // Extract theme assets
    const themeAssets = new Map<string, Blob>();
    const assetsFolder = loadedZip.folder(ArchiveManager.ASSETS_DIR);
    if (assetsFolder) {
      const assetFilePromises: Promise<void>[] = [];
      assetsFolder.forEach((relativePath, file) => {
        if (!file.dir) {
          assetFilePromises.push(
            (async () => {
              const assetId = this.getAssetIdFromPath(relativePath);
              // Use arraybuffer for React Native compatibility
              if (Platform.OS === 'web') {
                const blob = await file.async('blob');
                themeAssets.set(assetId, blob);
              } else {
                const arrayBuffer = await file.async('arraybuffer');
                // Create a mock Blob-like object for React Native
                const blob = {
                  arrayBuffer: () => Promise.resolve(arrayBuffer),
                  size: arrayBuffer.byteLength,
                  type: 'application/octet-stream',
                } as Blob;
                themeAssets.set(assetId, blob);
              }
            })()
          );
        }
      });
      await Promise.all(assetFilePromises);
    }

    return {
      metadata,
      audioFiles,
      themeAssets
    };
  }

  /**
   * Validates a .mixblues archive
   * Requirements: 14.3, 18.5
   * 
   * @param archiveBlob - The archive blob or ArrayBuffer to validate
   * @returns Promise resolving to true if valid, false otherwise
   */
  async validateArchive(archiveBlob: Blob | ArrayBuffer): Promise<boolean> {
    try {
      const zip = new JSZip();
      const arrayBuffer = archiveBlob instanceof ArrayBuffer 
        ? archiveBlob 
        : await archiveBlob.arrayBuffer();
      const loadedZip = await zip.loadAsync(arrayBuffer);

      // Check for metadata.json
      const metadataFile = loadedZip.file(ArchiveManager.METADATA_FILENAME);
      if (!metadataFile) {
        return false;
      }

      // Validate metadata structure
      const metadataText = await metadataFile.async('text');
      const metadata: MixtapeMetadata = JSON.parse(metadataText);
      
      return this.isValidMetadata(metadata);
    } catch {
      return false;
    }
  }

  /**
   * Creates metadata object from mixtape
   * Requirements: 12.2
   */
  private createMetadata(mixtape: Mixtape): MixtapeMetadata {
    return {
      version: ArchiveManager.ARCHIVE_VERSION,
      mixtape: {
        id: mixtape.id,
        title: mixtape.title,
        note: mixtape.note,
        sideA: mixtape.sideA.map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          source: {
            type: track.source.type,
            uri: track.source.uri,
            metadata: track.source.metadata
          }
        })),
        sideB: mixtape.sideB.map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          source: {
            type: track.source.type,
            uri: track.source.uri,
            metadata: track.source.metadata
          }
        })),
        theme: {
          preset: mixtape.theme.preset,
          pattern: mixtape.theme.pattern,
          texture: mixtape.theme.texture,
          overlay: mixtape.theme.overlay
        },
        envelope: {
          color: mixtape.envelope.color,
          sigil: mixtape.envelope.sigil,
          signature: mixtape.envelope.signature
        }
      }
    };
  }

  /**
   * Validates metadata structure
   * Requirements: 14.3, 18.5
   */
  private isValidMetadata(metadata: any): metadata is MixtapeMetadata {
    if (!metadata || typeof metadata !== 'object') {
      return false;
    }

    // Check version
    if (!metadata.version || typeof metadata.version !== 'string') {
      return false;
    }

    // Check mixtape object
    if (!metadata.mixtape || typeof metadata.mixtape !== 'object') {
      return false;
    }

    const mixtape = metadata.mixtape;

    // Check required fields
    if (!mixtape.id || typeof mixtape.id !== 'string') {
      return false;
    }
    if (!mixtape.title || typeof mixtape.title !== 'string') {
      return false;
    }

    // Check sides
    if (!Array.isArray(mixtape.sideA) || !Array.isArray(mixtape.sideB)) {
      return false;
    }

    // Validate tracks
    const validateTrack = (track: any): boolean => {
      return (
        track &&
        typeof track.id === 'string' &&
        typeof track.title === 'string' &&
        typeof track.duration === 'number' &&
        track.source &&
        (track.source.type === 'local' || track.source.type === 'url') &&
        typeof track.source.uri === 'string'
      );
    };

    if (!mixtape.sideA.every(validateTrack) || !mixtape.sideB.every(validateTrack)) {
      return false;
    }

    // Check theme
    if (!mixtape.theme || typeof mixtape.theme !== 'object') {
      return false;
    }
    const validPresets = ['vhs-static-grey', 'pumpkin-orange', 'ghostly-green'];
    if (!validPresets.includes(mixtape.theme.preset)) {
      return false;
    }

    // Check envelope
    if (!mixtape.envelope || typeof mixtape.envelope !== 'object') {
      return false;
    }
    if (!mixtape.envelope.color || typeof mixtape.envelope.color !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Gets file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/mp4': '.m4a',
      'audio/aac': '.aac',
      'audio/wav': '.wav',
      'audio/wave': '.wav',
      'audio/x-wav': '.wav',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };

    // Return mapped extension or default to .mp3 for audio, empty for others
    const extension = mimeMap[mimeType];
    if (extension) {
      return extension;
    }
    
    // Fallback: if it's audio but unknown type, use .mp3
    if (mimeType && mimeType.startsWith('audio/')) {
      return '.mp3';
    }
    
    return '';
  }

  /**
   * Determines asset path based on asset ID
   */
  private getAssetPath(assetId: string, mimeType: string): string {
    const extension = this.getFileExtension(mimeType);
    
    if (assetId.includes('pattern')) {
      return `${ArchiveManager.PATTERNS_DIR}/${assetId}${extension}`;
    } else if (assetId.includes('texture')) {
      return `${ArchiveManager.TEXTURES_DIR}/${assetId}${extension}`;
    } else if (assetId.includes('overlay')) {
      return `${ArchiveManager.OVERLAYS_DIR}/${assetId}${extension}`;
    }
    
    return `${ArchiveManager.ASSETS_DIR}/${assetId}${extension}`;
  }

  /**
   * Extracts track ID from file path
   */
  private getTrackIdFromPath(path: string): string {
    const filename = path.split('/').pop() || '';
    return filename.replace(/\.[^/.]+$/, ''); // Remove extension
  }

  /**
   * Extracts asset ID from file path
   */
  private getAssetIdFromPath(path: string): string {
    const filename = path.split('/').pop() || '';
    return filename.replace(/\.[^/.]+$/, ''); // Remove extension
  }

  /**
   * Import a mixtape archive from a URL
   * Requirements: 14.1, 14.3, 14.4, 14.5
   * 
   * @param url - The URL to download the archive from (shareable URL or direct link)
   * @returns Promise resolving to the imported mixtape
   * @throws Error if import fails
   */
  async importFromURL(url: string): Promise<Mixtape> {
    try {
      // Extract ID from shareable URL if it's in the expected format
      const shareUrlPattern = /\/t\/([^/]+)$/;
      const match = url.match(shareUrlPattern);
      
      let archiveBlob: Blob;
      
      if (match) {
        // It's a shareable URL, use BackendClient
        const id = match[1];
        const backendClient = new BackendClient();
        archiveBlob = await backendClient.downloadArchive(id);
      } else {
        // It's a direct URL, fetch directly
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download archive: ${response.statusText}`);
        }
        archiveBlob = await response.blob();
      }

      // Validate the archive
      const isValid = await this.validateArchive(archiveBlob);
      if (!isValid) {
        throw new Error('Invalid archive format or corrupted file');
      }

      // Extract and import the archive
      return await this.importArchive(archiveBlob);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to import from URL: ${error.message}`);
      }
      throw new Error('Failed to import from URL: Unknown error');
    }
  }

  /**
   * Import a mixtape archive from a local file
   * Requirements: 14.2, 14.3, 14.4, 14.5
   * 
   * @param file - The local file blob, File object, or ArrayBuffer
   * @returns Promise resolving to the imported mixtape
   * @throws Error if import fails
   */
  async importFromFile(file: Blob | File | ArrayBuffer): Promise<Mixtape> {
    try {
      // Validate the archive
      const isValid = await this.validateArchive(file);
      if (!isValid) {
        throw new Error('Invalid archive format or corrupted file');
      }

      // Extract and import the archive
      return await this.importArchive(file);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to import from file: ${error.message}`);
      }
      throw new Error('Failed to import from file: Unknown error');
    }
  }

  /**
   * Import a mixtape archive (common logic for URL and file imports)
   * Requirements: 14.3, 14.4, 14.5
   * 
   * @param archiveBlob - The archive blob or ArrayBuffer to import
   * @returns Promise resolving to the imported mixtape
   * @throws Error if import fails
   */
  private async importArchive(archiveBlob: Blob | ArrayBuffer): Promise<Mixtape> {
    try {
      // Extract archive data
      const archiveData = await this.extractArchive(archiveBlob);

      // Get repositories
      const mixtapeRepo = createMixtapeRepository();
      const audioRepo = createAudioRepository();
      const themeRepo = createThemeRepository();

      // Create a unique fingerprint for this mixtape based on its content
      // This allows same songs in different mixtapes but prevents duplicate imports
      const mixtapeFingerprint = this.createMixtapeFingerprint(archiveData.metadata.mixtape);
      
      // Check if this exact mixtape already exists in library
      const allMixtapes = await mixtapeRepo.getAll();
      const duplicateExists = allMixtapes.some(existing => {
        const existingFingerprint = this.createMixtapeFingerprint({
          title: existing.title,
          note: existing.note,
          sideA: existing.sideA.map(t => ({ id: t.id, title: t.title, artist: t.artist, duration: t.duration, source: t.source })),
          sideB: existing.sideB.map(t => ({ id: t.id, title: t.title, artist: t.artist, duration: t.duration, source: t.source })),
          theme: existing.theme,
          envelope: existing.envelope,
        });
        return existingFingerprint === mixtapeFingerprint;
      });
      
      if (duplicateExists) {
        throw new Error('This mixtape already exists in your library');
      }
      
      // Generate a new ID for the imported mixtape
      const newMixtapeId = `mixtape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Convert metadata to Mixtape object with new ID
      const mixtape: Mixtape = {
        id: newMixtapeId,
        title: archiveData.metadata.mixtape.title,
        note: archiveData.metadata.mixtape.note,
        sideA: archiveData.metadata.mixtape.sideA,
        sideB: archiveData.metadata.mixtape.sideB,
        theme: archiveData.metadata.mixtape.theme,
        envelope: archiveData.metadata.mixtape.envelope,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save audio files from archive and build a map of track IDs to saved URIs
      const savedAudioFiles = new Map<string, string>();
      
      for (const [trackId, audioBlob] of archiveData.audioFiles.entries()) {
        try {
          if (Platform.OS === 'web') {
            // Web: Convert blob to data URL for storage in IndexedDB
            const dataUrl = await this.blobToDataUrl(audioBlob);
            await audioRepo.saveAudioFile(trackId, dataUrl);
            
            // Get the blob URL for the saved audio file
            const savedUri = await audioRepo.getAudioFile(trackId);
            if (savedUri) {
              savedAudioFiles.set(trackId, savedUri);
            }
          } else {
            // Mobile: Write ArrayBuffer directly to file system
            const { Directory, File, Paths } = await import('expo-file-system');
            const AUDIO_DIR = new Directory(new Directory(Paths.document, 'moodybeats'), 'audio');
            
            // Ensure directory exists
            if (!AUDIO_DIR.exists) {
              await AUDIO_DIR.create();
            }
            
            // Get the ArrayBuffer from our mock Blob
            const arrayBuffer = await audioBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Write to file
            const audioFile = new File(AUDIO_DIR, `${trackId}.mp3`);
            await audioFile.write(uint8Array);
            savedAudioFiles.set(trackId, audioFile.uri);
          }
        } catch (error) {
          if (__DEV__) {
            console.warn(`Failed to save audio file for track ${trackId}:`, error);
          }
          // Continue with import even if some audio files fail
        }
      }
      
      // Update track sources: replace archive:// URIs with actual saved file URIs
      const updateTrackSource = (track: any) => {
        if (savedAudioFiles.has(track.id)) {
          // Update to point to the saved audio file
          track.source = {
            type: 'local' as const,
            uri: savedAudioFiles.get(track.id)!,
          };
        } else if (track.source.uri?.startsWith('archive://')) {
          // Archive reference but no audio file found - this is an error state
          if (__DEV__) {
            console.warn(`Track ${track.id} has archive reference but no audio file was found in archive`);
          }
        }
        // For non-archive tracks (URL sources), keep the original source
      };
      
      mixtape.sideA.forEach(updateTrackSource);
      mixtape.sideB.forEach(updateTrackSource);

      // Save theme assets
      for (const [assetId, assetBlob] of archiveData.themeAssets.entries()) {
        try {
          await themeRepo.saveCustomAsset(assetId, assetBlob);
        } catch (error) {
          if (__DEV__) {
            console.warn(`Failed to save theme asset ${assetId}:`, error);
          }
          // Continue with import even if some theme assets fail
        }
      }

      // Save mixtape to library
      await mixtapeRepo.save(mixtape);

      return mixtape;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to import archive: Unknown error');
    }
  }

  /**
   * Convert a Blob to a data URL
   * Helper method for saving audio files
   */
  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to data URL'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert a Blob to an ArrayBuffer
   * React Native compatible method using FileReader
   */
  private blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    // On web, use native arrayBuffer if available
    if (Platform.OS === 'web' && typeof blob.arrayBuffer === 'function') {
      return blob.arrayBuffer();
    }

    // On React Native, use FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Create a unique fingerprint for a mixtape based on its content
   * This allows detecting duplicate imports while allowing same songs in different mixtapes
   */
  private createMixtapeFingerprint(mixtapeData: any): string {
    // Create a string representation of the mixtape's unique properties
    const fingerprintData = {
      title: mixtapeData.title,
      note: mixtapeData.note || '',
      sideA: mixtapeData.sideA.map((t: any) => ({
        title: t.title,
        artist: t.artist || '',
        duration: t.duration,
      })),
      sideB: mixtapeData.sideB.map((t: any) => ({
        title: t.title,
        artist: t.artist || '',
        duration: t.duration,
      })),
      theme: {
        preset: mixtapeData.theme.preset,
        pattern: mixtapeData.theme.pattern || '',
        texture: mixtapeData.theme.texture || '',
      },
      envelope: {
        color: mixtapeData.envelope.color,
        sigil: mixtapeData.envelope.sigil || '',
        signature: mixtapeData.envelope.signature || undefined,
      },
    };
    
    // Create a simple hash from the JSON string
    const jsonString = JSON.stringify(fingerprintData);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}
