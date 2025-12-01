/**
 * Mixtape Player Screen
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5
 * 
 * Main playback interface featuring:
 * - Tape deck visualization with reel animations
 * - Playback controls (play, pause, FF, REW, flip)
 * - Overheat mechanic
 * - Glitch mode effects
 * - Side A/B navigation
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';
import { useToast } from '../components';
import { Mixtape } from '../models';
import { PlaybackState } from '../models/PlaybackState';
import { createMixtapeRepository } from '../repositories/adapters/StorageFactory';
import { PlaybackEngine } from '../services/PlaybackEngine';
import {
    triggerErrorHaptic,
    triggerLightHaptic,
    triggerMediumHaptic,
} from '../utils/haptics';

export default function PlayerScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const mixtapeId = params.id as string;

  const [mixtape, setMixtape] = useState<Mixtape | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [playbackEngine] = useState(() => new PlaybackEngine());
  const [isLoading, setIsLoading] = useState(true);

  const mixtapeRepo = createMixtapeRepository();

  /**
   * Safe navigation back
   */
  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/library');
    }
  };

  /**
   * Load mixtape and initialize playback
   */
  useEffect(() => {
    loadMixtape();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixtapeId]);

  /**
   * Subscribe to playback state changes
   */
  useEffect(() => {
    if (!playbackEngine) return;

    const unsubscribe = playbackEngine.onStateChange((state) => {
      setPlaybackState(state);
    });

    return () => {
      unsubscribe();
    };
  }, [playbackEngine]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (playbackEngine) {
        // Properly cleanup audio resources to prevent thread errors
        playbackEngine.cleanup().catch((error) => {
          console.error('Error cleaning up playback engine:', error);
        });
      }
    };
  }, [playbackEngine]);

  const loadMixtape = async () => {
    if (!mixtapeId) {
      await triggerErrorHaptic();
      showToast('No mixtape ID provided', 'error');
      navigateBack();
      return;
    }

    try {
      const loadedMixtape = await mixtapeRepo.getById(mixtapeId);
      if (!loadedMixtape) {
        await triggerErrorHaptic();
        showToast('Mixtape not found', 'error');
        navigateBack();
        return;
      }

      setMixtape(loadedMixtape);

      // Load mixtape into playback engine
      await playbackEngine.load(loadedMixtape);
      setPlaybackState(playbackEngine.getCurrentState());
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading mixtape:', error);
      await triggerErrorHaptic();
      showToast('Failed to load mixtape', 'error');
      navigateBack();
    }
  };

  /**
   * Playback control handlers
   */
  const handlePlay = async () => {
    try {
      await triggerMediumHaptic();
      await playbackEngine.play();
    } catch (error) {
      console.error('Error playing:', error);
      await triggerErrorHaptic();
      showToast('Failed to start playback', 'error');
    }
  };

  const handlePause = async () => {
    try {
      await triggerMediumHaptic();
      playbackEngine.pause();
    } catch (error) {
      console.error('Error pausing:', error);
      await triggerErrorHaptic();
      showToast('Failed to pause playback', 'error');
    }
  };

  const handleFastForwardPress = async () => {
    try {
      await triggerLightHaptic();
      playbackEngine.startFastForward();
    } catch (error) {
      console.error('Error fast forwarding:', error);
      await triggerErrorHaptic();
      showToast('Failed to fast forward', 'error');
    }
  };

  const handleFastForwardRelease = async () => {
    try {
      await triggerLightHaptic();
      playbackEngine.stopFastForward();
    } catch (error) {
      console.error('Error stopping fast forward:', error);
    }
  };

  const handleRewindPress = async () => {
    try {
      await triggerLightHaptic();
      playbackEngine.startRewind();
    } catch (error) {
      console.error('Error rewinding:', error);
      await triggerErrorHaptic();
      showToast('Failed to rewind', 'error');
    }
  };

  const handleRewindRelease = async () => {
    try {
      await triggerLightHaptic();
      playbackEngine.stopRewind();
    } catch (error) {
      console.error('Error stopping rewind:', error);
    }
  };

  const handleFlipSide = async () => {
    try {
      await triggerMediumHaptic();
      await playbackEngine.flipSide();
    } catch (error) {
      console.error('Error flipping side:', error);
      await triggerErrorHaptic();
      showToast('Failed to flip tape side', 'error');
    }
  };

  if (isLoading || !mixtape || !playbackState) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a9eff" />
          <Text style={styles.loadingText}>Loading mixtape...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={async () => {
            await triggerLightHaptic();
            navigateBack();
          }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          PLAYER MODE
        </Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={async () => {
            await triggerLightHaptic();
          }}
          accessibilityLabel="Menu"
          accessibilityRole="button"
        >
          <Text style={styles.menuButtonText}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content - Centered Player */}
      <View style={styles.mainContent}>
        {/* Navigation Arrows and Title */}
        <View style={styles.navigationSection}>
          <TouchableOpacity style={styles.navArrow}>
            <Text style={styles.navArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.mixtapeTitle}>{mixtape.title}</Text>
          <TouchableOpacity style={styles.navArrow}>
            <Text style={styles.navArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Player Shell */}
        <View style={styles.playerShell}>
          {/* Top Label/Button Area */}
          <View style={styles.topLabelArea}>
            <View style={styles.topLabel} />
            {playbackState.isPlaying &&
              !playbackState.isRewinding &&
              !playbackState.isFastForwarding &&
              Platform.OS === 'android' && (
                <View style={styles.recordIndicatorGlowWrapper}>
                  <View style={styles.recordIndicatorGlowOuter} />
                </View>
              )}
            <View
              style={[
                styles.recordIndicator,
                playbackState.isPlaying &&
                  !playbackState.isRewinding &&
                  !playbackState.isFastForwarding &&
                  styles.recordIndicatorGlow,
              ]}
            />
          </View>

          {/* Deck Area with Reels */}
          <View style={styles.deckArea}>
            <View style={styles.reelsSection}>
              <View style={styles.playerReel}>
                <View style={styles.playerReelInner} />
              </View>
              <View style={styles.playerTape} />
              <View style={styles.playerReel}>
                <View style={styles.playerReelInner} />
              </View>
            </View>
            {/* Glass Effect Overlay */}
            <View style={styles.glassOverlay} />
          </View>

          {/* Bottom Control Area */}
          <View style={styles.bottomControlArea}>
            {/* Control Buttons */}
            <View style={styles.controlButtons}>
              {/* Rewind Button */}
              <TouchableOpacity
                style={styles.controlBtn}
                onPressIn={handleRewindPress}
                onPressOut={handleRewindRelease}
                disabled={playbackState.isOverheated}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <Svg width="40" height="40" viewBox="0 0 24 24">
                  <Circle cx="12" cy="12" r="10" fill="#4E9E9A" />
                  <Polygon points="14.5,7 10.5,12 14.5,17" fill="white" />
                  <Polygon points="10.5,7 6.5,12 10.5,17" fill="white" />
                </Svg>
              </TouchableOpacity>

              {/* Play/Pause Button */}
              <TouchableOpacity
                style={[styles.controlBtn, styles.mainControlBtn]}
                onPress={
                  playbackState.isPlaying &&
                  !playbackState.isRewinding &&
                  !playbackState.isFastForwarding
                    ? handlePause
                    : handlePlay
                }
                disabled={
                  playbackState.isRewinding || playbackState.isFastForwarding
                }
              >
                {playbackState.isPlaying &&
                !playbackState.isRewinding &&
                !playbackState.isFastForwarding ? (
                  <Svg width="28" height="28" viewBox="0 0 24 24">
                    <Rect x="6" y="4" width="4" height="16" fill="#000000" />
                    <Rect x="14" y="4" width="4" height="16" fill="#000000" />
                  </Svg>
                ) : (
                  <Svg width="28" height="28" viewBox="0 0 24 24">
                    <Polygon points="8,5 8,19 19,12" fill="#000000" />
                  </Svg>
                )}
              </TouchableOpacity>

              {/* Fast Forward Button */}
              <TouchableOpacity
                style={styles.controlBtn}
                onPressIn={handleFastForwardPress}
                onPressOut={handleFastForwardRelease}
                disabled={playbackState.isOverheated}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <Svg width="40" height="40" viewBox="0 0 24 24">
                  <Circle cx="12" cy="12" r="10" fill="#4E9E9A" />
                  <Polygon points="9.5,7 13.5,12 9.5,17" fill="white" />
                  <Polygon points="13.5,7 17.5,12 13.5,17" fill="white" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Status Info */}
      {playbackState.isOverheated && (
        <Text style={styles.statusText}>🔥 Cooling down...</Text>
      )}
      {playbackState.glitchMode && (
        <Text style={styles.statusText}>👻 Glitch Mode</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonText: {
    fontSize: 32,
    color: '#c084fc',
    fontWeight: '300',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  menuButtonText: {
    fontSize: 32,
    color: '#c084fc',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c084fc',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
    marginTop: 16,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navigationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
  },
  navArrow: {
    padding: 12,
  },
  navArrowText: {
    fontSize: 32,
    color: '#4a4a4a',
    fontWeight: '300',
  },
  mixtapeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 20,
    textAlign: 'center',
  },
  playerShell: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#b794f6',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  topLabelArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topLabel: {
    flex: 1,
    height: 50,
    backgroundColor: '#4E9E9A',
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 5,
    borderColor: '#800080',
  },
  recordIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    zIndex: 2,
  },
  recordIndicatorGlowWrapper: {
    position: 'absolute',
    right: -12,
    top: 4,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  recordIndicatorGlowOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
  },
  recordIndicatorGlow: {
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: {
        // Android uses the wrapper view for glow effect
      },
      web: {
        boxShadow:
          '0 0 24px 8px rgba(239, 68, 68, 1), 0 0 12px 4px rgba(239, 68, 68, 0.8)',
      },
    }),
  },
  deckArea: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  reelsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(2px)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0.08) 100%)',
      },
      ios: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
      },
      android: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
      },
    }),
  },
  playerReel: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f5f5f5',
    borderWidth: 4,
    borderColor: '#d5d5d5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerReelInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
  },
  playerTape: {
    flex: 1,
    height: 6,
    backgroundColor: '#4a9eff',
    marginHorizontal: 16,
  },
  bottomControlArea: {
    backgroundColor: '#7c6ba8',
    borderRadius: 12,
    padding: 16,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    height: 70,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  controlBtnText: {
    fontSize: 24,
    color: '#ffffff',
  },
  mainControlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4E9E9A',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -5,
  },
  mainControlBtnText: {
    fontSize: 28,
    color: '#000000',
    textAlign: 'center',
    ...Platform.select({
      android: {
        lineHeight: 28,
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
  svgPlaceholder: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 16,
  },
});
