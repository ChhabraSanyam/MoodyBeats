/**
 * Sound Effects Manager
 * Handles loading and playing sound effects for UI interactions
 */

import { Audio } from 'expo-av';

export class SoundEffects {
  private static instance: SoundEffects;
  private sounds: Map<string, Audio.Sound> = new Map();
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
      console.log('SoundEffects already initialized');
      return;
    }

    try {
      console.log('Initializing SoundEffects...');
      
      // Configure audio mode for sound effects
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Preload FF error sounds
      console.log('Loading FF error sounds...');
      await this.loadSound('ff-error-1', require('../assets/sounds/ff-error-1.mp3'));
      await this.loadSound('ff-error-2', require('../assets/sounds/ff-error-2.mp3'));
      await this.loadSound('ff-error-3', require('../assets/sounds/ff-error-3.mp3'));
      await this.loadSound('ff-error-4', require('../assets/sounds/ff-error-4.mp3'));
      
      // Preload pause sound
      await this.loadSound('pause', require('../assets/sounds/pause.mp3'));
      
      // Preload rewind error sound
      await this.loadSound('rewind-error', require('../assets/sounds/rewind-error.mp3'));

      this.isInitialized = true;
      console.log('SoundEffects initialized successfully. Loaded sounds:', Array.from(this.sounds.keys()));
    } catch (error) {
      console.error('Error initializing sound effects:', error);
    }
  }

  /**
   * Load a single sound file
   */
  private async loadSound(key: string, source: any): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: false,
        volume: 1.0,
      });
      this.sounds.set(key, sound);
    } catch (error) {
      console.error(`Error loading sound ${key}:`, error);
    }
  }

  /**
   * Play a specific sound effect
   */
  async play(key: string): Promise<void> {
    try {
      console.log(`Attempting to play sound: ${key}`);
      console.log('Available sounds:', Array.from(this.sounds.keys()));
      
      const sound = this.sounds.get(key);
      if (!sound) {
        console.warn(`Sound ${key} not found in loaded sounds`);
        return;
      }

      console.log(`Sound ${key} found, playing...`);
      // Reset to beginning and play
      await sound.setPositionAsync(0);
      await sound.playAsync();
      console.log(`Sound ${key} played successfully`);
    } catch (error) {
      console.error(`Error playing sound ${key}:`, error);
    }
  }

  /**
   * Play a random FF error sound
   */
  async playRandomFFError(): Promise<void> {
    console.log('playRandomFFError called');
    
    if (!this.isInitialized) {
      console.warn('SoundEffects not initialized yet, initializing now...');
      await this.initialize();
    }
    
    const errorSounds = ['ff-error-1', 'ff-error-2', 'ff-error-3', 'ff-error-4'];
    const randomSound = errorSounds[Math.floor(Math.random() * errorSounds.length)];
    console.log('Playing random FF error sound:', randomSound);
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
    for (const [key, sound] of this.sounds.entries()) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error(`Error unloading sound ${key}:`, error);
      }
    }
    this.sounds.clear();
    this.isInitialized = false;
  }
}
