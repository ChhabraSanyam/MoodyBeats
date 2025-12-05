/**
 * Redesigned TapeShellDesigner Component
 * Modern UI for tape shell customization
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Animated,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { TapeTheme } from '../models';

// Inject CSS animations and 3D styles (web only)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'shooting-star-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .tape-3d-container {
        position: relative;
        transform-style: preserve-3d;
      }
      
      .tape-3d-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: inherit;
        border-radius: inherit;
        transform: translateZ(-15px);
        filter: brightness(0.7);
        z-index: -1;
      }
      
      .tape-3d-container::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: inherit;
        border-radius: inherit;
        transform: translateZ(-30px);
        filter: brightness(0.5);
        z-index: -2;
      }
      
      @keyframes shootingStar1 {
        0% {
          transform: translateX(0) translateY(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateX(600px) translateY(-80px);
          opacity: 0;
        }
      }
      
      @keyframes shootingStar2 {
        0% {
          transform: translateX(0) translateY(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateX(550px) translateY(-70px);
          opacity: 0;
        }
      }
      
      @keyframes shootingStar3 {
        0% {
          transform: translateX(0) translateY(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateX(580px) translateY(-75px);
          opacity: 0;
        }
      }
      
      @keyframes shootingStar4 {
        0% {
          transform: translateX(0) translateY(0);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateX(520px) translateY(-65px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

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

// Heart Shape Component for Android (replaces emoji hearts)
interface HeartShapeProps {
  color: string;
  size: number;
  top: number;
  left: number;
}

// Flower Component for Android (6-petal design)
interface FlowerProps {
  petalColor: string;
  centerColor: string;
  size: number;
  top: number;
  left?: number;
  right?: number;
}

function Flower({ petalColor, centerColor, size, top, left, right }: FlowerProps) {
  const petalSize = size * 0.4;
  const centerSize = size * 0.5;
  const radius = size * 0.36;
  
  return (
    <View style={{ position: 'absolute', top, left, right, width: size, height: size }}>
      {/* 6 petals arranged in a circle */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const radian = (angle * Math.PI) / 180;
        const x = size / 2 + radius * Math.cos(radian) - petalSize / 2;
        const y = size / 2 + radius * Math.sin(radian) - petalSize / 2;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              top: y,
              left: x,
              width: petalSize,
              height: petalSize,
              borderRadius: petalSize / 2,
              backgroundColor: petalColor,
            }}
          />
        );
      })}
      {/* Center */}
      <View
        style={{
          position: 'absolute',
          top: (size - centerSize) / 2,
          left: (size - centerSize) / 2,
          width: centerSize,
          height: centerSize,
          borderRadius: centerSize / 2,
          backgroundColor: centerColor,
        }}
      />
    </View>
  );
}

function HeartShape({ color, size, top, left }: HeartShapeProps) {
  // Render heart shape using View components instead of emoji
  const heartWidth = size * 2;
  const heartHeight = size * 1.8;
  
  return (
    <View style={{ position: 'absolute', top, left, width: heartWidth, height: heartHeight }}>
      {/* Left circle */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
      {/* Right circle */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: size,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
      {/* Bottom triangle (using rotated square) - positioned to form heart point */}
      <View
        style={{
          position: 'absolute',
          top: size * 0.5,
          left: size * 0.5,
          width: size * 1,
          height: size * 1,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

interface TapeShellDesignerProps {
  theme: TapeTheme;
  onThemeChange: (theme: TapeTheme) => void;
  mixtapeTitle?: string;
  onChangeSongs?: () => void;
  onSave?: () => void;
}

// Color options
const COLOR_OPTIONS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink/Magenta
];

// Preset gradient themes
const PRESET_GRADIENTS = [
  {
    id: 'love',
    name: 'Love',
    colors: ['#FFFFFF', '#F8F8F8', '#F0F0F0'],
    preset: 'vhs-static-grey' as const,
  },
  {
    id: 'retro',
    name: 'Retro',
    colors: ['#4169E1', '#5B7FD8', '#7495CF'],
    preset: 'pumpkin-orange' as const,
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    colors: ['#0F1B4C', '#1E1B4B', '#4C1D95', '#7C3AED'],
    preset: 'ghostly-green' as const,
  },
  {
    id: 'flowers',
    name: 'Flowers',
    colors: ['#FCD34D', '#FBBF24', '#F59E0B', '#F97316'],
    preset: 'vhs-static-grey' as const,
  },
];

export default function TapeShellDesigner({ 
  theme, 
  onThemeChange, 
  mixtapeTitle = 'GHOSTLY ECHOES',
  onChangeSongs,
  onSave 
}: TapeShellDesignerProps) {
  const [selectedColor, setSelectedColor] = useState('#EC4899');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  
  // Mobile animation values
  const tiltAnimX = useRef(new Animated.Value(0)).current;
  const tiltAnimY = useRef(new Animated.Value(0)).current;
  const panStartX = useRef(0);
  const panStartY = useRef(0);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    // Clear preset selection when a color is selected
    setSelectedPreset(null);
    // Update theme with selected color only
    onThemeChange({
      preset: theme.preset,
      pattern: color,
    });
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = PRESET_GRADIENTS.find(p => p.id === presetId);
    if (preset) {
      // Set the shell color - use beige for love theme, first gradient color for others
      const shellColor = presetId === 'love' ? '#F5F5DC' : preset.colors[0];
      setSelectedColor(shellColor);
      onThemeChange({
        preset: preset.preset,
        pattern: shellColor,
        texture: presetId, // Store the preset ID so we can render it correctly later
      });
    }
  };

  // 3D Tilt handlers for web
  const handleMouseDown = (e: any) => {
    if (Platform.OS === 'web') {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: any) => {
    if (Platform.OS === 'web' && isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate tilt based on mouse position (increased to ±30 degrees for more visible sides)
      const maxTilt = 30;
      const newTiltY = ((x - centerX) / centerX) * maxTilt;
      const newTiltX = -((y - centerY) / centerY) * maxTilt;
      
      setTiltX(newTiltX);
      setTiltY(newTiltY);
    }
  };

  const handleMouseUp = () => {
    if (Platform.OS === 'web') {
      setIsDragging(false);
      // Smooth return to center
      setTiltX(0);
      setTiltY(0);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsDragging(false);
      setTiltX(0);
      setTiltY(0);
    }
  };

  // Mobile pan responder for touch gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Platform.OS !== 'web',
      onMoveShouldSetPanResponder: () => Platform.OS !== 'web',
      onPanResponderGrant: (evt) => {
        if (Platform.OS !== 'web') {
          panStartX.current = evt.nativeEvent.pageX;
          panStartY.current = evt.nativeEvent.pageY;
          setIsDragging(true);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (Platform.OS !== 'web') {
          // Calculate tilt based on drag distance (limited to ±15 degrees for mobile)
          const maxTilt = 15;
          const sensitivity = 0.15;
          const newTiltY = Math.max(-maxTilt, Math.min(maxTilt, gestureState.dx * sensitivity));
          const newTiltX = Math.max(-maxTilt, Math.min(maxTilt, -gestureState.dy * sensitivity));
          
          tiltAnimX.setValue(newTiltX);
          tiltAnimY.setValue(newTiltY);
        }
      },
      onPanResponderRelease: () => {
        if (Platform.OS !== 'web') {
          setIsDragging(false);
          // Smooth return to center
          Animated.parallel([
            Animated.spring(tiltAnimX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 40,
              friction: 7,
            }),
            Animated.spring(tiltAnimY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 40,
              friction: 7,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Render the tilt container based on platform
  const TiltContainer = Platform.OS === 'web' ? View : Animated.View;
  const tiltContainerProps = Platform.OS === 'web' 
    ? {
        // @ts-ignore - Web-specific props
        style: [
          styles.tiltContainer,
          {
            transform: `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
            transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            cursor: isDragging ? 'grabbing' : 'grab',
            transformStyle: 'preserve-3d',
          },
        ],
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseLeave,
      }
    : {
        ...panResponder.panHandlers,
        style: [
          styles.tiltContainer,
          {
            transform: [
              { perspective: 1000 },
              { 
                rotateX: tiltAnimX.interpolate({
                  inputRange: [-15, 15],
                  outputRange: ['-15deg', '15deg'],
                }),
              },
              { 
                rotateY: tiltAnimY.interpolate({
                  inputRange: [-15, 15],
                  outputRange: ['-15deg', '15deg'],
                }),
              },
            ],
          },
        ],
      };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Tape Preview */}
        <View style={styles.previewSection}>
          <TiltContainer {...tiltContainerProps}>
          {/* 3D Depth Layers - Dark grey sides for all colors */}
          {Platform.OS === 'web' ? (
            <>
              {[...Array(8)].map((_, i) => {
                const depth = (i + 1) * 8; // 8px spacing between layers
                const opacity = 0.9 - (i * 0.1); // Gradual fade
                return (
                  <View
                    key={i}
                    // @ts-ignore
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 480,
                      height: 300,
                      backgroundColor: '#2a2a2a',
                      borderRadius: 12,
                      transform: `translateZ(-${depth}px)`,
                      opacity: opacity,
                      pointerEvents: 'none',
                    }}
                  />
                );
              })}
            </>
          ) : (
            <>
              {/* Mobile: Depth layers - inverted movement for correct 3D perspective */}
              {[...Array(8)].map((_, i) => {
                const layerDepth = (i + 1) * 0.1; // Depth multiplier
                const baseOpacity = 0.9 - (i * 0.1); // Gradual fade
                return (
                  <Animated.View
                    key={`depth-${i}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 320,
                      height: 200,
                      backgroundColor: '#2a2a2a', // Dark grey depth
                      borderRadius: 12,
                      opacity: baseOpacity,
                      zIndex: -1 - i,
                      transform: [
                        {
                          translateX: Animated.multiply(tiltAnimY, -layerDepth), // Inverted
                        },
                        {
                          translateY: Animated.multiply(tiltAnimX, layerDepth), // Inverted
                        },
                      ],
                    }}
                  />
                );
              })}
            </>
          )}
          <View style={[
            styles.tapeShell,
            { backgroundColor: selectedColor },
            selectedPreset === 'love' && Platform.OS === 'web' && {
              backgroundColor: '#F5F5DC',
              backgroundImage: `
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 300'%3E%3Cg%3E%3C!-- Top left (red) --%3E%3Cpath fill='%238B0000' d='M 60 38 C 60 30 56 26 50 26 C 44 26 40 30 40 38 C 40 30 36 26 30 26 C 24 26 20 30 20 38 C 20 49 40 61 40 61 C 40 61 60 49 60 38 Z'/%3E%3C!-- Top center left (pink) --%3E%3Cpath fill='%23FF69B4' d='M 152 28 C 152 22 149 19 144 19 C 139 19 136 22 136 28 C 136 22 133 19 128 19 C 123 19 120 22 120 28 C 120 37 136 47 136 47 C 136 47 152 37 152 28 Z'/%3E%3C!-- Top center (red) --%3E%3Cpath fill='%238B0000' d='M 252 23 C 252 17 249 14 244 14 C 239 14 236 17 236 23 C 236 17 233 14 228 14 C 223 14 220 17 220 23 C 220 32 236 42 236 42 C 236 42 252 32 252 23 Z'/%3E%3C!-- Top center right (pink) --%3E%3Cpath fill='%23FF69B4' d='M 348 28 C 348 22 345 19 340 19 C 335 19 332 22 332 28 C 332 22 329 19 324 19 C 319 19 316 22 316 28 C 316 37 332 47 332 47 C 332 47 348 37 348 28 Z'/%3E%3C!-- Top right (red) --%3E%3Cpath fill='%238B0000' d='M 460 38 C 460 30 456 26 450 26 C 444 26 440 30 440 38 C 440 30 436 26 430 26 C 424 26 420 30 420 38 C 420 49 440 61 440 61 C 440 61 460 49 460 38 Z'/%3E%3C!-- Left side top (red) --%3E%3Cpath fill='%238B0000' d='M 52 88 C 52 81 49 78 44 78 C 39 78 36 81 36 88 C 36 81 33 78 28 78 C 23 78 20 81 20 88 C 20 98 36 108 36 108 C 36 108 52 98 52 88 Z'/%3E%3C!-- Left side middle (pink) --%3E%3Cpath fill='%23FF69B4' d='M 52 148 C 52 141 49 138 44 138 C 39 138 36 141 36 148 C 36 141 33 138 28 138 C 23 138 20 141 20 148 C 20 158 36 168 36 168 C 36 168 52 158 52 148 Z'/%3E%3C!-- Left side bottom (red) --%3E%3Cpath fill='%238B0000' d='M 52 208 C 52 201 49 198 44 198 C 39 198 36 201 36 208 C 36 201 33 198 28 198 C 23 198 20 201 20 208 C 20 218 36 228 36 228 C 36 228 52 218 52 208 Z'/%3E%3C!-- Right side top (pink) --%3E%3Cpath fill='%23FF69B4' d='M 460 88 C 460 81 457 78 452 78 C 447 78 444 81 444 88 C 444 81 441 78 436 78 C 431 78 428 81 428 88 C 428 98 444 108 444 108 C 444 108 460 98 460 88 Z'/%3E%3C!-- Right side middle (red) --%3E%3Cpath fill='%238B0000' d='M 460 148 C 460 141 457 138 452 138 C 447 138 444 141 444 148 C 444 141 441 138 436 138 C 431 138 428 141 428 148 C 428 158 444 168 444 168 C 444 168 460 158 460 148 Z'/%3E%3C!-- Right side bottom (pink) --%3E%3Cpath fill='%23FF69B4' d='M 460 208 C 460 201 457 198 452 198 C 447 198 444 201 444 208 C 444 201 441 198 436 198 C 431 198 428 201 428 208 C 428 218 444 228 444 228 C 444 228 460 218 460 208 Z'/%3E%3C!-- Bottom left (red) --%3E%3Cpath fill='%238B0000' d='M 60 262 C 60 254 56 250 50 250 C 44 250 40 254 40 262 C 40 254 36 250 30 250 C 24 250 20 254 20 262 C 20 273 40 285 40 285 C 40 285 60 273 60 262 Z'/%3E%3C!-- Bottom center left (pink) --%3E%3Cpath fill='%23FF69B4' d='M 152 272 C 152 266 149 263 144 263 C 139 263 136 266 136 272 C 136 266 133 263 128 263 C 123 263 120 266 120 272 C 120 281 136 291 136 291 C 136 291 152 281 152 272 Z'/%3E%3C!-- Bottom center right (pink) --%3E%3Cpath fill='%23FF69B4' d='M 348 272 C 348 266 345 263 340 263 C 335 263 332 266 332 272 C 332 266 329 263 324 263 C 319 263 316 266 316 272 C 316 281 332 291 332 291 C 332 291 348 281 348 272 Z'/%3E%3C!-- Bottom right (red) --%3E%3Cpath fill='%238B0000' d='M 460 262 C 460 254 456 250 450 250 C 444 250 440 254 440 262 C 440 254 436 250 430 250 C 424 250 420 254 420 262 C 420 273 440 285 440 285 C 440 285 460 273 460 262 Z'/%3E%3C!-- Additional bottom hearts evenly spaced --%3E%3Cpath fill='%238B0000' d='M 100 268 C 100 262 97 259 93 259 C 89 259 86 262 86 268 C 86 262 83 259 79 259 C 75 259 72 262 72 268 C 72 276 86 285 86 285 C 86 285 100 276 100 268 Z'/%3E%3Cpath fill='%23FF69B4' d='M 200 265 C 200 259 197 256 193 256 C 189 256 186 259 186 265 C 186 259 183 256 179 256 C 175 256 172 259 172 265 C 172 273 186 282 186 282 C 186 282 200 273 200 265 Z'/%3E%3Cpath fill='%238B0000' d='M 280 268 C 280 262 277 259 273 259 C 269 259 266 262 266 268 C 266 262 263 259 259 259 C 255 259 252 262 252 268 C 252 276 266 285 266 285 C 266 285 280 276 280 268 Z'/%3E%3Cpath fill='%23FF69B4' d='M 390 265 C 390 259 387 256 383 256 C 379 256 376 259 376 265 C 376 259 373 256 369 256 C 365 256 362 259 362 265 C 362 273 376 282 376 282 C 376 282 390 273 390 265 Z'/%3E%3C/g%3E%3C/svg%3E")
              `,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            },
           selectedPreset === 'flowers' && Platform.OS === 'web' && {
  background: `#EAB308`,
  backgroundImage: `
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 300'%3E%3Crect width='480' height='300' fill='%23EAB308'/%3E%3Cg%3E%3C!-- Top border flowers --%3E%3C!-- Violet --%3E%3Ccircle cx='60' cy='10' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='68' cy='15' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='68' cy='25' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='60' cy='30' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='52' cy='25' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='52' cy='15' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='60' cy='20' r='5' fill='%23F97316'/%3E%3C!-- Indigo --%3E%3Ccircle cx='160' cy='10' r='6' fill='%234F46E5'/%3E%3Ccircle cx='168' cy='15' r='6' fill='%234F46E5'/%3E%3Ccircle cx='168' cy='25' r='6' fill='%234F46E5'/%3E%3Ccircle cx='160' cy='30' r='6' fill='%234F46E5'/%3E%3Ccircle cx='152' cy='25' r='6' fill='%234F46E5'/%3E%3Ccircle cx='152' cy='15' r='6' fill='%234F46E5'/%3E%3Ccircle cx='160' cy='20' r='5' fill='%23F97316'/%3E%3C!-- Blue --%3E%3Ccircle cx='240' cy='10' r='6' fill='%233B82F6'/%3E%3Ccircle cx='248' cy='15' r='6' fill='%233B82F6'/%3E%3Ccircle cx='248' cy='25' r='6' fill='%233B82F6'/%3E%3Ccircle cx='240' cy='30' r='6' fill='%233B82F6'/%3E%3Ccircle cx='232' cy='25' r='6' fill='%233B82F6'/%3E%3Ccircle cx='232' cy='15' r='6' fill='%233B82F6'/%3E%3Ccircle cx='240' cy='20' r='5' fill='%23F97316'/%3E%3C!-- Green --%3E%3Ccircle cx='320' cy='10' r='6' fill='%2322C55E'/%3E%3Ccircle cx='328' cy='15' r='6' fill='%2322C55E'/%3E%3Ccircle cx='328' cy='25' r='6' fill='%2322C55E'/%3E%3Ccircle cx='320' cy='30' r='6' fill='%2322C55E'/%3E%3Ccircle cx='312' cy='25' r='6' fill='%2322C55E'/%3E%3Ccircle cx='312' cy='15' r='6' fill='%2322C55E'/%3E%3Ccircle cx='320' cy='20' r='5' fill='%23F97316'/%3E%3C!-- Red --%3E%3Ccircle cx='420' cy='10' r='6' fill='%23EF4444'/%3E%3Ccircle cx='428' cy='15' r='6' fill='%23EF4444'/%3E%3Ccircle cx='428' cy='25' r='6' fill='%23EF4444'/%3E%3Ccircle cx='420' cy='30' r='6' fill='%23EF4444'/%3E%3Ccircle cx='412' cy='25' r='6' fill='%23EF4444'/%3E%3Ccircle cx='412' cy='15' r='6' fill='%23EF4444'/%3E%3Ccircle cx='420' cy='20' r='5' fill='%23F97316'/%3E%3C!-- Left border flowers --%3E%3C!-- Red --%3E%3Ccircle cx='25' cy='65' r='6' fill='%23EF4444'/%3E%3Ccircle cx='33' cy='70' r='6' fill='%23EF4444'/%3E%3Ccircle cx='33' cy='80' r='6' fill='%23EF4444'/%3E%3Ccircle cx='25' cy='85' r='6' fill='%23EF4444'/%3E%3Ccircle cx='17' cy='80' r='6' fill='%23EF4444'/%3E%3Ccircle cx='17' cy='70' r='6' fill='%23EF4444'/%3E%3Ccircle cx='25' cy='75' r='5' fill='%23F97316'/%3E%3C!-- Violet --%3E%3Ccircle cx='25' cy='140' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='33' cy='145' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='33' cy='155' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='25' cy='160' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='17' cy='155' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='17' cy='145' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='25' cy='150' r='5' fill='%23F97316'/%3E%3C!-- Indigo --%3E%3Ccircle cx='25' cy='215' r='6' fill='%234F46E5'/%3E%3Ccircle cx='33' cy='220' r='6' fill='%234F46E5'/%3E%3Ccircle cx='33' cy='230' r='6' fill='%234F46E5'/%3E%3Ccircle cx='25' cy='235' r='6' fill='%234F46E5'/%3E%3Ccircle cx='17' cy='230' r='6' fill='%234F46E5'/%3E%3Ccircle cx='17' cy='220' r='6' fill='%234F46E5'/%3E%3Ccircle cx='25' cy='225' r='5' fill='%23F97316'/%3E%3C!-- Right border flowers --%3E%3C!-- Blue --%3E%3Ccircle cx='455' cy='65' r='6' fill='%233B82F6'/%3E%3Ccircle cx='463' cy='70' r='6' fill='%233B82F6'/%3E%3Ccircle cx='463' cy='80' r='6' fill='%233B82F6'/%3E%3Ccircle cx='455' cy='85' r='6' fill='%233B82F6'/%3E%3Ccircle cx='447' cy='80' r='6' fill='%233B82F6'/%3E%3Ccircle cx='447' cy='70' r='6' fill='%233B82F6'/%3E%3Ccircle cx='455' cy='75' r='5' fill='%23F97316'/%3E%3C!-- Green --%3E%3Ccircle cx='455' cy='140' r='6' fill='%2322C55E'/%3E%3Ccircle cx='463' cy='145' r='6' fill='%2322C55E'/%3E%3Ccircle cx='463' cy='155' r='6' fill='%2322C55E'/%3E%3Ccircle cx='455' cy='160' r='6' fill='%2322C55E'/%3E%3Ccircle cx='447' cy='155' r='6' fill='%2322C55E'/%3E%3Ccircle cx='447' cy='145' r='6' fill='%2322C55E'/%3E%3Ccircle cx='455' cy='150' r='5' fill='%23F97316'/%3E%3C!-- Red --%3E%3Ccircle cx='455' cy='215' r='6' fill='%23EF4444'/%3E%3Ccircle cx='463' cy='220' r='6' fill='%23EF4444'/%3E%3Ccircle cx='463' cy='230' r='6' fill='%23EF4444'/%3E%3Ccircle cx='455' cy='235' r='6' fill='%23EF4444'/%3E%3Ccircle cx='447' cy='230' r='6' fill='%23EF4444'/%3E%3Ccircle cx='447' cy='220' r='6' fill='%23EF4444'/%3E%3Ccircle cx='455' cy='225' r='5' fill='%23F97316'/%3E%3C!-- Bottom border flowers --%3E%3C!-- Red --%3E%3Ccircle cx='60' cy='270' r='6' fill='%23EF4444'/%3E%3Ccircle cx='68' cy='275' r='6' fill='%23EF4444'/%3E%3Ccircle cx='68' cy='285' r='6' fill='%23EF4444'/%3E%3Ccircle cx='60' cy='290' r='6' fill='%23EF4444'/%3E%3Ccircle cx='52' cy='285' r='6' fill='%23EF4444'/%3E%3Ccircle cx='52' cy='275' r='6' fill='%23EF4444'/%3E%3Ccircle cx='60' cy='280' r='5' fill='%23F97316'/%3E%3C!-- Violet --%3E%3Ccircle cx='160' cy='270' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='168' cy='275' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='168' cy='285' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='160' cy='290' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='152' cy='285' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='152' cy='275' r='6' fill='%238B5CF6'/%3E%3Ccircle cx='160' cy='280' r='5' fill='%23F97316'/%3E%3C!-- Indigo --%3E%3Ccircle cx='240' cy='270' r='6' fill='%234F46E5'/%3E%3Ccircle cx='248' cy='275' r='6' fill='%234F46E5'/%3E%3Ccircle cx='248' cy='285' r='6' fill='%234F46E5'/%3E%3Ccircle cx='240' cy='290' r='6' fill='%234F46E5'/%3E%3Ccircle cx='232' cy='285' r='6' fill='%234F46E5'/%3E%3Ccircle cx='232' cy='275' r='6' fill='%234F46E5'/%3E%3Ccircle cx='240' cy='280' r='5' fill='%23F97316'/%3E%3C!-- Blue --%3E%3Ccircle cx='320' cy='270' r='6' fill='%233B82F6'/%3E%3Ccircle cx='328' cy='275' r='6' fill='%233B82F6'/%3E%3Ccircle cx='328' cy='285' r='6' fill='%233B82F6'/%3E%3Ccircle cx='320' cy='290' r='6' fill='%233B82F6'/%3E%3Ccircle cx='312' cy='285' r='6' fill='%233B82F6'/%3E%3Ccircle cx='312' cy='275' r='6' fill='%233B82F6'/%3E%3Ccircle cx='320' cy='280' r='5' fill='%23F97316'/%3E%3C!-- Green --%3E%3Ccircle cx='420' cy='270' r='6' fill='%2322C55E'/%3E%3Ccircle cx='428' cy='275' r='6' fill='%2322C55E'/%3E%3Ccircle cx='428' cy='285' r='6' fill='%2322C55E'/%3E%3Ccircle cx='420' cy='290' r='6' fill='%2322C55E'/%3E%3Ccircle cx='412' cy='285' r='6' fill='%2322C55E'/%3E%3Ccircle cx='412' cy='275' r='6' fill='%2322C55E'/%3E%3Ccircle cx='420' cy='280' r='5' fill='%23F97316'/%3E%3C/g%3E%3C/svg%3E")
  `,
  
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            },
            selectedPreset === 'galaxy' && Platform.OS === 'web' && {
              background: `
                radial-gradient(circle at 8% 5%, rgba(255, 255, 255, 0.95) 1px, transparent 1px),
                radial-gradient(circle at 15% 8%, rgba(255, 255, 255, 0.4) 0.8px, transparent 0.8px),
                radial-gradient(circle at 25% 6%, rgba(255, 255, 255, 0.75) 1px, transparent 1px),
                radial-gradient(circle at 35% 10%, rgba(255, 255, 255, 0.3) 1.2px, transparent 1.2px),
                radial-gradient(circle at 45% 7%, rgba(255, 255, 255, 0.85) 1px, transparent 1px),
                radial-gradient(circle at 55% 9%, rgba(255, 255, 255, 0.5) 1px, transparent 1px),
                radial-gradient(circle at 65% 6%, rgba(255, 255, 255, 0.9) 0.8px, transparent 0.8px),
                radial-gradient(circle at 75% 8%, rgba(255, 255, 255, 0.35) 1px, transparent 1px),
                radial-gradient(circle at 85% 10%, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
                radial-gradient(circle at 92% 7%, rgba(255, 255, 255, 0.6) 1.2px, transparent 1.2px),
                radial-gradient(circle at 5% 18%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 7% 25%, rgba(255, 255, 255, 0.85) 0.8px, transparent 0.8px),
                radial-gradient(circle at 6% 32%, rgba(255, 255, 255, 0.5) 1px, transparent 1px),
                radial-gradient(circle at 8% 40%, rgba(255, 255, 255, 0.95) 1.2px, transparent 1.2px),
                radial-gradient(circle at 5% 48%, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                radial-gradient(circle at 7% 55%, rgba(255, 255, 255, 0.75) 0.8px, transparent 0.8px),
                radial-gradient(circle at 6% 62%, rgba(255, 255, 255, 0.9) 1px, transparent 1px),
                radial-gradient(circle at 8% 70%, rgba(255, 255, 255, 0.35) 1px, transparent 1px),
                radial-gradient(circle at 5% 78%, rgba(255, 255, 255, 0.8) 1.2px, transparent 1.2px),
                radial-gradient(circle at 7% 85%, rgba(255, 255, 255, 0.55) 1px, transparent 1px),
                radial-gradient(circle at 95% 18%, rgba(255, 255, 255, 0.7) 1px, transparent 1px),
                radial-gradient(circle at 93% 25%, rgba(255, 255, 255, 0.9) 0.8px, transparent 0.8px),
                radial-gradient(circle at 94% 32%, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
                radial-gradient(circle at 92% 40%, rgba(255, 255, 255, 0.85) 1.2px, transparent 1.2px),
                radial-gradient(circle at 95% 48%, rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                radial-gradient(circle at 93% 55%, rgba(255, 255, 255, 0.75) 0.8px, transparent 0.8px),
                radial-gradient(circle at 94% 62%, rgba(255, 255, 255, 0.95) 1px, transparent 1px),
                radial-gradient(circle at 92% 70%, rgba(255, 255, 255, 0.45) 1px, transparent 1px),
                radial-gradient(circle at 95% 78%, rgba(255, 255, 255, 0.8) 1.2px, transparent 1.2px),
                radial-gradient(circle at 93% 85%, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
                radial-gradient(circle at 8% 90%, rgba(255, 255, 255, 0.9) 1px, transparent 1px),
                radial-gradient(circle at 15% 92%, rgba(255, 255, 255, 0.4) 0.8px, transparent 0.8px),
                radial-gradient(circle at 25% 91%, rgba(255, 255, 255, 0.75) 1px, transparent 1px),
                radial-gradient(circle at 35% 93%, rgba(255, 255, 255, 0.95) 1px, transparent 1px),
                radial-gradient(circle at 45% 90%, rgba(255, 255, 255, 0.35) 1.2px, transparent 1.2px),
                radial-gradient(circle at 55% 92%, rgba(255, 255, 255, 0.8) 1px, transparent 1px),
                radial-gradient(circle at 65% 91%, rgba(255, 255, 255, 0.5) 0.8px, transparent 0.8px),
                radial-gradient(circle at 75% 93%, rgba(255, 255, 255, 0.85) 1px, transparent 1px),
                radial-gradient(circle at 85% 90%, rgba(255, 255, 255, 0.45) 1px, transparent 1px),
                radial-gradient(circle at 92% 92%, rgba(255, 255, 255, 0.7) 1.2px, transparent 1.2px),
                linear-gradient(135deg, #0F1B4C 0%, #1E1B4B 30%, #4C1D95 70%, #7C3AED 100%)
              `,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              overflow: 'hidden',
            },
            selectedPreset === 'retro' && Platform.OS === 'web' && {
              backgroundColor: '#4169E1',
              backgroundImage: `
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 300'%3E%3Ctext x='420' y='240' font-family='Arial, sans-serif' font-size='28' font-weight='bold' fill='%234169E1'%3E30%3C/text%3E%3C/svg%3E"),
                linear-gradient(to right, #EF4444 0%, #EF4444 100%),
                linear-gradient(to right, #F97316 0%, #F97316 100%),
                linear-gradient(to right, #EAB308 0%, #EAB308 100%),
                repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.05) 0px, rgba(0, 0, 0, 0.05) 2px, transparent 2px, transparent 4px)
              `,
              backgroundSize: '100% 100%, 100% 8px, 100% 8px, 100% 8px, 100% 100%',
              backgroundPosition: '0 0, 0 35%, 0 43%, 0 51%, 0 0',
              backgroundRepeat: 'no-repeat, no-repeat, no-repeat, no-repeat, repeat',
            },
          ]}>
            {/* Pattern overlay for mobile (using positioned elements) */}
            {Platform.OS !== 'web' && selectedPreset === 'love' && (
              <>
                <View style={styles.loveBackground} />
                <View style={styles.patternOverlay}>
                  {/* Hearts positioned ONLY in the narrow beige border areas */}
                  {/* Top beige border (Android: 320x200 with 30px padding, top border at 0-30px) */}
                  <HeartShape color="#FF69B4" size={7} top={5} left={15} />
                  <HeartShape color="#8B0000" size={8} top={5} left={50} />
                  <HeartShape color="#FF69B4" size={7} top={5} left={90} />
                  <HeartShape color="#8B0000" size={8} top={5} left={130} />
                  <HeartShape color="#FF69B4" size={7} top={5} left={170} />
                  <HeartShape color="#8B0000" size={8} top={5} left={210} />
                  <HeartShape color="#FF69B4" size={7} top={5} left={250} />
                  <HeartShape color="#8B0000" size={7} top={5} left={285} />
                  
                  {/* Left beige border (Android: left border at 0-30px, avoid black center at 30-290px) */}
                  <HeartShape color="#8B0000" size={7} top={35} left={5} />
                  <HeartShape color="#FF69B4" size={8} top={65} left={5} />
                  <HeartShape color="#8B0000" size={7} top={95} left={5} />
                  <HeartShape color="#FF69B4" size={8} top={125} left={5} />
                  <HeartShape color="#8B0000" size={7} top={155} left={5} />
                  
                  {/* Right beige border (Android: right border at 290-320px) */}
                  <HeartShape color="#FF69B4" size={7} top={35} left={300} />
                  <HeartShape color="#8B0000" size={8} top={65} left={300} />
                  <HeartShape color="#FF69B4" size={7} top={95} left={300} />
                  <HeartShape color="#8B0000" size={8} top={125} left={300} />
                  <HeartShape color="#FF69B4" size={7} top={155} left={300} />
                  
                  {/* Bottom beige border (Android: bottom border at 170-200px) */}
                  <HeartShape color="#8B0000" size={7} top={180} left={15} />
                  <HeartShape color="#FF69B4" size={8} top={180} left={50} />
                  <HeartShape color="#8B0000" size={7} top={180} left={90} />
                  <HeartShape color="#FF69B4" size={8} top={180} left={130} />
                  <HeartShape color="#8B0000" size={7} top={180} left={170} />
                  <HeartShape color="#FF69B4" size={8} top={180} left={210} />
                  <HeartShape color="#8B0000" size={7} top={180} left={250} />
                  <HeartShape color="#FF69B4" size={7} top={180} left={285} />
                </View>
              </>
            )}
            {Platform.OS !== 'web' && selectedPreset === 'retro' && (
              <View style={styles.patternOverlay}>
                {/* Horizontal retro stripes on the border areas only (not on black center) */}
                {/* Left side stripes - 9% width for Android (320px * 9% = 28.8px, stays within 30px padding) */}
                <View style={{ position: 'absolute', top: '35%', left: 0, width: '9%', height: 8, backgroundColor: '#EF4444' }} />
                <View style={{ position: 'absolute', top: '43%', left: 0, width: '9%', height: 8, backgroundColor: '#F97316' }} />
                <View style={{ position: 'absolute', top: '51%', left: 0, width: '9%', height: 8, backgroundColor: '#EAB308' }} />
                {/* Right side stripes - 9% width for Android */}
                <View style={{ position: 'absolute', top: '35%', right: 0, width: '9%', height: 8, backgroundColor: '#EF4444' }} />
                <View style={{ position: 'absolute', top: '43%', right: 0, width: '9%', height: 8, backgroundColor: '#F97316' }} />
                <View style={{ position: 'absolute', top: '51%', right: 0, width: '9%', height: 8, backgroundColor: '#EAB308' }} />
                {/* Retro text on blue shell */}
                <Text style={[styles.retroSmallText, { bottom: '15%', right: '10%' }]}>30</Text>
              </View>
            )}
            {Platform.OS !== 'web' && selectedPreset === 'flowers' && (
              <View style={styles.patternOverlay}>
                {/* VIBGYOR flowers distributed around borders - Violet, Indigo, Blue, Green, Yellow, Red */}
                {/* Top border flowers */}
                <Flower petalColor="#8B5CF6" centerColor="#F97316" size={24} top={5} left={15} />
                <Flower petalColor="#4F46E5" centerColor="#F97316" size={24} top={5} left={80} />
                <Flower petalColor="#3B82F6" centerColor="#F97316" size={24} top={5} left={145} />
                <Flower petalColor="#22C55E" centerColor="#F97316" size={24} top={5} left={210} />
                <Flower petalColor="#EAB308" centerColor="#F97316" size={24} top={5} left={275} />
                
                {/* Left border flowers */}
                <Flower petalColor="#EF4444" centerColor="#F97316" size={22} top={45} left={5} />
                <Flower petalColor="#8B5CF6" centerColor="#F97316" size={22} top={85} left={5} />
                <Flower petalColor="#4F46E5" centerColor="#F97316" size={22} top={125} left={5} />
                
                {/* Right border flowers */}
                <Flower petalColor="#3B82F6" centerColor="#F97316" size={22} top={45} right={5} />
                <Flower petalColor="#22C55E" centerColor="#F97316" size={22} top={85} right={5} />
                <Flower petalColor="#EAB308" centerColor="#F97316" size={22} top={125} right={5} />
                
                {/* Bottom border flowers */}
                <Flower petalColor="#EF4444" centerColor="#F97316" size={24} top={175} left={15} />
                <Flower petalColor="#8B5CF6" centerColor="#F97316" size={24} top={175} left={80} />
                <Flower petalColor="#4F46E5" centerColor="#F97316" size={24} top={175} left={145} />
                <Flower petalColor="#3B82F6" centerColor="#F97316" size={24} top={175} left={210} />
                <Flower petalColor="#22C55E" centerColor="#F97316" size={24} top={175} left={275} />
                
                
              </View>
            )}
            {/* Shooting stars for galaxy theme (web only) */}
            {selectedPreset === 'galaxy' && Platform.OS === 'web' && (
              <>
                <View
                  // @ts-ignore - Web-specific style
                  style={{
                    position: 'absolute',
                    top: '15%',
                    left: '-100px',
                    width: '80px',
                    height: '2px',
                    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent)',
                    borderRadius: '50%',
                    animation: 'shootingStar1 3s ease-in-out infinite',
                    animationDelay: '0s',
                  }}
                />
                <View
                  // @ts-ignore - Web-specific style
                  style={{
                    position: 'absolute',
                    top: '45%',
                    left: '-100px',
                    width: '60px',
                    height: '1.5px',
                    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
                    borderRadius: '50%',
                    animation: 'shootingStar2 4s ease-in-out infinite',
                    animationDelay: '1.5s',
                  }}
                />
                <View
                  // @ts-ignore - Web-specific style
                  style={{
                    position: 'absolute',
                    top: '70%',
                    left: '-100px',
                    width: '70px',
                    height: '2px',
                    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.85), transparent)',
                    borderRadius: '50%',
                    animation: 'shootingStar3 3.5s ease-in-out infinite',
                    animationDelay: '2.5s',
                  }}
                />
                <View
                  // @ts-ignore - Web-specific style
                  style={{
                    position: 'absolute',
                    top: '25%',
                    left: '-100px',
                    width: '50px',
                    height: '1.5px',
                    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent)',
                    borderRadius: '50%',
                    animation: 'shootingStar4 4.5s ease-in-out infinite',
                    animationDelay: '3.5s',
                  }}
                />
              </>
            )}
            {selectedPreset === 'galaxy' && (
              <View style={styles.patternOverlay}>
                {[
                  // Top border stars - varying brightness
                  { top: '5%', left: '8%', size: 2, opacity: 0.95 },
                  { top: '8%', left: '15%', size: 1.5, opacity: 0.4 },
                  { top: '6%', left: '25%', size: 2, opacity: 0.75 },
                  { top: '10%', left: '35%', size: 2.5, opacity: 0.3 },
                  { top: '7%', left: '45%', size: 2, opacity: 0.85 },
                  { top: '9%', left: '55%', size: 2, opacity: 0.5 },
                  { top: '6%', left: '65%', size: 1.5, opacity: 0.9 },
                  { top: '8%', left: '75%', size: 2, opacity: 0.35 },
                  { top: '10%', left: '85%', size: 2, opacity: 0.8 },
                  { top: '7%', left: '92%', size: 2.5, opacity: 0.6 },
                  // Left border stars - twinkling effect
                  { top: '18%', left: '5%', size: 2, opacity: 0.3 },
                  { top: '25%', left: '7%', size: 1.5, opacity: 0.85 },
                  { top: '32%', left: '6%', size: 2, opacity: 0.5 },
                  { top: '40%', left: '8%', size: 2.5, opacity: 0.95 },
                  { top: '48%', left: '5%', size: 2, opacity: 0.4 },
                  { top: '55%', left: '7%', size: 1.5, opacity: 0.75 },
                  { top: '62%', left: '6%', size: 2, opacity: 0.9 },
                  { top: '70%', left: '8%', size: 2, opacity: 0.35 },
                  { top: '78%', left: '5%', size: 2.5, opacity: 0.8 },
                  { top: '85%', left: '7%', size: 2, opacity: 0.55 },
                  // Right border stars - twinkling effect
                  { top: '18%', left: '95%', size: 2, opacity: 0.7 },
                  { top: '25%', left: '93%', size: 1.5, opacity: 0.9 },
                  { top: '32%', left: '94%', size: 2, opacity: 0.4 },
                  { top: '40%', left: '92%', size: 2.5, opacity: 0.85 },
                  { top: '48%', left: '95%', size: 2, opacity: 0.3 },
                  { top: '55%', left: '93%', size: 1.5, opacity: 0.75 },
                  { top: '62%', left: '94%', size: 2, opacity: 0.95 },
                  { top: '70%', left: '92%', size: 2, opacity: 0.45 },
                  { top: '78%', left: '95%', size: 2.5, opacity: 0.8 },
                  { top: '85%', left: '93%', size: 2, opacity: 0.6 },
                  // Bottom border stars - varying brightness
                  { top: '90%', left: '8%', size: 2, opacity: 0.9 },
                  { top: '92%', left: '15%', size: 1.5, opacity: 0.4 },
                  { top: '91%', left: '25%', size: 2, opacity: 0.75 },
                  { top: '93%', left: '35%', size: 2, opacity: 0.95 },
                  { top: '90%', left: '45%', size: 2.5, opacity: 0.35 },
                  { top: '92%', left: '55%', size: 2, opacity: 0.8 },
                  { top: '91%', left: '65%', size: 1.5, opacity: 0.5 },
                  { top: '93%', left: '75%', size: 2, opacity: 0.85 },
                  { top: '90%', left: '85%', size: 2, opacity: 0.45 },
                  { top: '92%', left: '92%', size: 2.5, opacity: 0.7 },
                ].map((star, i) => (
                  <View
                    key={i}
                    style={[
                      styles.starDot,
                      {
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size,
                        borderRadius: star.size / 2,
                        opacity: star.opacity,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
            
            <View style={styles.tapeWindow}>
              <View style={styles.reelContainer}>
                <View style={styles.reel}>
                  <View style={styles.reelCenter} />
                </View>
                <View style={styles.tapeLine} />
                <View style={styles.reel}>
                  <View style={styles.reelCenter} />
                </View>
              </View>
              {selectedPreset === 'retro' && (
                <Text style={styles.stereoText}>STEREO</Text>
              )}
            </View>
          </View>
          </TiltContainer>
        </View>

        {/* Color Selector */}
        <View style={[
          styles.section,
          Platform.OS === 'web' && styles.sectionCentered
        ]}>
          <Text style={styles.label}>COLOR</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selectedColor === color && (styles.colorSwatchSelected as any),
                ]}
                onPress={() => handleColorSelect(color)}
              />
            ))}
          </View>
        </View>

        {/* Preset Gradients */}
        <View style={styles.section}>
          <Text style={styles.presetLabel}>PRESET</Text>
          <View style={styles.presetGrid}>
            {PRESET_GRADIENTS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetCard,
                  selectedPreset === preset.id && styles.presetCardSelected,
                ]}
                onPress={() => handlePresetSelect(preset.id)}
              >
                <View
                  style={[
                    styles.presetGradient,
                    Platform.OS === 'web' 
                      ? {
                          background: `linear-gradient(135deg, ${preset.colors.join(', ')})`,
                        }
                      : {
                          backgroundColor: preset.id === 'love' ? '#F5F5F5' 
                            : preset.id === 'retro' ? '#5B7FD8'
                            : preset.id === 'galaxy' ? '#1E1B4B'
                            : '#EAB308', // flowers - yellow
                        },
                    preset.id === 'galaxy' && Platform.OS === 'web' && {
                      background: `
                        radial-gradient(circle at 10% 15%, rgba(255, 255, 255, 0.9) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 25% 10%, rgba(255, 255, 255, 0.7) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 40% 20%, rgba(255, 255, 255, 0.8) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 55% 12%, rgba(255, 255, 255, 0.6) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 70% 18%, rgba(255, 255, 255, 0.9) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 85% 8%, rgba(255, 255, 255, 0.7) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 15% 35%, rgba(255, 255, 255, 0.8) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 30% 40%, rgba(255, 255, 255, 0.6) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 45% 32%, rgba(255, 255, 255, 0.9) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 60% 38%, rgba(255, 255, 255, 0.7) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 75% 30%, rgba(255, 255, 255, 0.8) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 90% 42%, rgba(255, 255, 255, 0.6) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 12% 55%, rgba(255, 255, 255, 0.9) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 28% 60%, rgba(255, 255, 255, 0.7) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 42% 52%, rgba(255, 255, 255, 0.8) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 58% 58%, rgba(255, 255, 255, 0.6) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 72% 50%, rgba(255, 255, 255, 0.9) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 88% 62%, rgba(255, 255, 255, 0.7) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 18% 75%, rgba(255, 255, 255, 0.8) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 32% 80%, rgba(255, 255, 255, 0.6) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 48% 72%, rgba(255, 255, 255, 0.9) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 62% 78%, rgba(255, 255, 255, 0.7) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 78% 70%, rgba(255, 255, 255, 0.8) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 92% 82%, rgba(255, 255, 255, 0.6) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 8% 90%, rgba(255, 255, 255, 0.9) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 22% 92%, rgba(255, 255, 255, 0.7) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 38% 88%, rgba(255, 255, 255, 0.8) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 52% 95%, rgba(255, 255, 255, 0.6) 0.6px, transparent 0.6px),
                        radial-gradient(circle at 68% 90%, rgba(255, 255, 255, 0.9) 0.8px, transparent 0.8px),
                        radial-gradient(circle at 82% 92%, rgba(255, 255, 255, 0.7) 0.6px, transparent 0.6px),
                        linear-gradient(135deg, #0F1B4C 0%, #1E1B4B 30%, #4C1D95 70%, #7C3AED 100%)
                      `,
                      overflow: 'hidden',
                    },
                  ]}
                >
                  {preset.id === 'love' && (
                    <View style={styles.loveHeartContainer}>
                      {Platform.OS === 'web' ? (
                        <Text style={styles.loveHeartEmoji}>❤️</Text>
                      ) : (
                        <View style={{ position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center' }}>
                          <HeartShape color="#8B0000" size={15} top={0} left={70} />
                        </View>
                      )}
                    </View>
                  )}
                  {preset.id === 'retro' && (
                    <View style={styles.retroStripesContainer}>
                      <View style={[styles.retroStripePreset, { top: '35%', backgroundColor: '#EF4444' }]} />
                      <View style={[styles.retroStripePreset, { top: '43%', backgroundColor: '#F97316' }]} />
                      <View style={[styles.retroStripePreset, { top: '51%', backgroundColor: '#EAB308' }]} />
                      <Text style={[styles.retroSmallTextPreset, { bottom: '10%', right: '15%' }]}>30</Text>
                    </View>
                  )}
                  {preset.id === 'flowers' && (
                    <View style={styles.flowersContainer}>
                      {/* Single centered flower */}
                      <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -25 }, { translateY: -25 }] }}>
                        <Flower petalColor="#8B5CF6" centerColor="#F97316" size={50} top={0} left={0} />
                      </View>
                    </View>
                  )}
                  {/* Shooting stars for galaxy preset preview (web only) */}
                  {preset.id === 'galaxy' && Platform.OS === 'web' && (
                    <>
                      <View
                        // @ts-ignore - Web-specific style
                        style={{
                          position: 'absolute',
                          top: '20%',
                          left: '-50px',
                          width: '40px',
                          height: '1px',
                          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent)',
                          borderRadius: '50%',
                          animation: 'shootingStar1 3s ease-in-out infinite',
                          animationDelay: '0s',
                        }}
                      />
                      <View
                        // @ts-ignore - Web-specific style
                        style={{
                          position: 'absolute',
                          top: '60%',
                          left: '-50px',
                          width: '35px',
                          height: '1px',
                          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
                          borderRadius: '50%',
                          animation: 'shootingStar3 3.5s ease-in-out infinite',
                          animationDelay: '1.5s',
                        }}
                      />
                    </>
                  )}
                  {preset.id === 'galaxy' && Platform.OS !== 'web' && (
                    <View style={styles.patternOverlay}>
                      {[
                        { top: '15%', left: '10%', size: 1.5, opacity: 0.9 },
                        { top: '10%', left: '25%', size: 1, opacity: 0.7 },
                        { top: '20%', left: '40%', size: 1.5, opacity: 0.8 },
                        { top: '12%', left: '55%', size: 1, opacity: 0.6 },
                        { top: '18%', left: '70%', size: 1.5, opacity: 0.9 },
                        { top: '8%', left: '85%', size: 1, opacity: 0.7 },
                        { top: '35%', left: '15%', size: 1.5, opacity: 0.8 },
                        { top: '40%', left: '30%', size: 1, opacity: 0.6 },
                        { top: '32%', left: '45%', size: 1.5, opacity: 0.9 },
                        { top: '38%', left: '60%', size: 1, opacity: 0.7 },
                        { top: '30%', left: '75%', size: 1.5, opacity: 0.8 },
                        { top: '42%', left: '90%', size: 1, opacity: 0.6 },
                        { top: '55%', left: '12%', size: 1.5, opacity: 0.9 },
                        { top: '60%', left: '28%', size: 1, opacity: 0.7 },
                        { top: '52%', left: '42%', size: 1.5, opacity: 0.8 },
                        { top: '58%', left: '58%', size: 1, opacity: 0.6 },
                        { top: '50%', left: '72%', size: 1.5, opacity: 0.9 },
                        { top: '62%', left: '88%', size: 1, opacity: 0.7 },
                        { top: '75%', left: '18%', size: 1.5, opacity: 0.8 },
                        { top: '80%', left: '32%', size: 1, opacity: 0.6 },
                        { top: '72%', left: '48%', size: 1.5, opacity: 0.9 },
                        { top: '78%', left: '62%', size: 1, opacity: 0.7 },
                        { top: '70%', left: '78%', size: 1.5, opacity: 0.8 },
                        { top: '82%', left: '92%', size: 1, opacity: 0.6 },
                        { top: '90%', left: '8%', size: 1.5, opacity: 0.9 },
                        { top: '92%', left: '22%', size: 1, opacity: 0.7 },
                        { top: '88%', left: '38%', size: 1.5, opacity: 0.8 },
                        { top: '95%', left: '52%', size: 1, opacity: 0.6 },
                        { top: '90%', left: '68%', size: 1.5, opacity: 0.9 },
                        { top: '92%', left: '82%', size: 1, opacity: 0.7 },
                      ].map((star, i) => (
                        <View
                          key={i}
                          style={[
                            styles.starDot,
                            {
                              top: star.top,
                              left: star.left,
                              width: star.size,
                              height: star.size,
                              borderRadius: star.size / 2,
                              opacity: star.opacity,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
                <Text style={[styles.presetName, preset.id === 'love' && { color: '#000000' }]}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <HoverableButton
            style={styles.changeSongsButton}
            textStyle={styles.changeSongsButtonText}
            onPress={onChangeSongs}
            glowColor="#d4b8ff"
          >
            CHANGE SONGS
          </HoverableButton>

          <HoverableButton
            style={styles.saveButton}
            textStyle={styles.saveButtonText}
            onPress={onSave}
            glowColor="#4a4a4a"
          >
            SAVE MIXTAPE
          </HoverableButton>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContainer: {
    flex: 1,
  },
  previewSection: {
    padding: 20,
    alignItems: 'center',
  },
  tiltContainer: {
    position: 'relative',
    ...(Platform.OS !== 'web' && {
      overflow: 'visible',
    }),
  },
  tapeShell: {
    width: 320,
    height: 200,
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 30,
    position: 'relative',
    overflow: Platform.OS === 'web' ? 'hidden' : 'visible',
    ...(Platform.OS === 'web' 
      ? {
          width: 480,
          height: 300,
          padding: 45,
          boxShadow: `
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset,
            -8px 0 20px -8px rgba(0, 0, 0, 0.5),
            8px 0 20px -8px rgba(0, 0, 0, 0.5),
            0 -8px 20px -8px rgba(0, 0, 0, 0.5),
            0 8px 20px -8px rgba(0, 0, 0, 0.5)
          `,
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }),
  },
  loveBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5DC',
    zIndex: 0,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  heartEmoji: {
    position: 'absolute',
    fontSize: 20,
    color: '#8B0000',
  },
  flowerPetal: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  flowerCenter: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  leaf: {
    position: 'absolute',
    width: 10,
    height: 15,
    borderRadius: 8,
  },
  starDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  tapeWindow: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  reelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  reel: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E5E5E5',
    ...(Platform.OS === 'web' && {
      width: 82,
      height: 82,
      borderRadius: 41,
      borderWidth: 4,
    }),
  },
  reelCenter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#666666',
    ...(Platform.OS === 'web' && {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 3,
    }),
  },
  tapeLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#00CED1',
    marginHorizontal: 8,
    ...(Platform.OS === 'web' && {
      height: 4,
      marginHorizontal: 12,
    }),
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionCentered: {
    alignItems: 'center',
  },
  label: {
    fontSize: 22,
    fontFamily: Platform.OS === 'web' ? 'Staatliches' : undefined,
    color: '#888',
    marginBottom: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#ffffff',
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)' }
      : {
          shadowColor: '#ffffff',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 8,
          elevation: 8,
        }),
  },
  presetLabel: {
    fontSize: 22,
    fontFamily: Platform.OS === 'web' ? 'Staatliches' : undefined,
    color: '#888',
    marginBottom: 16,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    ...(Platform.OS === 'web' && {
      justifyContent: 'center',
    }),
  },
  presetCard: {
    width: '47%',
    aspectRatio: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
    ...(Platform.OS === 'web' && {
      width: 140,
      height: 100,
    }),
  },
  presetCardSelected: {
    borderColor: '#b794f6',
  },
  presetGradient: {
    flex: 1,
    borderRadius: 8,
  },
  presetName: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    ...(Platform.OS === 'web' 
      ? { 
          fontSize: 18,
          textShadow: '0px 1px 4px rgba(0, 0, 0, 0.8)',
        }
      : {
          textShadowColor: 'rgba(0, 0, 0, 0.8)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        }),
  },
  buttonSection: {
    padding: 20,
    gap: 12,
  },
  changeSongsButton: {
    backgroundColor: '#b794f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  changeSongsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 1,
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
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  loveHeartContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loveHeartEmoji: {
    fontSize: 50,
    ...(Platform.OS === 'web' && {
      fontSize: 60,
    }),
  },
  flowersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  flowerEmoji: {
    position: 'absolute',
  },
  retroStripe: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
  },
  retroStripesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  retroStripePreset: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 8,
  },
  retroText: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#333',
    letterSpacing: 2,
  },
  retroSmallText: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  retroTextPreset: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#333',
    letterSpacing: 1,
    alignSelf: 'center',
  },
  retroSmallTextPreset: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4169E1',
  },
  stereoText: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    letterSpacing: 3,
    ...(Platform.OS === 'web' && {
      fontSize: 36,
      bottom: 30,
    }),
  },
});
