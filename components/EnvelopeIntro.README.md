# EnvelopeIntro Component

## Overview

The `EnvelopeIntro` component creates an animated sequence that displays when a user opens a shared mixtape. It provides a delightful introduction experience with a customized envelope, mist effects, tape sliding animation, and a personal note.

## Requirements

- **13.3**: Display animated envelope intro with customized colors and sigil
- **13.4**: Show mist animation followed by tape sliding out
- **13.5**: Fade in the handwritten note

## Features

### Animation Sequence

The component executes a carefully choreographed animation sequence:

1. **Envelope Appearance** (0-800ms)
   - Envelope fades in with custom color
   - Sigil is displayed on the envelope

2. **Mist Animation** (800-2000ms)
   - Ethereal mist overlay appears and pulses
   - Creates atmospheric effect

3. **Tape Sliding Out** (2000-3500ms)
   - Cassette tape slides out from the envelope
   - Smooth cubic easing for realistic motion

4. **Note Fade-In** (3500-4500ms)
   - Personal note fades in at the bottom
   - Completion callback is triggered

### Customization

- **Envelope Color**: Any valid CSS color string
- **Sigil**: Predefined symbols including:
  - `moon-stars`: 🌙✨
  - `skull`: 💀
  - `heart`: ❤️
  - `lightning`: ⚡
  - `rose`: 🌹
  - `eye`: 👁️
  - `flame`: 🔥
  - `ghost`: 👻
- **Note**: Optional personal message

## Props

```typescript
interface EnvelopeIntroProps {
  envelope: EnvelopeCustomization;  // Color and sigil configuration
  note?: string;                     // Optional personal message
  onComplete: () => void;            // Callback when animation finishes
}
```

## Usage

```tsx
import { EnvelopeIntro } from '../components';

const MyComponent = () => {
  const envelope = {
    color: '#FFE4B5',
    sigil: 'moon-stars',
  };

  const handleComplete = () => {
    // Navigate to player or show mixtape content
    console.log('Animation complete!');
  };

  return (
    <EnvelopeIntro
      envelope={envelope}
      note="Made this for you! Enjoy 🎵"
      onComplete={handleComplete}
    />
  );
};
```

## Animation Details

### Timing

- Total duration: ~4.5 seconds
- Uses React Native Reanimated for smooth 60fps animations
- Easing functions:
  - Cubic easing for envelope and tape
  - Ease in-out for mist effects
  - Linear timing for smooth transitions

### Performance

- All animations run on the UI thread via Reanimated worklets
- No JavaScript bridge overhead during animation
- Optimized for 60fps on all platforms

## Testing

The component includes comprehensive unit tests covering:
- Rendering with different envelope colors
- Displaying various sigil types
- Showing/hiding notes
- Handling missing sigils
- Animation element presence

Run tests with:
```bash
npm test -- EnvelopeIntro.test.tsx
```

## Example

See `EnvelopeIntro.example.tsx` for a complete working example.

## Design Notes

The component creates an immersive introduction experience that:
- Sets the mood for the mixtape listening experience
- Provides visual feedback that content is loading
- Adds personality through customization options
- Creates anticipation through sequential reveals
- Maintains the nostalgic cassette tape aesthetic

The animation timing is carefully tuned to feel neither rushed nor sluggish, creating a pleasant reveal that respects the user's time while building excitement.
