# TapeDeck Component

The TapeDeck component is the main visual player interface for MoodyBeats, providing an authentic cassette tape experience with animated reels, control buttons, and theme customization.

## Features

- **Animated Reels**: Spinning reel animations synchronized to playback position using React Native Reanimated
- **Tape Ribbon**: Visual representation of tape stretching between reels
- **Control Buttons**: Play/Pause, Fast Forward, Rewind, and Flip Side controls
- **Theme Support**: Three preset themes (VHS Static Grey, Pumpkin Orange, Ghostly Green)
- **Overheat Mechanic**: Visual feedback when FF/REW controls are overused
- **Side Flip Prompt**: Automatic prompt when reaching the end of a side
- **Reel Physics**: Realistic reel rotation speeds based on tape position

## Requirements Validated

- **7.1**: Reel animations synchronized with playback position
- **7.2**: Tape ribbon stretching animation
- **7.3**: Side flip animation sequence (stop, eject, switch, restart)
- **7.4**: Speed-proportional reel rotation for FF/REW
- **7.5**: End-of-side behavior with flip prompt

## Usage

```typescript
import { TapeDeck } from '../components';
import { PlaybackEngine } from '../services';
import { Mixtape } from '../models';

const MyPlayer = () => {
  const [playbackEngine] = useState(() => new PlaybackEngine());
  const [playbackState, setPlaybackState] = useState(
    playbackEngine.getCurrentState()
  );

  useEffect(() => {
    // Load mixtape
    playbackEngine.load(myMixtape);

    // Subscribe to state changes
    const unsubscribe = playbackEngine.onStateChange(setPlaybackState);
    return unsubscribe;
  }, []);

  return (
    <TapeDeck
      theme={myMixtape.theme}
      playbackState={playbackState}
      onPlay={() => playbackEngine.play()}
      onPause={() => playbackEngine.pause()}
      onFastForward={() => playbackEngine.fastForward()}
      onRewind={() => playbackEngine.rewind()}
      onFlipSide={() => playbackEngine.flipSide()}
    />
  );
};
```

## Props

### `theme: TapeTheme`
The visual theme for the tape shell. Supports three presets:
- `vhs-static-grey`: Classic grey cassette with static overlay
- `pumpkin-orange`: Orange Halloween-themed cassette
- `ghostly-green`: Green phosphor-style cassette

### `playbackState: PlaybackState`
Current playback state from the PlaybackEngine, including:
- `currentSide`: 'A' or 'B'
- `position`: Current playback position in milliseconds
- `duration`: Total duration of current track
- `isPlaying`: Whether audio is currently playing
- `isFastForwarding`: Whether FF is active
- `isRewinding`: Whether REW is active
- `isOverheated`: Whether overheat cooldown is active

### Callbacks
- `onPlay()`: Called when play button is pressed
- `onPause()`: Called when pause button is pressed
- `onFastForward()`: Called when FF button is pressed
- `onRewind()`: Called when REW button is pressed
- `onFlipSide()`: Called when flip tape button is pressed

## ReelAnimation Component

The ReelAnimation component handles individual reel rendering and animation. It calculates realistic rotation speeds based on:

- **Playback position**: Reels slow down as they fill with tape (larger radius)
- **Speed multiplier**: Adjusts for FF (2x) and REW (-2x)
- **Reel side**: Left reel (source) vs right reel (destination)

### Reel Physics

The rotation speed calculation mimics real cassette physics:
- Left reel starts fast (small radius) and slows down as tape unwinds
- Right reel starts slow (small radius) and speeds up as tape winds
- Speed range: 0.5x to 2.0x base rotation speed

## Theme Colors

Each preset theme provides a consistent color palette:

### VHS Static Grey
- Background: `#2a2a2a`
- Primary: `#808080`
- Secondary: `#505050`
- Accent: `#a0a0a0`

### Pumpkin Orange
- Background: `#1a1a1a`
- Primary: `#ff8c00`
- Secondary: `#ff6b00`
- Accent: `#ffa500`

### Ghostly Green
- Background: `#0a1a0a`
- Primary: `#00ff00`
- Secondary: `#00cc00`
- Accent: `#00ff88`

## Visual States

### Normal Playback
- Reels spin at calculated speed
- Tape ribbon visible between reels
- All controls enabled

### Fast Forward / Rewind
- Reels spin at 2x speed (or -2x for rewind)
- Controls remain enabled unless overheated

### Overheated
- Reels glow red
- "COOLING DOWN..." message displayed
- FF/REW buttons disabled
- Play/Pause and Flip still functional

### End of Side
- Reels stop spinning
- "↻ Flip to Side B" prompt displayed
- User must flip tape to continue

## Testing

The component includes comprehensive unit tests covering:
- Theme rendering for all three presets
- Play/Pause button states and callbacks
- FF/REW button functionality
- Flip side button
- Overheat state and disabled controls
- End-of-side flip prompt
- ReelAnimation integration
- Speed multiplier calculations

Run tests with:
```bash
npm test -- components/__tests__/TapeDeck.test.tsx
npm test -- components/__tests__/ReelAnimation.test.tsx
```

## Example

See `TapeDeck.example.tsx` for a complete working example with PlaybackEngine integration.
