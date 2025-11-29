/**
 * Web storage adapter using IndexedDB
 * Requirements: 15.2
 */

import localforage from 'localforage';
import { AudioSource, Mixtape, TapeTheme } from '../../models';
import { AudioRepository } from '../AudioRepository';
import { MixtapeRepository } from '../MixtapeRepository';
import { ThemeRepository } from '../ThemeRepository';
import { validateAudioSource as validateAudioSourceUtil } from '../utils/audioValidation';

// Configure localforage instances for different data types
const mixtapeStore = localforage.createInstance({
  name: 'moodybeats',
  storeName: 'mixtapes',
});

const audioStore = localforage.createInstance({
  name: 'moodybeats',
  storeName: 'audio',
});

const themeStore = localforage.createInstance({
  name: 'moodybeats',
  storeName: 'themes',
});

/**
 * IndexedDB-based implementation of MixtapeRepository
 */
export class IndexedDBMixtapeRepository implements MixtapeRepository {
  async getAll(): Promise<Mixtape[]> {
    const mixtapes: Mixtape[] = [];
    await mixtapeStore.iterate<Mixtape, void>((value) => {
      mixtapes.push(this.deserializeMixtape(value));
    });
    return mixtapes;
  }

  async getById(id: string): Promise<Mixtape | null> {
    const mixtape = await mixtapeStore.getItem<Mixtape>(id);
    if (!mixtape) {
      return null;
    }
    return this.deserializeMixtape(mixtape);
  }

  async save(mixtape: Mixtape): Promise<void> {
    await mixtapeStore.setItem(mixtape.id, this.serializeMixtape(mixtape));
  }

  async delete(id: string): Promise<void> {
    await mixtapeStore.removeItem(id);
  }

  async exists(id: string): Promise<boolean> {
    const mixtape = await mixtapeStore.getItem(id);
    return mixtape !== null;
  }

  private serializeMixtape(mixtape: Mixtape): any {
    return {
      ...mixtape,
      createdAt: mixtape.createdAt.toISOString(),
      updatedAt: mixtape.updatedAt.toISOString(),
    };
  }

  private deserializeMixtape(data: any): Mixtape {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }
}

/**
 * IndexedDB-based implementation of AudioRepository
 */
export class IndexedDBAudioRepository implements AudioRepository {
  async saveAudioFile(trackId: string, uri: string): Promise<string> {
    // For web, we need to fetch the audio file and store it as a Blob
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const response = await fetch(uri);
      const blob = await response.blob();
      await audioStore.setItem(trackId, blob);
      return trackId; // Return the trackId as the stored reference
    } else if (uri.startsWith('blob:')) {
      // Handle blob URLs
      const response = await fetch(uri);
      const blob = await response.blob();
      await audioStore.setItem(trackId, blob);
      return trackId;
    } else if (uri.startsWith('data:')) {
      // Handle data URLs - convert to Blob for proper storage
      const response = await fetch(uri);
      let blob = await response.blob();
      
      // Ensure correct MIME type for audio
      if (blob.type === 'application/octet-stream' || !blob.type) {
        blob = new Blob([blob], { type: 'audio/mpeg' });
      }
      
      await audioStore.setItem(trackId, blob);
      return trackId;
    } else {
      // For local file references, store the URI directly
      await audioStore.setItem(trackId, uri);
      return trackId;
    }
  }

  async getAudioFile(trackId: string): Promise<string | null> {
    const data = await audioStore.getItem<Blob | string>(trackId);
    if (!data) {
      return null;
    }

    // If it's a Blob, create a blob URL
    if (data instanceof Blob) {
      return URL.createObjectURL(data);
    }

    // Otherwise, return the stored URI
    return data;
  }

  async deleteAudioFile(trackId: string): Promise<void> {
    await audioStore.removeItem(trackId);
  }

  async validateAudioSource(source: AudioSource): Promise<boolean> {
    // Use the comprehensive validation utility
    const result = validateAudioSourceUtil(source);
    
    // For web, blob URLs are always valid if they pass basic validation
    if (result.valid && source.type === 'local' && source.uri.startsWith('blob:')) {
      return true;
    }
    
    return result.valid;
  }
}

/**
 * IndexedDB-based implementation of ThemeRepository
 */
export class IndexedDBThemeRepository implements ThemeRepository {
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

  getPresetTheme(preset: string): TapeTheme {
    const theme = this.presetThemes[preset];
    if (!theme) {
      // Return default theme if preset not found
      return this.presetThemes['vhs-static-grey'];
    }
    return theme;
  }

  async saveCustomAsset(assetId: string, data: Blob): Promise<string> {
    await themeStore.setItem(assetId, data);
    return assetId;
  }

  async getCustomAsset(assetId: string): Promise<Blob | null> {
    const blob = await themeStore.getItem<Blob>(assetId);
    return blob || null;
  }
}
