/**
 * Example usage of TapeDeck component
 * This demonstrates how to integrate the TapeDeck with PlaybackEngine
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Mixtape, PlaybackState } from '../models';
import { PlaybackEngine } from '../services';
import TapeDeck from './TapeDeck';

// Example mixtape data
const exampleMixtape: Mixtape = {
  id: 'example-mixtape-1',
  title: 'Summer Vibes',
  note: 'For the road trip',
  sideA: [
    {
      id: 'track-1',
      title: 'Song 1',
      artist: 'Artist 1',
      duration: 180000,
      source: {
        type: 'local',
        uri: 'file://path/to/song1.mp3',
      },
    },
    {
      id: 'track-2',
      title: 'Song 2',
      artist: 'Artist 2',
      duration: 200000,
      source: {
        type: 'local',
        uri: 'file://path/to/song2.mp3',
      },
    },
  ],
  sideB: [
    {
      id: 'track-3',
      title: 'Song 3',
      artist: 'Artist 3',
      duration: 190000,
      source: {
        type: 'local',
        uri: 'file://path/to/song3.mp3',
      },
    },
  ],
  theme: {
    preset: 'pumpkin-orange',
    pattern: 'retro-lines',
    texture: 'crt-scan',
    overlay: 'vhs-static',
  },
  envelope: {
    color: '#FFE4B5',
    sigil: 'moon-stars',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const TapeDeckExample: React.FC = () => {
  const [playbackEngine] = useState(() => new PlaybackEngine());
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    playbackEngine.getCurrentState()
  );

  useEffect(() => {
    // Load the mixtape
    playbackEngine.load(exampleMixtape);

    // Subscribe to playback state changes
    const unsubscribe = playbackEngine.onStateChange((newState) => {
      setPlaybackState(newState);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      playbackEngine.cleanup();
    };
  }, [playbackEngine]);

  const handlePlay = async () => {
    await playbackEngine.play();
  };

  const handlePause = async () => {
    await playbackEngine.pause();
  };

  const handleFastForward = async () => {
    await playbackEngine.fastForward();
  };

  const handleRewind = async () => {
    await playbackEngine.rewind();
  };

  const handleFlipSide = async () => {
    await playbackEngine.flipSide();
  };

  return (
    <View style={styles.container}>
      <TapeDeck
        theme={exampleMixtape.theme}
        playbackState={playbackState}
        onPlay={handlePlay}
        onPause={handlePause}
        onFastForwardPress={handleFastForward}
        onFastForwardRelease={() => {}}
        onRewindPress={handleRewind}
        onRewindRelease={() => {}}
        onFlipSide={handleFlipSide}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

export default TapeDeckExample;
