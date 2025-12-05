# MoodyBeats Project Structure

## Directory Organization

```
moodybeats/
├── app/                    # Expo Router screens and navigation
├── models/                 # TypeScript domain models and interfaces
│   ├── Mixtape.ts         # Mixtape, Track, AudioSource, TapeTheme, EnvelopeCustomization
│   ├── PlaybackState.ts   # PlaybackState, GlitchMode
│   ├── index.ts           # Central export for all models
│   └── __tests__/         # Unit tests for models
├── repositories/           # Data access layer interfaces
│   ├── MixtapeRepository.ts
│   ├── AudioRepository.ts
│   ├── ThemeRepository.ts
│   └── index.ts
├── services/              # Business logic services
├── components/            # React Native UI components
├── assets/               # Static assets (images, fonts, etc.)
└── node_modules/         # Dependencies
```

## Core Models

### Mixtape Models (`models/Mixtape.ts`)
- **AudioSource**: Represents audio file sources (local or URL-based)
- **Track**: Individual audio track with metadata
- **TapeTheme**: Visual theme customization for tape shell
- **EnvelopeCustomization**: Envelope appearance for sharing
- **Mixtape**: Complete mixtape with sides A & B, theme, and metadata

### Playback Models (`models/PlaybackState.ts`)
- **GlitchMode**: Spooky glitch effect configuration
- **PlaybackState**: Current playback state including position, side, overheat level

## Repository Interfaces

### MixtapeRepository
Handles persistence of mixtape data with CRUD operations.

### AudioRepository
Manages audio file storage and validation.

### ThemeRepository
Handles theme assets and preset themes.

## Testing

### Framework
- **Jest**: Test runner
- **React Native Testing Library**: Component testing
- **fast-check**: Property-based testing

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Test Organization
- Unit tests are located in `__tests__` directories next to the code they test
- Property-based tests will be tagged with format: `**Feature: moody-beats, Property {number}: {property_text}**`

## Requirements Coverage

This structure addresses the following requirements:
- **1.1**: Audio track management (AudioSource, Track models)
- **3.1**: Mixtape metadata (Mixtape model with unique ID)
- **4.1**: Tape shell customization (TapeTheme model)
- **5.1**: Envelope customization (EnvelopeCustomization model)
- **6.1, 6.2**: Playback controls (PlaybackState model)
- **7.1**: Reel animations (PlaybackState with position tracking)
- **9.1**: Overheat mechanic (PlaybackState with overheatLevel)
- **11.1**: Glitch mode (GlitchMode model)
- **14.1, 14.2, 15.1, 15.2**: Storage abstraction (Repository interfaces)

## Next Steps

1. Implement platform-agnostic storage adapters (Task 2)
2. Implement audio source validation (Task 3)
3. Build UI components (Tasks 4+)
4. Implement services (PlaybackEngine, ArchiveManager, etc.)
