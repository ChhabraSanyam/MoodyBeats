# EnvelopeCustomizer Component

## Overview

The `EnvelopeCustomizer` component provides a visual interface for customizing the envelope appearance when sharing mixtapes. It allows users to select from a light color palette and preset sigil designs to personalize their mixtape presentation.

## Requirements

This component implements the following requirements:
- **5.1**: Display envelope customization options in export screen
- **5.2**: Provide light color palette for envelope backgrounds
- **5.3**: Provide preset sigil designs for envelope decoration
- **5.4**: Preview customized envelope appearance
- **5.5**: Store envelope customization in mixtape metadata

## Features

### Light Color Palette (Requirement 5.2)
- 10 carefully selected light colors perfect for envelope backgrounds
- Colors include: Cream, Peach, Lavender, Mint, Rose, Sky, Lemon, Blush, Sage, Vanilla
- Visual color swatches for easy selection
- Selected color is highlighted with blue border

### Preset Sigil Designs (Requirement 5.3)
- 12 decorative symbols to personalize envelopes
- Sigils include: None, Moon & Stars, Skull, Heart, Rose, Ghost, Crystal, Flame, Lightning, Butterfly, Eye, Pentagram
- Each sigil has a name and description
- Emoji-based symbols for universal compatibility

### Live Preview (Requirement 5.4)
- Real-time envelope preview showing selected color and sigil
- Envelope design includes flap, seal, and sigil placement
- Preview info displays current selections

### Data Persistence (Requirement 5.5)
- Envelope customization is stored in the `Mixtape.envelope` field
- Automatically persisted through `MixtapeRepository`
- Included in `.mixblues` archive exports

## Usage

```typescript
import { EnvelopeCustomizer } from '../components';
import { EnvelopeCustomization } from '../models';

function ExportScreen() {
  const [envelope, setEnvelope] = useState<EnvelopeCustomization>({
    color: '#FFF8DC', // Default cream
    sigil: undefined,
  });

  return (
    <EnvelopeCustomizer
      envelope={envelope}
      onEnvelopeChange={setEnvelope}
    />
  );
}
```

## Props

### `envelope: EnvelopeCustomization`
The current envelope customization state.

```typescript
interface EnvelopeCustomization {
  color: string;      // Hex color code
  sigil?: string;     // Optional sigil ID
}
```

### `onEnvelopeChange: (envelope: EnvelopeCustomization) => void`
Callback function called when the user changes envelope customization.

## Integration with Export Screen

The component is designed to be used in the export/sharing screen alongside:
1. Note input field (Requirement 3.3)
2. Export button with upload/save options (Requirement 12.4)

See `EnvelopeCustomizer.example.tsx` for a complete integration example.

## Styling

The component uses a dark theme consistent with the MoodyBeats aesthetic:
- Dark background (#1a1a1a)
- Section dividers (#3a3a3a)
- Blue selection highlights (#4a9eff)
- White text with gray descriptions

## Testing

Comprehensive unit tests are provided in `__tests__/EnvelopeCustomizer.test.tsx`:
- Renders preview with current customization
- Displays all color palette options
- Displays all sigil design options
- Calls onChange when selections are made
- Updates preview when envelope changes
- Highlights selected options
- Clears sigil when "None" is selected

Run tests with:
```bash
npm test -- components/__tests__/EnvelopeCustomizer.test.tsx
```

## Color Palette Reference

| Name     | Hex Code | Description           |
|----------|----------|-----------------------|
| Cream    | #FFF8DC  | Warm neutral          |
| Peach    | #FFDAB9  | Soft orange           |
| Lavender | #E6E6FA  | Light purple          |
| Mint     | #F0FFF0  | Fresh green           |
| Rose     | #FFE4E1  | Delicate pink         |
| Sky      | #E0F6FF  | Light blue            |
| Lemon    | #FFFACD  | Pale yellow           |
| Blush    | #FFF0F5  | Soft pink             |
| Sage     | #F0F8F0  | Muted green           |
| Vanilla  | #F3E5AB  | Creamy yellow         |

## Sigil Design Reference

| ID          | Symbol | Description          |
|-------------|--------|----------------------|
| none        | -      | No sigil             |
| moon-stars  | 🌙✨   | Celestial magic      |
| skull       | 💀     | Spooky vibes         |
| heart       | ❤️     | Love and care        |
| rose        | 🌹     | Romance              |
| ghost       | 👻     | Haunting presence    |
| crystal     | 🔮     | Mystical energy      |
| flame       | 🔥     | Burning passion      |
| lightning   | ⚡     | Electric energy      |
| butterfly   | 🦋     | Transformation       |
| eye         | 👁️     | All-seeing           |
| pentagram   | ⭐     | Occult symbol        |

## Architecture

The component follows the same pattern as `TapeShellDesigner`:
- Controlled component pattern
- Callback-based state updates
- Scrollable layout for mobile compatibility
- Responsive grid layouts
- Accessible touch targets

## Future Enhancements

Potential improvements for future versions:
- Custom color picker for advanced users
- Upload custom sigil images
- Envelope texture options
- Animation preview
- Handwriting font for notes
