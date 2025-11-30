# MoodyBeats Design Document

## Overview

MoodyBeats is a cross-platform React Native application built with Expo that recreates the nostalgic cassette mixtape experience with modern digital capabilities. The application features three primary modes: Maker (creation), Player (playback), and Sharing (export/import). The design emphasizes authentic tape deck simulation through synchronized animations, realistic audio effects, and deliberate interaction constraints that mirror physical cassette limitations.

The architecture follows a layered approach with clear separation between UI presentation, business logic, data persistence, and external services. The system is designed to work fully offline except for URL-based audio imports and online sharing features.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Maker      │  │   Player     │  │   Sharing    │      │
│  │   Screen     │  │   Screen     │  │   Screen     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Mixtape    │  │   Playback   │  │   Archive    │      │
│  │   Manager    │  │   Engine     │  │   Manager    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Animation  │  │   Audio FX   │  │   Glitch     │      │
│  │   Controller │  │   Manager    │  │   Controller │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Mixtape    │  │   Audio      │  │   Theme      │      │
│  │   Repository │  │   Repository │  │   Repository │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │  Platform Storage Adapter                       │        │
│  │  (Expo FileSystem / IndexedDB)                  │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      External Services                       │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │   Backend    │  │   Audio      │                         │
│  │   API Client │  │   Providers  │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **Animation**: React Native Reanimated 4.1
- **Audio**: Expo AV for playback and audio effects
- **Storage**: 
  - Mobile: Expo FileSystem
  - Web: IndexedDB via localforage
- **Archive Management**: JSZip for .mixblues file creation/extraction
- **State Management**: React Context API with useReducer
- **Gestures**: React Native Gesture Handler for drag-and-drop
- **Testing**: Jest with React Native Testing Library, fast-check for property-based testing

## Components and Interfaces

### Core Domain Models

#### Mixtape Model
```typescript
interface Mixtape {
  id: string;
  title: string;
  note?: string;
  sideA: Track[];
  sideB: Track[];
  theme: TapeTheme;
  envelope: EnvelopeCustomization;
  createdAt: Date;
  updatedAt: Date;
}

interface Track {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  source: AudioSource;
}

interface AudioSource {
  type: 'local' | 'url';
  uri: string;
  metadata?: {
    provider?: 'direct';
  };
}

interface TapeTheme {
  preset: 'vhs-static-grey' | 'pumpkin-orange' | 'ghostly-green';
  pattern?: string;
  texture?: string;
  overlay?: string;
}

interface EnvelopeCustomization {
  color: string;
  sigil?: string;
}
```

#### Playback State Model
```typescript
interface PlaybackState {
  mixtapeId: string;
  currentSide: 'A' | 'B';
  currentTrackIndex: number;
  position: number;
  duration: number;
  isPlaying: boolean;
  isFastForwarding: boolean;
  isRewinding: boolean;
  overheatLevel: number;
  isOverheated: boolean;
  glitchMode: GlitchMode | null;
}

interface GlitchMode {
  type: 'crt-scanline' | 'phosphor-green' | 'ui-shake' | 'tape-jitter';
  audioJumpscare?: string;
  startTime: number;
  duration: number;
}
```

### Repository Interfaces

#### MixtapeRepository
```typescript
interface MixtapeRepository {
  getAll(): Promise<Mixtape[]>;
  getById(id: string): Promise<Mixtape | null>;
  save(mixtape: Mixtape): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}
```

#### AudioRepository
```typescript
interface AudioRepository {
  saveAudioFile(trackId: string, uri: string): Promise<string>;
  getAudioFile(trackId: string): Promise<string | null>;
  deleteAudioFile(trackId: string): Promise<void>;
  validateAudioSource(source: AudioSource): Promise<boolean>;
}
```

#### ThemeRepository
```typescript
interface ThemeRepository {
  getPresetTheme(preset: string): TapeTheme;
  saveCustomAsset(assetId: string, data: Blob): Promise<string>;
  getCustomAsset(assetId: string): Promise<Blob | null>;
}
```

### Service Interfaces

#### PlaybackEngine
```typescript
interface PlaybackEngine {
  load(mixtape: Mixtape): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  fastForward(): void;
  rewind(): void;
  flipSide(): Promise<void>;
  seekTo(position: number): void;
  getCurrentState(): PlaybackState;
  onStateChange(callback: (state: PlaybackState) => void): () => void;
}
```

#### ArchiveManager
```typescript
interface ArchiveManager {
  createArchive(mixtape: Mixtape): Promise<Blob>;
  extractArchive(archiveBlob: Blob): Promise<MixtapeArchiveData>;
  validateArchive(archiveBlob: Blob): Promise<boolean>;
}

interface MixtapeArchiveData {
  metadata: MixtapeMetadata;
  audioFiles: Map<string, Blob>;
  themeAssets: Map<string, Blob>;
}

interface MixtapeMetadata {
  version: string;
  mixtape: Omit<Mixtape, 'createdAt' | 'updatedAt'>;
}
```

#### BackendClient
```typescript
interface BackendClient {
  uploadArchive(archive: Blob): Promise<UploadResponse>;
  downloadArchive(id: string): Promise<Blob>;
}

interface UploadResponse {
  id: string;
  url: string;
}
```

### UI Components

#### TapeDeck Component
```typescript
interface TapeDeckProps {
  theme: TapeTheme;
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onFastForward: () => void;
  onRewind: () => void;
  onFlipSide: () => void;
}
```

The TapeDeck component renders the visual cassette player interface with:
- Animated spinning reels synchronized to playback position
- Tape ribbon stretching animation
- Control buttons (play, pause, FF, REW, flip)
- Overheat meter visualization
- Glitch effect overlays

#### ReelAnimation Component
```typescript
interface ReelAnimationProps {
  position: number;
  duration: number;
  isPlaying: boolean;
  speed: number;
  side: 'A' | 'B';
}
```

Uses React Native Reanimated for smooth 60fps animations:
- Left reel rotation (source)
- Right reel rotation (destination)
- Tape ribbon path calculation
- Speed multipliers for FF/REW

#### EnvelopeIntro Component
```typescript
interface EnvelopeIntroProps {
  envelope: EnvelopeCustomization;
  note?: string;
  onComplete: () => void;
}
```

Animated sequence component that displays:
1. Envelope with custom color and sigil
2. Mist animation overlay
3. Tape sliding out animation
4. Note fade-in

#### TrackList Component (Maker Mode Only)
```typescript
interface TrackListProps {
  tracks: Track[];
  side: 'A' | 'B';
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (trackId: string) => void;
}
```

Drag-and-drop enabled list using React Native Gesture Handler.

## Data Models

### Storage Schema

#### Mixtape Storage (JSON)
```json
{
  "id": "uuid-v4",
  "title": "Summer Vibes",
  "note": "For the road trip",
  "sideA": [
    {
      "id": "track-1",
      "title": "Song Name",
      "artist": "Artist Name",
      "duration": 180,
      "source": {
        "type": "local",
        "uri": "file://path/to/audio.mp3"
      }
    }
  ],
  "sideB": [],
  "theme": {
    "preset": "pumpkin-orange",
    "pattern": "retro-lines",
    "texture": "crt-scan",
    "overlay": "vhs-static"
  },
  "envelope": {
    "color": "#FFE4B5",
    "sigil": "moon-stars"
  },
  "createdAt": "2025-11-27T00:00:00.000Z",
  "updatedAt": "2025-11-27T00:00:00.000Z"
}
```

#### Archive Format (.mixblues)
```
mixtape.mixblues (ZIP archive)
├── metadata.json
├── audio/
│   ├── track-1.mp3
│   ├── track-2.mp3
│   └── ...
└── assets/
    ├── patterns/
    ├── textures/
    └── overlays/
```

### Platform Storage Implementation

#### Mobile (iOS/Android)
- Base directory: `${FileSystem.documentDirectory}moodybeats/`
- Mixtapes: `mixtapes/{id}.json`
- Audio files: `audio/{trackId}.{ext}`
- Theme assets: `themes/{assetId}.{ext}`

#### Web
- IndexedDB database: `moodybeats`
- Object stores:
  - `mixtapes`: Mixtape objects
  - `audio`: Audio file blobs
  - `themes`: Theme asset blobs

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Valid audio files are accepted
*For any* valid local audio file, when uploaded, the system should add it to the track pool with correct metadata.
**Validates: Requirements 1.1**

### Property 2: URL validation for direct audio files
*For any* direct audio file URL (MP3, AAC, WAV, M4A), valid URLs should be accepted and invalid URLs should be rejected.
**Validates: Requirements 1.2**

### Property 3: Track visibility mode consistency
*For any* track, it should be visible with metadata in creation mode and hidden in playback mode.
**Validates: Requirements 1.3, 1.4**

### Property 4: Invalid audio source rejection
*For any* invalid audio source, the system should reject it and display an error message.
**Validates: Requirements 1.5**

### Property 5: Drag-and-drop placement
*For any* track dragged from the track pool, it should be placeable into either Side A or Side B.
**Validates: Requirements 2.2**

### Property 6: Playlist reordering preserves intent
*For any* playlist and any valid drag-and-drop operation, the resulting order should match the drop position.
**Validates: Requirements 2.3**

### Property 7: Track removal preserves order
*For any* playlist and any track removal, the relative order of remaining tracks should be preserved.
**Validates: Requirements 2.4**

### Property 8: Playlist modification persistence
*For any* playlist modification, the changes should be immediately persisted and retrievable from local storage.
**Validates: Requirements 2.5**

### Property 9: Unique mixtape identifiers
*For any* number of mixtapes created, all generated IDs should be unique.
**Validates: Requirements 3.1**

### Property 10: Mixtape metadata round-trip
*For any* mixtape with title, note, and metadata, saving and retrieving by ID should return identical data.
**Validates: Requirements 3.2, 3.4**

### Property 11: Library displays all titles
*For any* set of saved mixtapes, the library view should display all their titles.
**Validates: Requirements 3.5**

### Property 12: Theme application consistency
*For any* preset theme selected, the tape shell should render with that theme's corresponding colors and properties.
**Validates: Requirements 4.2**

### Property 13: Visual customization rendering
*For any* combination of patterns, textures, and overlays, the tape shell should render with all selected customizations applied.
**Validates: Requirements 4.4**

### Property 14: Theme data persistence
*For any* mixtape with theme customizations, saving and retrieving should preserve all theme data.
**Validates: Requirements 4.5**

### Property 15: Envelope customization preview
*For any* envelope color and sigil selection, the preview should immediately reflect those customizations.
**Validates: Requirements 5.4**

### Property 16: Envelope data in archive
*For any* exported mixtape, the archive metadata should contain the envelope color and sigil data.
**Validates: Requirements 5.5**

### Property 17: Play/pause state transitions
*For any* mixtape, pressing play should start audio and reel animations, and pressing pause should stop both.
**Validates: Requirements 6.1, 6.2**

### Property 18: Fast forward and rewind speed modification
*For any* playback state, activating FF should increase audio and animation speed, and activating REW should reverse both.
**Validates: Requirements 6.3, 6.4**

### Property 19: Side flip transitions
*For any* current side, pressing flip should execute the stop-eject-switch-restart sequence and begin playing the opposite side.
**Validates: Requirements 6.5**

### Property 20: Reel synchronization with playback
*For any* playback position, both reel rotation speeds should be proportional to the current position.
**Validates: Requirements 7.1**

### Property 21: Tape ribbon animation continuity
*For any* playback progression, the tape ribbon should continuously animate between the reels.
**Validates: Requirements 7.2**

### Property 22: Side flip animation sequence
*For any* flip action, the system should execute reel stop, tape eject animation, side switch, and reel restart in that order.
**Validates: Requirements 7.3**

### Property 23: Speed-proportional reel rotation
*For any* FF or REW action, reel rotation speed should increase proportionally to the playback speed multiplier.
**Validates: Requirements 7.4**

### Property 24: End-of-side behavior
*For any* side that reaches its end, reel animations should stop and the flip tape prompt should appear.
**Validates: Requirements 7.5**

### Property 25: Track skip threshold behavior
*For any* track, fast forwarding past FF_THRESHOLD_PERCENT should skip to the next track, while staying below the threshold should continue the current track.
**Validates: Requirements 8.1, 8.2**

### Property 26: Backward track skip
*For any* track, rewinding past the beginning should skip to the previous track.
**Validates: Requirements 8.4**

### Property 27: Overheat meter accumulation
*For any* sequence of FF or REW actions, the overheat meter should increment with each action.
**Validates: Requirements 9.1**

### Property 28: Overheat threshold enforcement
*For any* playback state, when the overheat meter reaches maximum, FF and REW controls should be disabled.
**Validates: Requirements 9.2**

### Property 29: Overheat visual feedback
*For any* overheated state, the system should display glowing red reels and a cooldown animation.
**Validates: Requirements 9.3**

### Property 30: Cooldown recovery
*For any* overheated state, after the cooldown period completes, the meter should reset and controls should re-enable.
**Validates: Requirements 9.4**

### Property 31: Overheat meter decay
*For any* non-maximum overheat meter value, the value should gradually decrease over time when not actively FF/REW.
**Validates: Requirements 9.5**

### Property 32: Control audio feedback
*For any* play or pause action, a click or clunk sound effect should play.
**Validates: Requirements 10.1**

### Property 33: Pitch shift effects
*For any* FF action, audio pitch should increase, and for any REW action, audio pitch should decrease.
**Validates: Requirements 10.2, 10.3**

### Property 34: Flip audio feedback
*For any* tape flip action, mechanical tape deck sound effects should play.
**Validates: Requirements 10.4**

### Property 35: Glitch trigger conditions
*For any* rapid button sequence, repeated FF/REW pattern, or extreme overheat level, a glitch mode effect should trigger.
**Validates: Requirements 11.1, 11.2, 11.3**

### Property 36: Glitch visual effects
*For any* glitch activation, at least one visual effect (CRT scanlines, phosphor green, UI shake, or tape jitter) should be applied.
**Validates: Requirements 11.4**

### Property 37: Glitch audio jumpscare
*For any* glitch activation, one random audio jumpscare from the predefined set should play.
**Validates: Requirements 11.5**

### Property 38: Archive creation format
*For any* mixtape export, the system should produce a valid .mixblues archive in ZIP format.
**Validates: Requirements 12.1, 18.1**

### Property 39: Archive metadata completeness
*For any* created archive, the metadata.json should contain all required fields: sides, track URLs, theme data, envelope customization, title, and note.
**Validates: Requirements 12.2**

### Property 40: Archive asset completeness
*For any* mixtape with audio files and theme assets, all referenced files should be included in the archive.
**Validates: Requirements 12.3**

### Property 41: Backend upload response
*For any* archive uploaded to the backend, the response should contain a unique ID and a URL in the format https://share.moodybeats.sanyamchhabra.in/t/{id}.
**Validates: Requirements 12.5, 13.1**

### Property 42: Shareable URL download
*For any* valid shareable URL accessed, the system should download the mixtape archive from the backend.
**Validates: Requirements 13.2**

### Property 43: Envelope intro animation
*For any* shareable URL accessed, the system should display an animated envelope intro with the customized colors and sigil.
**Validates: Requirements 13.3**

### Property 44: Intro animation sequence
*For any* envelope animation completion, the system should show mist animation followed by tape sliding out, then fade in the note.
**Validates: Requirements 13.4, 13.5**

### Property 45: Local archive import
*For any* valid local archive file selected, the system should read and process the file from device storage.
**Validates: Requirements 14.2**

### Property 46: Archive validation
*For any* archive downloaded or selected, the system should validate the metadata.json structure and contents.
**Validates: Requirements 14.3**

### Property 47: Import success handling
*For any* valid archive, the system should extract all files and add the mixtape to the local library.
**Validates: Requirements 14.4**

### Property 48: Import error handling
*For any* invalid archive, the system should display an error message and reject the import.
**Validates: Requirements 14.5**

### Property 49: Mixtape persistence round-trip
*For any* mixtape saved with all metadata, theme data, and audio file references, retrieving it should return identical data.
**Validates: Requirements 15.3**

### Property 50: Application initialization
*For any* application launch, all previously stored mixtapes should be loaded from the repository.
**Validates: Requirements 15.4**

### Property 51: Mixtape deletion completeness
*For any* mixtape deleted, all associated data should be removed and the mixtape should not be retrievable.
**Validates: Requirements 15.5**

### Property 52: Offline creation capability
*For any* device without internet connection, mixtape creation using locally stored audio files should function normally.
**Validates: Requirements 16.1**

### Property 53: Offline playback capability
*For any* device without internet connection, playback of all locally stored mixtapes should function normally.
**Validates: Requirements 16.2**

### Property 54: Offline export capability
*For any* device without internet connection, export of mixtape archives to local storage should function normally.
**Validates: Requirements 16.3**

### Property 55: Offline import capability
*For any* device without internet connection, import of mixtape archives from local storage should function normally.
**Validates: Requirements 16.4**

### Property 56: Offline feature availability
*For any* device without internet connection, only URL-based audio import and online sharing features should be disabled, all other features should remain available.
**Validates: Requirements 16.5**

### Property 57: Backend archive serving
*For any* valid archive ID, a GET request to /t/{id} should serve the corresponding archive with appropriate headers.
**Validates: Requirements 17.2**

### Property 58: Backend file size enforcement
*For any* archive upload exceeding the file size limit, the backend should reject the upload.
**Validates: Requirements 17.3**

### Property 59: Backend CORS configuration
*For any* cross-origin request from mobile applications, the backend should allow the request through CORS headers.
**Validates: Requirements 17.4**

### Property 60: Backend anonymous upload support
*For any* archive upload, the backend should accept it without requiring user authentication.
**Validates: Requirements 17.5**

### Property 61: Cross-platform visual consistency
*For any* platform (iOS, Android, Web), the tape deck visual components should render identically.
**Validates: Requirements 19.1**

### Property 62: Cross-platform behavior consistency
*For any* platform (iOS, Android, Web), playback controls and behavior should function identically.
**Validates: Requirements 19.2**

### Property 63: Cross-platform animation consistency
*For any* platform (iOS, Android, Web), reel animations and visual effects should execute identically.
**Validates: Requirements 19.3**

### Property 64: Cross-platform theme consistency
*For any* platform (iOS, Android, Web), theme rendering and customization options should be consistent.
**Validates: Requirements 19.4**

### Property 65: Responsive layout adaptation
*For any* screen size, the layout should adapt responsively while preserving visual design integrity.
**Validates: Requirements 19.5**

## Error Handling

### Error Categories

#### 1. Audio Source Errors
- **Invalid File Format**: Display user-friendly error when unsupported audio format is uploaded
- **URL Validation Failure**: Show specific error when direct audio URL is malformed or unsupported
- **Network Timeout**: Retry mechanism with exponential backoff for URL-based audio loading
- **Audio Loading Failure**: Graceful degradation - skip track and continue playback

#### 2. Storage Errors
- **Quota Exceeded**: Alert user when device storage is full, offer to delete old mixtapes
- **Permission Denied**: Request appropriate permissions with clear explanation
- **Corruption Detection**: Validate data integrity on read, offer recovery or deletion options
- **Write Failure**: Retry with exponential backoff, fallback to in-memory state

#### 3. Archive Errors
- **Invalid Archive Format**: Detect non-ZIP or corrupted files, display clear error message
- **Missing Metadata**: Reject archives without valid metadata.json
- **Schema Mismatch**: Handle version differences gracefully, migrate old formats if possible
- **Incomplete Assets**: Warn user about missing audio files or theme assets, allow partial import

#### 4. Network Errors
- **Backend Unavailable**: Queue uploads for retry when connection restored
- **Upload Failure**: Provide option to save archive locally as fallback
- **Download Failure**: Cache partial downloads, resume on retry
- **CORS Issues**: Detect and log CORS errors for debugging

#### 5. Playback Errors
- **Audio Decode Error**: Skip problematic track, log error for debugging
- **Buffer Underrun**: Pause playback, show loading indicator, resume when buffered
- **Seek Failure**: Reset to last known good position
- **Side Flip Failure**: Retry flip operation, fallback to manual side selection

### Error Recovery Strategies

#### Automatic Recovery
- Retry transient network errors with exponential backoff (max 3 attempts)
- Auto-save state every 5 seconds to prevent data loss
- Gracefully skip corrupted tracks during playback
- Migrate old data formats automatically on app update

#### User-Initiated Recovery
- "Retry" button for failed operations
- "Save Locally" fallback for failed uploads
- "Report Issue" option that captures error logs
- "Reset" option to clear corrupted state

#### Error Logging
- Log all errors to local storage with timestamps
- Include error context (user action, app state, device info)
- Provide export function for debugging
- Respect user privacy - no automatic error reporting

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples, edge cases, and integration points:

**Component Tests:**
- TapeDeck renders correctly with different themes
- ReelAnimation calculates correct rotation angles
- EnvelopeIntro plays animation sequence in order
- TrackList handles empty state

**Service Tests:**
- PlaybackEngine loads mixtape correctly
- ArchiveManager creates valid ZIP files
- BackendClient handles network errors
- AudioRepository validates file formats

**Repository Tests:**
- MixtapeRepository CRUD operations
- Platform-specific storage adapters (FileSystem vs IndexedDB)
- Data migration between schema versions

**Edge Cases:**
- Empty mixtapes (no tracks on either side)
- Single-track mixtapes
- Very long mixtapes (100+ tracks)
- Mixtapes with missing audio files
- Corrupted archive files
- Network disconnection during upload

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library:

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with format: `**Feature: moody-beats, Property {number}: {property_text}**`
- One property-based test per correctness property
- Tests should use smart generators that constrain to valid input space

**Generator Strategy:**
- `arbitraryMixtape()`: Generates valid mixtapes with 0-50 tracks per side
- `arbitraryTrack()`: Generates tracks with valid durations (1-600 seconds)
- `arbitraryTheme()`: Generates valid theme combinations
- `arbitraryPlaybackState()`: Generates valid playback states
- `arbitraryArchive()`: Generates valid .mixblues archives
- `arbitraryInvalidAudioSource()`: Generates various invalid audio sources
- `arbitraryButtonSequence()`: Generates rapid button press patterns

**Property Test Examples:**

```typescript
// Property 9: Unique mixtape identifiers
test('Property 9: All generated mixtape IDs are unique', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 1000 }),
      (count) => {
        const ids = Array.from({ length: count }, () => 
          generateMixtapeId()
        );
        const uniqueIds = new Set(ids);
        return ids.length === uniqueIds.size;
      }
    ),
    { numRuns: 100 }
  );
});

// Property 25: Track skip threshold behavior
test('Property 25: FF past threshold skips, below threshold continues', () => {
  fc.assert(
    fc.property(
      arbitraryMixtape(),
      fc.integer({ min: 0, max: 100 }),
      (mixtape, ffPercent) => {
        const engine = new PlaybackEngine();
        engine.load(mixtape);
        engine.play();
        
        const initialTrack = engine.getCurrentState().currentTrackIndex;
        engine.fastForwardToPercent(ffPercent);
        const finalTrack = engine.getCurrentState().currentTrackIndex;
        
        if (ffPercent > FF_THRESHOLD_PERCENT) {
          return finalTrack === initialTrack + 1;
        } else {
          return finalTrack === initialTrack;
        }
      }
    ),
    { numRuns: 100 }
  );
});

// Property 49: Mixtape persistence round-trip
test('Property 49: Save then load returns identical mixtape', () => {
  fc.assert(
    fc.property(
      arbitraryMixtape(),
      async (mixtape) => {
        const repo = new MixtapeRepository();
        await repo.save(mixtape);
        const loaded = await repo.getById(mixtape.id);
        return deepEqual(mixtape, loaded);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify end-to-end workflows:

- Create mixtape → Save → Load → Play
- Export mixtape → Upload → Download → Import
- Offline mode → Create → Export locally → Import
- Glitch trigger → Visual effects → Audio jumpscare
- Overheat → Cooldown → Recovery

### Manual Testing Checklist

- [ ] Test on iOS physical device
- [ ] Test on Android physical device
- [ ] Test on web browser (Chrome, Safari, Firefox)
- [ ] Test with various audio formats (MP3, AAC, WAV)
- [ ] Test with slow network connection
- [ ] Test with no network connection
- [ ] Test with device storage nearly full
- [ ] Test animations at 60fps
- [ ] Test accessibility (screen readers, keyboard navigation)
- [ ] Test with very long mixtapes (50+ tracks)

## Implementation Notes

### Performance Considerations

**Animation Performance:**
- Use React Native Reanimated's worklet threads for 60fps animations
- Minimize re-renders by using `useMemo` and `useCallback`
- Use `InteractionManager` to defer non-critical updates
- Implement virtualized lists for large track collections

**Audio Performance:**
- Preload next track during playback to prevent gaps
- Use audio buffering to handle network latency
- Implement audio ducking for sound effects
- Cache decoded audio in memory for instant replay

**Storage Performance:**
- Batch write operations to reduce I/O
- Use compression for theme assets
- Implement lazy loading for mixtape library
- Index mixtapes by ID for O(1) lookup

### Security Considerations

**Input Validation:**
- Sanitize all user input (titles, notes)
- Validate audio file types and sizes
- Verify archive integrity before extraction
- Prevent path traversal in archive extraction

**Network Security:**
- Use HTTPS for all backend communication
- Implement request rate limiting
- Validate backend responses
- Handle CORS properly for web platform

**Data Privacy:**
- Store all data locally by default
- No telemetry or analytics without consent
- Clear user data on app uninstall
- Encrypt sensitive data if needed

### Accessibility

**Screen Reader Support:**
- Label all interactive elements
- Provide audio descriptions for animations
- Announce playback state changes
- Support keyboard navigation on web

**Visual Accessibility:**
- Maintain WCAG AA contrast ratios
- Support system font scaling
- Provide alternative text for visual effects
- Offer reduced motion mode

**Motor Accessibility:**
- Large touch targets (minimum 44x44 points)
- Adjustable overheat threshold
- Alternative to drag-and-drop (long-press menu)
- Keyboard shortcuts on web

### Platform-Specific Considerations

**iOS:**
- Handle audio session interruptions (calls, alarms)
- Support background audio playback
- Implement audio route changes (headphones)
- Use haptic feedback for interactions

**Android:**
- Handle audio focus changes
- Support media session controls
- Implement notification controls for playback
- Handle back button navigation

**Web:**
- Implement service worker for offline support
- Use Web Audio API for audio effects
- Handle browser audio autoplay policies
- Support keyboard shortcuts

### Future Enhancements

**Phase 2 Features:**
- Collaborative mixtapes (multiple creators)
- Social features (like, comment, share)
- Mixtape discovery feed
- User profiles and collections

**Phase 3 Features:**
- AI-powered track recommendations
- Auto-generated mixtapes from mood/genre
- Advanced audio effects (equalizer, reverb)
- Custom sigil designer

**Technical Debt:**
- Migrate to TypeScript strict mode
- Implement comprehensive error boundaries
- Add performance monitoring
- Set up automated visual regression testing
