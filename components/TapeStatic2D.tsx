/**
 * TapeStatic2D Component
 * Simple 2D tape display without 3D effects or animations
 */

import React from 'react';
import {
    Platform,
    StyleSheet,
    View,
} from 'react-native';
import { TapeTheme } from '../models';
import TapePresetDecorations from './TapePresetDecorations';

interface TapeStatic2DProps {
  theme: TapeTheme;
  title: string;
}

export default function TapeStatic2D({ theme, title }: TapeStatic2DProps) {
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

  // Smaller dimensions for draggable tape
  const tapeWidth = Platform.OS === 'web' ? 320 : (Platform.OS === 'android' ? 200 : 240);
  const tapeHeight = Platform.OS === 'web' ? 200 : (Platform.OS === 'android' ? 125 : 150);

  return (
    <View style={styles.container}>
      <View style={[styles.tapeShell, { backgroundColor: shellColor, width: tapeWidth, height: tapeHeight }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapeShell: {
    borderRadius: 8,
    padding: Platform.OS === 'web' ? 25 : 20,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
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
    borderRadius: 6,
    padding: Platform.OS === 'web' ? 12 : 8,
    justifyContent: 'center',
  },
  reelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Platform.OS === 'web' ? 16 : 12,
  },
  reel: {
    width: Platform.OS === 'web' ? 50 : 35,
    height: Platform.OS === 'web' ? 50 : 35,
    borderRadius: Platform.OS === 'web' ? 25 : 17.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Platform.OS === 'web' ? 3 : 2,
    borderColor: '#E5E5E5',
  },
  reelCenter: {
    width: Platform.OS === 'web' ? 20 : 14,
    height: Platform.OS === 'web' ? 20 : 14,
    borderRadius: Platform.OS === 'web' ? 10 : 7,
    backgroundColor: '#000000',
    borderWidth: Platform.OS === 'web' ? 2 : 1,
    borderColor: '#666666',
  },
  tapeLine: {
    flex: 1,
    height: Platform.OS === 'web' ? 3 : 2,
    backgroundColor: '#00CED1',
    marginHorizontal: Platform.OS === 'web' ? 8 : 6,
  },
});