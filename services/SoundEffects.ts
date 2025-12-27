/**
 * Sound Effects Manager
 * Handles loading and playing sound effects for UI interactions
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio/build/AudioModule.types';


export class SoundEffects {
  private static instance: SoundEffects;
  private sounds: Map<string, AudioPlayer> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): SoundEffects {
    if (!SoundEffects.instance) {
      SoundEffects.instance = new SoundEffects();
    }
    return SoundEffects.instance;
  }

  /**
   * Initialize and preload sound effects
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Configure audio mode for sound effects
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });

      // Preload FF error sounds
      await this.loadSound('ff-error-1', require('../assets/sounds/ff-error-1.mp3'));
      await this.loadSound('ff-error-2', require('../assets/sounds/ff-error-2.mp3'));
      await this.loadSound('ff-error-3', require('../assets/sounds/ff-error-3.mp3'));
      await this.loadSound('ff-error-4', require('../assets/sounds/ff-error-4.mp3'));
      
      // Preload pause sound
      await this.loadSound('pause', require('../assets/sounds/pause.mp3'));
      
      // Preload rewind error sound
      await this.loadSound('rewind-error', require('../assets/sounds/rewind-error.mp3'));

      this.isInitialized = true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error initializing sound effects:', error);
      }
    }
  }

  /**
   * Load a single sound file
   */
  private async loadSound(key: string, source: any): Promise<void> {
    try {
      // Create audio player with proper error handling
      const player = createAudioPlayer(source, { updateInterval: 500, keepAudioSessionActive: false });
      
      // Wait a moment for the player to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if the player loaded successfully
      if (player.currentStatus && !player.currentStatus.isLoaded) {
        if (__DEV__) {
          console.warn(`Sound ${key} may not have loaded properly`);
        }
      }
      
      this.sounds.set(key, player);
    } catch (error) {
      if (__DEV__) {
        console.error(`Error loading sound ${key}:`, error);
      }
      // Continue without this sound - don't fail the entire initialization
    }
  }

  /**
   * Play a specific sound effect
   */
  /**
   * Play a sound effect
   */
  async play(key: string): Promise<void> {
    try {
      const player = this.sounds.get(key);
      if (!player) {
        // Silently fail if sound not available - don't spam warnings
        return;
      }

      // Check if player is loaded before trying to play
      if (!player.currentStatus?.isLoaded) {
        return;
      }

      // Reset to beginning and play
      await player.seekTo(0);
      player.play();
    } catch (error) {
      // Silently handle audio errors - they're not critical to app functionality
      // Only log if it's a development environment
      if (__DEV__) {
        console.warn(`Error playing sound ${key}:`, error);
      }
    }
  }

  /**
   * Play a random FF error sound
   */
  async playRandomFFError(): Promise<void> {
    if (!this.isInitialized) {
      if (__DEV__) {
        console.warn('SoundEffects not initialized yet, initializing now...');
      }
      await this.initialize();
    }
    
    const errorSounds = ['ff-error-1', 'ff-error-2', 'ff-error-3', 'ff-error-4'];
    const randomSound = errorSounds[Math.floor(Math.random() * errorSounds.length)];
    await this.play(randomSound);
  }

  /**
   * Play pause sound
   */
  async playPause(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    await this.play('pause');
  }

  /**
   * Play rewind error sound
   */
  async playRewindError(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    await this.play('rewind-error');
  }

  /**
   * Cleanup all loaded sounds
   */
  async cleanup(): Promise<void> {
    for (const [key, player] of Array.from(this.sounds.entries())) {
      try {
        player.remove();
      } catch (error) {
        if (__DEV__) {
          console.error(`Error unloading sound ${key}:`, error);
        }
      }
    }
    this.sounds.clear();
    this.isInitialized = false;
  }
}
