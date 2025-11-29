/**
 * TapeDeck component - Main tape player UI with reel animations
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 * Performance optimized with memoization
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PlaybackState, TapeTheme } from '../models';
import {
    getMonospaceFont,
    getPlatformShadow,
} from '../repositories/utils/platformStyles';
import { getTapeDeckDimensions } from '../repositories/utils/responsiveLayout';
import ReelAnimation from './ReelAnimation';

interface TapeDeckProps {
  theme: TapeTheme;
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onFastForwardPress: () => void;
  onFastForwardRelease: () => void;
  onRewindPress: () => void;
  onRewindRelease: () => void;
  onFlipSide: () => void;
}

const TapeDeck: React.FC<TapeDeckProps> = ({
  theme,
  playbackState,
  onPlay,
  onPause,
  onFastForwardPress,
  onFastForwardRelease,
  onRewindPress,
  onRewindRelease,
  onFlipSide,
}) => {
  const [showFlipPrompt, setShowFlipPrompt] = useState(false);

  // Check if we're at the end of the side
  useEffect(() => {
    const isAtEnd = playbackState.position >= playbackState.duration && 
                    playbackState.duration > 0 &&
                    !playbackState.isPlaying;
    setShowFlipPrompt(isAtEnd);
  }, [playbackState.position, playbackState.duration, playbackState.isPlaying]);

  // Memoize theme colors to avoid recalculation
  const colors = useMemo(() => {
    switch (theme.preset) {
      case 'vhs-static-grey':
        return {
          background: '#2a2a2a',
          primary: '#808080',
          secondary: '#505050',
          accent: '#a0a0a0',
        };
      case 'pumpkin-orange':
        return {
          background: '#1a1a1a',
          primary: '#ff8c00',
          secondary: '#ff6b00',
          accent: '#ffa500',
        };
      case 'ghostly-green':
        return {
          background: '#0a1a0a',
          primary: '#00ff00',
          secondary: '#00cc00',
          accent: '#00ff88',
        };
      default:
        return {
          background: '#2a2a2a',
          primary: '#808080',
          secondary: '#505050',
          accent: '#a0a0a0',
        };
    }
  }, [theme.preset]);
  
  // Memoize responsive dimensions
  const tapeDeckDimensions = useMemo(() => getTapeDeckDimensions(), []);
  
  // Memoize platform-specific values
  const monospaceFont = useMemo(() => getMonospaceFont(), []);
  const platformShadow = useMemo(() => getPlatformShadow(4), []);
  const platformShadowLight = useMemo(() => getPlatformShadow(2), []);

  // Memoize speed multiplier calculation
  const speedMultiplier = useMemo(() => {
    if (playbackState.isFastForwarding) {
      return 2.0;
    }
    if (playbackState.isRewinding) {
      return -2.0;
    }
    return 1.0;
  }, [playbackState.isFastForwarding, playbackState.isRewinding]);

  // Memoize reel color to avoid recalculation
  const reelColor = useMemo(() => {
    return playbackState.isOverheated ? '#ff0000' : colors.primary;
  }, [playbackState.isOverheated, colors.primary]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="tape-deck-container">
      {/* Tape Shell */}
      <View style={[styles.tapeShell, { borderColor: colors.primary }]}>
        {/* Side Label */}
        <View style={styles.sideLabel}>
          <Text style={[styles.sideLabelText, { color: colors.accent, fontFamily: monospaceFont }]}>
            Side {playbackState.currentSide}
          </Text>
        </View>

        {/* Reel Container */}
        <View style={styles.reelContainer}>
          {/* Left Reel (Source) */}
          <ReelAnimation
            position={playbackState.position}
            duration={playbackState.duration}
            isPlaying={playbackState.isPlaying}
            speed={speedMultiplier}
            side={playbackState.currentSide}
            isLeftReel={true}
            reelColor={reelColor}
            reelSize={tapeDeckDimensions.reelSize}
          />

          {/* Tape Ribbon */}
          <View style={styles.tapeRibbon}>
            <View style={[styles.ribbon, { backgroundColor: colors.secondary }]} />
          </View>

          {/* Right Reel (Destination) */}
          <ReelAnimation
            position={playbackState.position}
            duration={playbackState.duration}
            isPlaying={playbackState.isPlaying}
            speed={speedMultiplier}
            side={playbackState.currentSide}
            isLeftReel={false}
            reelColor={reelColor}
            reelSize={tapeDeckDimensions.reelSize}
          />
        </View>

        {/* Overheat Indicator */}
        {playbackState.isOverheated && (
          <View style={styles.overheatIndicator}>
            <Text style={[styles.overheatText, { fontFamily: monospaceFont }]}>COOLING DOWN...</Text>
          </View>
        )}

        {/* Flip Prompt */}
        {showFlipPrompt && (
          <View style={styles.flipPrompt}>
            <Text style={[styles.flipPromptText, { color: colors.accent, fontFamily: monospaceFont }]}>
              ↻ Flip to Side {playbackState.currentSide === 'A' ? 'B' : 'A'}
            </Text>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        {/* Rewind Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            platformShadow,
            { backgroundColor: colors.secondary },
            playbackState.isOverheated && styles.disabledButton,
          ]}
          onPressIn={onRewindPress}
          onPressOut={onRewindRelease}
          disabled={playbackState.isOverheated}
        >
          <Text style={[styles.controlButtonText, { color: colors.accent }]}>
            ⏪
          </Text>
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.playButton, platformShadow, { backgroundColor: colors.primary }]}
          onPress={playbackState.isPlaying ? onPause : onPlay}
        >
          <Text style={[styles.controlButtonText, { color: '#000' }]}>
            {playbackState.isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* Fast Forward Button */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            platformShadow,
            { backgroundColor: colors.secondary },
            playbackState.isOverheated && styles.disabledButton,
          ]}
          onPressIn={onFastForwardPress}
          onPressOut={onFastForwardRelease}
          disabled={playbackState.isOverheated}
        >
          <Text style={[styles.controlButtonText, { color: colors.accent }]}>
            ⏩
          </Text>
        </TouchableOpacity>
      </View>

      {/* Flip Side Button */}
      <TouchableOpacity
        style={[styles.flipButton, platformShadowLight, { backgroundColor: colors.secondary }]}
        onPress={onFlipSide}
      >
        <Text style={[styles.flipButtonText, { color: colors.accent, fontFamily: monospaceFont }]}>
          ↻ Flip Tape
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  tapeShell: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: 1.6,
    borderWidth: 3,
    borderRadius: 8,
    padding: 16,
    position: 'relative',
  },
  sideLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sideLabelText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  tapeRibbon: {
    flex: 1,
    height: 4,
    marginHorizontal: 16,
    justifyContent: 'center',
  },
  ribbon: {
    height: '100%',
    borderRadius: 2,
  },
  overheatIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overheatText: {
    color: '#ff0000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  flipPrompt: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  flipPromptText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  disabledButton: {
    opacity: 0.3,
  },
  controlButtonText: {
    fontSize: 24,
  },
  flipButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  flipButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Memoize component to prevent unnecessary re-renders
export default React.memo(TapeDeck);
