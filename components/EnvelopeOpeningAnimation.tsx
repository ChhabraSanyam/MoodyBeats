/**
 * EnvelopeOpeningAnimation Component
 * Animated sequence: Envelope → Note Paper → Tape Cassette
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TapeTheme } from '../models';
import TapePresetDecorations from './TapePresetDecorations';

// Inject CSS animations for shooting stars (web only)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'envelope-shooting-star-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes shootingStar1 {
        0% {
          transform: translateX(0) translateY(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateX(600px) translateY(-80px);
          opacity: 0;
        }
      }
      
      @keyframes shootingStar2 {
        0% {
          transform: translateX(0) translateY(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateX(550px) translateY(-70px);
          opacity: 0;
        }
      }
      
      @keyframes shootingStar3 {
        0% {
          transform: translateX(0) translateY(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateX(580px) translateY(-75px);
          opacity: 0;
        }
      }
      
      @keyframes shootingStar4 {
        0% {
          transform: translateX(0) translateY(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateX(520px) translateY(-65px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

interface EnvelopeOpeningAnimationProps {
  envelopeColor: string;
  note?: string;
  signature?: string;
  sigil?: string;
  tapeTheme: TapeTheme;
  onComplete: () => void;
}

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
    'crystal': '💎',
    'butterfly': '🦋',
    'pentagram': '⭐',
  };
  return sigilMap[sigil] || '✨';
};

export default function EnvelopeOpeningAnimation({
  envelopeColor,
  note,
  signature,
  sigil,
  tapeTheme,
  onComplete,
}: EnvelopeOpeningAnimationProps) {
  const [stage, setStage] = useState<'envelope' | 'note' | 'tape'>('envelope');
  
  console.log('EnvelopeOpeningAnimation props:', { signature, sigil, note });
  
  // Animation values
  const envelopeOpacity = useRef(new Animated.Value(0)).current;
  const envelopeScale = useRef(new Animated.Value(0.8)).current;
  const envelopeBlur = useRef(new Animated.Value(0)).current;
  
  const noteOpacity = useRef(new Animated.Value(0)).current;
  const noteScale = useRef(new Animated.Value(0.9)).current;
  const noteBlur = useRef(new Animated.Value(0)).current;
  
  const tapeOpacity = useRef(new Animated.Value(0)).current;
  const tapeScale = useRef(new Animated.Value(0.8)).current;
  
  const tiltAnimX = useRef(new Animated.Value(0)).current;
  const tiltAnimY = useRef(new Animated.Value(0)).current;
  const tiltXValue = useRef(0);
  const tiltYValue = useRef(0);

  useEffect(() => {
    runAnimationSequence();
  }, []);

  const runAnimationSequence = async () => {
    // Stage 1: Envelope appears
    await animateEnvelopeIn();
    await delay(1500);
    
    // Stage 2: Envelope blurs, note appears
    setStage('note');
    await animateEnvelopeToNote();
    await delay(3000); // Show note for 3 seconds
    
    // Stage 3: Note blurs, tape appears
    setStage('tape');
    await animateNoteToTape();
    await delay(4000); // Show tape for 4 seconds
    
    // Complete
    onComplete();
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const animateEnvelopeIn = () => {
    return new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(envelopeOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(envelopeScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => resolve());
    });
  };

  const animateEnvelopeToNote = () => {
    return new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(envelopeBlur, {
          toValue: 10,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(envelopeOpacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(noteOpacity, {
          toValue: 1,
          duration: 800,
          delay: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(noteScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          delay: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => resolve());
    });
  };

  const animateNoteToTape = () => {
    return new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(noteBlur, {
          toValue: 10,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(noteOpacity, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(tapeOpacity, {
          toValue: 1,
          duration: 800,
          delay: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(tapeScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          delay: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => resolve());
    });
  };

  // Auto-tilt animation for tape
  useEffect(() => {
    if (stage === 'tape') {
      // Add listeners to track animated values
      const listenerX = tiltAnimX.addListener(({ value }) => {
        tiltXValue.current = value;
      });
      const listenerY = tiltAnimY.addListener(({ value }) => {
        tiltYValue.current = value;
      });

      const tiltSequence = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(tiltAnimX, {
              toValue: 10,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnimY, {
              toValue: 10,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(tiltAnimX, {
              toValue: -10,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnimY, {
              toValue: -10,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(tiltAnimX, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnimY, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      tiltSequence.start();
      return () => {
        tiltSequence.stop();
        tiltAnimX.removeListener(listenerX);
        tiltAnimY.removeListener(listenerY);
      };
    }
  }, [stage, tiltAnimX, tiltAnimY]);

  // Determine which preset is being used based on the theme
  const getPresetId = (): string | null => {
    // First check if texture field has the preset ID (new way)
    if (tapeTheme.texture) {
      console.log('EnvelopeOpeningAnimation - Using texture field:', tapeTheme.texture);
      return tapeTheme.texture;
    }
    
    // If pattern exists but no texture, it's a color-only theme
    if (tapeTheme.pattern && !tapeTheme.texture) {
      console.log('EnvelopeOpeningAnimation - Color-only theme detected, no preset');
      return null;
    }
    
    // Fallback to preset-based detection for backwards compatibility
    const preset = tapeTheme.preset;
    
    console.log('EnvelopeOpeningAnimation - Theme data (fallback):', { preset, fullTheme: tapeTheme });
    
    if (preset === 'vhs-static-grey') {
      console.log('Detected preset: love');
      return 'love';
    }
    if (preset === 'ghostly-green') {
      console.log('Detected preset: galaxy');
      return 'galaxy';
    }
    if (preset === 'pumpkin-orange') {
      console.log('Detected preset: retro');
      return 'retro';
    }
    
    console.log('No preset detected');
    return null;
  };

  const presetId = getPresetId();

  // Get the shell color and dimensions
  const shellColor = tapeTheme.pattern || (() => {
    // Fallback based on preset if no pattern is set
    switch (tapeTheme.preset) {
      case 'pumpkin-orange':
        return '#5B7FD8'; // Retro - blue
      case 'ghostly-green':
        return '#1E1B4C'; // Galaxy - dark purple
      case 'vhs-static-grey':
      default:
        return '#F5F5DC'; // Love - beige
    }
  })();

  const tapeWidth = Platform.OS === 'web' ? 480 : 320;
  const tapeHeight = Platform.OS === 'web' ? 300 : 200;

  console.log('Final presetId:', presetId, 'shellColor:', shellColor);

  return (
    <View style={styles.container}>
      {/* Envelope */}
      {(stage === 'envelope' || stage === 'note') && (
        <Animated.View
          style={[
            styles.envelope,
            {
              backgroundColor: envelopeColor,
              opacity: envelopeOpacity,
              transform: [{ scale: envelopeScale }],
            },
            Platform.OS === 'web' && {
              filter: `blur(${envelopeBlur}px)`,
            } as any,
          ]}
        >
          <View style={styles.envelopeFlap} />
          {sigil && (
            <View style={styles.envelopeSigilContainer}>
              <Text style={styles.envelopeSigil}>
                {getSigilSymbol(sigil)}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Note Paper */}
      {(stage === 'note' || stage === 'tape') && (
        <Animated.View
          style={[
            styles.notePaper,
            {
              opacity: noteOpacity,
              transform: [{ scale: noteScale }],
            },
            Platform.OS === 'web' && {
              filter: `blur(${noteBlur}px)`,
            } as any,
          ]}
        >
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>A Note For You</Text>
            <Text style={styles.noteText}>
              {note || 'Enjoy this mixtape...'}
            </Text>
          </View>
          <View style={styles.noteFooter}>
            <Text style={styles.noteSignature}>
              — {(signature && signature.trim() !== '') ? signature : 'Anonymous'}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Tape Cassette */}
      {stage === 'tape' && (
        <Animated.View
          style={[
            styles.tapeContainer,
            {
              opacity: tapeOpacity,
              transform: [{ scale: tapeScale }],
            },
          ]}
        >
          {Platform.OS === 'web' ? (
            <Animated.View
              style={[
                styles.tiltWrapper,
                {
                  transform: [
                    { perspective: 1200 },
                    {
                      rotateX: tiltAnimX.interpolate({
                        inputRange: [-15, 15],
                        outputRange: ['-15deg', '15deg'],
                      }),
                    },
                    {
                      rotateY: tiltAnimY.interpolate({
                        inputRange: [-15, 15],
                        outputRange: ['-15deg', '15deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Web: Depth layers */}
              {[...Array(8)].map((_, i) => {
                const layerDepth = (i + 1) * 0.15;
                const baseOpacity = 0.9 - (i * 0.1);
                return (
                  <Animated.View
                    key={`depth-${i}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 480,
                      height: 300,
                      backgroundColor: '#2a2a2a',
                      borderRadius: 12,
                      opacity: baseOpacity,
                      transform: [
                        { translateX: Animated.multiply(tiltAnimY, -layerDepth) },
                        { translateY: Animated.multiply(tiltAnimX, layerDepth) },
                      ],
                    }}
                  />
                );
              })}
              <View style={[styles.tapeShell, { backgroundColor: shellColor }]}>
                {/* Render preset-specific decorations using shared component */}
                <TapePresetDecorations 
                  presetId={presetId} 
                  tapeWidth={tapeWidth} 
                  tapeHeight={tapeHeight} 
                />
                
                <View style={styles.tapeWindow}>
                  <View style={styles.reelContainer}>
                    <View style={styles.reel}>
                      <View style={styles.reelCenter} />
                    </View>
                    <View style={styles.tapeLine} />
                    <View style={styles.reel}>
                      <View style={styles.reelCenter} />
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.tiltWrapper,
                {
                  transform: [
                    { perspective: 1000 },
                    {
                      rotateX: tiltAnimX.interpolate({
                        inputRange: [-15, 15],
                        outputRange: ['-15deg', '15deg'],
                      }),
                    },
                    {
                      rotateY: tiltAnimY.interpolate({
                        inputRange: [-15, 15],
                        outputRange: ['-15deg', '15deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              {/* Mobile: Depth layers */}
              {[...Array(8)].map((_, i) => {
                const layerDepth = (i + 1) * 0.15;
                const baseOpacity = 0.9 - (i * 0.1);
                return (
                  <Animated.View
                    key={`depth-${i}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 320,
                      height: 200,
                      backgroundColor: '#2a2a2a',
                      borderRadius: 12,
                      opacity: baseOpacity,
                      zIndex: -1 - i,
                      transform: [
                        { translateX: Animated.multiply(tiltAnimY, -layerDepth) },
                        { translateY: Animated.multiply(tiltAnimX, layerDepth) },
                      ],
                    }}
                  />
                );
              })}
              <View style={[styles.tapeShell, { backgroundColor: shellColor }]}>
                {/* Render preset-specific decorations using shared component */}
                <TapePresetDecorations 
                  presetId={presetId} 
                  tapeWidth={tapeWidth} 
                  tapeHeight={tapeHeight} 
                />
                
                <View style={styles.tapeWindow}>
                  <View style={styles.reelContainer}>
                    <View style={styles.reel}>
                      <View style={styles.reelCenter} />
                    </View>
                    <View style={styles.tapeLine} />
                    <View style={styles.reel}>
                      <View style={styles.reelCenter} />
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  envelope: {
    position: 'absolute',
    width: 350,
    height: 220,
    borderRadius: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  envelopeFlap: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 175,
    borderRightWidth: 175,
    borderTopWidth: 110,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.2)',
  },
  envelopeSigilContainer: {
    position: 'absolute',
    top: '46%',
    left: '48%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
  },
  envelopeSigil: {
    fontSize: 64,
    lineHeight: 64,
    textAlign: 'center',
  },
  notePaper: {
    position: 'absolute',
    width: Platform.OS === 'android' ? 400 : 500,
    height: Platform.OS === 'android' ? 500 : 600,
    backgroundColor: '#FFF8DC',
    borderRadius: 4,
    padding: Platform.OS === 'android' ? 40 : 50,
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  noteTitle: {
    fontSize: 24,
    fontFamily: Platform.OS === 'web' ? 'Staatliches' : undefined,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  noteText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  noteContent: {
    flex: 0,
  },
  noteFooter: {
    width: '100%',
    alignItems: 'flex-end',
  },
  noteSignature: {
    fontSize: 22,
    color: '#333',
    fontStyle: 'italic',
    fontWeight: '600',
  },
  tapeContainer: {
    position: 'absolute',
  },
  tiltWrapper: {
    position: 'relative',
  },
  tapeShell: {
    width: 320,
    height: 200,
    borderRadius: 12,
    padding: 30,
    position: 'relative',
    overflow: Platform.OS === 'web' ? 'hidden' : 'visible',
    ...Platform.select({
      web: {
        width: 480,
        height: 300,
        padding: 45,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  tapeWindow: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  reelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  reel: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E5E5E5',
    ...(Platform.OS === 'web' && {
      width: 82,
      height: 82,
      borderRadius: 41,
      borderWidth: 4,
    }),
  },
  reelCenter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#666666',
    ...(Platform.OS === 'web' && {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 3,
    }),
  },
  tapeLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#00CED1',
    marginHorizontal: 8,
    ...(Platform.OS === 'web' && {
      height: 4,
      marginHorizontal: 12,
    }),
  },
});
