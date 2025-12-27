/**
 * Mobile storage adapter using Expo FileSystem
 * Requirements: 15.1
 */

import { Directory, File, Paths } from 'expo-file-system';
import { AudioSource, Mixtape, TapeTheme } from '../../models';
import { AudioRepository } from '../AudioRepository';
import { MixtapeRepository } from '../MixtapeRepository';
import { ThemeRepository } from '../ThemeRepository';
import {
  getFileExtension,
  validateAudioSource as validateAudioSourceUtil,
} from '../utils/audioValidation';

// Base directories
const BASE_DIR = new Directory(Paths.document, 'moodybeats');
const MIXTAPES_DIR = new Directory(BASE_DIR, 'mixtapes');
const AUDIO_DIR = new Directory(BASE_DIR, 'audio');
const THEMES_DIR = new Directory(BASE_DIR, 'themes');

/**
 * Ensures that the required directories exist
 */
async function ensureDirectories(): Promise<void> {
  const dirs = [BASE_DIR, MIXTAPES_DIR, AUDIO_DIR, THEMES_DIR];
  for (const dir of dirs) {
    if (!dir.exists) {
      await dir.create();
    }
  }
}

/**
 * FileSystem-based implementation of MixtapeRepository
 */
export class FileSystemMixtapeRepository implements MixtapeRepository {
  constructor() {
    ensureDirectories();
  }

  async getAll(): Promise<Mixtape[]> {
    await ensureDirectories();
    
    if (!MIXTAPES_DIR.exists) {
      return [];
    }

    const items = MIXTAPES_DIR.list();
    const mixtapes: Mixtape[] = [];

    for (const item of items) {
      if (item instanceof File && item.name.endsWith('.json')) {
        const content = await item.text();
        const mixtape = this.deserializeMixtape(content);
        mixtapes.push(mixtape);
      }
    }

    return mixtapes;
  }

  async getById(id: string): Promise<Mixtape | null> {
    await ensureDirectories();
    const file = new File(MIXTAPES_DIR, `${id}.json`);

    if (!file.exists) {
      return null;
    }

    const content = await file.text();
    return this.deserializeMixtape(content);
  }

  async save(mixtape: Mixtape): Promise<void> {
    await ensureDirectories();
    const file = new File(MIXTAPES_DIR, `${mixtape.id}.json`);
    const content = this.serializeMixtape(mixtape);
    await file.write(content);
  }

  async delete(id: string): Promise<void> {
    await ensureDirectories();
    const file = new File(MIXTAPES_DIR, `${id}.json`);

    if (file.exists) {
      await file.delete();
    }
  }

  async exists(id: string): Promise<boolean> {
    await ensureDirectories();
    const file = new File(MIXTAPES_DIR, `${id}.json`);
    return file.exists;
  }

  private serializeMixtape(mixtape: Mixtape): string {
    return JSON.stringify(mixtape, null, 2);
  }

  private deserializeMixtape(content: string): Mixtape {
    const parsed = JSON.parse(content);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
    };
  }
}

/**
 * FileSystem-based implementation of AudioRepository
 */
export class FileSystemAudioRepository implements AudioRepository {
  constructor() {
    ensureDirectories();
  }

  async saveAudioFile(trackId: string, uri: string): Promise<string> {
    await ensureDirectories();
    const extension = getFileExtension(uri).replace('.', '') || 'mp3';
    const destFile = new File(AUDIO_DIR, `${trackId}.${extension}`);

    try {
      // Copy the file to our storage directory
      const sourceFile = new File(uri);
      await sourceFile.copy(destFile);
      return destFile.uri;
    } catch (error) {
      if (__DEV__) {
        console.error(`Failed to copy audio file:`, error);
      }
      throw error;
    }
  }

  async getAudioFile(trackId: string): Promise<string | null> {
    await ensureDirectories();
    // Try common audio extensions
    const extensions = ['mp3', 'aac', 'wav', 'm4a'];

    for (const ext of extensions) {
      const file = new File(AUDIO_DIR, `${trackId}.${ext}`);
      if (file.exists) {
        return file.uri;
      }
    }

    return null;
  }

  async deleteAudioFile(trackId: string): Promise<void> {
    await ensureDirectories();
    const extensions = ['mp3', 'aac', 'wav', 'm4a'];

    for (const ext of extensions) {
      const file = new File(AUDIO_DIR, `${trackId}.${ext}`);
      if (file.exists) {
        await file.delete();
      }
    }
  }

  async validateAudioSource(source: AudioSource): Promise<boolean> {
    // Use the comprehensive validation utility
    const result = validateAudioSourceUtil(source);
    
    // For local files, also check if the file exists
    if (result.valid && source.type === 'local') {
      const file = new File(source.uri);
      return file.exists;
    }
    
    return result.valid;
  }
}

/**
 * FileSystem-based implementation of ThemeRepository
 */
export class FileSystemThemeRepository implements ThemeRepository {
  private presetThemes: Record<string, TapeTheme> = {
    'vhs-static-grey': {
      preset: 'vhs-static-grey',
      pattern: 'static-lines',
      texture: 'crt-grain',
      overlay: 'vhs-noise',
    },
    'pumpkin-orange': {
      preset: 'pumpkin-orange',
      pattern: 'retro-stripes',
      texture: 'smooth',
      overlay: 'light-grain',
    },
    'ghostly-green': {
      preset: 'ghostly-green',
      pattern: 'phosphor-dots',
      texture: 'crt-scan',
      overlay: 'green-glow',
    },
  };

  constructor() {
    ensureDirectories();
  }

  getPresetTheme(preset: string): TapeTheme {
    const theme = this.presetThemes[preset];
    if (!theme) {
      // Return default theme if preset not found
      return this.presetThemes['vhs-static-grey'];
    }
    return theme;
  }

  async saveCustomAsset(assetId: string, data: Blob): Promise<string> {
    await ensureDirectories();
    const file = new File(THEMES_DIR, assetId);

    // Convert Blob to ArrayBuffer and write
    const arrayBuffer = await data.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    await file.write(uint8Array);

    return file.uri;
  }

  async getCustomAsset(assetId: string): Promise<Blob | null> {
    await ensureDirectories();
    const file = new File(THEMES_DIR, assetId);

    if (!file.exists) {
      return null;
    }

    // Read as ArrayBuffer and convert to Blob
    const arrayBuffer = await file.arrayBuffer();
    return new Blob([arrayBuffer]);
  }
}
