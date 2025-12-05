/**
 * Mixtape Player Screen with Integrated Tape Selection
 * Features tape carousel, drag interaction, and insertion animation
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    PanResponder,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Svg, { Circle, Polygon, Rect } from 'react-native-svg';
import { Button, useToast } from '../components';
import TapeCarousel3D from '../components/TapeCarousel3D';
import TapeStatic2D from '../components/TapeStatic2D';
import { Mixtape } from '../models';
import { PlaybackState } from '../models/PlaybackState';
import { createMixtapeRepository } from '../repositories/adapters/StorageFactory';
import { PlaybackEngine } from '../services/PlaybackEngine';
import {
    triggerErrorHaptic,
    triggerLightHaptic,
    triggerMediumHaptic,
} from '../utils/haptics';

type PlayerMode = 'selection' | 'dragging' | 'inserted' | 'playing';

export default function PlayerScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const mixtapeId = params.id as string;

  // State management
  const [mixtapes, setMixtapes] = useState<Mixtape[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMixtape, setSelectedMixtape] = useState<Mixtape | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [playbackEngine] = useState(() => new PlaybackEngine());
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mode, setMode] = useState<PlayerMode>('selection');

  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tapePositionY = useRef(new Animated.Value(0)).current;
  const playerPositionY = useRef(new Animated.Value(0)).current; // Will be positioned at 30% from bottom
  const playerOpacity = useRef(new Animated.Value(0)).current; // For fade in
  const tapeDepth = useRef(new Animated.Value(0)).current;
  const tapeFlipRotation = useRef(new Animated.Value(0)).current; // For tape flip animation
  const flipButtonOpacity = useRef(new Animated.Value(1)).current; // For flip button visibility

  // Drag state for web
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialTapeY, setInitialTapeY] = useState(-200);

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
   * Load mixtapes for selection or specific mixtape
   */
  useEffect(() => {
    if (mixtapeId) {
      loadSpecificMixtape();
    } else {
      loadAllMixtapes();
    }
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

  const loadAllMixtapes = async () => {
    try {
      const allMixtapes = await mixtapeRepo.getAll();
      if (allMixtapes.length === 0) {
        showToast('No mixtapes found', 'error');
        navigateBack();
        return;
      }
      
      allMixtapes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setMixtapes(allMixtapes);
      setSelectedMixtape(allMixtapes[0]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading mixtapes:', error);
      await triggerErrorHaptic();
      showToast('Failed to load mixtapes', 'error');
      navigateBack();
    }
  };

  const loadSpecificMixtape = async () => {
    try {
      const loadedMixtape = await mixtapeRepo.getById(mixtapeId);
      if (!loadedMixtape) {
        await triggerErrorHaptic();
        showToast('Mixtape not found', 'error');
        navigateBack();
        return;
      }

      setSelectedMixtape(loadedMixtape);
      setMode('inserted');
      
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
   * Carousel navigation handlers
   */
  const handlePrevious = () => {
    if (isAnimating || mode !== 'selection') return;
    setIsAnimating(true);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : mixtapes.length - 1;
      setSelectedIndex(newIndex);
      setSelectedMixtape(mixtapes[newIndex]);
      slideAnim.setValue(1);
      scaleAnim.setValue(0.8);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => setIsAnimating(false));
    });
  };

  const handleNext = () => {
    if (isAnimating || mode !== 'selection') return;
    setIsAnimating(true);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const newIndex = selectedIndex < mixtapes.length - 1 ? selectedIndex + 1 : 0;
      setSelectedIndex(newIndex);
      setSelectedMixtape(mixtapes[newIndex]);
      slideAnim.setValue(-1);
      scaleAnim.setValue(0.8);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => setIsAnimating(false));
    });
  };

  const handleSelectMixtape = async () => {
    if (!selectedMixtape || isAnimating) return;
    
    console.log('Starting tape selection animation');
    setIsAnimating(true);
    setMode('dragging');
    
    // Load mixtape into playback engine for side flipping (but don't start playing)
    if (selectedMixtape) {
      await playbackEngine.load(selectedMixtape);
      setPlaybackState(playbackEngine.getCurrentState());
    }
    
    // Fade in player at 30% from bottom and move tape to 20% from top
    Animated.parallel([
      Animated.timing(playerOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(tapePositionY, {
        toValue: -200, // Position tape at 20% from top
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(flipButtonOpacity, {
        toValue: 1, // Show flip button
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('Player faded in and tape moved to top, ready for dragging');
      setIsAnimating(false);
    });
  };

  // Web mouse handlers
  const handleMouseDown = (e: any) => {
    if (Platform.OS !== 'web' || mode !== 'dragging') return;
    setIsDragging(true);
    setIsAnimating(true);
    setDragStartY(e.clientY || e.nativeEvent.pageY);
    setInitialTapeY(-200); // Updated to match new tape position
  };

  const handleMouseMove = (e: any) => {
    if (Platform.OS !== 'web' || !isDragging || mode !== 'dragging') return;
    
    const currentY = e.clientY || e.nativeEvent.pageY;
    const dragY = Math.max(0, currentY - dragStartY);
    
    tapePositionY.setValue(initialTapeY + dragY);
  };

  const handleMouseUp = async (e: any) => {
    if (Platform.OS !== 'web' || !isDragging || mode !== 'dragging') return;
    
    setIsDragging(false);
    const currentY = e.clientY || e.nativeEvent.pageY;
    const dragY = currentY - dragStartY;
    const tapeBottom = -200 + dragY + 150; // tape position + height (updated for new position)
    const playerTop = 0; // player at 30% from bottom (updated position)
    
    if (tapeBottom >= playerTop) {
      // Hide flip button during insertion
      flipButtonOpacity.setValue(0);
      
      // Start tape insertion animation
      Animated.timing(tapePositionY, {
        toValue: 180, // Tape slides much deeper into the cassette player
        duration: 800,
        useNativeDriver: true,
      }).start(async () => {
        // Only set to inserted mode - mixtape is already loaded from selection
        setMode('inserted');
        setIsAnimating(false);
      });
    } else {
      // Snap back
      Animated.timing(tapePositionY, {
        toValue: -200, // Updated snap back position
        duration: 400,
        useNativeDriver: true,
      }).start(() => setIsAnimating(false));
    }
  };

  // Mobile pan responder for touch gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Platform.OS !== 'web' && mode === 'dragging',
      onMoveShouldSetPanResponder: () => Platform.OS !== 'web' && mode === 'dragging',
      onPanResponderGrant: () => {
        setIsAnimating(true);
      },
      onPanResponderMove: (_, gestureState) => {
        if (mode !== 'dragging') return;
        
        const dragY = Math.max(0, gestureState.dy);
        tapePositionY.setValue(-200 + dragY); // Updated for new tape position
      },
      onPanResponderRelease: async (_, gestureState) => {
        if (mode !== 'dragging') return;
        
        const dragY = gestureState.dy;
        const tapeBottom = -200 + dragY + 150; // tape position + height (updated)
        const playerTop = 0; // player at 30% from bottom (updated)
        
        if (tapeBottom >= playerTop) {
          // Hide flip button during insertion
          flipButtonOpacity.setValue(0);
          
          // Start tape insertion animation
          Animated.timing(tapePositionY, {
            toValue: 180, // Tape slides much deeper into the cassette player
            duration: 800,
            useNativeDriver: true,
          }).start(async () => {
            // Only set to inserted mode - mixtape is already loaded from selection
            setMode('inserted');
            setIsAnimating(false);
          });
        } else {
          // Snap back
          Animated.timing(tapePositionY, {
            toValue: -200, // Updated snap back position
            duration: 400,
            useNativeDriver: true,
          }).start(() => setIsAnimating(false));
        }
      },
    })
  ).current;

  // Add global mouse event listeners for web
  useEffect(() => {
    if (Platform.OS === 'web' && isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
      const handleGlobalMouseUp = (e: MouseEvent) => handleMouseUp(e);
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, mode, dragStartY, initialTapeY]);

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

  const handleTapeFlip = async () => {
    if (isAnimating) return;
    
    try {
      await triggerMediumHaptic();
      setIsAnimating(true);
      
      // Hide flip button during animation
      Animated.timing(flipButtonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Flip the tape 180 degrees
      const currentValue = (tapeFlipRotation as any)._value || 0;
      Animated.timing(tapeFlipRotation, {
        toValue: currentValue === 0 ? 1 : 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Show flip button again after animation
        Animated.timing(flipButtonOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
        
        setIsAnimating(false);
      });
      
      // Flip the side in the playback engine (works in both dragging and inserted modes)
      if (playbackEngine && selectedMixtape) {
        console.log('Before flip - Current side:', playbackEngine.getCurrentState().currentSide);
        await playbackEngine.flipSide();
        const newState = playbackEngine.getCurrentState();
        console.log('After flip - Current side:', newState.currentSide);
        // Update playback state to reflect the side change
        setPlaybackState(newState);
      }
    } catch (error) {
      console.error('Error flipping tape:', error);
      await triggerErrorHaptic();
      showToast('Failed to flip tape', 'error');
      setIsAnimating(false);
      
      // Restore flip button visibility on error
      flipButtonOpacity.setValue(1);
    }
  };

  const handleEject = async () => {
    try {
      await triggerMediumHaptic();
      setIsAnimating(true);
      
      // Store current side before ejecting
      const currentSide = playbackState?.currentSide || 'A';
      
      // Stop playback first
      playbackEngine.pause();
      
      // Animate tape sliding out (reverse of insertion)
      Animated.parallel([
        Animated.timing(tapePositionY, {
          toValue: -200, // Back to original dragging position
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(flipButtonOpacity, {
          toValue: 1, // Show flip button again
          duration: 400,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start(async () => {
        // Stay in dragging mode so user can re-insert the same tape
        setMode('dragging');
        
        // Reload the mixtape but preserve the current side
        if (selectedMixtape) {
          await playbackEngine.load(selectedMixtape);
          // If we were on Side B, flip back to Side B
          if (currentSide === 'B') {
            await playbackEngine.flipSide();
          }
          setPlaybackState(playbackEngine.getCurrentState());
        }
        
        setIsAnimating(false);
      });
    } catch (error) {
      console.error('Error ejecting tape:', error);
      await triggerErrorHaptic();
      showToast('Failed to eject tape', 'error');
      setIsAnimating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a9eff" />
          <Text style={styles.loadingText}>Loading mixtapes...</Text>
        </View>
      </View>
    );
  }

  if (mixtapes.length === 0 && !selectedMixtape) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No mixtapes available</Text>
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
            router.push('/library');
          }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {mode === 'selection' ? 'SELECT A MIXTAPE' : 'PLAYER MODE'}
        </Text>
        <View style={styles.menuButton} />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {mode === 'selection' && (
          <>
            {/* Title and Counter */}
            <Text style={styles.selectionTitle}>Select a Mixtape</Text>
            <Text style={styles.selectionSubtitle}>
              {selectedIndex + 1} of {mixtapes.length}
            </Text>

            {/* Tape Selection Carousel */}
            <View style={styles.tapeDisplayContainer}>
              {/* Left Arrow */}
              <TouchableOpacity
                style={[styles.arrowButton, styles.leftArrow]}
                onPress={handlePrevious}
              >
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>

              {/* Tape Display */}
              <Animated.View 
                style={[
                  styles.tapeWrapper,
                  {
                    opacity: scaleAnim.interpolate({
                      inputRange: [0.8, 1],
                      outputRange: [0.5, 1],
                    }),
                    transform: [
                      {
                        translateX: slideAnim.interpolate({
                          inputRange: [-1, 0, 1],
                          outputRange: [-400, 0, 400],
                        }),
                      },
                      { scale: scaleAnim },
                    ],
                  },
                ]}
              >
                <Text style={styles.tapeTitle}>{selectedMixtape?.title}</Text>
                <TapeCarousel3D
                  theme={selectedMixtape?.theme || { preset: 'vhs-static-grey' }}
                  title={selectedMixtape?.title || ''}
                />
              </Animated.View>

              {/* Right Arrow */}
              <TouchableOpacity
                style={[styles.arrowButton, styles.rightArrow]}
                onPress={handleNext}
              >
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Select Button */}
            <View style={styles.buttonContainer}>
              <Button
                title="Select Mixtape"
                variant="primary"
                size="large"
                onPress={handleSelectMixtape}
                fullWidth
              />
            </View>
          </>
        )}

        {(mode === 'dragging' || mode === 'inserted') && (
          <>
            {/* Draggable Tape */}
            <Animated.View
              {...(Platform.OS === 'web' ? {} : panResponder.panHandlers)}
              {...(Platform.OS === 'web' && {
                onMouseDown: handleMouseDown,
                style: { cursor: mode === 'dragging' ? (isDragging ? 'grabbing' : 'grab') : 'default' }
              })}
              style={[
                styles.draggableTape,
                {
                  transform: [
                    { translateY: tapePositionY },
                    {
                      rotateY: tapeFlipRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    },
                  ],
                  opacity: 1, // Keep tape fully visible
                },
              ]}
            >
              {mode === 'dragging' || mode === 'inserted' ? (
                <TapeStatic2D
                  theme={selectedMixtape?.theme || { preset: 'vhs-static-grey' }}
                  title={selectedMixtape?.title || ''}
                />
              ) : (
                <TapeCarousel3D
                  theme={selectedMixtape?.theme || { preset: 'vhs-static-grey' }}
                  title={selectedMixtape?.title || ''}
                  disableIdleAnimation={mode === 'inserted'}
                />
              )}
            </Animated.View>

            {/* Flip Button - Only show in dragging mode */}
            {mode === 'dragging' && (
              <Animated.View
                style={[
                  styles.flipButtonContainer,
                  {
                    opacity: flipButtonOpacity,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={handleTapeFlip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flipButtonText}>FLIP TAPE</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Player that fades in at fixed position */}
            <Animated.View
              style={[
                styles.playerContainer,
                {
                  transform: [{ translateY: playerPositionY }],
                  opacity: playerOpacity,
                },
              ]}
            >
              {mode === 'dragging' && (
                <Text style={styles.dragHint}>Drag the tape down to insert</Text>
              )}
              
              {/* Player Shell */}
              <View style={styles.playerShell}>
                {/* Top Label/Button Area */}
                <View style={styles.topLabelArea}>
                  {/* Eject Button */}
                  <TouchableOpacity
                    style={styles.topEjectButton}
                    onPress={handleEject}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.topEjectButtonText}>EJECT</Text>
                  </TouchableOpacity>
                  
                  {/* Smaller Teal Label */}
                  <View style={styles.topLabel} />
                  
                  {/* Record Indicator */}
                  {playbackState?.isPlaying &&
                    !playbackState?.isRewinding &&
                    !playbackState?.isFastForwarding &&
                    Platform.OS === 'android' && (
                      <View style={styles.recordIndicatorGlowWrapper}>
                        <View style={styles.recordIndicatorGlowOuter} />
                      </View>
                    )}
                  <View
                    style={[
                      styles.recordIndicator,
                      playbackState?.isPlaying &&
                        !playbackState?.isRewinding &&
                        !playbackState?.isFastForwarding &&
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
                {mode === 'inserted' && playbackState && (
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
                )}
              </View>
            </Animated.View>
          </>
        )}

      </View>

      {/* Back to Select Button - Only show during player modes */}
      {(mode === 'dragging' || mode === 'inserted') && (
        <View style={styles.backToSelectContainer}>
          <TouchableOpacity
            style={styles.backToSelectButton}
            onPress={async () => {
              await triggerLightHaptic();
              // Reset to selection mode
              setMode('selection');
              setPlaybackState(null);
              // Reset animations
              Animated.parallel([
                Animated.timing(playerOpacity, {
                  toValue: 0,
                  duration: 400,
                  useNativeDriver: true,
                }),
                Animated.timing(tapePositionY, {
                  toValue: 0,
                  duration: 400,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                // Cleanup playback engine
                playbackEngine.pause();
              });
            }}
          >
            <Text style={styles.backToSelectText}>← Back to Select Mixtape</Text>
          </TouchableOpacity>
        </View>
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
    color: '#B28EF1',
    fontWeight: '300',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Staatliches',
    color: '#B28EF1',
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
  // Tape Selection Styles
  selectionTitle: {
    fontSize: 32,
    fontFamily: Platform.OS === 'web' ? 'Staatliches' : 'Staatliches',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  selectionSubtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 40,
  },
  tapeDisplayContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Changed to space-between for edge positioning
    paddingHorizontal: '10%', // 10% margin from screen edges
    marginTop: -60,
  },
  arrowButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', // Position arrows absolutely
    top: '50%',
    zIndex: 30, // Ensure arrows are above other elements
  },
  leftArrow: {
    left: 0, // Position at left edge (within 10% margin)
  },
  rightArrow: {
    right: 0, // Position at right edge (within 10% margin)
  },
  arrowText: {
    fontSize: 64,
    color: '#B28EF1',
    fontWeight: 'bold',
  },
  tapeWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60, // More padding to account for absolute positioned arrows
  },
  tapeTitle: {
    fontSize: 28,
    fontFamily: Platform.OS === 'web' ? 'Staatliches' : 'Staatliches',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 60,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  // Drag Interaction Styles
  draggableTape: {
    position: 'absolute',
    top: '20%', // Updated to 20% from top
    width: '100%',
    alignItems: 'center',
    zIndex: 10, // Lower than player so it goes behind
  },
  playerContainer: {
    position: 'absolute',
    bottom: '30%', // Updated to 30% from bottom
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 20, // Higher than tape to cover it
  },
  dragHint: {
    fontSize: 16,
    color: '#B28EF1',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
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
    fontFamily: 'Staatliches',
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
    alignSelf: 'center',
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
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  topLabelArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  topEjectButton: {
    backgroundColor: '#ef4444',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
      },
    }),
  },
  topEjectButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  flipButtonContainer: {
    position: 'absolute',
    top: '25%', // 5% below the cassette (cassette is at 20% from top)
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 25, // Above player to ensure visibility
  },
  flipButton: {
    backgroundColor: '#B28EF1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#B28EF1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(178, 142, 241, 0.3)',
      },
    }),
  },
  flipButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  topLabel: {
    flex: 1,
    height: 35, // Made smaller
    backgroundColor: '#4E9E9A',
    borderRadius: 17.5,
    marginRight: 12,
    borderWidth: 3, // Made thinner
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
        backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 50%, rgba(255, 255, 255, 0.08) 100%)',
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
  backToSelectContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 25, // Above other elements but below any modals
  },
  backToSelectButton: {
    backgroundColor: 'rgba(178, 142, 241, 0.2)',
    borderWidth: 1,
    borderColor: '#B28EF1',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#B28EF1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 12px rgba(178, 142, 241, 0.3)',
      },
    }),
  },
  backToSelectText: {
    fontSize: 16,
    color: '#B28EF1',
    fontWeight: '600',
    textAlign: 'center',
  },

  statusText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 16,
  },
});
