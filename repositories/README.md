# MoodyBeats Storage Layer

This directory contains the platform-agnostic storage abstraction layer for MoodyBeats.

## Architecture

The storage layer provides three repository interfaces:
- `MixtapeRepository` - For storing and retrieving mixtape metadata
- `AudioRepository` - For managing audio files
- `ThemeRepository` - For managing theme assets

## Platform Support

The storage layer automatically detects the platform and uses the appropriate adapter:

- **Mobile (iOS/Android)**: Uses Expo FileSystem API
- **Web**: Uses IndexedDB via localforage

## Usage

### Basic Usage

```typescript
import {
  createMixtapeRepository,
  createAudioRepository,
  createThemeRepository,
} from './repositories';

// Create repository instances
const mixtapeRepo = createMixtapeRepository();
const audioRepo = createAudioRepository();
const themeRepo = createThemeRepository();

// Save a mixtape
await mixtapeRepo.save(myMixtape);

// Retrieve all mixtapes
const allMixtapes = await mixtapeRepo.getAll();

// Get a specific mixtape
const mixtape = await mixtapeRepo.getById('mixtape-id');

// Delete a mixtape
await mixtapeRepo.delete('mixtape-id');
```

### Audio Management

```typescript
// Save an audio file
const storedUri = await audioRepo.saveAudioFile('track-id', 'file:///path/to/audio.mp3');

// Retrieve an audio file
const audioUri = await audioRepo.getAudioFile('track-id');

// Validate an audio source
const isValid = await audioRepo.validateAudioSource({
  type: 'local',
  uri: 'file:///path/to/audio.mp3',
});

// Delete an audio file
await audioRepo.deleteAudioFile('track-id');
```

### Theme Management

```typescript
// Get a preset theme
const theme = themeRepo.getPresetTheme('vhs-static-grey');

// Save a custom asset
const assetUri = await themeRepo.saveCustomAsset('asset-id', blobData);

// Retrieve a custom asset
const assetBlob = await themeRepo.getCustomAsset('asset-id');
```

## Storage Locations

### Mobile (iOS/Android)
- Base: `${Paths.document}/moodybeats/`
- Mixtapes: `${Paths.document}/moodybeats/mixtapes/`
- Audio: `${Paths.document}/moodybeats/audio/`
- Themes: `${Paths.document}/moodybeats/themes/`

### Web
- Database: `moodybeats` (IndexedDB)
- Object Stores:
  - `mixtapes` - Mixtape metadata
  - `audio` - Audio file blobs
  - `themes` - Theme asset blobs

## Requirements Satisfied

- **14.1, 14.2**: Platform detection and abstraction
- **15.1**: Mobile storage using Expo FileSystem
- **15.2**: Web storage using IndexedDB
- **15.3**: Mixtape persistence with JSON serialization
- **15.4**: Application initialization with stored data
- **15.5**: Complete data deletion
