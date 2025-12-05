/**
 * Toast Notification Component
 * Displays temporary success/error/info messages
 * Requirements: Toast notifications for success/error states
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
  visible: boolean;
}

export function Toast({
  message,
  type = 'info',
  duration = 2000,
  onHide,
  visible,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const [isRendered, setIsRendered] = React.useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      // Slide in and fade in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setIsRendered(false);
      if (onHide) {
        onHide();
      }
    });
  };

  if (!isRendered) {
    return null;
  }

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return styles.success;
      case 'error':
        return styles.error;
      case 'warning':
        return styles.warning;
      default:
        return styles.info;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getToastStyle(),
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }),
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
    color: '#ffffff',
  },
  message: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '500',
    flex: 1,
  },
  success: {
    backgroundColor: '#10b981',
  },
  error: {
    backgroundColor: '#ef4444',
  },
  warning: {
    backgroundColor: '#f59e0b',
  },
  info: {
    backgroundColor: '#3b82f6',
  },
});
