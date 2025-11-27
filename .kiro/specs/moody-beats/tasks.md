# Implementation Plan

- [ ] 1. Set up project structure and core data models
  - Create directory structure for models, repositories, services, and components
  - Define TypeScript interfaces for Mixtape, Track, AudioSource, TapeTheme, EnvelopeCustomization, and PlaybackState
  - Set up testing framework (Jest + React Native Testing Library + fast-check)
  - _Requirements: 1.1, 3.1, 4.1, 5.1_

- [ ]* 1.1 Write property test for unique mixtape ID generation
  - **Property 9: Unique mixtape identifiers**
  - **Validates: Requirements 3.1**

- [ ] 2. Implement platform-agnostic storage abstraction layer
  - Create MixtapeRepository interface with getAll, getById, save, delete, exists methods
  - Create AudioRepository interface for audio file management
  - Create ThemeRepository interface for theme asset management
  - Implement platform detection utility
  - _Requirements: 14.1, 14.2, 15.1, 15.2_

- [ ] 2.1 Implement mobile storage adapter using Expo FileSystem
  - Create FileSystemStorageAdapter implementing repository interfaces
  - Implement JSON serialization for mixtape data
  - Implement file operations for audio and theme assets
  - _Requirements: 15.1_

- [ ] 2.2 Implement web storage adapter using IndexedDB
  - Create IndexedDBStorageAdapter implementing repository interfaces
  - Set up IndexedDB database schema with object stores
  - Implement blob storage for audio and theme assets
  - _Requirements: 15.2_

- [ ]* 2.3 Write property test for mixtape persistence round-trip
  - **Property 49: Mixtape persistence round-trip**
  - **Validates: Requirements 15.3**

- [ ]* 2.4 Write property test for mixtape deletion completeness
  - **Property 51: Mixtape deletion completeness**
  - **Validates: Requirements 15.5**

- [ ]* 2.5 Write property test for application initialization
  - **Property 50: Application initialization**
  - **Validates: Requirements 15.4**

- [ ] 3. Implement audio source validation and management
  - Create audio file format validator (MP3, AAC, WAV)
  - Implement URL validator for Spotify, YouTube, SoundCloud, and direct MP3 URLs
  - Create AudioRepository implementation for saving and retrieving audio files
  - Implement error handling for invalid audio sources
  - _Requirements: 1.1, 1.2, 1.5_

- [ ]* 3.1 Write property test for valid audio file acceptance
  - **Property 1: Valid audio files are accepted**
  - **Validates: Requirements 1.1**

- [ ]* 3.2 Write property test for URL validation across providers
  - **Property 2: URL validation across providers**
  - **Validates: Requirements 1.2**

- [ ]* 3.3 Write property test for invalid audio source rejection
  - **Property 4: Invalid audio source rejection**
  - **Validates: Requirements 1.5**

- [ ] 4. Build mixtape creation UI (Maker Mode)
  - Create MixtapeCreatorScreen with navigation setup
  - Implement track pool UI with add track button
  - Create file picker integration for local audio upload
  - Create URL input modal for online audio sources
  - Display track name and metadata in creation mode
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]* 4.1 Write property test for track visibility mode consistency
  - **Property 3: Track visibility mode consistency**
  - **Validates: Requirements 1.3, 1.4**

- [ ] 5. Implement drag-and-drop playlist organization
  - Create TrackList component with React Native Gesture Handler
  - Implement Side A and Side B columns layout
  - Add drag-and-drop functionality for track placement
  - Implement reordering within sides
  - Add track removal functionality
  - Persist playlist changes immediately to storage
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 5.1 Write property test for drag-and-drop placement
  - **Property 5: Drag-and-drop placement**
  - **Validates: Requirements 2.2**

- [ ]* 5.2 Write property test for playlist reordering
  - **Property 6: Playlist reordering preserves intent**
  - **Validates: Requirements 2.3**

- [ ]* 5.3 Write property test for track removal order preservation
  - **Property 7: Track removal preserves order**
  - **Validates: Requirements 2.4**

- [ ]* 5.4 Write property test for playlist modification persistence
  - **Property 8: Playlist modification persistence**
  - **Validates: Requirements 2.5**

- [ ] 6. Implement mixtape metadata management
  - Add title input field to creator screen
  - Implement unique ID generation using UUID
  - Create metadata storage with MixtapeRepository
  - Build mixtape library screen displaying saved mixtapes
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ]* 6.1 Write property test for mixtape metadata round-trip
  - **Property 10: Mixtape metadata round-trip**
  - **Validates: Requirements 3.2, 3.4**

- [ ]* 6.2 Write property test for library title display
  - **Property 11: Library displays all titles**
  - **Validates: Requirements 3.5**

- [ ] 7. Build tape shell designer with theme customization
  - Create TapeShellDesigner component
  - Implement three preset themes: VHS Static Grey, Pumpkin Orange, Ghostly Green
  - Add pattern selector (retro patterns)
  - Add texture selector (CRT textures)
  - Add overlay selector (VHS static noise)
  - Implement theme preview rendering
  - Store theme data with mixtape
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 7.1 Write property test for theme application consistency
  - **Property 12: Theme application consistency**
  - **Validates: Requirements 4.2**

- [ ]* 7.2 Write property test for visual customization rendering
  - **Property 13: Visual customization rendering**
  - **Validates: Requirements 4.4**

- [ ]* 7.3 Write property test for theme data persistence
  - **Property 14: Theme data persistence**
  - **Validates: Requirements 4.5**

- [ ] 8. Implement envelope customization for sharing
  - Create EnvelopeCustomizer component for export screen
  - Implement light color palette selector
  - Add preset sigil designs (moon-stars, skull, heart, etc.)
  - Create envelope preview component
  - Store envelope customization in mixtape metadata
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 8.1 Write property test for envelope customization preview
  - **Property 15: Envelope customization preview**
  - **Validates: Requirements 5.4**

- [ ]* 8.2 Write property test for envelope data in archive
  - **Property 16: Envelope data in archive**
  - **Validates: Requirements 5.5**

- [ ] 9. Build core playback engine
  - Create PlaybackEngine service class
  - Implement audio loading with Expo AV
  - Add play/pause functionality
  - Implement playback state management
  - Add state change event emitter
  - Handle track transitions
  - _Requirements: 6.1, 6.2_

- [ ]* 9.1 Write property test for play/pause state transitions
  - **Property 17: Play/pause state transitions**
  - **Validates: Requirements 6.1, 6.2**

- [ ] 10. Implement fast forward, rewind, and side flip
  - Add fast forward functionality with speed multiplier
  - Add rewind functionality with reverse playback
  - Implement side flip with animation sequence
  - Add track skip threshold logic (FF_THRESHOLD_PERCENT = 85%)
  - Handle side boundaries and prompts
  - _Requirements: 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4_

- [ ]* 10.1 Write property test for FF/REW speed modification
  - **Property 18: Fast forward and rewind speed modification**
  - **Validates: Requirements 6.3, 6.4**

- [ ]* 10.2 Write property test for side flip transitions
  - **Property 19: Side flip transitions**
  - **Validates: Requirements 6.5**

- [ ]* 10.3 Write property test for track skip threshold behavior
  - **Property 25: Track skip threshold behavior**
  - **Validates: Requirements 8.1, 8.2**

- [ ]* 10.4 Write property test for backward track skip
  - **Property 26: Backward track skip**
  - **Validates: Requirements 8.4**

- [ ] 11. Build tape deck UI with reel animations
  - Create TapeDeck component with theme rendering
  - Implement ReelAnimation component using React Native Reanimated
  - Add spinning reel animations synchronized to playback position
  - Implement tape ribbon stretching animation
  - Add control buttons (play, pause, FF, REW, flip)
  - Calculate reel rotation based on playback progress
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 11.1 Write property test for reel synchronization
  - **Property 20: Reel synchronization with playback**
  - **Validates: Requirements 7.1**

- [ ]* 11.2 Write property test for tape ribbon animation
  - **Property 21: Tape ribbon animation continuity**
  - **Validates: Requirements 7.2**

- [ ]* 11.3 Write property test for side flip animation sequence
  - **Property 22: Side flip animation sequence**
  - **Validates: Requirements 7.3**

- [ ]* 11.4 Write property test for speed-proportional reel rotation
  - **Property 23: Speed-proportional reel rotation**
  - **Validates: Requirements 7.4**

- [ ]* 11.5 Write property test for end-of-side behavior
  - **Property 24: End-of-side behavior**
  - **Validates: Requirements 7.5**

- [ ] 12. Implement overheat mechanic
  - Add overheat meter state to PlaybackEngine
  - Increment meter on FF/REW actions
  - Disable FF/REW when meter reaches maximum
  - Implement cooldown timer and animation
  - Add gradual meter decay over time
  - Display glowing red reels when overheated
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 12.1 Write property test for overheat meter accumulation
  - **Property 27: Overheat meter accumulation**
  - **Validates: Requirements 9.1**

- [ ]* 12.2 Write property test for overheat threshold enforcement
  - **Property 28: Overheat threshold enforcement**
  - **Validates: Requirements 9.2**

- [ ]* 12.3 Write property test for overheat visual feedback
  - **Property 29: Overheat visual feedback**
  - **Validates: Requirements 9.3**

- [ ]* 12.4 Write property test for cooldown recovery
  - **Property 30: Cooldown recovery**
  - **Validates: Requirements 9.4**

- [ ]* 12.5 Write property test for overheat meter decay
  - **Property 31: Overheat meter decay**
  - **Validates: Requirements 9.5**

- [ ] 13. Add authentic audio effects
  - Implement click/clunk sound effects for play/pause
  - Add pitch shift effects for FF/REW using Web Audio API or Expo AV
  - Create mechanical tape deck sounds for side flip
  - Load and manage sound effect assets
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ]* 13.1 Write property test for control audio feedback
  - **Property 32: Control audio feedback**
  - **Validates: Requirements 10.1**

- [ ]* 13.2 Write property test for pitch shift effects
  - **Property 33: Pitch shift effects**
  - **Validates: Requirements 10.2, 10.3**

- [ ]* 13.3 Write property test for flip audio feedback
  - **Property 34: Flip audio feedback**
  - **Validates: Requirements 10.4**

- [ ] 14. Implement spooky glitch mode system
  - Create GlitchController service
  - Detect rapid button mashing patterns
  - Detect repeated FF/REW sequences
  - Trigger glitch on extreme overheat
  - Implement visual effects: CRT scanlines, phosphor green mode, UI shake, tape jitter
  - Load and play random audio jumpscares
  - Add glitch duration and cooldown
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 14.1 Write property test for glitch trigger conditions
  - **Property 35: Glitch trigger conditions**
  - **Validates: Requirements 11.1, 11.2, 11.3**

- [ ]* 14.2 Write property test for glitch visual effects
  - **Property 36: Glitch visual effects**
  - **Validates: Requirements 11.4**

- [ ]* 14.3 Write property test for glitch audio jumpscare
  - **Property 37: Glitch audio jumpscare**
  - **Validates: Requirements 11.5**

- [ ] 15. Build archive creation and export system
  - Create ArchiveManager service using JSZip
  - Implement .mixblues archive creation with ZIP compression
  - Create metadata.json with all mixtape data
  - Include audio files in archive
  - Include theme assets in archive
  - Implement archive validation
  - _Requirements: 12.1, 12.2, 12.3, 17.1, 17.2, 17.3, 17.4, 17.5, 18.1_

- [ ]* 15.1 Write property test for archive creation format
  - **Property 38: Archive creation format**
  - **Validates: Requirements 12.1, 18.1**

- [ ]* 15.2 Write property test for archive metadata completeness
  - **Property 39: Archive metadata completeness**
  - **Validates: Requirements 12.2**

- [ ]* 15.3 Write property test for archive asset completeness
  - **Property 40: Archive asset completeness**
  - **Validates: Requirements 12.3**

- [ ]* 15.4 Write property test for archive validation
  - **Property 46: Archive validation**
  - **Validates: Requirements 14.3**

- [ ] 16. Create export/sharing screen
  - Build MixtapeSharingScreen component
  - Add note input field
  - Integrate envelope customization UI
  - Add export button with loading state
  - Provide options: upload to backend or save locally
  - Handle export success/failure states
  - _Requirements: 3.3, 5.1, 12.4_

- [ ] 17. Implement backend API client
  - Create BackendClient service
  - Implement POST /upload endpoint integration
  - Implement GET /t/{id} endpoint integration
  - Handle file upload with progress tracking
  - Handle network errors and retries
  - Parse backend responses
  - _Requirements: 12.5, 13.1, 13.2, 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ]* 17.1 Write property test for backend upload response
  - **Property 41: Backend upload response**
  - **Validates: Requirements 12.5, 13.1**

- [ ]* 17.2 Write property test for shareable URL download
  - **Property 42: Shareable URL download**
  - **Validates: Requirements 13.2**

- [ ] 18. Build envelope intro animation sequence
  - Create EnvelopeIntro component
  - Implement envelope appearance with custom color and sigil
  - Add mist animation overlay
  - Create tape sliding out animation
  - Implement note fade-in animation
  - Chain animations in sequence
  - _Requirements: 13.3, 13.4, 13.5_

- [ ]* 18.1 Write property test for envelope intro animation
  - **Property 43: Envelope intro animation**
  - **Validates: Requirements 13.3**

- [ ]* 18.2 Write property test for intro animation sequence
  - **Property 44: Intro animation sequence**
  - **Validates: Requirements 13.4, 13.5**

- [ ] 19. Implement archive import functionality
  - Add import from URL functionality
  - Add import from local file functionality
  - Implement archive extraction with JSZip
  - Validate metadata.json schema
  - Extract and save audio files
  - Extract and save theme assets
  - Add mixtape to local library
  - Handle import errors gracefully
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ]* 19.1 Write property test for local archive import
  - **Property 45: Local archive import**
  - **Validates: Requirements 14.2**

- [ ]* 19.2 Write property test for import success handling
  - **Property 47: Import success handling**
  - **Validates: Requirements 14.4**

- [ ]* 19.3 Write property test for import error handling
  - **Property 48: Import error handling**
  - **Validates: Requirements 14.5**

- [ ] 20. Implement offline mode functionality
  - Add network connectivity detection
  - Disable URL-based audio import when offline
  - Disable online sharing when offline
  - Enable all local operations when offline
  - Queue uploads for when connection restored
  - Display offline indicator in UI
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ]* 20.1 Write property test for offline creation capability
  - **Property 52: Offline creation capability**
  - **Validates: Requirements 16.1**

- [ ]* 20.2 Write property test for offline playback capability
  - **Property 53: Offline playback capability**
  - **Validates: Requirements 16.2**

- [ ]* 20.3 Write property test for offline export capability
  - **Property 54: Offline export capability**
  - **Validates: Requirements 16.3**

- [ ]* 20.4 Write property test for offline import capability
  - **Property 55: Offline import capability**
  - **Validates: Requirements 16.4**

- [ ]* 20.5 Write property test for offline feature availability
  - **Property 56: Offline feature availability**
  - **Validates: Requirements 16.5**

- [ ] 21. Ensure cross-platform consistency
  - Test and fix visual rendering differences across iOS, Android, Web
  - Ensure playback controls work identically on all platforms
  - Verify animations run at 60fps on all platforms
  - Test theme rendering consistency
  - Implement responsive layouts for different screen sizes
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ]* 21.1 Write property test for cross-platform visual consistency
  - **Property 61: Cross-platform visual consistency**
  - **Validates: Requirements 19.1**

- [ ]* 21.2 Write property test for cross-platform behavior consistency
  - **Property 62: Cross-platform behavior consistency**
  - **Validates: Requirements 19.2**

- [ ]* 21.3 Write property test for cross-platform animation consistency
  - **Property 63: Cross-platform animation consistency**
  - **Validates: Requirements 19.3**

- [ ]* 21.4 Write property test for cross-platform theme consistency
  - **Property 64: Cross-platform theme consistency**
  - **Validates: Requirements 19.4**

- [ ]* 21.5 Write property test for responsive layout adaptation
  - **Property 65: Responsive layout adaptation**
  - **Validates: Requirements 19.5**

- [ ] 22. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. Polish UI and add error handling
  - Implement comprehensive error boundaries
  - Add loading states for all async operations
  - Improve error messages with user-friendly text
  - Add haptic feedback for iOS interactions
  - Implement toast notifications for success/error states
  - Add accessibility labels and screen reader support
  - _Requirements: All error handling requirements_

- [ ] 24. Performance optimization
  - Optimize reel animations for 60fps
  - Implement audio preloading for seamless playback
  - Add virtualized lists for large track collections
  - Optimize storage operations with batching
  - Implement lazy loading for mixtape library
  - Profile and fix any performance bottlenecks
  - _Requirements: All performance-related requirements_

- [ ] 25. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
