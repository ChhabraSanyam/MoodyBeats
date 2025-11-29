/**
 * EnvelopeCustomizer Component
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * Provides visual customization interface for envelope appearance including:
 * - Light color palette selector for envelope background
 * - Preset sigil designs (moon-stars, skull, heart, etc.)
 * - Live envelope preview
 * - Integration with mixtape metadata storage
 */

import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { EnvelopeCustomization } from '../models';

interface EnvelopeCustomizerProps {
  envelope: EnvelopeCustomization;
  onEnvelopeChange: (envelope: EnvelopeCustomization) => void;
}

// Light color palette for envelope backgrounds - Requirements: 5.2
const COLOR_PALETTE = [
  { id: 'cream', name: 'Cream', hex: '#FFF8DC' },
  { id: 'peach', name: 'Peach', hex: '#FFDAB9' },
  { id: 'lavender', name: 'Lavender', hex: '#E6E6FA' },
  { id: 'mint', name: 'Mint', hex: '#F0FFF0' },
  { id: 'rose', name: 'Rose', hex: '#FFE4E1' },
  { id: 'sky', name: 'Sky', hex: '#E0F6FF' },
  { id: 'lemon', name: 'Lemon', hex: '#FFFACD' },
  { id: 'blush', name: 'Blush', hex: '#FFF0F5' },
  { id: 'sage', name: 'Sage', hex: '#F0F8F0' },
  { id: 'vanilla', name: 'Vanilla', hex: '#F3E5AB' },
];

// Preset sigil designs - Requirements: 5.3
const SIGIL_DESIGNS = [
  { id: 'none', name: 'None', symbol: '', description: 'No sigil' },
  { id: 'moon-stars', name: 'Moon & Stars', symbol: '🌙✨', description: 'Celestial magic' },
  { id: 'skull', name: 'Skull', symbol: '💀', description: 'Spooky vibes' },
  { id: 'heart', name: 'Heart', symbol: '❤️', description: 'Love and care' },
  { id: 'rose', name: 'Rose', symbol: '🌹', description: 'Romance' },
  { id: 'ghost', name: 'Ghost', symbol: '👻', description: 'Haunting presence' },
  { id: 'crystal', name: 'Crystal', symbol: '🔮', description: 'Mystical energy' },
  { id: 'flame', name: 'Flame', symbol: '🔥', description: 'Burning passion' },
  { id: 'lightning', name: 'Lightning', symbol: '⚡', description: 'Electric energy' },
  { id: 'butterfly', name: 'Butterfly', symbol: '🦋', description: 'Transformation' },
  { id: 'eye', name: 'Eye', symbol: '👁️', description: 'All-seeing' },
  { id: 'pentagram', name: 'Pentagram', symbol: '⭐', description: 'Occult symbol' },
];

/**
 * EnvelopeCustomizer Component
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export default function EnvelopeCustomizer({ envelope, onEnvelopeChange }: EnvelopeCustomizerProps) {
  /**
   * Handle color selection
   * Requirements: 5.2, 5.4
   */
  const handleColorChange = (color: string) => {
    onEnvelopeChange({
      ...envelope,
      color,
    });
  };

  /**
   * Handle sigil selection
   * Requirements: 5.3, 5.4
   */
  const handleSigilChange = (sigil: string) => {
    onEnvelopeChange({
      ...envelope,
      sigil: sigil === 'none' ? undefined : sigil,
    });
  };

  // Get current color and sigil details
  const currentColor = COLOR_PALETTE.find((c) => c.hex === envelope.color);
  const currentSigil = SIGIL_DESIGNS.find((s) => s.id === envelope.sigil);

  return (
    <ScrollView style={styles.container}>
      {/* Envelope Preview - Requirements: 5.4 */}
      <View style={styles.previewSection}>
        <Text style={styles.sectionTitle}>Preview</Text>
        <View style={styles.previewContainer}>
          <View
            style={[
              styles.envelopePreview,
              {
                backgroundColor: envelope.color || '#FFF8DC',
              },
            ]}
          >
            {/* Envelope flap */}
            <View
              style={[
                styles.envelopeFlap,
                {
                  borderBottomColor: envelope.color || '#FFF8DC',
                },
              ]}
            />
            
            {/* Sigil display */}
            {envelope.sigil && currentSigil && currentSigil.symbol && (
              <View style={styles.sigilContainer}>
                <Text style={styles.sigilSymbol}>{currentSigil.symbol}</Text>
              </View>
            )}
            
            {/* Envelope seal */}
            <View style={styles.envelopeSeal} />
          </View>
          
          {/* Display active customizations */}
          <View style={styles.previewInfo}>
            <Text style={styles.previewInfoText}>
              Color: {currentColor?.name || 'Custom'}
            </Text>
            {envelope.sigil && currentSigil && (
              <Text style={styles.previewInfoText}>
                Sigil: {currentSigil.name}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Color Palette Section - Requirements: 5.2 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Envelope Color</Text>
        <Text style={styles.sectionDescription}>
          Choose a light color for your envelope background
        </Text>
        <View style={styles.colorGrid}>
          {COLOR_PALETTE.map((color) => (
            <TouchableOpacity
              key={color.id}
              style={[
                styles.colorOption,
                envelope.color === color.hex && styles.selectedColorOption,
              ]}
              onPress={() => handleColorChange(color.hex)}
            >
              <View
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color.hex },
                ]}
              />
              <Text style={styles.colorName}>{color.name}</Text>
              {envelope.color === color.hex && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sigil Designs Section - Requirements: 5.3 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sigil Design</Text>
        <Text style={styles.sectionDescription}>
          Add a decorative symbol to personalize your envelope
        </Text>
        <View style={styles.sigilGrid}>
          {SIGIL_DESIGNS.map((sigil) => (
            <TouchableOpacity
              key={sigil.id}
              style={[
                styles.sigilOption,
                (envelope.sigil === sigil.id || (!envelope.sigil && sigil.id === 'none')) &&
                  styles.selectedOption,
              ]}
              onPress={() => handleSigilChange(sigil.id)}
            >
              {sigil.symbol ? (
                <Text style={styles.sigilPreview}>{sigil.symbol}</Text>
              ) : (
                <View style={styles.sigilPreview} />
              )}
              <View style={styles.sigilContent}>
                <Text style={styles.optionName}>{sigil.name}</Text>
                <Text style={styles.optionDescription}>{sigil.description}</Text>
              </View>
              {(envelope.sigil === sigil.id || (!envelope.sigil && sigil.id === 'none')) && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
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
  envelopePreview: {
    width: 280,
    height: 180,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#d4af37',
  },
  envelopeFlap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 140,
    borderRightWidth: 140,
    borderBottomWidth: 90,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  sigilContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  sigilSymbol: {
    fontSize: 48,
  },
  envelopeSeal: {
    position: 'absolute',
    bottom: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d4af37',
    borderWidth: 2,
    borderColor: '#b8941f',
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: '30%',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderColor: '#4a9eff',
    backgroundColor: '#2a3a4a',
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#000000',
  },
  colorName: {
    fontSize: 13,
    color: '#ffffff',
    textAlign: 'center',
  },
  sigilGrid: {
    gap: 12,
  },
  sigilOption: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#4a9eff',
    backgroundColor: '#2a3a4a',
  },
  sigilPreview: {
    fontSize: 32,
    marginRight: 16,
    width: 48,
    textAlign: 'center',
  },
  sigilContent: {
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
