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
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  { id: 'lilac', name: 'Lilac', hex: '#E0D4F7' },
  { id: 'coral', name: 'Coral', hex: '#FFE5D9' },
];

// Preset sigil designs - Requirements: 5.3
const SIGIL_DESIGNS = [
  { id: 'none', name: 'None', symbol: '', description: 'No sigil', circleColor: '#ffffff' },
  { id: 'stars', name: 'Stars', symbol: '✨', description: 'Celestial magic', circleColor: '#FFF9E6' },
  { id: 'skull', name: 'Skull', symbol: '💀', description: 'Spooky vibes', circleColor: '#E8E8E8' },
  { id: 'heart', name: 'Heart', symbol: '❤️', description: 'Love and care', circleColor: '#FFE0E6' },
  { id: 'rose', name: 'Rose', symbol: '🌹', description: 'Romance', circleColor: '#FFE5ED' },
  { id: 'ghost', name: 'Ghost', symbol: '👻', description: 'Haunting presence', circleColor: '#F0F0F5' },
  { id: 'crystal', name: 'Crystal', symbol: '🔮', description: 'Mystical energy', circleColor: '#E6E0FF' },
  { id: 'flame', name: 'Flame', symbol: '🔥', description: 'Burning passion', circleColor: '#FFE8D6' },
  { id: 'lightning', name: 'Lightning', symbol: '⚡', description: 'Electric energy', circleColor: '#FFFACD' },
  { id: 'butterfly', name: 'Butterfly', symbol: '🦋', description: 'Transformation', circleColor: '#E6F3FF' },
  { id: 'eye', name: 'Eye', symbol: '👁️', description: 'All-seeing', circleColor: '#E8F4F8' },
  { id: 'pentagram', name: 'Pentagram', symbol: '⭐', description: 'Occult symbol', circleColor: '#FFFACD' },
  { id: 'gaming', name: 'Gaming', symbol: '🎮', description: 'Game on', circleColor: '#E8E5FF' },
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

  /**
   * Handle signature change
   */
  const handleSignatureChange = (signature: string) => {
    onEnvelopeChange({
      ...envelope,
      signature: signature.trim() === '' ? undefined : signature,
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
            {/* Envelope flap lines - white border outline */}
            <View style={styles.envelopeFlapLines}>
              <View style={styles.flapLineLeft} />
              <View style={styles.flapLineRight} />
            </View>
            
            {/* Sigil display - always show placeholder */}
            <View style={styles.sigilContainer}>
              {envelope.sigil && currentSigil && currentSigil.symbol ? (
                <>
                  <View style={[styles.sigilCircle, { backgroundColor: currentSigil.circleColor }]} />
                  <Text style={styles.sigilSymbol}>{currentSigil.symbol}</Text>
                </>
              ) : (
                <View style={styles.sigilPlaceholder} />
              )}
            </View>

            {/* Signature display */}
            {envelope.signature && (
              <View style={styles.signatureContainer}>
                <Text style={styles.signatureLabel}>From -</Text>
                <Text style={styles.signatureText}>{envelope.signature}</Text>
              </View>
            )}
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

      {/* Signature Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Signature</Text>
        <Text style={styles.sectionDescription}>
          Sign your name on the envelope
        </Text>
        <TextInput
          style={styles.signatureInput}
          value={envelope.signature || ''}
          onChangeText={handleSignatureChange}
          placeholder="Your name..."
          placeholderTextColor="#666666"
          maxLength={30}
        />
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
    fontFamily: 'Staatliches',
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
    width: 320,
    height: 200,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: '#000000',
  },
  envelopeFlapLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  flapLineLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '56%',
    height: 2,
    backgroundColor: '#000000',
    transform: [{ rotate: '25deg' }],
    transformOrigin: 'left top',
  },
  flapLineRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '55%',
    height: 2,
    backgroundColor: '#000000',
    transform: [{ rotate: '-25deg' }],
    transformOrigin: 'right top',
  },
  sigilContainer: {
    position: 'absolute',
    top: 29,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    minHeight: 60,
    minWidth: 60,
  },
  sigilCircle: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
  },
  sigilSymbol: {
    fontSize: Platform.OS === 'android' ? 32 : 38,
    zIndex: 1,
  },
  sigilPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
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
    borderColor: '#B28EF1',
    backgroundColor: '#2a2a3a',
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
    borderColor: '#B28EF1',
    backgroundColor: '#2a2a3a',
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
    backgroundColor: '#B28EF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signatureContainer: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    alignItems: 'flex-end',
  },
  signatureLabel: {
    fontSize: 20,
    color: '#000000',
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'cursive' : 'Vladimir Script',
    fontStyle: 'italic',
  },
  signatureText: {
    fontSize: 30,
    fontStyle: 'italic',
    color: '#000000',
    fontFamily: Platform.OS === 'android' ? 'cursive' : 'Vladimir Script',
  },
  signatureInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#B28EF1',
    padding: 12,
    fontSize: 20,
    color: '#ffffff',
    fontStyle: 'italic',
  },
});
