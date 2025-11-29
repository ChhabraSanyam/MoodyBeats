/**
 * AudioEffectsManager service for MoodyBeats
 * Manages authentic tape deck sound effects and pitch shifting
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

import { Audio, AVPlaybackSource } from 'expo-av';

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
  private soundEffects: Map<SoundEffectType, Audio.Sound> = new Map();
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
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Preload all sound effects
      await this.loadSoundEffect('play-click', require('../assets/sounds/play-click.mp3'));
      await this.loadSoundEffect('pause-clunk', require('../assets/sounds/pause-clunk.mp3'));
      await this.loadSoundEffect('flip-mechanical', require('../assets/sounds/flip-mechanical.mp3'));
      await this.loadSoundEffect('tape-eject', require('../assets/sounds/tape-eject.mp3'));
      await this.loadSoundEffect('tape-insert', require('../assets/sounds/tape-insert.mp3'));

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing audio effects:', error);
      // Continue without sound effects if loading fails
    }
  }

  /**
   * Load a single sound effect
   */
  private async loadSoundEffect(type: SoundEffectType, source: AVPlaybackSource): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(source, {
        shouldPlay: false,
        volume: 0.7,
      });
      
      this.soundEffects.set(type, sound);
    } catch (error) {
      console.error(`Error loading sound effect ${type}:`, error);
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

    const sound = this.soundEffects.get(type);
    if (!sound) {
      return;
    }

    try {
      // Rewind to start and play
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (error) {
      console.error(`Error playing sound effect ${type}:`, error);
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
    for (const [type, sound] of this.soundEffects.entries()) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error(`Error unloading sound effect ${type}:`, error);
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
   * Note: Expo AV's setRateAsync with shouldCorrectPitch=false will
   * naturally increase pitch when speed increases, creating the
   * authentic tape fast-forward sound.
   */
  static async applyFastForwardPitch(sound: Audio.Sound, speed: number = 2.0): Promise<void> {
    try {
      // Set rate without pitch correction to get the chipmunk effect
      await sound.setRateAsync(speed, false);
    } catch (error) {
      console.error('Error applying fast forward pitch:', error);
    }
  }

  /**
   * Apply pitch shift effect for rewind
   * Requirements: 10.3
   * 
   * Note: For rewind, we simulate the effect by playing backwards
   * with pitch shift. Since Expo AV doesn't support true reverse playback,
   * we achieve the rewind effect through rapid seeking backwards in
   * the PlaybackEngine, and this method prepares the audio characteristics.
   */
  static async applyRewindPitch(sound: Audio.Sound, speed: number = 2.0): Promise<void> {
    try {
      // Set rate without pitch correction for the rewind effect
      // The actual backwards motion is handled by PlaybackEngine's seeking
      await sound.setRateAsync(speed, false);
    } catch (error) {
      console.error('Error applying rewind pitch:', error);
    }
  }

  /**
   * Reset pitch to normal playback
   */
  static async resetPitch(sound: Audio.Sound): Promise<void> {
    try {
      // Return to normal rate with pitch correction
      await sound.setRateAsync(1.0, true);
    } catch (error) {
      console.error('Error resetting pitch:', error);
    }
  }
}
