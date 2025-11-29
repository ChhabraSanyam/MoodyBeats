# MoodyBeats Sound Effects

This directory contains authentic tape deck sound effects for the MoodyBeats application.

## Required Sound Files

The following MP3 files are required for the audio effects system:

### 1. play-click.mp3
- **Description**: Click sound when pressing the play button
- **Duration**: ~100-200ms
- **Characteristics**: Sharp, mechanical click similar to a cassette player play button
- **Requirements**: 10.1

### 2. pause-clunk.mp3
- **Description**: Clunk sound when pressing the pause button
- **Duration**: ~100-200ms
- **Characteristics**: Heavier mechanical clunk, slightly deeper than play click
- **Requirements**: 10.1

### 3. flip-mechanical.mp3
- **Description**: Mechanical sound of tape deck mechanism during flip
- **Duration**: ~300-500ms
- **Characteristics**: Whirring, mechanical movement sound
- **Requirements**: 10.4

### 4. tape-eject.mp3
- **Description**: Sound of tape being ejected from deck
- **Duration**: ~200-400ms
- **Characteristics**: Mechanical release and slight spring sound
- **Requirements**: 10.4

### 5. tape-insert.mp3
- **Description**: Sound of tape being inserted into deck
- **Duration**: ~200-400ms
- **Characteristics**: Mechanical insertion with slight click at end
- **Requirements**: 10.4

## Sound Effect Sources

You can obtain these sounds from:
- **Freesound.org**: Search for "cassette", "tape deck", "mechanical click"
- **BBC Sound Effects**: Free sound effects library
- **Record your own**: Use an actual cassette player if available
- **Synthesize**: Create using audio editing software like Audacity

## Audio Specifications

- **Format**: MP3
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128kbps or higher
- **Channels**: Mono or Stereo
- **Volume**: Normalized to -3dB to prevent clipping

## Placeholder Files

For development and testing, you can create silent placeholder files:

```bash
# Using ffmpeg to create silent MP3 files
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.2 -q:a 9 -acodec libmp3lame play-click.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.2 -q:a 9 -acodec libmp3lame pause-clunk.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.4 -q:a 9 -acodec libmp3lame flip-mechanical.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.3 -q:a 9 -acodec libmp3lame tape-eject.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.3 -q:a 9 -acodec libmp3lame tape-insert.mp3
```

## Integration

These sound effects are loaded and managed by the `AudioEffectsManager` service in `services/AudioEffectsManager.ts`.

## Pitch Shifting

Pitch shifting for fast forward and rewind is handled separately using Expo AV's rate control:
- **Fast Forward**: Increases playback rate without pitch correction (chipmunk effect)
- **Rewind**: Simulated through backwards seeking with pitch characteristics

See `PitchShiftManager` in `services/AudioEffectsManager.ts` for implementation details.
