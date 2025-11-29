/**
 * Tests for audio validation utilities
 * Requirements: 1.1, 1.2, 1.5
 */

import { AudioSource } from '../../../models';
import {
    AudioValidationError,
    SUPPORTED_AUDIO_FORMATS,
    assertValidAudioSource,
    detectUrlProvider,
    getFileExtension,
    isValidAudioFormat,
    validateAudioSource,
    validateAudioUrl,
    validateLocalAudioFile,
} from '../audioValidation';

describe('Audio Validation Utilities', () => {
  describe('isValidAudioFormat', () => {
    it('should accept valid audio formats', () => {
      expect(isValidAudioFormat('song.mp3')).toBe(true);
      expect(isValidAudioFormat('track.aac')).toBe(true);
      expect(isValidAudioFormat('audio.wav')).toBe(true);
      expect(isValidAudioFormat('music.m4a')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(isValidAudioFormat('SONG.MP3')).toBe(true);
      expect(isValidAudioFormat('Track.AAC')).toBe(true);
      expect(isValidAudioFormat('Audio.WaV')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidAudioFormat('video.mp4')).toBe(false);
      expect(isValidAudioFormat('document.pdf')).toBe(false);
      expect(isValidAudioFormat('image.jpg')).toBe(false);
      expect(isValidAudioFormat('noextension')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions correctly', () => {
      expect(getFileExtension('file.mp3')).toBe('.mp3');
      expect(getFileExtension('path/to/file.aac')).toBe('.aac');
      expect(getFileExtension('file.name.with.dots.wav')).toBe('.wav');
    });

    it('should handle URLs with query parameters', () => {
      expect(getFileExtension('https://example.com/file.mp3?token=abc')).toBe('.mp3');
      expect(getFileExtension('https://example.com/file.aac#fragment')).toBe('.aac');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('noextension')).toBe('');
      expect(getFileExtension('path/to/file')).toBe('');
    });
  });

  describe('detectUrlProvider', () => {
    it('should detect Spotify URLs', () => {
      expect(detectUrlProvider('https://open.spotify.com/track/123')).toBe('spotify');
      expect(detectUrlProvider('https://spotify.com/track/456')).toBe('spotify');
      expect(detectUrlProvider('spotify:track:789')).toBe('spotify');
      expect(detectUrlProvider('https://open.spotify.com/playlist/abc')).toBe('spotify');
    });

    it('should detect YouTube URLs', () => {
      expect(detectUrlProvider('https://www.youtube.com/watch?v=abc123')).toBe('youtube');
      expect(detectUrlProvider('https://youtu.be/xyz789')).toBe('youtube');
      expect(detectUrlProvider('https://youtube.com/watch?v=test')).toBe('youtube');
      expect(detectUrlProvider('https://www.youtube.com/embed/video123')).toBe('youtube');
    });

    it('should detect SoundCloud URLs', () => {
      expect(detectUrlProvider('https://soundcloud.com/artist/track')).toBe('soundcloud');
      expect(detectUrlProvider('https://www.soundcloud.com/user/song')).toBe('soundcloud');
    });

    it('should detect direct audio file URLs', () => {
      expect(detectUrlProvider('https://example.com/audio.mp3')).toBe('direct');
      expect(detectUrlProvider('https://cdn.example.com/file.aac')).toBe('direct');
      expect(detectUrlProvider('https://example.com/music.wav?token=123')).toBe('direct');
      expect(detectUrlProvider('https://example.com/song.m4a')).toBe('direct');
    });

    it('should return null for unsupported URLs', () => {
      expect(detectUrlProvider('https://example.com/video.mp4')).toBeNull();
      expect(detectUrlProvider('https://unsupported.com/audio')).toBeNull();
    });
  });

  describe('validateAudioUrl', () => {
    it('should validate Spotify URLs', () => {
      const result = validateAudioUrl('https://open.spotify.com/track/123');
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('spotify');
    });

    it('should validate YouTube URLs', () => {
      const result = validateAudioUrl('https://www.youtube.com/watch?v=abc');
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('youtube');
    });

    it('should validate SoundCloud URLs', () => {
      const result = validateAudioUrl('https://soundcloud.com/artist/track');
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('soundcloud');
    });

    it('should validate direct MP3 URLs', () => {
      const result = validateAudioUrl('https://example.com/audio.mp3');
      expect(result.valid).toBe(true);
      expect(result.provider).toBe('direct');
    });

    it('should reject invalid URL format', () => {
      const result = validateAudioUrl('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should reject unsupported providers', () => {
      const result = validateAudioUrl('https://unsupported.com/audio');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported audio provider');
    });
  });

  describe('validateLocalAudioFile', () => {
    it('should validate files with supported extensions', () => {
      expect(validateLocalAudioFile('file.mp3').valid).toBe(true);
      expect(validateLocalAudioFile('path/to/file.aac').valid).toBe(true);
      expect(validateLocalAudioFile('audio.wav').valid).toBe(true);
      expect(validateLocalAudioFile('music.m4a').valid).toBe(true);
    });

    it('should reject files with unsupported extensions', () => {
      const result = validateLocalAudioFile('video.mp4');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported audio format');
    });

    it('should reject files without extensions', () => {
      const result = validateLocalAudioFile('noextension');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported audio format');
    });
  });

  describe('validateAudioSource', () => {
    it('should validate URL-based audio sources', () => {
      const source: AudioSource = {
        type: 'url',
        uri: 'https://open.spotify.com/track/123',
        metadata: { provider: 'spotify' },
      };
      const result = validateAudioSource(source);
      expect(result.valid).toBe(true);
    });

    it('should validate local audio sources', () => {
      const source: AudioSource = {
        type: 'local',
        uri: 'file:///path/to/audio.mp3',
      };
      const result = validateAudioSource(source);
      expect(result.valid).toBe(true);
    });

    it('should reject sources with missing type', () => {
      const source = {
        uri: 'https://example.com/audio.mp3',
      } as any;
      const result = validateAudioSource(source);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing type or uri');
    });

    it('should reject sources with missing uri', () => {
      const source = {
        type: 'local',
      } as any;
      const result = validateAudioSource(source);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing type or uri');
    });

    it('should reject sources with invalid type', () => {
      const source = {
        type: 'invalid',
        uri: 'some-uri',
      } as any;
      const result = validateAudioSource(source);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid audio source type');
    });

    it('should detect provider mismatch', () => {
      const source: AudioSource = {
        type: 'url',
        uri: 'https://open.spotify.com/track/123',
        metadata: { provider: 'youtube' }, // Wrong provider
      };
      const result = validateAudioSource(source);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Provider mismatch');
    });

    it('should accept sources without metadata provider', () => {
      const source: AudioSource = {
        type: 'url',
        uri: 'https://open.spotify.com/track/123',
      };
      const result = validateAudioSource(source);
      expect(result.valid).toBe(true);
    });
  });

  describe('assertValidAudioSource', () => {
    it('should not throw for valid audio sources', () => {
      const source: AudioSource = {
        type: 'url',
        uri: 'https://open.spotify.com/track/123',
      };
      expect(() => assertValidAudioSource(source)).not.toThrow();
    });

    it('should throw AudioValidationError for invalid sources', () => {
      const source: AudioSource = {
        type: 'local',
        uri: 'invalid.mp4',
      };
      expect(() => assertValidAudioSource(source)).toThrow(AudioValidationError);
    });

    it('should include error message in thrown error', () => {
      const source: AudioSource = {
        type: 'local',
        uri: 'invalid.mp4',
      };
      expect(() => assertValidAudioSource(source)).toThrow('Unsupported audio format');
    });
  });

  describe('SUPPORTED_AUDIO_FORMATS constant', () => {
    it('should contain expected formats', () => {
      expect(SUPPORTED_AUDIO_FORMATS).toContain('.mp3');
      expect(SUPPORTED_AUDIO_FORMATS).toContain('.aac');
      expect(SUPPORTED_AUDIO_FORMATS).toContain('.wav');
      expect(SUPPORTED_AUDIO_FORMATS).toContain('.m4a');
    });

    it('should have exactly 4 formats', () => {
      expect(SUPPORTED_AUDIO_FORMATS).toHaveLength(4);
    });
  });
});
