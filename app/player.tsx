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
import { useToast } from '../components';
import TapeDeck from '../components/TapeDeck';
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
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={async () => {
              await triggerLightHaptic();
              navigateBack();
            }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={async () => {
              await triggerLightHaptic();
              router.push(`/export?id=${mixtapeId}`);
            }}
            accessibilityLabel="Export mixtape"
            accessibilityRole="button"
          >
            <Text style={styles.exportButtonText}>📤 Export</Text>
          </TouchableOpacity>
        </View>
        <Text
          style={styles.headerTitle}
          accessibilityRole="header"
        >
          {mixtape.title}
        </Text>
        <Text
          style={styles.headerSubtitle}
          accessibilityLabel={`Currently playing side ${playbackState.currentSide}`}
        >
          Side {playbackState.currentSide}
        </Text>
      </View>

      {/* Tape Deck */}
      <View style={styles.deckContainer}>
        <TapeDeck
          theme={mixtape.theme}
          playbackState={playbackState}
          onPlay={handlePlay}
          onPause={handlePause}
          onFastForwardPress={handleFastForwardPress}
          onFastForwardRelease={handleFastForwardRelease}
          onRewindPress={handleRewindPress}
          onRewindRelease={handleRewindRelease}
          onFlipSide={handleFlipSide}
        />
      </View>

      {/* Current Track Info (only shown in creation mode per requirements) */}
      {/* Requirements: 1.4 - Track names hidden in playback mode */}
      <View style={styles.infoContainer}>
        <Text
          style={styles.infoText}
          accessibilityLabel={playbackState.isPlaying ? 'Playing' : 'Paused'}
          accessibilityLiveRegion="polite"
        >
          {playbackState.isPlaying ? '▶ Playing' : '⏸ Paused'}
        </Text>
        {playbackState.isOverheated && (
          <Text
            style={styles.overheatText}
            accessibilityLabel="Overheated, cooling down"
            accessibilityLiveRegion="assertive"
          >
            🔥 Overheated - Cooling down...
          </Text>
        )}
        {playbackState.glitchMode && (
          <Text
            style={styles.glitchText}
            accessibilityLabel="Glitch mode active"
            accessibilityLiveRegion="assertive"
          >
            👻 Glitch Mode Active
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4a9eff',
    fontWeight: '600',
  },
  exportButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  exportButtonText: {
    fontSize: 16,
    color: '#34d399',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888888',
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
  deckContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  overheatText: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  glitchText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
});
