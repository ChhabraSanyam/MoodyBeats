# Repository Utilities

This directory contains utility functions for the MoodyBeats repository layer.

## Audio Validation

The audio validation module provides comprehensive validation for audio sources used in MoodyBeats.

### Supported Audio Formats

- MP3 (`.mp3`)
- AAC (`.aac`)
- WAV (`.wav`)
- M4A (`.m4a`)

### Supported URL Providers

- **Spotify**: Track, playlist, and album URLs
- **YouTube**: Watch, short, and embed URLs
- **SoundCloud**: Track and playlist URLs
- **Direct**: Direct links to audio files (MP3, AAC, WAV, M4A)

### Usage Examples

#### Validating an Audio Source

```typescript
import { validateAudioSource, AudioValidationError } from './repositories';
import { AudioSource } from './models';

// Validate a Spotify URL
const spotifySource: AudioSource = {
  type: 'url',
  uri: 'https://open.spotify.com/track/123',
  metadata: { provider: 'spotify' }
};

const result = validateAudioSource(spotifySource);
if (result.valid) {
  console.log('Valid audio source!');
} else {
  console.error('Invalid:', result.error);
}

// Validate a local file
const localSource: AudioSource = {
  type: 'local',
  uri: 'file:///path/to/audio.mp3'
};

const localResult = validateAudioSource(localSource);
```

#### Using Assert for Validation

```typescript
import { assertValidAudioSource, AudioValidationError } from './repositories';

try {
  assertValidAudioSource(audioSource);
  // Proceed with valid audio source
} catch (error) {
  if (error instanceof AudioValidationError) {
    console.error('Validation failed:', error.message);
  }
}
```

#### Checking File Formats

```typescript
import { isValidAudioFormat, SUPPORTED_AUDIO_FORMATS } from './repositories';

if (isValidAudioFormat('song.mp3')) {
  console.log('Valid audio format');
}

console.log('Supported formats:', SUPPORTED_AUDIO_FORMATS);
// Output: ['.mp3', '.aac', '.wav', '.m4a']
```

#### Detecting URL Providers

```typescript
import { detectUrlProvider, validateAudioUrl } from './repositories';

const provider = detectUrlProvider('https://www.youtube.com/watch?v=abc123');
console.log(provider); // 'youtube'

const urlResult = validateAudioUrl('https://open.spotify.com/track/123');
console.log(urlResult.valid); // true
console.log(urlResult.provider); // 'spotify'
```

### Error Handling

The validation functions return detailed error messages to help users understand what went wrong:

```typescript
const result = validateAudioSource({
  type: 'local',
  uri: 'video.mp4'
});

console.log(result.error);
// "Unsupported audio format: .mp4. Supported formats: .mp3, .aac, .wav, .m4a"
```

### Integration with AudioRepository

The `AudioRepository` implementations automatically use these validation utilities:

```typescript
import { createAudioRepository } from './repositories';

const audioRepo = createAudioRepository();

// This will validate the source before saving
const isValid = await audioRepo.validateAudioSource(audioSource);
if (isValid) {
  const savedUri = await audioRepo.saveAudioFile(trackId, uri);
}
```

## Platform Detection

Utilities for detecting the current platform (iOS, Android, or Web):

```typescript
import { detectPlatform, isMobilePlatform, isWebPlatform } from './repositories';

const platform = detectPlatform(); // 'ios' | 'android' | 'web'

if (isMobilePlatform()) {
  // Use FileSystem storage
} else if (isWebPlatform()) {
  // Use IndexedDB storage
}
```
