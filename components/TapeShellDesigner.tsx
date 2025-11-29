/**
 * TapeShellDesigner Component
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * Provides visual customization interface for tape shell themes including:
 * - Three preset themes (VHS Static Grey, Pumpkin Orange, Ghostly Green)
 * - Pattern selector (retro patterns)
 * - Texture selector (CRT textures)
 * - Overlay selector (VHS static noise)
 * - Live theme preview
 */

import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { TapeTheme } from '../models';

interface TapeShellDesignerProps {
  theme: TapeTheme;
  onThemeChange: (theme: TapeTheme) => void;
}

// Preset theme definitions - Requirements: 4.1, 4.2
const PRESET_THEMES: {
  id: TapeTheme['preset'];
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}[] = [
  {
    id: 'vhs-static-grey',
    name: 'VHS Static Grey',
    description: 'Classic monochrome aesthetic',
    colors: {
      primary: '#808080',
      secondary: '#606060',
      accent: '#a0a0a0',
    },
  },
  {
    id: 'pumpkin-orange',
    name: 'Pumpkin Orange',
    description: 'Warm autumn vibes',
    colors: {
      primary: '#ff7518',
      secondary: '#cc5e13',
      accent: '#ffaa66',
    },
  },
  {
    id: 'ghostly-green',
    name: 'Ghostly Green',
    description: 'Eerie phosphorescent glow',
    colors: {
      primary: '#39ff14',
      secondary: '#2ecc11',
      accent: '#66ff44',
    },
  },
];

// Pattern options - Requirements: 4.3
const PATTERN_OPTIONS = [
  { id: 'none', name: 'None', description: 'No pattern' },
  { id: 'retro-lines', name: 'Retro Lines', description: 'Horizontal stripes' },
  { id: 'retro-grid', name: 'Retro Grid', description: 'Grid pattern' },
  { id: 'retro-dots', name: 'Retro Dots', description: 'Dotted pattern' },
  { id: 'retro-waves', name: 'Retro Waves', description: 'Wave pattern' },
];

// Texture options - Requirements: 4.3
const TEXTURE_OPTIONS = [
  { id: 'none', name: 'None', description: 'No texture' },
  { id: 'crt-scan', name: 'CRT Scanlines', description: 'Classic CRT effect' },
  { id: 'crt-curve', name: 'CRT Curve', description: 'Curved screen effect' },
  { id: 'film-grain', name: 'Film Grain', description: 'Grainy texture' },
  { id: 'noise', name: 'Noise', description: 'Static noise' },
];

// Overlay options - Requirements: 4.3
const OVERLAY_OPTIONS = [
  { id: 'none', name: 'None', description: 'No overlay' },
  { id: 'vhs-static-light', name: 'VHS Static (Light)', description: 'Subtle static' },
  { id: 'vhs-static-medium', name: 'VHS Static (Medium)', description: 'Medium static' },
  { id: 'vhs-static-heavy', name: 'VHS Static (Heavy)', description: 'Heavy static' },
  { id: 'vhs-tracking', name: 'VHS Tracking', description: 'Tracking errors' },
];

/**
 * TapeShellDesigner Component
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export default function TapeShellDesigner({ theme, onThemeChange }: TapeShellDesignerProps) {
  /**
   * Handle preset theme selection
   * Requirements: 4.2
   */
  const handlePresetChange = (preset: TapeTheme['preset']) => {
    onThemeChange({
      ...theme,
      preset,
    });
  };

  /**
   * Handle pattern selection
   * Requirements: 4.3, 4.4
   */
  const handlePatternChange = (pattern: string) => {
    onThemeChange({
      ...theme,
      pattern: pattern === 'none' ? undefined : pattern,
    });
  };

  /**
   * Handle texture selection
   * Requirements: 4.3, 4.4
   */
  const handleTextureChange = (texture: string) => {
    onThemeChange({
      ...theme,
      texture: texture === 'none' ? undefined : texture,
    });
  };

  /**
   * Handle overlay selection
   * Requirements: 4.3, 4.4
   */
  const handleOverlayChange = (overlay: string) => {
    onThemeChange({
      ...theme,
      overlay: overlay === 'none' ? undefined : overlay,
    });
  };

  // Get current preset colors for preview
  const currentPreset = PRESET_THEMES.find((p) => p.id === theme.preset);

  return (
    <ScrollView style={styles.container}>
      {/* Theme Preview - Requirements: 4.4 */}
      <View style={styles.previewSection}>
        <Text style={styles.sectionTitle}>Preview</Text>
        <View style={styles.previewContainer}>
          <View
            style={[
              styles.tapePreview,
              {
                backgroundColor: currentPreset?.colors.primary || '#808080',
              },
            ]}
          >
            <View
              style={[
                styles.tapeReel,
                {
                  backgroundColor: currentPreset?.colors.secondary || '#606060',
                },
              ]}
            />
            <View
              style={[
                styles.tapeReel,
                {
                  backgroundColor: currentPreset?.colors.secondary || '#606060',
                },
              ]}
            />
            <View style={styles.tapeLabel}>
              <Text style={styles.tapeLabelText}>MIXTAPE</Text>
            </View>
          </View>
          
          {/* Display active customizations */}
          <View style={styles.previewInfo}>
            <Text style={styles.previewInfoText}>
              Theme: {currentPreset?.name || 'Unknown'}
            </Text>
            {theme.pattern && (
              <Text style={styles.previewInfoText}>
                Pattern: {PATTERN_OPTIONS.find((p) => p.id === theme.pattern)?.name}
              </Text>
            )}
            {theme.texture && (
              <Text style={styles.previewInfoText}>
                Texture: {TEXTURE_OPTIONS.find((t) => t.id === theme.texture)?.name}
              </Text>
            )}
            {theme.overlay && (
              <Text style={styles.previewInfoText}>
                Overlay: {OVERLAY_OPTIONS.find((o) => o.id === theme.overlay)?.name}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Preset Themes Section - Requirements: 4.1, 4.2 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preset Themes</Text>
        <Text style={styles.sectionDescription}>
          Choose from three classic tape aesthetics
        </Text>
        <View style={styles.optionsGrid}>
          {PRESET_THEMES.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetOption,
                theme.preset === preset.id && styles.selectedOption,
              ]}
              onPress={() => handlePresetChange(preset.id)}
            >
              <View
                style={[
                  styles.presetColorSwatch,
                  { backgroundColor: preset.colors.primary },
                ]}
              />
              <View style={styles.optionContent}>
                <Text style={styles.optionName}>{preset.name}</Text>
                <Text style={styles.optionDescription}>{preset.description}</Text>
              </View>
              {theme.preset === preset.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Pattern Selector - Requirements: 4.3 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patterns</Text>
        <Text style={styles.sectionDescription}>
          Add retro patterns to your tape shell
        </Text>
        <View style={styles.optionsGrid}>
          {PATTERN_OPTIONS.map((pattern) => (
            <TouchableOpacity
              key={pattern.id}
              style={[
                styles.option,
                (theme.pattern === pattern.id || (!theme.pattern && pattern.id === 'none')) &&
                  styles.selectedOption,
              ]}
              onPress={() => handlePatternChange(pattern.id)}
            >
              <Text style={styles.optionName}>{pattern.name}</Text>
              <Text style={styles.optionDescription}>{pattern.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Texture Selector - Requirements: 4.3 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Textures</Text>
        <Text style={styles.sectionDescription}>
          Apply CRT and film textures
        </Text>
        <View style={styles.optionsGrid}>
          {TEXTURE_OPTIONS.map((texture) => (
            <TouchableOpacity
              key={texture.id}
              style={[
                styles.option,
                (theme.texture === texture.id || (!theme.texture && texture.id === 'none')) &&
                  styles.selectedOption,
              ]}
              onPress={() => handleTextureChange(texture.id)}
            >
              <Text style={styles.optionName}>{texture.name}</Text>
              <Text style={styles.optionDescription}>{texture.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Overlay Selector - Requirements: 4.3 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overlays</Text>
        <Text style={styles.sectionDescription}>
          Add VHS static and tracking effects
        </Text>
        <View style={styles.optionsGrid}>
          {OVERLAY_OPTIONS.map((overlay) => (
            <TouchableOpacity
              key={overlay.id}
              style={[
                styles.option,
                (theme.overlay === overlay.id || (!theme.overlay && overlay.id === 'none')) &&
                  styles.selectedOption,
              ]}
              onPress={() => handleOverlayChange(overlay.id)}
            >
              <Text style={styles.optionName}>{overlay.name}</Text>
              <Text style={styles.optionDescription}>{overlay.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  previewSection: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
  },
  previewContainer: {
    alignItems: 'center',
  },
  tapePreview: {
    width: 280,
    height: 180,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tapeReel: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#000000',
  },
  tapeLabel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  tapeLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 2,
  },
  previewInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  previewInfoText: {
    fontSize: 13,
    color: '#aaaaaa',
    marginBottom: 4,
  },
  optionsGrid: {
    gap: 12,
  },
  presetOption: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    alignItems: 'center',
  },
  presetColorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#000000',
  },
  option: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  selectedOption: {
    borderColor: '#4a9eff',
    backgroundColor: '#2a3a4a',
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#888888',
  },
  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4a9eff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
