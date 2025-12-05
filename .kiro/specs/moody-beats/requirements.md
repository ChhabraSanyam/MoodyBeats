# Requirements Document

## Introduction

MoodyBeats is a cross-platform (iOS/Android/Web) React Native application that recreates the nostalgic experience of cassette mixtapes with authentic tape-like playback behavior and spooky interactive elements. The system allows users to create custom mixtapes from various audio sources, design retro-styled tape shells, play them back with realistic tape deck simulation, and share them via URLs or archive files. The application works fully offline except when importing URL-based audio or sharing tapes online.

## Glossary

- **Mixtape**: A digital collection of audio tracks organized into Side A and Side B, with associated metadata and visual theme
- **Tape Shell**: The visual representation of the cassette tape with customizable colors, patterns, and textures
- **Reel Animation**: Visual simulation of cassette tape reels spinning during playback
- **Side A/Side B**: The two sequential playlists that comprise a mixtape, mimicking physical cassette tape sides
- **Fast Forward (FF)**: Playback control that advances through audio at accelerated speed
- **Rewind (REW)**: Playback control that reverses through audio at accelerated speed
- **Overheat Mechanic**: System that limits excessive fast-forward/rewind usage by imposing cooldown periods
- **FF_THRESHOLD_PERCENT**: The percentage of a track that must be traversed via fast-forward before the system skips to the next track
- **Glitch Mode**: Easter egg feature that triggers visual and audio distortions based on user interaction patterns
- **Mixtape Archive**: A compressed file format (.mixblues) containing all mixtape data including metadata, theme assets, and audio files
- **MixtapeRepository**: Data access interface for storing and retrieving mixtape data
- **Tape Deck**: The visual player interface resembling a cassette player or walkman
- **Envelope Intro**: Animated sequence showing a tape emerging from an envelope when opening shared mixtapes
- **Envelope Customization**: Visual personalization of the envelope appearance including color palette and sigil designs
- **Sigil**: A decorative symbol or emblem displayed on the envelope
- **Backend Client**: Minimal server API for uploading and serving mixtape archives via shareable URLs

## Requirements

### Requirement 1: Audio Track Management

**User Story:** As a mixtape creator, I want to add audio tracks from multiple sources, so that I can build a diverse mixtape collection.

#### Acceptance Criteria

1. WHEN a user selects the file upload option, THE MoodyBeats System SHALL accept local audio files and add them to the track pool
2. WHEN a user provides a direct audio file URL (MP3, AAC, WAV, M4A), THE MoodyBeats System SHALL validate and add the audio track to the track pool
3. WHEN a track is added to the track pool, THE MoodyBeats System SHALL display the track name and metadata
4. WHEN a track is in playback mode, THE MoodyBeats System SHALL hide all track names and metadata from the user interface
5. WHEN a user attempts to add an invalid audio source, THE MoodyBeats System SHALL reject the input and display an error message

### Requirement 2: Mixtape Playlist Organization

**User Story:** As a mixtape creator, I want to organize tracks into Side A and Side B with drag-and-drop ordering, so that I can control the listening sequence.

#### Acceptance Criteria

1. WHEN a user is in creation mode, THE MoodyBeats System SHALL display two separate columns labeled Side A and Side B
2. WHEN a user drags a track from the track pool, THE MoodyBeats System SHALL allow placement into either Side A or Side B
3. WHEN a user drags a track within Side A or Side B, THE MoodyBeats System SHALL reorder the playlist according to the drop position
4. WHEN a user removes a track from Side A or Side B, THE MoodyBeats System SHALL update the playlist and maintain the order of remaining tracks
5. WHEN a playlist is modified, THE MoodyBeats System SHALL persist the changes to local storage immediately

### Requirement 3: Mixtape Metadata Management

**User Story:** As a mixtape creator, I want to add a title and optional message to my mixtape, so that I can personalize the listening experience.

#### Acceptance Criteria

1. WHEN a user creates a new mixtape, THE MoodyBeats System SHALL generate a unique tape identifier
2. WHEN a user enters a tape title, THE MoodyBeats System SHALL store the title with the mixtape metadata
3. WHEN a user exports a mixtape, THE MoodyBeats System SHALL display an interface (in the export screen) for adding an optional message or note
4. WHEN a mixtape is saved, THE MoodyBeats System SHALL associate all metadata with the unique tape identifier
5. WHEN a user views their mixtape library, THE MoodyBeats System SHALL display the tape title for each saved mixtape

### Requirement 4: Tape Shell Visual Customization

**User Story:** As a mixtape creator, I want to customize the visual appearance of my tape shell, so that I can express the mood and theme of my mixtape.

#### Acceptance Criteria

1. WHEN a user accesses the tape shell designer, THE MoodyBeats System SHALL display multiple preset theme options: VHS Static Grey, Pumpkin Orange, and Ghostly Green
2. WHEN a user selects a preset theme, THE MoodyBeats System SHALL apply the corresponding color scheme to the tape shell
3. WHEN a user customizes the tape shell, THE MoodyBeats System SHALL provide options for retro patterns, CRT textures, and VHS static noise overlays
4. WHEN a user applies visual customizations, THE MoodyBeats System SHALL render the tape shell with the selected theme and overlays
5. WHEN a mixtape is saved, THE MoodyBeats System SHALL store all theme and customization data with the mixtape

### Requirement 5: Envelope Visual Customization

**User Story:** As a mixtape creator, I want to customize the envelope appearance when sharing my mixtape, so that I can personalize the presentation for recipients.

#### Acceptance Criteria

1. WHEN a user accesses the export screen, THE MoodyBeats System SHALL display envelope customization options alongside the note input field
2. WHEN a user selects envelope customization, THE MoodyBeats System SHALL provide a light color palette for envelope background colors
3. WHEN a user selects envelope customization, THE MoodyBeats System SHALL provide preset sigil designs for envelope decoration
4. WHEN a user applies envelope customizations, THE MoodyBeats System SHALL preview the customized envelope appearance
5. WHEN a mixtape is exported, THE MoodyBeats System SHALL include envelope color and sigil data in the archive metadata

### Requirement 6: Basic Playback Controls

**User Story:** As a mixtape listener, I want to control playback with play, pause, fast forward, rewind, and side flip functions, so that I can navigate the mixtape.

#### Acceptance Criteria

1. WHEN a user presses the play button, THE MoodyBeats System SHALL begin audio playback and start reel animations
2. WHEN a user presses the pause button, THE MoodyBeats System SHALL halt audio playback and freeze reel animations
3. WHEN a user activates fast forward, THE MoodyBeats System SHALL advance audio playback at accelerated speed and increase reel animation speed
4. WHEN a user activates rewind, THE MoodyBeats System SHALL reverse audio playback at accelerated speed and reverse reel animation direction
5. WHEN a user presses the flip tape button, THE MoodyBeats System SHALL execute the side switch sequence and begin playback of the opposite side

### Requirement 7: Authentic Tape Reel Simulation

**User Story:** As a mixtape listener, I want to see realistic tape reel animations synchronized with playback, so that I experience authentic cassette tape behavior.

#### Acceptance Criteria

1. WHEN audio is playing, THE MoodyBeats System SHALL rotate both tape reels at speeds proportional to the current playback position
2. WHEN playback progresses, THE MoodyBeats System SHALL animate the tape ribbon stretching between the reels
3. WHEN the user flips the tape side, THE MoodyBeats System SHALL stop the reels, execute a tape eject animation, switch sides, and restart the reels
4. WHEN fast forward or rewind is active, THE MoodyBeats System SHALL increase reel rotation speed proportionally
5. WHEN playback reaches the end of a side, THE MoodyBeats System SHALL stop reel animations and display the flip tape prompt

### Requirement 8: Track Skip Behavior via Fast Forward

**User Story:** As a mixtape listener, I want track skipping to require overshooting the track boundary via fast forward, so that I experience authentic tape navigation without visible track lists.

#### Acceptance Criteria

1. WHEN a user fast forwards past the FF_THRESHOLD_PERCENT of the current track, THE MoodyBeats System SHALL skip to the next track
2. WHEN a user fast forwards but does not exceed FF_THRESHOLD_PERCENT, THE MoodyBeats System SHALL continue playing the current track from the new position
3. WHEN a user reaches the end of Side A via fast forward, THE MoodyBeats System SHALL prompt the user to flip to Side B
4. WHEN a user rewinds past the beginning of a track, THE MoodyBeats System SHALL skip to the previous track
5. WHEN no track list is displayed, THE MoodyBeats System SHALL maintain track navigation solely through fast forward and rewind mechanics

### Requirement 9: Overheat Mechanic for Fast Forward Abuse

**User Story:** As a mixtape listener, I want the system to limit excessive fast forward and rewind usage, so that the experience maintains authentic tape deck limitations.

#### Acceptance Criteria

1. WHEN a user repeatedly activates fast forward or rewind, THE MoodyBeats System SHALL increment an overheat meter
2. WHEN the overheat meter reaches maximum capacity, THE MoodyBeats System SHALL disable fast forward and rewind controls
3. WHEN the system is overheated, THE MoodyBeats System SHALL display glowing red reels and a cooldown animation
4. WHEN the cooldown period completes, THE MoodyBeats System SHALL reset the overheat meter and re-enable fast forward and rewind controls
5. WHEN the overheat meter is below maximum, THE MoodyBeats System SHALL gradually decrease the meter value over time

### Requirement 10: Audio Effects for Tape Authenticity

**User Story:** As a mixtape listener, I want to hear authentic tape sounds during playback, so that the audio experience matches the visual cassette simulation.

#### Acceptance Criteria

1. WHEN the user presses play or pause, THE MoodyBeats System SHALL play a click or clunk sound effect
2. WHEN the user activates fast forward, THE MoodyBeats System SHALL apply pitch shift effects to increase audio frequency
3. WHEN the user activates rewind, THE MoodyBeats System SHALL apply pitch shift effects to decrease audio frequency
4. WHEN the tape flips sides, THE MoodyBeats System SHALL play mechanical tape deck sound effects

### Requirement 11: Glitch Mode Easter Eggs

**User Story:** As a mixtape listener, I want to discover spooky glitch effects through specific interaction patterns, so that I experience unexpected moments of digital horror.

#### Acceptance Criteria

1. WHEN a user rapidly presses multiple buttons in succession, THE MoodyBeats System SHALL trigger a glitch mode effect
2. WHEN a user executes repeated fast forward and rewind sequences, THE MoodyBeats System SHALL trigger a glitch mode effect
3. WHEN the overheat meter reaches extreme levels, THE MoodyBeats System SHALL trigger a glitch mode effect
4. WHEN glitch mode activates, THE MoodyBeats System SHALL apply one or more visual effects including CRT scanlines, phosphor green monochrome mode, UI shake, or tape deck jitter
5. WHEN glitch mode activates, THE MoodyBeats System SHALL play one random audio jumpscare from a predefined set of spooky sounds

### Requirement 12: Mixtape Archive Export

**User Story:** As a mixtape creator, I want to export my mixtape as a shareable archive file, so that I can distribute it via URLs or manual file sharing.

#### Acceptance Criteria

1. WHEN a user initiates mixtape export, THE MoodyBeats System SHALL compile all mixtape data into a .mixblues archive format
2. WHEN creating the archive, THE MoodyBeats System SHALL include a metadata.json file containing sides, track URLs, theme data, envelope customization, title, and note
3. WHEN creating the archive, THE MoodyBeats System SHALL include all theme assets and audio files referenced by the mixtape
4. WHEN the archive is complete, THE MoodyBeats System SHALL provide options to upload to the backend or save locally to device storage
5. WHEN uploading to the backend, THE MoodyBeats System SHALL send the archive via POST request to the /upload endpoint and receive a shareable URL

### Requirement 13: Shareable URL Generation and Access

**User Story:** As a mixtape creator, I want to generate a shareable URL for my mixtape, so that others can access it through a web link.

#### Acceptance Criteria

1. WHEN the backend receives an uploaded archive, THE Backend Client SHALL store the file and return a unique identifier and URL in the format https://share.moodybeats.sanyamchhabra.in/t/{id}
2. WHEN a user accesses a shareable URL, THE MoodyBeats System SHALL download the mixtape archive from the backend
3. WHEN a shareable URL is accessed, THE MoodyBeats System SHALL display an animated envelope intro sequence with the customized envelope colors and sigil
4. WHEN the envelope animation completes, THE MoodyBeats System SHALL show a mist animation followed by the tape sliding out
5. WHEN the tape is fully visible, THE MoodyBeats System SHALL fade in the handwritten note associated with the mixtape

### Requirement 14: Mixtape Archive Import

**User Story:** As a mixtape listener, I want to import mixtape archives from URLs or local storage, so that I can add shared mixtapes to my library.

#### Acceptance Criteria

1. WHEN a user provides a shareable URL, THE MoodyBeats System SHALL download the archive from the specified location
2. WHEN a user selects a local archive file, THE MoodyBeats System SHALL read the file from device storage
3. WHEN an archive is downloaded or selected, THE MoodyBeats System SHALL validate the metadata.json structure and contents
4. WHEN validation succeeds, THE MoodyBeats System SHALL extract all files and add the mixtape to the local library
5. WHEN validation fails, THE MoodyBeats System SHALL display an error message and reject the import

### Requirement 15: Local Mixtape Persistence

**User Story:** As a mixtape user, I want my mixtapes to be stored locally on my device, so that I can access them offline.

#### Acceptance Criteria

1. WHERE the platform is iOS or Android, THE MoodyBeats System SHALL use Expo FileSystem for mixtape storage
2. WHERE the platform is Web, THE MoodyBeats System SHALL use IndexedDB for mixtape storage
3. WHEN a mixtape is saved, THE MoodyBeats System SHALL persist all metadata, theme data, and references to audio files
4. WHEN the application launches, THE MoodyBeats System SHALL load all stored mixtapes from the MixtapeRepository
5. WHEN a user deletes a mixtape, THE MoodyBeats System SHALL remove all associated data from local storage

### Requirement 16: Offline Functionality

**User Story:** As a mixtape user, I want the application to work fully offline, so that I can create and play mixtapes without internet connectivity.

#### Acceptance Criteria

1. WHEN the device has no internet connection, THE MoodyBeats System SHALL allow creation of mixtapes using locally stored audio files
2. WHEN the device has no internet connection, THE MoodyBeats System SHALL allow playback of all locally stored mixtapes
3. WHEN the device has no internet connection, THE MoodyBeats System SHALL allow export of mixtape archives to local storage
4. WHEN the device has no internet connection, THE MoodyBeats System SHALL allow import of mixtape archives from local storage
5. WHEN the device has no internet connection, THE MoodyBeats System SHALL disable only URL-based audio import and online sharing features

### Requirement 17: Backend API for Archive Hosting

**User Story:** As a system administrator, I want a minimal backend API for anonymous mixtape uploads, so that users can share mixtapes via URLs without authentication.

#### Acceptance Criteria

1. WHEN the backend receives a POST request to /upload with an archive file, THE Backend Client SHALL store the file and return a JSON response containing an id and url
2. WHEN the backend receives a GET request to /t/{id}, THE Backend Client SHALL serve the corresponding mixtape archive with appropriate headers
3. WHEN processing uploads, THE Backend Client SHALL enforce file size limits to prevent abuse
4. WHEN serving archives, THE Backend Client SHALL configure CORS headers to allow cross-origin requests from mobile applications
5. WHEN handling requests, THE Backend Client SHALL support anonymous uploads without requiring user authentication

### Requirement 18: Mixtape Archive Format Specification

**User Story:** As a developer, I want a well-defined archive format for mixtapes, so that the system can reliably serialize and deserialize mixtape data.

#### Acceptance Criteria

1. WHEN creating a mixtape archive, THE MoodyBeats System SHALL use a ZIP-based compression format with .mixblues file extension
2. WHEN writing metadata, THE MoodyBeats System SHALL create a metadata.json file containing all sides, track URLs, theme configuration, envelope customization, title, and note fields
3. WHEN including audio files, THE MoodyBeats System SHALL store all locally referenced audio files within the archive
4. WHEN including theme assets, THE MoodyBeats System SHALL store all custom pattern, texture, and overlay files within the archive
5. WHEN parsing an imported archive, THE MoodyBeats System SHALL validate that metadata.json conforms to the expected schema

### Requirement 19: Cross-Platform UI Consistency

**User Story:** As a mixtape user, I want consistent visual and interactive experiences across iOS, Android, and Web platforms, so that I can use the application seamlessly on any device.

#### Acceptance Criteria

1. WHEN the application renders on iOS, Android, or Web, THE MoodyBeats System SHALL display identical tape deck visual components
2. WHEN the application renders on iOS, Android, or Web, THE MoodyBeats System SHALL provide identical playback controls and behavior
3. WHEN the application renders on iOS, Android, or Web, THE MoodyBeats System SHALL execute identical reel animations and visual effects
4. WHEN the application renders on iOS, Android, or Web, THE MoodyBeats System SHALL maintain consistent theme rendering and customization options
5. WHEN the application renders on different screen sizes, THE MoodyBeats System SHALL adapt layouts responsively while preserving visual design integrity
