/**
 * Audio source validation utilities
 * Requirements: 1.1, 1.2, 1.5
 */

import { AudioSource } from '../../models';

/**
 * Supported audio file formats
 */
export const SUPPORTED_AUDIO_FORMATS = ['.mp3', '.aac', '.wav', '.m4a'] as const;

/**
 * Audio file format validation error
 */
export class AudioValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AudioValidationError';
  }
}

/**
 * Validates if a file extension is a supported audio format
 * Requirements: 1.1
 */
export function isValidAudioFormat(filename: string): boolean {
  const lowerFilename = filename.toLowerCase();
  return SUPPORTED_AUDIO_FORMATS.some((ext) => lowerFilename.endsWith(ext));
}

/**
 * Extracts file extension from a URI or filename
 */
export function getFileExtension(uri: string): string {
  const match = uri.match(/\.([^./?#]+)(?:[?#]|$)/);
  return match ? `.${match[1].toLowerCase()}` : '';
}

/**
 * Validates a URL string format
 */
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * URL provider patterns for validation
 * Requirements: 1.2
 */
const URL_PROVIDER_PATTERNS = {
  spotify: [
    /^https?:\/\/(open\.)?spotify\.com\/(track|playlist|album)\//,
    /^spotify:(track|playlist|album):/,
  ],
  youtube: [
    /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/,
    /^https?:\/\/(www\.)?youtube\.com\/(embed|v)\//,
  ],
  soundcloud: [
    /^https?:\/\/(www\.)?soundcloud\.com\//,
  ],
  direct: [
    /\.mp3(\?.*)?$/i,
    /\.aac(\?.*)?$/i,
    /\.wav(\?.*)?$/i,
    /\.m4a(\?.*)?$/i,
  ],
} as const;

/**
 * Detects the provider from a URL
 * Requirements: 1.2
 */
export function detectUrlProvider(
  url: string
): 'spotify' | 'youtube' | 'soundcloud' | 'direct' | null {
  for (const [provider, patterns] of Object.entries(URL_PROVIDER_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(url))) {
      return provider as 'spotify' | 'youtube' | 'soundcloud' | 'direct';
    }
  }
  return null;
}

/**
 * Validates a URL-based audio source
 * Requirements: 1.2
 */
export function validateAudioUrl(url: string): {
  valid: boolean;
  provider?: 'spotify' | 'youtube' | 'soundcloud' | 'direct';
  error?: string;
} {
  // Check if it's a valid URL format
  if (!isValidUrl(url)) {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }

  // Detect provider
  const provider = detectUrlProvider(url);
  if (!provider) {
    return {
      valid: false,
      error: 'Unsupported audio provider. Supported: Spotify, YouTube, SoundCloud, or direct MP3/AAC/WAV/M4A URLs',
    };
  }

  return {
    valid: true,
    provider,
  };
}

/**
 * Validates a local file audio source
 * Requirements: 1.1
 */
export function validateLocalAudioFile(uri: string): {
  valid: boolean;
  error?: string;
} {
  // Check if the file has a valid audio extension
  if (!isValidAudioFormat(uri)) {
    const extension = getFileExtension(uri);
    return {
      valid: false,
      error: `Unsupported audio format: ${extension || 'unknown'}. Supported formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`,
    };
  }

  return {
    valid: true,
  };
}

/**
 * Validates an AudioSource object
 * Requirements: 1.1, 1.2, 1.5
 */
export function validateAudioSource(source: AudioSource): {
  valid: boolean;
  error?: string;
} {
  if (!source || !source.type || !source.uri) {
    return {
      valid: false,
      error: 'Invalid audio source: missing type or uri',
    };
  }

  if (source.type === 'url') {
    const result = validateAudioUrl(source.uri);
    
    // If metadata provider is specified, verify it matches detected provider
    if (result.valid && source.metadata?.provider && result.provider) {
      if (source.metadata.provider !== result.provider) {
        return {
          valid: false,
          error: `Provider mismatch: metadata specifies ${source.metadata.provider} but URL is from ${result.provider}`,
        };
      }
    }
    
    return result;
  } else if (source.type === 'local') {
    return validateLocalAudioFile(source.uri);
  } else {
    return {
      valid: false,
      error: `Invalid audio source type: ${source.type}. Must be 'local' or 'url'`,
    };
  }
}

/**
 * Validates an AudioSource and throws an error if invalid
 * Requirements: 1.5
 */
export function assertValidAudioSource(source: AudioSource): void {
  const result = validateAudioSource(source);
  if (!result.valid) {
    throw new AudioValidationError(result.error || 'Invalid audio source');
  }
}
