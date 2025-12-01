/**
 * PlayerIcons - SVG icons for player controls
 */

import React from 'react';
import { Platform } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const FastForwardIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'white',
  backgroundColor = '#4E9E9A',
}) => {
  if (Platform.OS === 'web') {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="${backgroundColor}" />
              <polygon points="40,35 55,50 40,65" fill="${color}" />
              <polygon points="55,35 70,50 55,65" fill="${color}" />
            </svg>
          `,
        }}
      />
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="45" fill={backgroundColor} />
      <Polygon points="40,35 55,50 40,65" fill={color} />
      <Polygon points="55,35 70,50 55,65" fill={color} />
    </Svg>
  );
};

export const RewindIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'white',
  backgroundColor = '#4E9E9A',
}) => {
  if (Platform.OS === 'web') {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="${backgroundColor}" />
              <polygon points="60,35 45,50 60,65" fill="${color}" />
              <polygon points="45,35 30,50 45,65" fill="${color}" />
            </svg>
          `,
        }}
      />
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="45" fill={backgroundColor} />
      <Polygon points="60,35 45,50 60,65" fill={color} />
      <Polygon points="45,35 30,50 45,65" fill={color} />
    </Svg>
  );
};

export const PlayIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'black',
  backgroundColor = '#4E9E9A',
}) => {
  if (Platform.OS === 'web') {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="${backgroundColor}" />
              <polygon points="40,30 40,70 70,50" fill="${color}" />
            </svg>
          `,
        }}
      />
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="45" fill={backgroundColor} />
      <Polygon points="40,30 40,70 70,50" fill={color} />
    </Svg>
  );
};

export const PauseIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'black',
  backgroundColor = '#4E9E9A',
}) => {
  if (Platform.OS === 'web') {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="${backgroundColor}" />
              <rect x="35" y="30" width="10" height="40" fill="${color}" />
              <rect x="55" y="30" width="10" height="40" fill="${color}" />
            </svg>
          `,
        }}
      />
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="45" fill={backgroundColor} />
      <Polygon points="35,30 45,30 45,70 35,70" fill={color} />
      <Polygon points="55,30 65,30 65,70 55,70" fill={color} />
    </Svg>
  );
};
