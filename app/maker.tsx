/**
 * Redesigned Mixtape Creator Screen
 * Modern UI with drag-and-drop functionality
 */

import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { LoadingOverlay, useToast } from '../components';
import TapeShellDesigner from '../components/TapeShellDesigner';
import { AudioSource, Mixtape, TapeTheme, Track } from '../models';
import { createAudioRepository, createMixtapeRepository } from '../repositories/adapters/StorageFactory';
import { validateAudioSource, validateAudioUrl } from '../repositories/utils/audioValidation';
import {
  triggerErrorHaptic,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '../utils/haptics';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Hoverable Button Component for Web
interface HoverableButtonProps {
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  children: React.ReactNode;
  glowColor?: string;
}

function HoverableButton({ onPress, style, textStyle, children, glowColor = '#d4b8ff' }: HoverableButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (Platform.OS !== 'web') {
    return (
      <TouchableOpacity onPress={onPress} style={style}>
        <Text style={textStyle}>{children}</Text>
      </TouchableOpacity>
    );
  }

  const webStyle = isHovered ? {
    boxShadow: `0 0 10px ${glowColor}, 0 0 15px ${glowColor}`,
    transition: 'box-shadow 0.3s ease-in-out',
  } : {
    transition: 'box-shadow 0.3s ease-in-out',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        style,
        isHovered && {
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 5,
        },
      ]}
      // @ts-ignore - Web-specific props
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // @ts-ignore - Web-specific style
      {...(Platform.OS === 'web' && { style: [style, webStyle] })}
    >
      <Text style={textStyle}>{children}</Text>
    </TouchableOpacity>
  );
}

const MAX_TAPE_DURATION = 30 * 60; // 30 minutes in seconds

// Track Item Component
interface DraggableTrackProps {
  track: Track;
  index: number;
  side: 'A' | 'B';
  onRemove: (trackId: string, side: 'A' | 'B') => void;
  onMove: (track: Track, fromSide: 'A' | 'B', fromIndex: number, toSide: 'A' | 'B') => void;
}

function DraggableTrack({ track, index, side, onRemove, onMove }: DraggableTrackProps) {
  const handleMoveToOtherSide = async () => {
    const targetSide = side === 'A' ? 'B' : 'A';
    console.log(`Arrow button clicked: Moving "${track.title}" from Side ${side} to Side ${targetSide}`);
    await triggerLightHaptic();
    
    // Directly call the move handler
    onMove(track, side, index, targetSide);
  };

  return (
    <View style={styles.trackItem}>
      {/* Move button on left for both web and mobile */}
      <TouchableOpacity
        style={styles.moveButtonLeft}
        onPress={handleMoveToOtherSide}
        activeOpacity={0.7}
      >
        <Text style={styles.moveButtonText}>{side === 'A' ? '↓' : '↑'}</Text>
      </TouchableOpacity>
      
      <Text style={styles.trackTitle} numberOfLines={1}>
        {track.title}
      </Text>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onRemove(track.id, side)}
      >
        <Text style={styles.deleteButtonText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MixtapeCreatorScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [sideA, setSideA] = useState<Track[]>([]);
  const [sideB, setSideB] = useState<Track[]>([]);
  const [mixtapeTitle, setMixtapeTitle] = useState('');
  const [currentMixtapeId, setCurrentMixtapeId] = useState<string>('');
  const [trackInput, setTrackInput] = useState('');
  const [showThemeDesigner, setShowThemeDesigner] = useState(false);
  const [tapeTheme, setTapeTheme] = useState<TapeTheme>({
    preset: 'vhs-static-grey',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const mixtapeRepo = createMixtapeRepository();
  const audioRepo = createAudioRepository();

  // Load Staatliches font
  const [fontsLoaded, fontError] = useFonts({
    'Staatliches': require('../assets/fonts/Staatliches-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const generateMixtapeId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  useEffect(() => {
    const newId = generateMixtapeId();
    setCurrentMixtapeId(newId);
  }, []);

  // Calculate total duration
  const calculateDuration = (tracks: Track[]): number => {
    return tracks.reduce((total, track) => total + (track.duration || 0), 0);
  };

  const totalDuration = calculateDuration([...sideA, ...sideB]);
  const durationPercentage = Math.min((totalDuration / MAX_TAPE_DURATION) * 100, 100);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const persistMixtape = useCallback(async () => {
    if (!currentMixtapeId || (sideA.length === 0 && sideB.length === 0)) return;

    const existingMixtape = await mixtapeRepo.getById(currentMixtapeId);

    const mixtape: Mixtape = {
      id: currentMixtapeId,
      title: mixtapeTitle || 'Untitled Mixtape',
      sideA,
      sideB,
      theme: tapeTheme,
      envelope: { color: '#FFE4B5' },
      createdAt: existingMixtape?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    try {
      await mixtapeRepo.save(mixtape);
    } catch (error) {
      console.error('Error saving mixtape:', error);
      await triggerErrorHaptic();
      showToast('Failed to save mixtape', 'error');
    }
  }, [currentMixtapeId, mixtapeTitle, sideA, sideB, tapeTheme, mixtapeRepo, showToast]);

  useEffect(() => {
    if (currentMixtapeId && (sideA.length > 0 || sideB.length > 0)) {
      const timeoutId = setTimeout(() => {
        persistMixtape();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [sideA, sideB, mixtapeTitle, tapeTheme, currentMixtapeId, persistMixtape]);

  // Helper function to get audio duration
  const getAudioDuration = async (url: string): Promise<number> => {
    if (Platform.OS === 'web') {
      // Web: Use HTML5 Audio API
      return new Promise((resolve) => {
        const audio = new Audio(url);
        audio.addEventListener('loadedmetadata', () => {
          resolve(Math.floor(audio.duration));
        });
        audio.addEventListener('error', () => {
          console.error('Error loading audio metadata');
          resolve(180); // Default to 3 minutes on error
        });
      });
    } else {
      // Mobile: Use expo-av
      try {
        const { Audio } = require('expo-av');
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: false }
        );
        
        if (status.isLoaded && status.durationMillis) {
          const duration = Math.floor(status.durationMillis / 1000);
          await sound.unloadAsync(); // Clean up
          return duration;
        } else {
          await sound.unloadAsync();
          console.error('Could not load audio duration');
          return 180; // Default to 3 minutes
        }
      } catch (error) {
        console.error('Error loading audio on mobile:', error);
        return 180; // Default to 3 minutes on error
      }
    }
  };

  const handleFileUpload = async () => {
    await triggerLightHaptic();
    setIsLoading(true);
    setLoadingMessage('Uploading audio file...');
    
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) {
            setIsLoading(false);
            return;
          }
          
          const blobUrl = URL.createObjectURL(file);
          
          // Get actual audio duration
          setLoadingMessage('Reading audio duration...');
          const duration = await getAudioDuration(blobUrl);
          console.log(`Audio duration: ${duration} seconds (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`);
          
          // Check if adding this track would exceed the limit
          const currentDuration = calculateDuration([...sideA, ...sideB]);
          const newTotalDuration = currentDuration + duration;
          
          if (newTotalDuration > MAX_TAPE_DURATION) {
            const remainingTime = MAX_TAPE_DURATION - currentDuration;
            await triggerErrorHaptic();
            showToast(`Cannot add track: Would exceed 30-minute limit. Only ${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')} remaining.`, 'error');
            setIsLoading(false);
            return;
          }
          
          const audioSource: AudioSource = {
            type: 'local',
            uri: blobUrl,
          };

          const trackName = file.name || 'Unknown Track';
          const newTrack: Track = {
            id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: trackName.replace(/\.[^/.]+$/, ''),
            duration: duration,
            source: audioSource,
          };

          try {
            await audioRepo.saveAudioFile(newTrack.id, blobUrl);
          } catch (error) {
            console.error(`Failed to save audio file:`, error);
          }

          setSideA([...sideA, newTrack]);
          await triggerSuccessHaptic();
          showToast(`Added "${newTrack.title}" (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`, 'success');
          setIsLoading(false);
        };
        
        input.click();
        return;
      }
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];
      const audioSource: AudioSource = {
        type: 'local',
        uri: file.uri,
      };

      const validation = validateAudioSource(audioSource);
      if (!validation.valid) {
        Alert.alert('Invalid Audio File', validation.error || 'Unsupported audio format');
        setIsLoading(false);
        return;
      }

      const trackName = file.name || 'Unknown Track';
      
      // Get audio duration for native
      setLoadingMessage('Reading audio duration...');
      const duration = await getAudioDuration(file.uri);
      
      // Check if adding this track would exceed the limit
      const currentDuration = calculateDuration([...sideA, ...sideB]);
      const newTotalDuration = currentDuration + duration;
      
      if (newTotalDuration > MAX_TAPE_DURATION) {
        const remainingTime = MAX_TAPE_DURATION - currentDuration;
        await triggerErrorHaptic();
        showToast(`Cannot add track: Would exceed 30-minute limit. Only ${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')} remaining.`, 'error');
        setIsLoading(false);
        return;
      }
      
      const newTrack: Track = {
        id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: trackName.replace(/\.[^/.]+$/, ''),
        duration: duration,
        source: audioSource,
      };

      try {
        await audioRepo.saveAudioFile(newTrack.id, file.uri);
      } catch (error) {
        console.error(`Failed to save audio file:`, error);
      }

      setSideA([...sideA, newTrack]);
      await triggerSuccessHaptic();
      showToast(`Added "${newTrack.title}" (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`, 'success');
    } catch (error) {
      console.error('Error picking audio file:', error);
      await triggerErrorHaptic();
      showToast('Failed to upload audio file', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTrack = async () => {
    await triggerLightHaptic();
    
    if (!trackInput.trim()) {
      handleFileUpload();
      return;
    }

    const validation = validateAudioUrl(trackInput.trim());
    if (!validation.valid || validation.provider !== 'direct') {
      await triggerErrorHaptic();
      showToast('Only direct MP3/AAC/WAV/M4A URLs are supported', 'error');
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Loading audio from URL...');

    try {
      // Get audio duration from URL
      const duration = await getAudioDuration(trackInput.trim());
      
      // Check if adding this track would exceed the limit
      const currentDuration = calculateDuration([...sideA, ...sideB]);
      const newTotalDuration = currentDuration + duration;
      
      if (newTotalDuration > MAX_TAPE_DURATION) {
        const remainingTime = MAX_TAPE_DURATION - currentDuration;
        await triggerErrorHaptic();
        showToast(`Cannot add track: Would exceed 30-minute limit. Only ${Math.floor(remainingTime / 60)}:${(remainingTime % 60).toString().padStart(2, '0')} remaining.`, 'error');
        setIsLoading(false);
        return;
      }

      const audioSource: AudioSource = {
        type: 'url',
        uri: trackInput.trim(),
        metadata: { provider: validation.provider },
      };

      const newTrack: Track = {
        id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: 'Audio Track',
        duration: duration,
        source: audioSource,
      };

      setSideA([...sideA, newTrack]);
      setTrackInput('');
      await triggerSuccessHaptic();
      showToast(`Added "${newTrack.title}" (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`, 'success');
    } catch (error) {
      console.error('Error adding track from URL:', error);
      await triggerErrorHaptic();
      showToast('Failed to load audio from URL', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTrack = (trackId: string, side: 'A' | 'B') => {
    if (side === 'A') {
      setSideA(sideA.filter(t => t.id !== trackId));
    } else {
      setSideB(sideB.filter(t => t.id !== trackId));
    }
  };

  const handleMoveTrack = (track: Track, fromSide: 'A' | 'B', fromIndex: number, toSide: 'A' | 'B') => {
    console.log(`handleMoveTrack: Moving "${track.title}" from Side ${fromSide} (index ${fromIndex}) to Side ${toSide}`);
    
    if (fromSide === 'A' && toSide === 'B') {
      // Remove from Side A and add to Side B using functional setState
      setSideA(prevSideA => {
        const newSideA = prevSideA.filter((_, i) => i !== fromIndex);
        console.log(`Moving A->B: sideA ${prevSideA.length}->${newSideA.length}`);
        return newSideA;
      });
      setSideB(prevSideB => {
        const newSideB = [...prevSideB, track];
        console.log(`Moving A->B: sideB ${prevSideB.length}->${newSideB.length}`);
        return newSideB;
      });
      triggerSuccessHaptic();
      showToast(`Moved "${track.title}" to Side B`, 'success');
    } else if (fromSide === 'B' && toSide === 'A') {
      // Remove from Side B and add to Side A using functional setState
      setSideB(prevSideB => {
        const newSideB = prevSideB.filter((_, i) => i !== fromIndex);
        console.log(`Moving B->A: sideB ${prevSideB.length}->${newSideB.length}`);
        return newSideB;
      });
      setSideA(prevSideA => {
        const newSideA = [...prevSideA, track];
        console.log(`Moving B->A: sideA ${prevSideA.length}->${newSideA.length}`);
        return newSideA;
      });
      triggerSuccessHaptic();
      showToast(`Moved "${track.title}" to Side A`, 'success');
    }
  };



  return (
    <View style={styles.container}>
      <LoadingOverlay visible={isLoading} message={loadingMessage} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={async () => {
            await triggerLightHaptic();
            router.back();
          }}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Your Mixtape</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Tape Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Tape Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Your Tape Title"
            placeholderTextColor="#666"
            value={mixtapeTitle}
            onChangeText={setMixtapeTitle}
          />
        </View>

        {/* Add Tracks */}
        <View style={styles.section}>
          <Text style={styles.label}>Add Tracks</Text>
          <View style={styles.addTrackContainer}>
            <TextInput
              style={styles.trackInput}
              placeholder="Paste MP3 files or Direct URLs"
              placeholderTextColor="#666"
              value={trackInput}
              onChangeText={setTrackInput}
            />
            <TouchableOpacity
              style={styles.uploadIcon}
              onPress={handleFileUpload}
            >
              <Text style={styles.uploadIconText}>📁</Text>
            </TouchableOpacity>
          </View>
          <HoverableButton
            style={styles.addButton}
            textStyle={styles.addButtonText}
            onPress={handleAddTrack}
            glowColor="#d4b8ff"
          >
            Add Track
          </HoverableButton>
        </View>

        {/* Side A */}
        <View style={styles.section}>
          <Text style={styles.sideLabel}>SIDE A</Text>
          <View style={styles.trackList}>
            {sideA.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No tracks yet
                </Text>
              </View>
            ) : (
              sideA.map((track, index) => (
                <DraggableTrack
                  key={track.id}
                  track={track}
                  index={index}
                  side="A"
                  onRemove={handleRemoveTrack}
                  onMove={handleMoveTrack}
                />
              ))
            )}
          </View>
        </View>

        {/* Side B */}
        <View style={styles.section}>
          <Text style={styles.sideLabel}>SIDE B</Text>
          <View style={[styles.trackList, styles.sideBDropZone]}>
            {sideB.length === 0 ? (
              <View style={styles.dropZone}>
                <Text style={styles.dropZoneText}>
                  Use arrow buttons to move tracks here
                </Text>
              </View>
            ) : (
              sideB.map((track, index) => (
                <DraggableTrack
                  key={track.id}
                  track={track}
                  index={index}
                  side="B"
                  onRemove={handleRemoveTrack}
                  onMove={handleMoveTrack}
                />
              ))
            )}
          </View>
        </View>

        {/* Tape Length */}
        <View style={styles.section}>
          <View style={styles.tapeLengthHeader}>
            <Text style={styles.label}>Tape Length</Text>
            <Text style={styles.durationText}>
              {formatTime(totalDuration)} / {formatTime(MAX_TAPE_DURATION)}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${durationPercentage}%` }]} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <HoverableButton
            style={styles.customizeButton}
            textStyle={styles.customizeButtonText}
            onPress={async () => {
              await triggerLightHaptic();
              setShowThemeDesigner(true);
            }}
            glowColor="#d4b8ff"
          >
            CUSTOMIZE TAPE DESIGN
          </HoverableButton>

          <HoverableButton
            style={styles.saveButton}
            textStyle={styles.saveButtonText}
            onPress={async () => {
              await triggerLightHaptic();
              await persistMixtape();
              showToast('Mixtape saved!', 'success');
              router.push('/library');
            }}
            glowColor="#4a4a4a"
          >
            SAVE MIXTAPE
          </HoverableButton>
        </View>
      </ScrollView>

      {/* Theme Designer Modal */}
      <Modal
        visible={showThemeDesigner}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowThemeDesigner(false)}
      >
        <View style={styles.themeDesignerContainer}>
          <View style={styles.themeDesignerHeader}>
            <Text style={styles.themeDesignerTitle}>Tape Shell Designer</Text>
            <TouchableOpacity
              style={styles.themeDesignerCloseButton}
              onPress={() => setShowThemeDesigner(false)}
            >
              <Text style={styles.themeDesignerCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          <TapeShellDesigner
            theme={tapeTheme}
            onThemeChange={setTapeTheme}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Staatliches',
    color: '#ffffff',
    marginLeft: 8,
    letterSpacing: 1,
    ...(Platform.OS === 'web' && {
      flex: 1,
      textAlign: 'center',
      marginRight: 48, // Balance the back button width
    }),
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Staatliches',
    color: '#888',
    marginBottom: 8,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && {
      textAlign: 'center',
    }),
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  addTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingRight: 12,
  },
  trackInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  uploadIcon: {
    padding: 8,
  },
  uploadIconText: {
    fontSize: 20,
  },
  addButton: {
    backgroundColor: '#b794f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sideLabel: {
    fontSize: 20,
    fontFamily: 'Staatliches',
    color: '#888',
    marginBottom: 12,
    letterSpacing: 1.5,
    ...(Platform.OS === 'web' && {
      textAlign: 'center',
    }),
  },
  trackList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  sideBDropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#2a2a2a',
  },
  dropZoneActive: {
    borderColor: '#b794f6',
    backgroundColor: '#1a1520',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#555',
  },
  dropZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  dropZoneText: {
    fontSize: 14,
    color: '#555',
  },
  dropZoneTextActive: {
    color: '#b794f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  trackItemDragging: {
    opacity: 0.7,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dragHandle: {
    fontSize: 16,
    color: '#666',
    marginRight: 12,
  },
  trackTitle: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
  },
  moveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  moveButtonLeft: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moveButtonText: {
    color: '#b794f6',
    fontSize: 20,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 22,
    color: '#ffffff',
  },
  tapeLengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  durationText: {
    fontSize: 14,
    color: '#888',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#b794f6',
    borderRadius: 4,
  },
  customizeButton: {
    backgroundColor: '#b794f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  customizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  saveButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  themeDesignerContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  themeDesignerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  themeDesignerTitle: {
    fontSize: 26,
    fontFamily: 'Staatliches',
    color: '#ffffff',
    letterSpacing: 1,
  },
  themeDesignerCloseButton: {
    backgroundColor: '#b794f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  themeDesignerCloseButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});
