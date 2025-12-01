/**
 * Button component - Uniform button styling across the app
 * Primary buttons use #B28EF1 with glow
 * Delete buttons use red with red glow on hover
 */

import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'delete';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  style,
  disabled,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle: ViewStyle[] = [
    styles.button,
    styles[`${size}Button`],
    styles[`${variant}Button`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    isHovered && !disabled && styles[`${variant}ButtonHover`],
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${size}Text`],
    styles[`${variant}Text`],
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled}
      {...props}
      {...(Platform.OS === 'web' && {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      })}
    >
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Size variants
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },

  // Primary button (purple with glow)
  primaryButton: {
    backgroundColor: '#B28EF1',
    ...Platform.select({
      web: {
        boxShadow: '0 0 16px 2px rgba(178, 142, 241, 0.5)',
      },
      ios: {
        shadowColor: '#B28EF1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  primaryButtonHover: {
    backgroundColor: '#c9a8f5',
    ...Platform.select({
      web: {
        boxShadow: '0 0 24px 4px rgba(178, 142, 241, 0.8)',
      },
    }),
  },
  primaryText: {
    color: '#000000',
    fontWeight: '600',
  },

  // Secondary button (transparent with border)
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#B28EF1',
  },
  secondaryButtonHover: {
    backgroundColor: 'rgba(178, 142, 241, 0.1)',
    ...Platform.select({
      web: {
        boxShadow: '0 0 16px 2px rgba(178, 142, 241, 0.3)',
      },
    }),
  },
  secondaryText: {
    color: '#B28EF1',
    fontWeight: '600',
  },

  // Delete button (red with red glow on hover)
  deleteButton: {
    backgroundColor: '#ef4444',
    ...Platform.select({
      web: {
        boxShadow: '0 0 8px 1px rgba(239, 68, 68, 0.3)',
      },
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  deleteButtonHover: {
    backgroundColor: '#dc2626',
    ...Platform.select({
      web: {
        boxShadow: '0 0 24px 4px rgba(239, 68, 68, 0.8)',
      },
    }),
  },
  deleteText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Text sizes
  text: {
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.7,
  },
});

export default Button;
