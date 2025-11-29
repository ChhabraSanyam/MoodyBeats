/**
 * Mixtape Creator Screen (Maker Mode)
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5
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
} from 'react-native';
import { LoadingOverlay, useToast } from '../components';
import TapeShellDesigner from '../components/TapeShellDesigner';
import TrackList from '../components/TrackList';
import { AudioSource, Mixtape, TapeTheme, Track } from '../models';
import { createAudioRepository, createMixtapeRepository } from '../repositories/adapters/StorageFactory';
import { validateAudioSource, validateAudioUrl } from '../repositories/utils/audioValidation';
import {
    triggerErrorHaptic,
    triggerLightHaptic,
    triggerSuccessHaptic,
} from '../utils/haptics';

export default function MixtapeCreatorScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [trackPool, setTrackPool] = useState<Track[]>([]);
  const [sideA, setSideA] = useState<Track[]>([]);
  const [sideB, setSideB] = useState<Track[]>([]);
  const [mixtapeTitle, setMixtapeTitle] = useState('');
  const [currentMixtapeId, setCurrentMixtapeId] = useState<string>('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isUrlValid, setIsUrlValid] = useState(false);
  const [showThemeDesigner, setShowThemeDesigner] = useState(false);
  const [tapeTheme, setTapeTheme] = useState<TapeTheme>({
    preset: 'vhs-static-grey',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const mixtapeRepo = createMixtapeRepository();
  const audioRepo = createAudioRepository();

  /**
   * Generate a unique UUID for the mixtape
   * Requirements: 3.1
   */
  const generateMixtapeId = (): string => {
    // Generate UUID v4 using a simple UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  /**
   * Initialize or load existing mixtape
   */
  useEffect(() => {
    // Generate a unique UUID for the new mixtape
    // Requirements: 3.1
    const newId = generateMixtapeId();
    setCurrentMixtapeId(newId);
     
  }, []); // Only run once on mount

  /**
   * Persist mixtape changes to storage
   * Requirements: 2.5, 3.2, 3.4, 4.5
   */
  const persistMixtape = useCallback(async () => {
    if (!currentMixtapeId) return;

    // Don't save empty mixtapes (no tracks on either side)
    const totalTracks = sideA.length + sideB.length;
    if (totalTracks === 0) {
      console.log('Skipping save: No tracks in mixtape');
      return;
    }

    // Check if mixtape already exists to preserve createdAt
    const existingMixtape = await mixtapeRepo.getById(currentMixtapeId);

    const mixtape: Mixtape = {
      id: currentMixtapeId,
      title: mixtapeTitle || 'Untitled Mixtape',
      sideA,
      sideB,
      theme: tapeTheme, // Store theme data with mixtape - Requirements: 4.5
      envelope: {
        color: '#FFE4B5',
      },
      createdAt: existingMixtape?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    try {
      // Always save the mixtape, even with local files
      await mixtapeRepo.save(mixtape);
      console.log('Mixtape saved successfully');
    } catch (error) {
      console.error('Error saving mixtape:', error);
      await triggerErrorHaptic();
      showToast('Failed to save mixtape', 'error');
    }
  }, [currentMixtapeId, mixtapeTitle, sideA, sideB, tapeTheme, mixtapeRepo, showToast]);

  /**
   * Persist changes whenever sideA, sideB, title, or theme changes
   * Requirements: 2.5, 3.2, 4.5
   * Debounced to prevent excessive saves
   */
  useEffect(() => {
    // Only attempt to save if there are tracks
    if (currentMixtapeId && (sideA.length > 0 || sideB.length > 0)) {
      const timeoutId = setTimeout(() => {
        persistMixtape();
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sideA, sideB, mixtapeTitle, tapeTheme, currentMixtapeId]);

  /**
   * Handles local audio file upload
   * Requirements: 1.1
   */
  const handleLocalFileUpload = async () => {
    await triggerLightHaptic();
    setIsLoading(true);
    setLoadingMessage('Uploading audio file...');
    
    try {
      // Web-specific file picker using HTML input
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;
          
          // Create a blob URL for the file
          const blobUrl = URL.createObjectURL(file);
          
          // Create audio source
          const audioSource: AudioSource = {
            type: 'local',
            uri: blobUrl,
          };

          // Extract track name from filename
          const trackName = file.name || 'Unknown Track';

          // Create track object
          const newTrack: Track = {
            id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: trackName.replace(/\.[^/.]+$/, ''), // Remove extension
            duration: 0, // Will be determined during playback
            source: audioSource,
          };

          // Save audio file to repository for export
          try {
            await audioRepo.saveAudioFile(newTrack.id, blobUrl);
          } catch (error) {
            console.error(`Failed to save audio file for track ${newTrack.id}:`, error);
          }

          // Add to track pool
          setTrackPool([...trackPool, newTrack]);
        };
        
        input.click();
        return;
      }
      
      // Native file picker using expo-document-picker
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Create audio source
      const audioSource: AudioSource = {
        type: 'local',
        uri: file.uri,
      };

      // Validate audio source
      const validation = validateAudioSource(audioSource);
      if (!validation.valid) {
        Alert.alert('Invalid Audio File', validation.error || 'Unsupported audio format');
        return;
      }

      // Extract track name from filename
      const trackName = file.name || 'Unknown Track';

      // Create track object
      const newTrack: Track = {
        id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: trackName.replace(/\.[^/.]+$/, ''), // Remove extension
        duration: 0, // Will be determined during playback
        source: audioSource,
      };

      // Save audio file to repository for export
      try {
        await audioRepo.saveAudioFile(newTrack.id, file.uri);
      } catch (error) {
        console.error(`Failed to save audio file for track ${newTrack.id}:`, error);
      }

      // Add to track pool
      setTrackPool([...trackPool, newTrack]);
      
      await triggerSuccessHaptic();
      showToast(`Added "${newTrack.title}" to track pool`, 'success');
    } catch (error) {
      console.error('Error picking audio file:', error);
      await triggerErrorHaptic();
      showToast('Failed to upload audio file', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validates URL input in real-time
   */
  const handleUrlInputChange = (text: string) => {
    setUrlInput(text);
    
    // Validate the URL
    if (!text.trim()) {
      setIsUrlValid(false);
      return;
    }
    
    const validation = validateAudioUrl(text.trim());
    
    // On web, only accept direct audio URLs
    if (Platform.OS === 'web') {
      setIsUrlValid(validation.valid && validation.provider === 'direct');
    } else {
      // On native, accept all valid URLs
      setIsUrlValid(validation.valid);
    }
  };

  /**
   * Handles URL-based audio source addition
   * Requirements: 1.2, 16.5
   */
  const handleUrlSubmit = async () => {
    await triggerLightHaptic();
    
    if (!urlInput.trim()) {
      await triggerErrorHaptic();
      showToast('Please enter a URL', 'error');
      return;
    }

    // Validate URL
    const validation = validateAudioUrl(urlInput.trim());
    if (!validation.valid) {
      // Requirements: 16.5 - Simple error message for URL validation failures
      const errorMsg = validation.error || 'Unsupported audio source';
      await triggerErrorHaptic();
      showToast(errorMsg, 'error');
      return;
    }

    // On web, only direct audio URLs are supported (not Spotify/YouTube)
    if (Platform.OS === 'web' && validation.provider !== 'direct') {
      await triggerErrorHaptic();
      showToast(
        `${validation.provider?.toUpperCase()} URLs are not supported on web. Please use direct MP3/AAC/WAV URLs.`,
        'error',
        5000
      );
      return;
    }

    // Create audio source
    const audioSource: AudioSource = {
      type: 'url',
      uri: urlInput.trim(),
      metadata: {
        provider: validation.provider,
      },
    };

    // Create track object with provider-based title
    const providerName = validation.provider?.toUpperCase() || 'URL';
    const newTrack: Track = {
      id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${providerName} Track`,
      duration: 0, // Will be determined during playback
      source: audioSource,
    };

    // Add to track pool
    setTrackPool([...trackPool, newTrack]);
    
    // Reset and close modal
    setUrlInput('');
    setIsUrlValid(false);
    setShowUrlModal(false);
    
    await triggerSuccessHaptic();
    showToast(`Added "${newTrack.title}" to track pool`, 'success');
  };

  /**
   * Removes a track from the track pool
   */
  const handleRemoveTrack = (trackId: string) => {
    setTrackPool(trackPool.filter(track => track.id !== trackId));
  };

  /**
   * Handles track placement from track pool to Side A or Side B
   * Requirements: 2.2
   */
  const handleTrackPlacement = (track: Track, side: 'A' | 'B') => {
    // Remove from track pool
    setTrackPool(trackPool.filter(t => t.id !== track.id));
    
    // Add to the appropriate side
    if (side === 'A') {
      setSideA([...sideA, track]);
    } else {
      setSideB([...sideB, track]);
    }
  };

  /**
   * Handles reordering within a side
   * Requirements: 2.3
   */
  const handleReorder = (side: 'A' | 'B', fromIndex: number, toIndex: number) => {
    if (side === 'A') {
      const newSideA = [...sideA];
      const [movedTrack] = newSideA.splice(fromIndex, 1);
      newSideA.splice(toIndex, 0, movedTrack);
      setSideA(newSideA);
    } else {
      const newSideB = [...sideB];
      const [movedTrack] = newSideB.splice(fromIndex, 1);
      newSideB.splice(toIndex, 0, movedTrack);
      setSideB(newSideB);
    }
  };

  /**
   * Handles track removal from a side
   * Requirements: 2.4
   */
  const handleRemoveFromSide = (trackId: string, side: 'A' | 'B') => {
    if (side === 'A') {
      const removedTrack = sideA.find(t => t.id === trackId);
      setSideA(sideA.filter(t => t.id !== trackId));
      if (removedTrack) {
        setTrackPool([...trackPool, removedTrack]);
      }
    } else {
      const removedTrack = sideB.find(t => t.id === trackId);
      setSideB(sideB.filter(t => t.id !== trackId));
      if (removedTrack) {
        setTrackPool([...trackPool, removedTrack]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={isLoading} message={loadingMessage} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={async () => {
              await triggerLightHaptic();
              router.push('/');
            }}
            accessibilityLabel="Go to home screen"
            accessibilityRole="button"
          >
            <Text style={styles.homeButtonText}>← Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.libraryButton}
            onPress={async () => {
              await triggerLightHaptic();
              router.push('/library');
            }}
            accessibilityLabel="Go to library"
            accessibilityRole="button"
          >
            <Text style={styles.libraryButtonText}>📚 Library</Text>
          </TouchableOpacity>
        </View>
        <Text
          style={styles.headerTitle}
          accessibilityRole="header"
        >
          Create Mixtape
        </Text>
        <Text style={styles.headerSubtitle}>Maker Mode</Text>
        
        {/* Mixtape Title Input */}
        <TextInput
          style={styles.titleInput}
          placeholder="Mixtape Title..."
          placeholderTextColor="#666666"
          value={mixtapeTitle}
          onChangeText={setMixtapeTitle}
          accessibilityLabel="Mixtape title"
          accessibilityHint="Enter a title for your mixtape"
        />
        
        {/* Theme Designer Button - Requirements: 4.1 */}
        <TouchableOpacity
          style={styles.themeButton}
          onPress={async () => {
            await triggerLightHaptic();
            setShowThemeDesigner(true);
          }}
          accessibilityLabel="Customize tape shell"
          accessibilityRole="button"
          accessibilityHint="Open tape shell designer to customize appearance"
        >
          <Text style={styles.themeButtonText}>🎨 Customize Tape Shell</Text>
        </TouchableOpacity>
        
        {/* Export Button */}
        {(sideA.length > 0 || sideB.length > 0) && (
          <TouchableOpacity
            style={[styles.themeButton, styles.exportButton]}
            onPress={async () => {
              await triggerLightHaptic();
              router.push(`/export?id=${currentMixtapeId}`);
            }}
            accessibilityLabel="Export mixtape"
            accessibilityRole="button"
            accessibilityHint="Navigate to export screen"
          >
            <Text style={styles.themeButtonText}>📤 Export Mixtape</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Track Pool Section */}
        <View style={styles.trackPoolSection}>
          <Text style={styles.sectionTitle}>Track Pool</Text>
          
          {/* Add Track Buttons */}
          <View style={styles.addButtonsContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleLocalFileUpload}
              accessibilityLabel="Upload local audio file"
              accessibilityRole="button"
              accessibilityHint="Select an audio file from your device"
            >
              <Text style={styles.addButtonText}>📁 Upload Local File</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={async () => {
                await triggerLightHaptic();
                setShowUrlModal(true);
              }}
              accessibilityLabel="Add track from URL"
              accessibilityRole="button"
              accessibilityHint="Add a track from an online URL"
            >
              <Text style={styles.addButtonText}>🔗 Add from URL</Text>
            </TouchableOpacity>
          </View>

          {/* Track Pool List - Requirements: 1.3 (Display track name and metadata in creation mode) */}
          <View style={styles.trackPoolList}>
            {trackPool.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No tracks in pool</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add tracks from local files or URLs
                </Text>
              </View>
            ) : (
              trackPool.map((track) => (
                <View key={track.id} style={styles.trackItem}>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle}>{track.title}</Text>
                    {track.artist && (
                      <Text style={styles.trackArtist}>{track.artist}</Text>
                    )}
                    <Text style={styles.trackMetadata}>
                      {track.source.type === 'url' 
                        ? `${track.source.metadata?.provider?.toUpperCase() || 'URL'} • ${track.source.uri.substring(0, 40)}...`
                        : `Local File • ${track.source.uri.split('/').pop()?.substring(0, 30)}...`
                      }
                    </Text>
                  </View>
                  <View style={styles.trackActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleTrackPlacement(track, 'A')}
                    >
                      <Text style={styles.actionButtonText}>→ A</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleTrackPlacement(track, 'B')}
                    >
                      <Text style={styles.actionButtonText}>→ B</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveTrack(track.id)}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Side A and Side B Columns - Requirements: 2.1 */}
        <View style={styles.sidesContainer}>
          <View style={styles.sideColumn}>
            <Text style={styles.sideTitle}>Side A</Text>
            <TrackList
              tracks={sideA}
              side="A"
              onReorder={handleReorder}
              onRemove={handleRemoveFromSide}
            />
          </View>

          <View style={styles.sideColumn}>
            <Text style={styles.sideTitle}>Side B</Text>
            <TrackList
              tracks={sideB}
              side="B"
              onReorder={handleReorder}
              onRemove={handleRemoveFromSide}
            />
          </View>
        </View>
      </ScrollView>

      {/* URL Input Modal - Requirements: 1.2 */}
      <Modal
        visible={showUrlModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUrlModal(false)}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay} accessible={false}>
          <View style={styles.modalContent} accessible={true}>
            <Text style={styles.modalTitle}>Add Track from URL</Text>
            <Text style={styles.modalSubtitle}>
              Supported: Direct MP3/AAC/WAV URLs only
            </Text>
            
            <TextInput
              style={styles.urlInput}
              placeholder="Enter URL..."
              value={urlInput}
              onChangeText={handleUrlInputChange}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setUrlInput('');
                  setIsUrlValid(false);
                  setShowUrlModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonSubmit,
                  !isUrlValid && styles.modalButtonDisabled
                ]}
                onPress={handleUrlSubmit}
                disabled={!isUrlValid}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextSubmit]}>
                  Add Track
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Theme Designer Modal - Requirements: 4.1, 4.2, 4.3, 4.4 */}
      <Modal
        visible={showThemeDesigner}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowThemeDesigner(false)}
        accessible={true}
        accessibilityViewIsModal={true}
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
  homeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  homeButtonText: {
    fontSize: 16,
    color: '#4a9eff',
    fontWeight: '600',
  },
  libraryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  libraryButtonText: {
    fontSize: 16,
    color: '#4a9eff',
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
    marginBottom: 12,
  },
  titleInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    marginTop: 8,
  },
  themeButton: {
    backgroundColor: '#4a9eff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  themeButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: '#34d399',
  },
  scrollContainer: {
    flex: 1,
  },
  trackPoolSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  addButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  trackPoolList: {
    maxHeight: 300,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#555555',
  },
  trackItem: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: '#aaaaaa',
    marginBottom: 4,
  },
  trackMetadata: {
    fontSize: 12,
    color: '#777777',
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#4a9eff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sidesContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  sideColumn: {
    flex: 1,
  },
  sideTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 20,
    lineHeight: 18,
  },
  urlInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  modalButtonSubmit: {
    backgroundColor: '#4a9eff',
  },
  modalButtonDisabled: {
    backgroundColor: '#3a3a3a',
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalButtonTextSubmit: {
    color: '#ffffff',
  },
  themeDesignerContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  themeDesignerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  themeDesignerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  themeDesignerCloseButton: {
    backgroundColor: '#4a9eff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  themeDesignerCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
