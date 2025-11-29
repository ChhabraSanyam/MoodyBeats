/**
 * Factory for creating platform-specific storage adapters
 * Requirements: 14.1, 14.2, 15.1, 15.2
 */

import { AudioRepository } from '../AudioRepository';
import { MixtapeRepository } from '../MixtapeRepository';
import { ThemeRepository } from '../ThemeRepository';
import { detectPlatform } from '../utils/platform';
import {
    IndexedDBAudioRepository,
    IndexedDBMixtapeRepository,
    IndexedDBThemeRepository,
} from './IndexedDBStorageAdapter';

/**
 * Creates a MixtapeRepository instance for the current platform
 */
export function createMixtapeRepository(): MixtapeRepository {
  const platform = detectPlatform();
  if (platform === 'web') {
    return new IndexedDBMixtapeRepository();
  }
  // Lazy load FileSystem adapter only when needed
  const { FileSystemMixtapeRepository } = require('./FileSystemStorageAdapter');
  return new FileSystemMixtapeRepository();
}

/**
 * Creates an AudioRepository instance for the current platform
 */
export function createAudioRepository(): AudioRepository {
  const platform = detectPlatform();
  if (platform === 'web') {
    return new IndexedDBAudioRepository();
  }
  // Lazy load FileSystem adapter only when needed
  const { FileSystemAudioRepository } = require('./FileSystemStorageAdapter');
  return new FileSystemAudioRepository();
}

/**
 * Creates a ThemeRepository instance for the current platform
 */
export function createThemeRepository(): ThemeRepository {
  const platform = detectPlatform();
  if (platform === 'web') {
    return new IndexedDBThemeRepository();
  }
  // Lazy load FileSystem adapter only when needed
  const { FileSystemThemeRepository } = require('./FileSystemStorageAdapter');
  return new FileSystemThemeRepository();
}
