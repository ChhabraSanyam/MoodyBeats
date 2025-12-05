/**
 * ReelAnimation component - Animated cassette tape reel
 * Requirements: 7.1, 7.2, 7.4
 * Performance optimized with worklets and memoization
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    runOnUI,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

interface ReelAnimationProps {
  position: number;
  duration: number;
  isPlaying: boolean;
  speed: number;
  side: 'A' | 'B';
  isLeftReel: boolean;
  reelColor: string;
  reelSize?: number; // Optional responsive reel size
}

const ReelAnimation: React.FC<ReelAnimationProps> = ({
  position,
  duration,
  isPlaying,
  speed,
  side,
  isLeftReel,
  reelColor,
  reelSize = 80, // Default to 80 if not provided
}) => {
  const rotation = useSharedValue(0);

  // Memoize rotation speed calculation to avoid recalculating on every render
  const rotationSpeed = useMemo(() => {
    return calculateRotationSpeed(position, duration, isLeftReel, side);
  }, [position, duration, isLeftReel, side]);

  useEffect(() => {
    if (isPlaying) {
      // Use worklet for better performance
      runOnUI(() => {
        'worklet';
        const adjustedSpeed = rotationSpeed * Math.abs(speed);
        const direction = speed >= 0 ? 1 : -1;
        
        // Start continuous rotation with optimized timing
        rotation.value = withRepeat(
          withTiming(rotation.value + (360 * direction), {
            duration: 1000 / adjustedSpeed,
            easing: Easing.linear,
          }),
          -1, // Infinite repeat
          false
        );
      })();
    } else {
      // Stop rotation
      cancelAnimation(rotation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, speed, rotationSpeed]);

  // Optimized animated style with worklet
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  }, []);

  // Memoize responsive sizes to avoid recalculation
  const dimensions = useMemo(() => ({
    containerSize: reelSize,
    reelDiameter: reelSize * 0.875,
    spokeHeight: reelSize * 0.875 * 0.43,
    hubSize: reelSize * 0.875 * 0.286,
  }), [reelSize]);

  return (
    <View style={[styles.reelContainer, { width: dimensions.containerSize, height: dimensions.containerSize }]}>
      <Animated.View 
        style={[
          styles.reel, 
          { 
            backgroundColor: reelColor,
            width: dimensions.reelDiameter,
            height: dimensions.reelDiameter,
            borderRadius: dimensions.reelDiameter / 2,
          }, 
          animatedStyle
        ]}
      >
        {/* Reel spokes */}
        <View style={[styles.spoke, styles.spoke1, { backgroundColor: reelColor, height: dimensions.spokeHeight }]} />
        <View style={[styles.spoke, styles.spoke2, { backgroundColor: reelColor, height: dimensions.spokeHeight }]} />
        <View style={[styles.spoke, styles.spoke3, { backgroundColor: reelColor, height: dimensions.spokeHeight }]} />
        <View style={[styles.spoke, styles.spoke4, { backgroundColor: reelColor, height: dimensions.spokeHeight }]} />
        
        {/* Center hub */}
        <View style={[styles.hub, { backgroundColor: reelColor, width: dimensions.hubSize, height: dimensions.hubSize, borderRadius: dimensions.hubSize / 2 }]} />
      </Animated.View>
    </View>
  );
};

// Calculate rotation speed based on reel physics (moved outside component for better performance)
// Left reel (source) slows down as tape unwinds
// Right reel (destination) speeds up as tape winds
function calculateRotationSpeed(
  pos: number,
  dur: number,
  isLeft: boolean,
  currentSide: 'A' | 'B'
): number {
  if (dur === 0) return 1;

  const progress = Math.min(Math.max(pos / dur, 0), 1);
  
  // Base rotation speed (rotations per second)
  const baseSpeed = 1.5;
  
  if (isLeft) {
    // Left reel (source) - starts fast, slows down as tape unwinds
    // More tape = slower rotation (larger radius)
    const reelFullness = 1 - progress; // 1 at start, 0 at end
    const speedMultiplier = 0.5 + (reelFullness * 1.5); // Range: 0.5 to 2.0
    return baseSpeed * speedMultiplier;
  } else {
    // Right reel (destination) - starts slow, speeds up as tape winds
    // More tape = slower rotation (larger radius)
    const reelFullness = progress; // 0 at start, 1 at end
    const speedMultiplier = 0.5 + (reelFullness * 1.5); // Range: 0.5 to 2.0
    return baseSpeed * speedMultiplier;
  }
}

const styles = StyleSheet.create({
  reelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reel: {
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  spoke: {
    position: 'absolute',
    width: 3,
    borderRadius: 1.5,
    opacity: 0.6,
  },
  spoke1: {
    transform: [{ rotate: '0deg' }],
  },
  spoke2: {
    transform: [{ rotate: '45deg' }],
  },
  spoke3: {
    transform: [{ rotate: '90deg' }],
  },
  spoke4: {
    transform: [{ rotate: '135deg' }],
  },
  hub: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.5)',
  },
});

// Memoize component to prevent unnecessary re-renders
export default React.memo(ReelAnimation);
