/**
 * Mixtape Export/Sharing Screen
 * Requirements: 3.3, 5.1, 12.4
 * 
 * Provides interface for:
 * - Adding optional note/message to mixtape
 * - Customizing envelope appearance
 * - Exporting mixtape as .mixblues archive
 * - Options to upload to backend or save locally
 * - Handling export success/failure states
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from '../components';
import EnvelopeCustomizer from '../components/EnvelopeCustomizer';
import { EnvelopeCustomization, Mixtape } from '../models';
import { createAudioRepository, createMixtapeRepository } from '../repositories/adapters/StorageFactory';
import { ArchiveManager } from '../services/ArchiveManager';
import {
  triggerErrorHaptic,
  triggerLightHaptic,
  triggerSuccessHaptic,
} from '../utils/haptics';

type ExportState = 'idle' | 'exporting' | 'success' | 'error';

export default function MixtapeExportScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const mixtapeId = params.id as string;

  const [mixtape, setMixtape] = useState<Mixtape | null>(null);
  const [note, setNote] = useState('');
  const [envelope, setEnvelope] = useState<EnvelopeCustomization>({
    color: '#FFF8DC', // Default cream color
  });
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [shareableUrl, setShareableUrl] = useState('');

  const mixtapeRepo = createMixtapeRepository();
  const archiveManager = new ArchiveManager();

  /**
   * Safe navigation back - handles case when there's no history
   */
  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/library');
    }
  };

  /**
   * Load mixtape data on mount
   */
  useEffect(() => {
    loadMixtape();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixtapeId]);

  /**
   * Load mixtape from repository
   */
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
      // Initialize note and envelope from existing mixtape data
      setNote(loadedMixtape.note || '');
      setEnvelope(loadedMixtape.envelope);
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading mixtape:', error);
      }
      await triggerErrorHaptic();
      showToast('Failed to load mixtape', 'error');
      navigateBack();
    }
  };

  /**
   * Save note and envelope customization to mixtape
   * Requirements: 3.3, 5.5
   */
  const saveMixtapeMetadata = async (): Promise<Mixtape | null> => {
    if (!mixtape) return null;

    const updatedMixtape: Mixtape = {
      ...mixtape,
      note: note.trim() || undefined,
      envelope,
      updatedAt: new Date(),
    };

    try {
      await mixtapeRepo.save(updatedMixtape);
      setMixtape(updatedMixtape);
      return updatedMixtape;
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving mixtape metadata:', error);
      }
      throw error;
    }
  };

  /**
   * Collect audio files for tracks with local sources
   */
  const collectAudioFiles = async (): Promise<Map<string, Blob>> => {
    if (!mixtape) return new Map();

    const audioFiles = new Map<string, Blob>();
    const audioRepo = createAudioRepository();
    const allTracks = [...mixtape.sideA, ...mixtape.sideB];
    
    for (const track of allTracks) {
      // Try to get audio file from repository for ALL tracks
      // The repository stores local copies even for URL-based tracks
      try {
        const audioUri = await audioRepo.getAudioFile(track.id);
        
        if (audioUri) {
          // Fetch the audio file and convert to blob
          const response = await fetch(audioUri);
          let blob = await response.blob();
          
          // Ensure blob has correct MIME type
          // If blob type is empty or generic, try to infer from track source
          if (!blob.type || blob.type === 'application/octet-stream') {
            // Try to get MIME type from original source URI
            const mimeType = track.source.uri.endsWith('.mp3') ? 'audio/mpeg' :
                            track.source.uri.endsWith('.aac') ? 'audio/aac' :
                            track.source.uri.endsWith('.wav') ? 'audio/wav' :
                            track.source.uri.endsWith('.m4a') ? 'audio/mp4' :
                            'audio/mpeg'; // default to mp3
            
            // Create new blob with correct type
            blob = new Blob([blob], { type: mimeType });
          }
          
          audioFiles.set(track.id, blob);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(`Failed to collect audio for track ${track.id}:`, error);
        }
        // Continue with other tracks even if one fails
      }
    }

    return audioFiles;
  };

  /**
   * Export mixtape to local storage
   * Requirements: 12.4
   */
  const handleExportLocally = async () => {
    if (!mixtape) return;

    await triggerLightHaptic();
    setExportState('exporting');
    setErrorMessage('');

    try {
      // Save note and envelope customization first
      const updatedMixtape = await saveMixtapeMetadata();
      if (!updatedMixtape) return;

      // Collect audio files
      const audioFiles = await collectAudioFiles();

      // Create archive with audio files using the updated mixtape
      const archiveBlob = await archiveManager.createArchive(updatedMixtape, audioFiles);

      // Save to device storage
      if (Platform.OS === 'web') {
        // Web: Trigger download
        const url = URL.createObjectURL(archiveBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${mixtape.title.replace(/[^a-z0-9]/gi, '_')}.mixblues`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Mobile: Use Expo FileSystem to save and Sharing to export
        const { Directory, File, Paths } = await import('expo-file-system');
        const Sharing = await import('expo-sharing');
        
        // Check if archiveBlob has base64 data (React Native)
        const base64Data = (archiveBlob as any)._base64 ? (archiveBlob as any).data : null;
        
        if (base64Data) {
          // Create temporary exports directory
          const exportsDir = new Directory(Paths.cache, 'exports');
          if (!exportsDir.exists) {
            await exportsDir.create();
          }
          
          // Convert base64 to Uint8Array for File API
          const fileName = `${mixtape.title.replace(/[^a-z0-9]/gi, '_')}.mixblues`;
          const file = new File(exportsDir, fileName);
          
          // Decode base64 to binary
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          // Write binary data to file
          await file.write(bytes);
          
          // Check if sharing is available
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            // Open share dialog - user can save to Downloads or share via other apps
            await Sharing.shareAsync(file.uri, {
              mimeType: 'application/zip',
              dialogTitle: 'Save Mixtape Archive',
              UTI: 'public.zip-archive',
            });
          } else {
            // Fallback: just show the file location
            Alert.alert(
              'Export Complete',
              `Mixtape saved to:\n${file.uri}\n\nYou can find it in the app's cache folder.`,
              [{ text: 'OK' }]
            );
          }
        } else {
          throw new Error('Invalid archive format for React Native');
        }
      }

      setExportState('success');
      await triggerSuccessHaptic();
      
      // Show success message only on web (mobile uses share dialog)
      if (Platform.OS === 'web') {
        showToast('Mixtape saved successfully', 'success');
        setTimeout(() => {
          navigateBack();
        }, 1500);
      } else {
        // On mobile, navigate back after a short delay
        showToast('Mixtape exported successfully', 'success');
        setTimeout(() => {
          navigateBack();
        }, 1500);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error exporting mixtape:', error);
      }
      await triggerErrorHaptic();
      setExportState('error');
      setErrorMessage('Failed to export mixtape. Please try again.');
      showToast('Failed to export mixtape', 'error');
    }
  };

  /**
   * Upload mixtape to backend and get shareable URL
   * Requirements: 12.4, 16.5
   */
  const handleUploadToBackend = async () => {
    if (!mixtape) return;

    await triggerLightHaptic();
    setExportState('exporting');
    setErrorMessage('');

    try {
      // Save note and envelope customization first
      const updatedMixtape = await saveMixtapeMetadata();
      if (!updatedMixtape) return;

      // Collect audio files
      const audioFiles = await collectAudioFiles();

      // Create archive with audio files using the updated mixtape
      const archiveBlob = await archiveManager.createArchive(updatedMixtape, audioFiles);

      // For React Native, we need to save to file first, then upload
      let uploadBlob = archiveBlob;
      if (Platform.OS !== 'web' && (archiveBlob as any)._base64) {
        // Save the archive to a temporary file for upload
        const { Directory, File, Paths } = await import('expo-file-system');
        const base64Data = (archiveBlob as any).data;
        
        // Create temp directory
        const tempDir = new Directory(Paths.cache, 'uploads');
        if (!tempDir.exists) {
          await tempDir.create();
        }
        
        // Save to temp file
        const fileName = `${updatedMixtape.title.replace(/[^a-z0-9]/gi, '_')}.mixblues`;
        const tempFile = new File(tempDir, fileName);
        
        // Decode base64 to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Write to file
        await tempFile.write(bytes);
        
        // Create a blob-like object with the file URI for FormData
        uploadBlob = {
          uri: tempFile.uri,
          type: 'application/zip',
          name: fileName,
        } as any;
      }

      // Upload to backend - Requirements: 16.5 (Handle network errors)
      const { BackendClient } = await import('../services/BackendClient');
      const backendClient = new BackendClient();
      const uploadResponse = await backendClient.uploadArchive(uploadBlob);
      
      setShareableUrl(uploadResponse.url);
      setExportState('success');
      await triggerSuccessHaptic();
      showToast('Mixtape uploaded successfully!', 'success');
    } catch (error) {
      if (__DEV__) {
        console.error('Error uploading mixtape:', error);
      }
      await triggerErrorHaptic();
      setExportState('error');
      // Requirements: 16.5 - Simple error message for network failures
      const errorMsg = error instanceof Error && error.message.includes('Network')
        ? 'Unable to connect to server. Please check your internet connection and try again.'
        : 'Failed to upload mixtape. Please try again or save locally.';
      setErrorMessage(errorMsg);
      showToast(errorMsg, 'error', 5000);
    }
  };



  if (!mixtape) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B28EF1" />
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
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text
          style={styles.headerTitle}
          accessibilityRole="header"
        >
          Export Mixtape
        </Text>
        <Text style={styles.headerSubtitle}>{mixtape.title}</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Note Input - Requirements: 3.3 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a Note (Optional)</Text>
          <Text style={styles.sectionDescription}>
            Write a personal message for the recipient of this mixtape
          </Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Write your message here..."
            placeholderTextColor="#666666"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
            accessibilityLabel="Mixtape note"
            accessibilityHint="Write a personal message for the recipient"
          />
          <Text style={styles.characterCount}>
            {note.length}/500 characters
          </Text>
        </View>

        {/* Envelope Customization - Requirements: 5.1 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customize Envelope</Text>
          <Text style={styles.sectionDescription}>
            Personalize the envelope appearance for sharing
          </Text>
          <EnvelopeCustomizer
            envelope={envelope}
            onEnvelopeChange={setEnvelope}
          />
        </View>

        {/* Export Options - Requirements: 12.4 */}
        <View style={styles.exportSection}>
          <Text style={styles.sectionTitle}>Export Options</Text>
          
          {exportState === 'idle' && (
            <>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={handleUploadToBackend}
                accessibilityLabel="Upload and share mixtape"
                accessibilityRole="button"
                accessibilityHint="Upload mixtape to get a shareable URL"
              >
                <Text style={styles.exportButtonIcon}>🌐</Text>
                <View style={styles.exportButtonContent}>
                  <Text style={styles.exportButtonText}>Upload & Share</Text>
                  <Text style={styles.exportButtonDescription}>
                    Get a shareable URL to send to others
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.exportButton, styles.secondaryExportButton]}
                onPress={handleExportLocally}
                accessibilityLabel="Save mixtape locally"
                accessibilityRole="button"
                accessibilityHint="Download mixtape file to your device"
              >
                <Text style={styles.exportButtonIcon}>💾</Text>
                <View style={styles.exportButtonContent}>
                  <Text style={styles.exportButtonText}>Save Locally</Text>
                  <Text style={styles.exportButtonDescription}>
                    Download .mixblues file to your device
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {exportState === 'exporting' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#B28EF1" />
              <Text style={styles.loadingText}>Exporting mixtape...</Text>
            </View>
          )}

          {exportState === 'success' && (
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>Export Successful!</Text>
              {shareableUrl && (
                <View style={styles.urlContainer}>
                  <Text style={styles.urlLabel}>Shareable URL:</Text>
                  <Text style={styles.urlText}>{shareableUrl}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.doneButton}
                onPress={navigateBack}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {exportState === 'error' && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>✕</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setExportState('idle')}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
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
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#B28EF1',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Staatliches',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888888',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Staatliches',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
  },
  noteInput: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#B28EF1',
    borderRadius: 8,
    padding: 16,
    fontSize: 15,
    color: '#ffffff',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
    marginTop: 8,
  },
  exportSection: {
    padding: 20,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#B28EF1',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  secondaryExportButton: {
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  exportButtonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  exportButtonContent: {
    flex: 1,
  },
  exportButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  exportButtonDescription: {
    fontSize: 13,
    color: '#cccccc',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
  },
  successIcon: {
    fontSize: 64,
    color: '#4ade80',
    marginBottom: 16,
  },
  successText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  urlContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  urlLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
  },
  urlText: {
    fontSize: 13,
    color: '#B28EF1',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  doneButton: {
    backgroundColor: '#B28EF1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
  },
  errorIcon: {
    fontSize: 64,
    color: '#ff6b6b',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3a3a3a',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
