/**
 * Example usage of EnvelopeIntro component
 * Requirements: 13.3, 13.4, 13.5
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { EnvelopeCustomization } from '../models/Mixtape';
import EnvelopeIntro from './EnvelopeIntro';

const EnvelopeIntroExample: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);

  const exampleEnvelope: EnvelopeCustomization = {
    color: '#FFE4B5', // Moccasin/beige color
    sigil: 'moon-stars',
  };

  const exampleNote = 'Hey! I made this mixtape for you. Hope you enjoy these tracks! 🎵';

  const handleComplete = () => {
    setShowIntro(false);
    // Navigate to player screen or show mixtape content
  };

  if (!showIntro) {
    return (
      <View style={styles.container}>
        {/* Show mixtape player or other content after intro */}
      </View>
    );
  }

  return (
    <EnvelopeIntro
      envelope={exampleEnvelope}
      note={exampleNote}
      onComplete={handleComplete}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});

export default EnvelopeIntroExample;
