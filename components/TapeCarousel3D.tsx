/**
 * TapeCarousel3D Component
 * 3D tape display with idle animation, depth layers, and preset decorations
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TapeTheme } from '../models';
import TapePresetDecorations from './TapePresetDecorations';

interface TapeCarousel3DProps {
  theme: TapeTheme;
  title: string;
  disableIdleAnimation?: boolean;
}

export default function TapeCarousel3D({ theme, title, disableIdleAnimation = false }: TapeCarousel3DProps) {
  const tiltAnimX = useRef(new Animated.Value(0)).current;
  const tiltAnimY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (disableIdleAnimation) return;
    
    // Idle tilt animation
    const tiltSequence = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(tiltAnimX, {
            toValue: 8,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(tiltAnimY, {
            toValue: 8,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(tiltAnimX, {
            toValue: -8,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(tiltAnimY, {
            toValue: -8,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(tiltAnimX, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(tiltAnimY, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    tiltSequence.start();
    return () => tiltSequence.stop();
  }, [tiltAnimX, tiltAnimY, disableIdleAnimation]);

  // Get preset ID from theme
  const getPresetId = (): string | null => {
    // If texture field exists, it's a preset
    if (theme.texture) {
      return theme.texture;
    }
    
    // If pattern exists but no texture, it's a color-only theme
    if (theme.pattern && !theme.texture) {
      return null;
    }
    
    // Fallback to preset-based detection for backwards compatibility
    const preset = theme.preset;
    if (preset === 'vhs-static-grey') {
      return 'love';
    }
    if (preset === 'ghostly-green') {
      return 'galaxy';
    }
    if (preset === 'pumpkin-orange') {
      return 'retro';
    }
    
    return null;
  };

  const presetId = getPresetId();

  // Get shell color
  const shellColor = theme.pattern || (() => {
    switch (theme.preset) {
      case 'pumpkin-orange':
        return '#5B7FD8';
      case 'ghostly-green':
        return '#1E1B4B';
      case 'vhs-static-grey':
      default:
        return '#F5F5DC';
    }
  })();

  const tapeWidth = Platform.OS === 'web' ? 480 : (Platform.OS === 'android' ? 280 : 320);
  const tapeHeight = Platform.OS === 'web' ? 300 : (Platform.OS === 'android' ? 175 : 200);

  return (
    <View style={styles.container}>
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
          {/* Depth layers */}
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
            {/* Preset decorations */}
            <TapePresetDecorations 
              presetId={presetId} 
              tapeWidth={tapeWidth} 
              tapeHeight={tapeHeight} 
            />
            
            {/* Tape window */}
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
          {/* Depth layers */}
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
                  width: Platform.OS === 'android' ? 280 : 320,
                  height: Platform.OS === 'android' ? 175 : 200,
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
            {/* Preset decorations */}
            <TapePresetDecorations 
              presetId={presetId} 
              tapeWidth={tapeWidth} 
              tapeHeight={tapeHeight} 
            />
            
            {/* Tape window */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiltWrapper: {
    position: 'relative',
  },
  tapeShell: {
    width: Platform.OS === 'android' ? 280 : 320,
    height: Platform.OS === 'android' ? 175 : 200,
    borderRadius: 12,
    padding: Platform.OS === 'android' ? 25 : 30,
    position: 'relative',
    overflow: Platform.OS === 'web' ? 'hidden' : 'visible',
    ...Platform.select({
      web: {
        width: 480,
        height: 300,
        padding: 45,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 12,
      },
    }),
  },
  tapeWindow: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        padding: 16,
      },
    }),
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
