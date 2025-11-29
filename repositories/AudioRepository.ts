/**
 * Repository interface for audio file management
 * Requirements: 1.1, 1.2, 1.5
 */

import { AudioSource } from '../models';

export interface AudioRepository {
  saveAudioFile(trackId: string, uri: string): Promise<string>;
  getAudioFile(trackId: string): Promise<string | null>;
  deleteAudioFile(trackId: string): Promise<void>;
  validateAudioSource(source: AudioSource): Promise<boolean>;
}
