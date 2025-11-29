/**
 * Example usage of EnvelopeCustomizer component
 * This demonstrates how to integrate the component in an export/sharing screen
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { EnvelopeCustomization, Mixtape } from '../models';
import EnvelopeCustomizer from './EnvelopeCustomizer';

/**
 * Example Export Screen Component
 * Shows how to integrate EnvelopeCustomizer with mixtape export functionality
 */
export default function ExportScreenExample() {
  // Example mixtape state
  const [mixtape, setMixtape] = useState<Mixtape>({
    id: 'example-mixtape-id',
    title: 'Summer Vibes',
    note: '',
    sideA: [],
    sideB: [],
    theme: {
      preset: 'pumpkin-orange',
    },
    envelope: {
      color: '#FFF8DC', // Default cream color
      sigil: undefined,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  /**
   * Handle envelope customization changes
   * Requirements: 5.4, 5.5
   */
  const handleEnvelopeChange = (envelope: EnvelopeCustomization) => {
    setMixtape((prev) => ({
      ...prev,
      envelope,
      updatedAt: new Date(),
    }));
  };

  /**
   * Handle note input changes
   * Requirements: 3.3, 5.1
   */
  const handleNoteChange = (note: string) => {
    setMixtape((prev) => ({
      ...prev,
      note,
      updatedAt: new Date(),
    }));
  };

  return (
    <View style={styles.container}>
      {/* Note Input Section - Requirements: 3.3 */}
      <View style={styles.noteSection}>
        <Text style={styles.sectionTitle}>Add a Note</Text>
        <Text style={styles.sectionDescription}>
          Write a personal message to include with your mixtape
        </Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Write your note here..."
          placeholderTextColor="#666666"
          multiline
          numberOfLines={4}
          value={mixtape.note}
          onChangeText={handleNoteChange}
        />
      </View>

      {/* Envelope Customization Section - Requirements: 5.1 */}
      <View style={styles.envelopeSection}>
        <Text style={styles.sectionTitle}>Customize Envelope</Text>
        <Text style={styles.sectionDescription}>
          Personalize how your mixtape appears when shared
        </Text>
        <EnvelopeCustomizer
          envelope={mixtape.envelope}
          onEnvelopeChange={handleEnvelopeChange}
        />
      </View>

      {/* Export Button would go here */}
      <View style={styles.exportSection}>
        <Text style={styles.debugText}>
          Current envelope: {JSON.stringify(mixtape.envelope, null, 2)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  noteSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  envelopeSection: {
    flex: 1,
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
  noteInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  exportSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
});
