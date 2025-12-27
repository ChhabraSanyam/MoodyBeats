/**
 * AudioEffectsManager service for MoodyBeats
 * Manages authentic tape deck sound effects and pitch shifting
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio/build/AudioModule.types';


export type SoundEffectType = 
  | 'play-click'
  | 'pause-clunk'
  | 'flip-mechanical'
  | 'tape-eject'
  | 'tape-insert';

/**
 * AudioEffectsManager handles loading and playing tape deck sound effects
 */
export class AudioEffectsManager {
  private soundEffects: Map<SoundEffectType, AudioPlayer> = new Map();
  private isInitialized: boolean = false;

  /**
   * Initialize and preload all sound effects
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

      // Preload all sound effects
      await this.loadSoundEffect('play-click', require('../assets/sounds/play-click.mp3'));
      await this.loadSoundEffect('pause-clunk', require('../assets/sounds/pause-clunk.mp3'));
      await this.loadSoundEffect('flip-mechanical', require('../assets/sounds/flip-mechanical.mp3'));
      await this.loadSoundEffect('tape-eject', require('../assets/sounds/tape-eject.mp3'));
      await this.loadSoundEffect('tape-insert', require('../assets/sounds/tape-insert.mp3'));

      this.isInitialized = true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error initializing audio effects:', error);
      }
      // Continue without sound effects if loading fails
    }
  }

  /**
   * Load a single sound effect
   */
  private async loadSoundEffect(type: SoundEffectType, source: any): Promise<void> {
    try {
      const player = createAudioPlayer(source, { updateInterval: 500, keepAudioSessionActive: false });
      
      // Wait a moment for the player to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.soundEffects.set(type, player);
    } catch (error) {
      if (__DEV__) {
        console.error(`Error loading sound effect ${type}:`, error);
      }
      // Continue without this specific sound effect
    }
  }

  /**
   * Play a sound effect
   * Requirements: 10.1, 10.4
   */
  async playEffect(type: SoundEffectType): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const player = this.soundEffects.get(type);
    if (!player) {
      return;
    }

    try {
      // Check if player is loaded before trying to play
      if (!player.currentStatus?.isLoaded) {
        return;
      }

      // Seek to start and play
      await player.seekTo(0);
      player.play();
    } catch (error) {
      // Silently handle audio errors in production
      if (__DEV__) {
        console.warn(`Error playing sound effect ${type}:`, error);
      }
    }
  }

  /**
   * Play click sound for play button
   * Requirements: 10.1
   */
  async playClickSound(): Promise<void> {
    await this.playEffect('play-click');
  }

  /**
   * Play clunk sound for pause button
   * Requirements: 10.1
   */
  async playClunkSound(): Promise<void> {
    await this.playEffect('pause-clunk');
  }

  /**
   * Play mechanical tape deck sounds for side flip
   * Requirements: 10.4
   */
  async playFlipSound(): Promise<void> {
    // Play eject sound first
    await this.playEffect('tape-eject');
    
    // Wait for eject to finish, then play mechanical flip
    setTimeout(async () => {
      await this.playEffect('flip-mechanical');
      
      // Wait for flip, then play insert
      setTimeout(async () => {
        await this.playEffect('tape-insert');
      }, 300);
    }, 400);
  }

  /**
   * Clean up all sound effects
   */
  async cleanup(): Promise<void> {
    for (const [type, player] of Array.from(this.soundEffects.entries())) {
      try {
        player.remove();
      } catch (error) {
        if (__DEV__) {
          console.error(`Error unloading sound effect ${type}:`, error);
        }
      }
    }
    
    this.soundEffects.clear();
    this.isInitialized = false;
  }
}

/**
 * PitchShiftManager handles pitch shifting effects for FF/REW
 * Requirements: 10.2, 10.3
 */
export class PitchShiftManager {
  /**
   * Apply pitch shift effect for fast forward
   * Requirements: 10.2
   * 
   * Note: expo-audio's setPlaybackRate with shouldCorrectPitch=false will
   * naturally increase pitch when speed increases, creating the
   * authentic tape fast-forward sound.
   */
  static async applyFastForwardPitch(player: AudioPlayer, speed: number = 2.0): Promise<void> {
    try {
      // Set rate without pitch correction to get the chipmunk effect
      player.setPlaybackRate(speed, 'low');
      player.shouldCorrectPitch = false;
    } catch (error) {
      if (__DEV__) {
        console.error('Error applying fast forward pitch:', error);
      }
    }
  }

  /**
   * Apply pitch shift effect for rewind
   * Requirements: 10.3
   * 
   * Note: For rewind, we simulate the effect by playing backwards
   * with pitch shift. Since expo-audio doesn't support true reverse playback,
   * we achieve the rewind effect through rapid seeking backwards in
   * the PlaybackEngine, and this method prepares the audio characteristics.
   */
  static async applyRewindPitch(player: AudioPlayer, speed: number = 2.0): Promise<void> {
    try {
      // Set rate without pitch correction for the rewind effect
      // The actual backwards motion is handled by PlaybackEngine's seeking
      player.setPlaybackRate(speed, 'low');
      player.shouldCorrectPitch = false;
    } catch (error) {
      if (__DEV__) {
        console.error('Error applying rewind pitch:', error);
      }
    }
  }

  /**
   * Reset pitch to normal playback
   */
  static async resetPitch(player: AudioPlayer): Promise<void> {
    try {
      // Return to normal rate with pitch correction
      player.setPlaybackRate(1.0, 'medium');
      player.shouldCorrectPitch = true;
    } catch (error) {
      if (__DEV__) {
        console.error('Error resetting pitch:', error);
      }
    }
  }
}
