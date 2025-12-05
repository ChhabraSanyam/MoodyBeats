/**
 * TapeDisplay component - Static visual representation of the customized tape
 * Shows the tape design without any interactive controls
 */

import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { TapeTheme } from '../models';
import {
  getMonospaceFont,
  getPlatformShadow,
} from '../repositories/utils/platformStyles';
import ReelAnimation from './ReelAnimation';

interface TapeDisplayProps {
  theme: TapeTheme;
  isPlaying: boolean;
  position: number;
  duration: number;
  currentSide: 'A' | 'B';
  speed?: number;
  title?: string;
}

const TapeDisplay: React.FC<TapeDisplayProps> = ({
  theme,
  isPlaying,
  position,
  duration,
  currentSide,
  speed = 1.0,
  title,
}) => {
  // Memoize theme colors based on preset and pattern
  const colors = useMemo(() => {
    // Use pattern color if provided, otherwise use preset defaults
    const shellColor = theme.pattern || '#2a2a2a';
    
    // Apply preset-specific colors
    switch (theme.preset) {
      case 'vhs-static-grey':
        return {
          shell: shellColor,
          label: '#ffffff',
          window: '#1a1a1a',
          accent: '#a0a0a0',
        };
      case 'pumpkin-orange':
        return {
          shell: shellColor,
          label: '#ffffff',
          window: '#1a1a1a',
          accent: '#ffa500',
        };
      case 'ghostly-green':
        return {
          shell: shellColor,
          label: '#ffffff',
          window: '#1a1a1a',
          accent: '#00ff88',
        };
      default:
        return {
          shell: shellColor,
          label: '#ffffff',
          window: '#1a1a1a',
          accent: '#808080',
        };
    }
  }, [theme.preset, theme.pattern]);

  const monospaceFont = useMemo(() => getMonospaceFont(), []);
  const platformShadow = useMemo(() => getPlatformShadow(8), []);

  return (
    <View style={[styles.container, platformShadow]}>
      {/* Tape Shell */}
      <View
        style={[
          styles.tapeShell,
          {
            backgroundColor: colors.shell,
            borderColor: colors.accent,
          },
        ]}
      >
        {/* Label Area */}
        <View style={styles.labelArea}>
          <View style={[styles.label, { backgroundColor: colors.label }]}>
            {title && (
              <Text
                style={[
                  styles.labelText,
                  { fontFamily: monospaceFont, color: '#000' },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
          </View>
        </View>

        {/* Window Area with Reels */}
        <View style={[styles.windowArea, { backgroundColor: colors.window }]}>
          {/* Side Indicator */}
          <View style={styles.sideIndicator}>
            <Text
              style={[
                styles.sideText,
                { color: colors.accent, fontFamily: monospaceFont },
              ]}
            >
              {currentSide}
            </Text>
          </View>

          {/* Reels */}
          <View style={styles.reelContainer}>
            {/* Left Reel */}
            <ReelAnimation
              position={position}
              duration={duration}
              isPlaying={isPlaying}
              speed={speed}
              side={currentSide}
              isLeftReel={true}
              reelColor={colors.accent}
              reelSize={60}
            />

            {/* Tape Ribbon */}
            <View style={styles.tapeRibbon}>
              <View
                style={[styles.ribbon, { backgroundColor: colors.accent }]}
              />
            </View>

            {/* Right Reel */}
            <ReelAnimation
              position={position}
              duration={duration}
              isPlaying={isPlaying}
              speed={speed}
              side={currentSide}
              isLeftReel={false}
              reelColor={colors.accent}
              reelSize={60}
            />
          </View>
        </View>

        {/* Bottom screws decoration */}
        <View style={styles.screwsContainer}>
          <View style={[styles.screw, { backgroundColor: colors.accent }]} />
          <View style={[styles.screw, { backgroundColor: colors.accent }]} />
          <View style={[styles.screw, { backgroundColor: colors.accent }]} />
          <View style={[styles.screw, { backgroundColor: colors.accent }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: 1.6,
  },
  tapeShell: {
    flex: 1,
    borderWidth: 3,
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  labelArea: {
    height: 60,
    marginBottom: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  labelText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  windowArea: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    position: 'relative',
  },
  sideIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  sideText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  reelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  tapeRibbon: {
    flex: 1,
    height: 4,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  ribbon: {
    height: '100%',
    borderRadius: 2,
  },
  screwsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  screw: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
});

export default React.memo(TapeDisplay);
