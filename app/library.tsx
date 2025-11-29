/**
 * Mixtape Library Screen
 * Requirements: 3.4, 3.5
 * Performance optimized with lazy loading and batching
 */

import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItemInfo,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { EnvelopeIntro } from '../components';
import { Mixtape } from '../models';
import { createAudioRepository, createMixtapeRepository } from '../repositories/adapters/StorageFactory';
import { ArchiveManager } from '../services/ArchiveManager';

export default function MixtapeLibraryScreen() {
  const [mixtapes, setMixtapes] = useState<Mixtape[]>([]);
  const [displayedMixtapes, setDisplayedMixtapes] = useState<Mixtape[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mixtapeToDelete, setMixtapeToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showEnvelopeIntro, setShowEnvelopeIntro] = useState(false);
  const [importedMixtape, setImportedMixtape] = useState<Mixtape | null>(null);
  const [loadedCount, setLoadedCount] = useState(10); // Initial batch size
  const router = useRouter();
  const mixtapeRepo = useMemo(() => createMixtapeRepository(), []);
  const audioRepo = useMemo(() => createAudioRepository(), []);
  const archiveManager = useMemo(() => new ArchiveManager(), []);

  /**
   * Check if a blob URL is still valid (can be accessed)
   */
  const isBlobUrlValid = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Try to load the blob URL as an audio element
      const audio = new Audio();
      
      // Set a timeout in case the audio never loads or errors
      const timeout = setTimeout(() => {
        resolve(false);
      }, 1000);
      
      audio.onloadedmetadata = () => {
        // If metadata loads, the blob is valid
        clearTimeout(timeout);
        resolve(true);
      };
      
      audio.onerror = () => {
        // If there's an error, the blob URL is invalid (from previous session)
        clearTimeout(timeout);
        resolve(false);
      };
      
      audio.src = url;
    });
  };

  /**
   * Load all saved mixtapes from storage with lazy loading
   * Requirements: 3.4, 3.5
   */
  const loadMixtapes = useCallback(async () => {
    try {
      const allMixtapes = await mixtapeRepo.getAll();
      
      // On web, check for and remove mixtapes with invalid blob URLs
      if (Platform.OS === 'web') {
        const mixtapesToDelete: string[] = [];
        
        for (const mixtape of allMixtapes) {
          // Get all blob URLs from the mixtape
          const blobUrls = [...mixtape.sideA, ...mixtape.sideB]
            .filter(track => track.source.type === 'local' && track.source.uri.startsWith('blob:'))
            .map(track => track.source.uri);
          
          // If mixtape has blob URLs, check if any are invalid
          if (blobUrls.length > 0) {
            // Check the first blob URL - if it's invalid, the whole mixtape is from a previous session
            const isValid = await isBlobUrlValid(blobUrls[0]);
            if (!isValid) {
              mixtapesToDelete.push(mixtape.id);
            }
          }
        }
        
        // Delete mixtapes with invalid blob URLs (batch operation)
        if (mixtapesToDelete.length > 0) {
          await Promise.all(mixtapesToDelete.map(id => 
            mixtapeRepo.delete(id).catch(error => 
              console.error(`Failed to delete mixtape ${id}:`, error)
            )
          ));
        }
        
        // Filter out deleted mixtapes
        const validMixtapes = allMixtapes.filter(
          mixtape => !mixtapesToDelete.includes(mixtape.id)
        );
        
        // Sort by updatedAt, most recent first
        validMixtapes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setMixtapes(validMixtapes);
        // Initially display only first batch
        setDisplayedMixtapes(validMixtapes.slice(0, loadedCount));
      } else {
        // On native, keep all mixtapes
        allMixtapes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setMixtapes(allMixtapes);
        // Initially display only first batch
        setDisplayedMixtapes(allMixtapes.slice(0, loadedCount));
      }
    } catch (error) {
      console.error('Error loading mixtapes:', error);
      Alert.alert('Error', 'Failed to load mixtapes');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [mixtapeRepo, loadedCount]);

  useEffect(() => {
    loadMixtapes();
  }, [loadMixtapes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setLoadedCount(10); // Reset to initial batch
    loadMixtapes();
  }, [loadMixtapes]);

  /**
   * Load more mixtapes when scrolling (lazy loading)
   */
  const loadMore = useCallback(() => {
    if (displayedMixtapes.length < mixtapes.length) {
      const nextCount = Math.min(loadedCount + 10, mixtapes.length);
      setLoadedCount(nextCount);
      setDisplayedMixtapes(mixtapes.slice(0, nextCount));
    }
  }, [displayedMixtapes.length, mixtapes, loadedCount]);

  /**
   * Handle mixtape deletion - show confirmation modal
   */
  const handleDeleteMixtape = (id: string, title: string) => {
    setMixtapeToDelete({ id, title });
    setShowDeleteModal(true);
  };

  /**
   * Confirm and execute mixtape deletion
   * Also cleans up associated audio files from storage
   */
  const confirmDelete = async () => {
    if (!mixtapeToDelete) return;

    try {
      // First, get the mixtape to find all track IDs for cleanup
      const mixtape = await mixtapeRepo.getById(mixtapeToDelete.id);
      
      if (mixtape) {
        // Clean up audio files for all tracks
        const allTracks = [...mixtape.sideA, ...mixtape.sideB];
        for (const track of allTracks) {
          try {
            await audioRepo.deleteAudioFile(track.id);
          } catch (error) {
            // Log but don't fail deletion if audio cleanup fails
            console.warn(`Failed to delete audio file for track ${track.id}:`, error);
          }
        }
      }
      
      // Delete the mixtape itself
      await mixtapeRepo.delete(mixtapeToDelete.id);
      await loadMixtapes();
      setShowDeleteModal(false);
      setMixtapeToDelete(null);
    } catch (error) {
      console.error('Error deleting mixtape:', error);
      Alert.alert('Error', 'Failed to delete mixtape');
    }
  };

  /**
   * Cancel deletion
   */
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setMixtapeToDelete(null);
  };

  /**
   * Handle import from URL
   * Requirements: 14.1, 14.3, 14.4, 14.5, 13.3, 13.4, 13.5
   */
  const handleImportFromURL = async () => {
    if (!importUrl.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    setIsImporting(true);

    try {
      const mixtape = await archiveManager.importFromURL(importUrl.trim());
      
      setShowImportModal(false);
      setImportUrl('');
      await loadMixtapes();
      
      // Show envelope intro animation
      setImportedMixtape(mixtape);
      setShowEnvelopeIntro(true);
    } catch (error) {
      console.error('Error importing from URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Import Failed', errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Handle import from local file
   * Requirements: 14.2, 14.3, 14.4, 14.5, 13.3, 13.4, 13.5
   */
  const handleImportFromFile = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: Use file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.mixblues,application/zip';
        
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          
          if (!file) return;
          
          setIsImporting(true);
          setShowImportModal(false);
          
          try {
            const mixtape = await archiveManager.importFromFile(file);
            await loadMixtapes();
            
            // Show envelope intro animation
            setImportedMixtape(mixtape);
            setShowEnvelopeIntro(true);
          } catch (error) {
            console.error('Error importing from file:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Import Failed', errorMessage);
          } finally {
            setIsImporting(false);
          }
        };
        
        input.click();
      } else {
        // Mobile: Use Expo DocumentPicker
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/zip', 'application/octet-stream'],
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          return;
        }

        const pickedFile = result.assets[0];
        if (!pickedFile) {
          return;
        }

        setIsImporting(true);
        setShowImportModal(false);

        try {
          // Read the file using expo-file-system
          const { File } = await import('expo-file-system');
          const file = new File(pickedFile.uri);
          
          // Read as ArrayBuffer (React Native doesn't support creating Blobs from ArrayBuffer)
          const arrayBuffer = await file.arrayBuffer();

          const mixtape = await archiveManager.importFromFile(arrayBuffer);
          await loadMixtapes();

          // Show envelope intro animation
          setImportedMixtape(mixtape);
          setShowEnvelopeIntro(true);
        } catch (error) {
          console.error('Error importing from file:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          Alert.alert('Import Failed', errorMessage);
        } finally {
          setIsImporting(false);
        }
      }
    } catch (error) {
      console.error('Error setting up file import:', error);
      Alert.alert('Error', 'Failed to open file picker');
    }
  };

  /**
   * Handle envelope intro animation completion
   * Requirements: 13.3, 13.4, 13.5
   */
  const handleEnvelopeIntroComplete = () => {
    setShowEnvelopeIntro(false);
    if (importedMixtape) {
      // Navigate to player to play the imported mixtape
      router.push(`/player?id=${importedMixtape.id}`);
      setImportedMixtape(null);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  /**
   * Check if mixtape has local files (blob URLs) that won't work on web
   */
  const hasLocalFiles = useCallback((mixtape: Mixtape): boolean => {
    if (Platform.OS !== 'web') return false;
    
    return [...mixtape.sideA, ...mixtape.sideB].some(
      track => track.source.type === 'local' && track.source.uri.startsWith('blob:')
    );
  }, []);

  /**
   * Render individual mixtape card - Memoized for performance
   */
  const renderMixtapeCard = useCallback(({ item: mixtape }: ListRenderItemInfo<Mixtape>) => (
    <View style={styles.mixtapeCard}>
      {/* Mixtape Title - Requirements: 3.5 */}
      <View style={styles.mixtapeHeader}>
        <View style={styles.mixtapeInfo}>
          <Text style={styles.mixtapeTitle}>{mixtape.title}</Text>
          <Text style={styles.mixtapeDate}>
            {formatDate(mixtape.updatedAt)}
          </Text>
        </View>
        <View style={styles.themeIndicator}>
          <View
            style={[
              styles.themeColor,
              {
                backgroundColor:
                  mixtape.theme.preset === 'pumpkin-orange'
                    ? '#FF8C42'
                    : mixtape.theme.preset === 'ghostly-green'
                    ? '#7FFF7F'
                    : '#808080',
              },
            ]}
          />
        </View>
      </View>

      {/* Local Files Warning */}
      {hasLocalFiles(mixtape) && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Contains local files - may not play after refresh
          </Text>
        </View>
      )}

      {/* Note Preview */}
      {mixtape.note && (
        <Text style={styles.notePreview} numberOfLines={2}>
          &quot;{mixtape.note}&quot;
        </Text>
      )}

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/player?id=${mixtape.id}`)}
        >
          <Text style={styles.actionButtonText}>▶ Play</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/export?id=${mixtape.id}`)}
        >
          <Text style={styles.actionButtonText}>📤 Export</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteMixtape(mixtape.id, mixtape.title)}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            🗑 Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [formatDate, hasLocalFiles, router]);

  const keyExtractor = useCallback((item: Mixtape) => item.id, []);

  const emptyComponent = useMemo(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🎵</Text>
      <Text style={styles.emptyStateText}>No mixtapes yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Create your first mixtape to get started
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/maker')}
      >
        <Text style={styles.createButtonText}>Create Mixtape</Text>
      </TouchableOpacity>
    </View>
  ), [router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Library</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading mixtapes...</Text>
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
            style={styles.homeButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.homeButtonText}>← Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerCreateButton}
            onPress={() => router.push('/maker')}
          >
            <Text style={styles.headerCreateButtonText}>+ Create</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>My Library</Text>
        <Text style={styles.headerSubtitle}>
          {mixtapes.length} mixtape{mixtapes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={displayedMixtapes}
        renderItem={renderMixtapeCard}
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={5}
        contentContainerStyle={styles.listContent}
        style={styles.scrollContainer}
      />

      {/* Import Button */}
      <TouchableOpacity
        style={styles.importFab}
        onPress={() => setShowImportModal(true)}
      >
        <Text style={styles.importFabText}>📥</Text>
      </TouchableOpacity>

      {/* Import Modal */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImportModal(false)}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay} accessible={false}>
          <View style={styles.modalContent} accessible={true}>
            <Text style={styles.modalTitle}>Import Mixtape</Text>
            <Text style={styles.modalDescription}>
              Import a mixtape from a shareable URL or local file
            </Text>

            {/* URL Import */}
            <View style={styles.importSection}>
              <Text style={styles.importSectionTitle}>From URL</Text>
              <TextInput
                style={styles.urlInput}
                placeholder="https://share.moodybeats.sanyamchhabra.in/t/..."
                placeholderTextColor="#666666"
                value={importUrl}
                onChangeText={setImportUrl}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isImporting}
              />
              <TouchableOpacity
                style={[
                  styles.importButton,
                  isImporting && styles.importButtonDisabled,
                ]}
                onPress={handleImportFromURL}
                disabled={isImporting}
              >
                <Text style={styles.importButtonText}>
                  {isImporting ? 'Importing...' : 'Import from URL'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* File Import */}
            <View style={styles.importSection}>
              <Text style={styles.importSectionTitle}>From File</Text>
              <TouchableOpacity
                style={[
                  styles.importButton,
                  styles.secondaryImportButton,
                  isImporting && styles.importButtonDisabled,
                ]}
                onPress={handleImportFromFile}
                disabled={isImporting}
              >
                <Text style={styles.importButtonText}>
                  Choose .mixblues File
                </Text>
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowImportModal(false);
                setImportUrl('');
              }}
              disabled={isImporting}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={cancelDelete}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay} accessible={false}>
          <View style={styles.modalContent} accessible={true}>
            <Text style={styles.modalTitle}>Delete Mixtape</Text>
            <Text style={styles.modalDescription}>
              Are you sure you want to delete &quot;{mixtapeToDelete?.title}&quot;? This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.importButton, styles.secondaryImportButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.importButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.importButton, styles.deleteConfirmButton]}
                onPress={confirmDelete}
              >
                <Text style={styles.importButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Envelope Intro Animation Modal - Requirements: 13.3, 13.4, 13.5 */}
      <Modal
        visible={showEnvelopeIntro}
        transparent={false}
        animationType="fade"
        onRequestClose={handleEnvelopeIntroComplete}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        {importedMixtape && (
          <EnvelopeIntro
            envelope={importedMixtape.envelope}
            note={importedMixtape.note}
            onComplete={handleEnvelopeIntroComplete}
          />
        )}
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
  headerCreateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerCreateButtonText: {
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
  scrollContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#4a9eff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  mixtapeCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  mixtapeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mixtapeInfo: {
    flex: 1,
  },
  mixtapeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  mixtapeDate: {
    fontSize: 12,
    color: '#888888',
  },
  themeIndicator: {
    marginLeft: 12,
  },
  themeColor: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  trackSummary: {
    fontSize: 14,
    color: '#aaaaaa',
    marginBottom: 8,
  },
  warningBanner: {
    backgroundColor: '#3a2a1a',
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#ffb74d',
    fontWeight: '500',
  },
  notePreview: {
    fontSize: 13,
    color: '#888888',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#ff6b6b',
  },
  deleteButtonText: {
    color: '#ff6b6b',
  },
  importFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  importFabText: {
    fontSize: 24,
    color: '#ffffff',
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
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 24,
  },
  importSection: {
    marginBottom: 24,
  },
  importSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  urlInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 12,
  },
  importButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryImportButton: {
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    backgroundColor: '#ff6b6b',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#888888',
    fontSize: 16,
    fontWeight: '600',
  },
});
