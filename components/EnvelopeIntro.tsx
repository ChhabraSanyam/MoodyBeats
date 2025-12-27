/**
 * EnvelopeIntro component - Animated envelope intro sequence
 * Requirements: 13.3, 13.4, 13.5
 */

import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { EnvelopeCustomization } from '../models/Mixtape';

interface EnvelopeIntroProps {
  envelope: EnvelopeCustomization;
  note?: string;
  onComplete: () => void;
}

const EnvelopeIntro: React.FC<EnvelopeIntroProps> = ({
  envelope,
  note,
  onComplete,
}) => {
  // Animation values
  const envelopeOpacity = useSharedValue(0);
  const mistOpacity = useSharedValue(0);
  const tapeTranslateY = useSharedValue(100);
  const tapeOpacity = useSharedValue(0);
  const noteOpacity = useSharedValue(0);

  useEffect(() => {
    // Start animation sequence
    startAnimationSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAnimationSequence = () => {
    // Step 1: Envelope appears (0-800ms)
    envelopeOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    // Step 2: Mist animation overlay (800-2000ms)
    mistOpacity.value = withDelay(
      800,
      withSequence(
        withTiming(0.7, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.3, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        })
      )
    );

    // Step 3: Tape sliding out (2000-3500ms)
    tapeOpacity.value = withDelay(
      2000,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      })
    );

    tapeTranslateY.value = withDelay(
      2000,
      withTiming(0, {
        duration: 1500,
        easing: Easing.out(Easing.cubic),
      })
    );

    // Step 4: Note fade-in (3500-4500ms)
    noteOpacity.value = withDelay(
      3500,
      withTiming(1, {
        duration: 1000,
        easing: Easing.out(Easing.ease),
      }, (finished) => {
        if (finished) {
          // Call onComplete after animation finishes
          runOnJS(onComplete)();
        }
      })
    );
  };

  const envelopeStyle = useAnimatedStyle(() => ({
    opacity: envelopeOpacity.value,
  }));

  const mistStyle = useAnimatedStyle(() => ({
    opacity: mistOpacity.value,
  }));

  const tapeStyle = useAnimatedStyle(() => ({
    opacity: tapeOpacity.value,
    transform: [{ translateY: tapeTranslateY.value }],
  }));

  const noteStyle = useAnimatedStyle(() => ({
    opacity: noteOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {/* Envelope */}
      <Animated.View
        style={[
          styles.envelope,
          { backgroundColor: envelope.color },
          envelopeStyle,
        ]}
      >
        {/* Envelope flap */}
        <View style={[styles.envelopeFlap, { borderBottomColor: envelope.color }]} />
        
        {/* Sigil */}
        {envelope.sigil && (
          <View style={styles.sigilContainer}>
            <Text style={styles.sigil}>{getSigilSymbol(envelope.sigil)}</Text>
          </View>
        )}
      </Animated.View>

      {/* Mist overlay */}
      <Animated.View style={[styles.mistOverlay, mistStyle]}>
        <View style={styles.mistGradient} />
      </Animated.View>

      {/* Tape sliding out */}
      <Animated.View style={[styles.tapeContainer, tapeStyle]}>
        <View style={styles.tape}>
          <View style={styles.tapeLabel}>
            <Text style={styles.tapeLabelText}>MIXTAPE</Text>
          </View>
          <View style={styles.tapeReels}>
            <View style={styles.tapeReel} />
            <View style={styles.tapeReel} />
          </View>
        </View>
      </Animated.View>

      {/* Note */}
      {note && (
        <Animated.View style={[styles.noteContainer, noteStyle]}>
          <Text style={styles.noteText}>{note}</Text>
        </Animated.View>
      )}
    </View>
  );
};

// Helper function to get sigil symbol
const getSigilSymbol = (sigil: string): string => {
  const sigilMap: Record<string, string> = {
    'moon-stars': '🌙✨',
    'skull': '💀',
    'heart': '❤️',
    'lightning': '⚡',
    'rose': '🌹',
    'eye': '👁️',
    'flame': '🔥',
    'ghost': '👻',
  };
  return sigilMap[sigil] || '✨';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  envelope: {
    width: 300,
    height: 200,
    borderRadius: 8,
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
  },
  envelopeFlap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 150,
    borderRightWidth: 150,
    borderBottomWidth: 100,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    opacity: 0.8,
  },
  sigilContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  sigil: {
    fontSize: 48,
    textAlign: 'center',
  },
  mistOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(200, 200, 255, 0.1)',
    ...Platform.select({
      web: {
        pointerEvents: 'none',
      } as any,
      default: {},
    }),
  },
  mistGradient: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tapeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tape: {
    width: 250,
    height: 160,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  tapeLabel: {
    backgroundColor: '#f5f5dc',
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  tapeLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    letterSpacing: 2,
  },
  tapeReels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
  },
  tapeReel: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  noteContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  noteText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default EnvelopeIntro;
