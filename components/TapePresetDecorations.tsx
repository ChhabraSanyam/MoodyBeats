/**
 * TapePresetDecorations Component
 * Renders preset-specific decorations (stars, hearts, flowers, stripes) for tape cassettes
 * Shared by TapeShellDesigner and EnvelopeOpeningAnimation
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface TapePresetDecorationsProps {
  presetId: string | null;
  tapeWidth: number;
  tapeHeight: number;
}

// Heart Shape Component (matches TapeShellDesigner)
interface HeartShapeProps {
  color: string;
  size: number;
  top: number;
  left: number;
}

function HeartShape({ color, size, top, left }: HeartShapeProps) {
  const heartWidth = size * 2;
  const heartHeight = size * 1.8;
  
  return (
    <View style={{ position: 'absolute', top, left, width: heartWidth, height: heartHeight }}>
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        top: 0,
        left: size,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }} />
      <View style={{
        position: 'absolute',
        top: size * 0.5,
        left: size * 0.5,
        width: size * 1,
        height: size * 1,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
    </View>
  );
}

// Flower Component (matches TapeShellDesigner)
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
      <View style={{
        position: 'absolute',
        top: (size - centerSize) / 2,
        left: (size - centerSize) / 2,
        width: centerSize,
        height: centerSize,
        borderRadius: centerSize / 2,
        backgroundColor: centerColor,
      }} />
    </View>
  );
}

const TapePresetDecorations: React.FC<TapePresetDecorationsProps> = ({
  presetId,
  tapeWidth,
  tapeHeight,
}) => {
  if (!presetId) return null;

  // Render galaxy stars with shooting stars
  const renderGalaxyStars = () => {
    const stars = [
      { top: 0.05, left: 0.08, size: 2, opacity: 0.95 },
      { top: 0.08, left: 0.15, size: 1.5, opacity: 0.4 },
      { top: 0.06, left: 0.25, size: 2, opacity: 0.75 },
      { top: 0.10, left: 0.35, size: 2.5, opacity: 0.3 },
      { top: 0.07, left: 0.45, size: 2, opacity: 0.85 },
      { top: 0.09, left: 0.55, size: 2, opacity: 0.5 },
      { top: 0.06, left: 0.65, size: 1.5, opacity: 0.9 },
      { top: 0.08, left: 0.75, size: 2, opacity: 0.35 },
      { top: 0.10, left: 0.85, size: 2, opacity: 0.8 },
      { top: 0.07, left: 0.92, size: 2.5, opacity: 0.6 },
      { top: 0.25, left: 0.07, size: 1.5, opacity: 0.85 },
      { top: 0.40, left: 0.08, size: 2.5, opacity: 0.95 },
      { top: 0.55, left: 0.07, size: 1.5, opacity: 0.75 },
      { top: 0.70, left: 0.08, size: 2, opacity: 0.35 },
      { top: 0.85, left: 0.07, size: 2, opacity: 0.55 },
      { top: 0.25, left: 0.93, size: 1.5, opacity: 0.9 },
      { top: 0.40, left: 0.92, size: 2.5, opacity: 0.85 },
      { top: 0.55, left: 0.93, size: 1.5, opacity: 0.75 },
      { top: 0.70, left: 0.92, size: 2, opacity: 0.45 },
      { top: 0.85, left: 0.93, size: 2, opacity: 0.6 },
      { top: 0.90, left: 0.15, size: 1.5, opacity: 0.4 },
      { top: 0.91, left: 0.35, size: 2, opacity: 0.95 },
      { top: 0.92, left: 0.55, size: 2, opacity: 0.8 },
      { top: 0.91, left: 0.75, size: 2, opacity: 0.85 },
    ];

    const shootingStars = Platform.OS === 'web' ? [
      { top: 0.15, left: 0.05, animation: 'shootingStar1 3s ease-in-out infinite', delay: '0s' },
      { top: 0.45, left: 0.10, animation: 'shootingStar2 4s ease-in-out infinite', delay: '1.5s' },
      { top: 0.75, left: 0.08, animation: 'shootingStar3 3.5s ease-in-out infinite', delay: '2.5s' },
      { top: 0.30, left: 0.12, animation: 'shootingStar4 4.5s ease-in-out infinite', delay: '3.5s' },
    ] : [];

    return (
      <>
        {/* Static stars */}
        {stars.map((star, index) => (
          <View
            key={`star-${index}`}
            style={{
              position: 'absolute',
              top: star.top * tapeHeight,
              left: star.left * tapeWidth,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              backgroundColor: `rgba(255, 255, 255, ${star.opacity})`,
            }}
          />
        ))}
        
        {/* Shooting stars (web only) */}
        {Platform.OS === 'web' && shootingStars.map((shootingStar, index) => (
          // @ts-ignore - Web-specific styles
          <View
            key={`shooting-star-${index}`}
            style={{
              position: 'absolute',
              top: shootingStar.top * tapeHeight,
              left: shootingStar.left * tapeWidth,
              width: 60,
              height: 2,
              backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent)',
              borderRadius: '50%',
              animation: shootingStar.animation,
              animationDelay: shootingStar.delay,
            } as any}
          />
        ))}
      </>
    );
  };

  // Render love hearts (positioned around borders like in TapeShellDesigner)
  const renderLoveHearts = () => {
    // Scale factor for different tape sizes (base is 320x200 for mobile, 480x300 for web)
    const scale = tapeWidth / 320;
    
    return (
      <>
        {/* Top border hearts */}
        <HeartShape color="#FF69B4" size={7 * scale} top={5 * scale} left={15 * scale} />
        <HeartShape color="#8B0000" size={8 * scale} top={5 * scale} left={50 * scale} />
        <HeartShape color="#FF69B4" size={7 * scale} top={5 * scale} left={90 * scale} />
        <HeartShape color="#8B0000" size={8 * scale} top={5 * scale} left={130 * scale} />
        <HeartShape color="#FF69B4" size={7 * scale} top={5 * scale} left={170 * scale} />
        <HeartShape color="#8B0000" size={8 * scale} top={5 * scale} left={210 * scale} />
        <HeartShape color="#FF69B4" size={7 * scale} top={5 * scale} left={250 * scale} />
        <HeartShape color="#8B0000" size={7 * scale} top={5 * scale} left={285 * scale} />
        
        {/* Left border hearts */}
        <HeartShape color="#8B0000" size={7 * scale} top={35 * scale} left={5 * scale} />
        <HeartShape color="#FF69B4" size={8 * scale} top={65 * scale} left={5 * scale} />
        <HeartShape color="#8B0000" size={7 * scale} top={95 * scale} left={5 * scale} />
        <HeartShape color="#FF69B4" size={8 * scale} top={125 * scale} left={5 * scale} />
        <HeartShape color="#8B0000" size={7 * scale} top={155 * scale} left={5 * scale} />
        
        {/* Right border hearts */}
        <HeartShape color="#FF69B4" size={7 * scale} top={35 * scale} left={300 * scale} />
        <HeartShape color="#8B0000" size={8 * scale} top={65 * scale} left={300 * scale} />
        <HeartShape color="#FF69B4" size={7 * scale} top={95 * scale} left={300 * scale} />
        <HeartShape color="#8B0000" size={8 * scale} top={125 * scale} left={300 * scale} />
        <HeartShape color="#FF69B4" size={7 * scale} top={155 * scale} left={300 * scale} />
        
        {/* Bottom border hearts */}
        <HeartShape color="#8B0000" size={7 * scale} top={180 * scale} left={15 * scale} />
        <HeartShape color="#FF69B4" size={8 * scale} top={180 * scale} left={50 * scale} />
        <HeartShape color="#8B0000" size={7 * scale} top={180 * scale} left={90 * scale} />
        <HeartShape color="#FF69B4" size={8 * scale} top={180 * scale} left={130 * scale} />
        <HeartShape color="#8B0000" size={7 * scale} top={180 * scale} left={170 * scale} />
        <HeartShape color="#FF69B4" size={8 * scale} top={180 * scale} left={210 * scale} />
        <HeartShape color="#8B0000" size={7 * scale} top={180 * scale} left={250 * scale} />
        <HeartShape color="#FF69B4" size={7 * scale} top={180 * scale} left={285 * scale} />
      </>
    );
  };

  // Render flowers (positioned around borders like in TapeShellDesigner)
  const renderFlowers = () => {
    const scale = tapeWidth / 320;
    const flowerSize = 20 * scale;
    
    return (
      <>
        {/* Top border flowers */}
        <Flower petalColor="#8B5CF6" centerColor="#F97316" size={flowerSize} top={5 * scale} left={20 * scale} />
        <Flower petalColor="#4F46E5" centerColor="#F97316" size={flowerSize} top={5 * scale} left={80 * scale} />
        <Flower petalColor="#3B82F6" centerColor="#F97316" size={flowerSize} top={5 * scale} left={140 * scale} />
        <Flower petalColor="#22C55E" centerColor="#F97316" size={flowerSize} top={5 * scale} left={200 * scale} />
        <Flower petalColor="#EF4444" centerColor="#F97316" size={flowerSize} top={5 * scale} left={260 * scale} />
        
        {/* Left border flowers */}
        <Flower petalColor="#EF4444" centerColor="#F97316" size={flowerSize} top={40 * scale} left={5 * scale} />
        <Flower petalColor="#8B5CF6" centerColor="#F97316" size={flowerSize} top={90 * scale} left={5 * scale} />
        <Flower petalColor="#4F46E5" centerColor="#F97316" size={flowerSize} top={140 * scale} left={5 * scale} />
        
        {/* Right border flowers */}
        <Flower petalColor="#3B82F6" centerColor="#F97316" size={flowerSize} top={40 * scale} right={5 * scale} />
        <Flower petalColor="#22C55E" centerColor="#F97316" size={flowerSize} top={90 * scale} right={5 * scale} />
        <Flower petalColor="#EF4444" centerColor="#F97316" size={flowerSize} top={140 * scale} right={5 * scale} />
        
        {/* Bottom border flowers */}
        <Flower petalColor="#EF4444" centerColor="#F97316" size={flowerSize} top={175 * scale} left={20 * scale} />
        <Flower petalColor="#8B5CF6" centerColor="#F97316" size={flowerSize} top={175 * scale} left={80 * scale} />
        <Flower petalColor="#4F46E5" centerColor="#F97316" size={flowerSize} top={175 * scale} left={140 * scale} />
        <Flower petalColor="#3B82F6" centerColor="#F97316" size={flowerSize} top={175 * scale} left={200 * scale} />
        <Flower petalColor="#22C55E" centerColor="#F97316" size={flowerSize} top={175 * scale} left={260 * scale} />
      </>
    );
  };

  // Render retro stripes
  const renderRetroStripes = () => {
    return (
      <>
        {/* Red stripe */}
        <View style={{
          position: 'absolute',
          top: 0.35 * tapeHeight,
          left: 0,
          width: tapeWidth,
          height: 8,
          backgroundColor: '#EF4444',
        }} />
        
        {/* Orange stripe */}
        <View style={{
          position: 'absolute',
          top: 0.43 * tapeHeight,
          left: 0,
          width: tapeWidth,
          height: 8,
          backgroundColor: '#F97316',
        }} />
        
        {/* Yellow stripe */}
        <View style={{
          position: 'absolute',
          top: 0.51 * tapeHeight,
          left: 0,
          width: tapeWidth,
          height: 8,
          backgroundColor: '#EAB308',
        }} />
      </>
    );
  };

  return (
    <View style={styles.overlay}>
      {presetId === 'galaxy' && renderGalaxyStars()}
      {presetId === 'love' && renderLoveHearts()}
      {presetId === 'flowers' && renderFlowers()}
      {presetId === 'retro' && renderRetroStripes()}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    pointerEvents: 'none',
  },
});

export default TapePresetDecorations;
