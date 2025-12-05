/**
 * Loading Overlay Component
 * Displays loading state for async operations
 * Requirements: Add loading states for all async operations
 */

import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#4a9eff" />
          <Text
            style={styles.message}
            accessibilityLabel={message}
            accessibilityLiveRegion="polite"
          >
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 16,
    textAlign: 'center',
  },
});
