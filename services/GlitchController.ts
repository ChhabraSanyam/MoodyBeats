/**
 * GlitchController service for MoodyBeats
 * Detects interaction patterns and triggers spooky glitch effects
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { Audio } from 'expo-av';
import { GlitchMode } from '../models/PlaybackState';

// Constants
const BUTTON_MASH_THRESHOLD = 5; // Number of button presses
const BUTTON_MASH_WINDOW = 2000; // Time window in milliseconds
const FF_REW_SEQUENCE_THRESHOLD = 4; // Number of FF/REW alternations
const FF_REW_SEQUENCE_WINDOW = 3000; // Time window in milliseconds
const EXTREME_OVERHEAT_THRESHOLD = 95; // Overheat level that triggers glitch
const GLITCH_DURATION = 3000; // Duration of glitch effect in milliseconds
const GLITCH_COOLDOWN = 10000; // Cooldown before next glitch can trigger

type ButtonAction = 'play' | 'pause' | 'ff' | 'rew' | 'flip';
type GlitchTriggerCallback = (glitchMode: GlitchMode) => void;

interface ButtonPress {
  action: ButtonAction;
  timestamp: number;
}

interface FFREWAction {
  action: 'ff' | 'rew';
  timestamp: number;
}

export class GlitchController {
  private buttonPressHistory: ButtonPress[] = [];
  private ffRewHistory: FFREWAction[] = [];
  private lastGlitchTime: number = 0;
  private glitchTriggerCallbacks: Set<GlitchTriggerCallback> = new Set();
  private jumpscareSound: Audio.Sound | null = null;
  private isInitialized: boolean = false;

  // Available glitch visual effects
  private readonly visualEffects: ('crt-scanline' | 'phosphor-green' | 'ui-shake' | 'tape-jitter')[] = [
    'crt-scanline',
    'phosphor-green',
    'ui-shake',
    'tape-jitter',
  ];

  // Available jumpscare sounds (placeholders - actual files would be added to assets)
  private readonly jumpscareFiles = [
    'jumpscare-1',
    'jumpscare-2',
    'jumpscare-3',
  ];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the glitch controller
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Configure audio mode for jumpscare sounds
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false, // Don't duck - we want full volume for jumpscares
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing glitch controller:', error);
    }
  }

  /**
   * Record a button press and check for rapid mashing pattern
   * Requirements: 11.1
   */
  recordButtonPress(action: ButtonAction): void {
    const now = Date.now();
    
    // Add to history
    this.buttonPressHistory.push({ action, timestamp: now });

    // Clean up old entries outside the window
    this.buttonPressHistory = this.buttonPressHistory.filter(
      press => now - press.timestamp < BUTTON_MASH_WINDOW
    );

    // Check if we've detected rapid button mashing
    if (this.buttonPressHistory.length >= BUTTON_MASH_THRESHOLD) {
      this.triggerGlitch('button-mash');
    }
  }

  /**
   * Record FF/REW action and check for repeated sequences
   * Requirements: 11.2
   */
  recordFFREWAction(action: 'ff' | 'rew'): void {
    const now = Date.now();
    
    // Add to history
    this.ffRewHistory.push({ action, timestamp: now });

    // Clean up old entries outside the window
    this.ffRewHistory = this.ffRewHistory.filter(
      entry => now - entry.timestamp < FF_REW_SEQUENCE_WINDOW
    );

    // Check for alternating FF/REW pattern
    if (this.ffRewHistory.length >= FF_REW_SEQUENCE_THRESHOLD) {
      const hasAlternatingPattern = this.detectAlternatingFFREW();
      if (hasAlternatingPattern) {
        this.triggerGlitch('ff-rew-sequence');
      }
    }
  }

  /**
   * Detect alternating FF/REW pattern in history
   */
  private detectAlternatingFFREW(): boolean {
    if (this.ffRewHistory.length < 2) {
      return false;
    }

    let alternations = 0;
    for (let i = 1; i < this.ffRewHistory.length; i++) {
      if (this.ffRewHistory[i].action !== this.ffRewHistory[i - 1].action) {
        alternations++;
      }
    }

    // Consider it alternating if at least half the actions alternate
    return alternations >= Math.floor(this.ffRewHistory.length / 2);
  }

  /**
   * Check overheat level and trigger glitch if extreme
   * Requirements: 11.3
   */
  checkOverheatLevel(overheatLevel: number): void {
    if (overheatLevel >= EXTREME_OVERHEAT_THRESHOLD) {
      this.triggerGlitch('extreme-overheat');
    }
  }

  /**
   * Trigger a glitch effect
   * Requirements: 11.4, 11.5
   */
  private triggerGlitch(reason: string): void {
    const now = Date.now();

    // Check cooldown - don't trigger if we recently had a glitch
    if (now - this.lastGlitchTime < GLITCH_COOLDOWN) {
      return;
    }

    // Select random visual effect
    const visualEffect = this.selectRandomVisualEffect();

    // Select random jumpscare sound
    const jumpscareFile = this.selectRandomJumpscare();

    // Create glitch mode object
    const glitchMode: GlitchMode = {
      type: visualEffect,
      audioJumpscare: jumpscareFile,
      startTime: now,
      duration: GLITCH_DURATION,
    };

    // Update last glitch time
    this.lastGlitchTime = now;

    // Play jumpscare audio
    this.playJumpscare(jumpscareFile);

    // Notify all callbacks
    this.notifyGlitchTrigger(glitchMode);

    // Clear button press history to prevent immediate re-trigger
    this.buttonPressHistory = [];
    this.ffRewHistory = [];

    console.log(`Glitch triggered! Reason: ${reason}, Effect: ${visualEffect}`);
  }

  /**
   * Select a random visual effect
   * Requirements: 11.4
   */
  private selectRandomVisualEffect(): 'crt-scanline' | 'phosphor-green' | 'ui-shake' | 'tape-jitter' {
    const randomIndex = Math.floor(Math.random() * this.visualEffects.length);
    return this.visualEffects[randomIndex];
  }

  /**
   * Select a random jumpscare sound
   * Requirements: 11.5
   */
  private selectRandomJumpscare(): string {
    const randomIndex = Math.floor(Math.random() * this.jumpscareFiles.length);
    return this.jumpscareFiles[randomIndex];
  }

  /**
   * Play a jumpscare audio file
   * Requirements: 11.5
   */
  private async playJumpscare(jumpscareFile: string): Promise<void> {
    try {
      // Unload previous jumpscare if any
      if (this.jumpscareSound) {
        await this.jumpscareSound.unloadAsync();
        this.jumpscareSound = null;
      }

      // Note: In a real implementation, these would be actual audio files
      // For now, we'll create a placeholder that logs the jumpscare
      console.log(`Playing jumpscare: ${jumpscareFile}`);

      // In production, this would be:
      // const { sound } = await Audio.Sound.createAsync(
      //   require(`../assets/sounds/jumpscares/${jumpscareFile}.mp3`),
      //   { shouldPlay: true, volume: 1.0 }
      // );
      // this.jumpscareSound = sound;

    } catch (error) {
      console.error('Error playing jumpscare:', error);
    }
  }

  /**
   * Register a callback for glitch triggers
   * Returns an unsubscribe function
   */
  onGlitchTrigger(callback: GlitchTriggerCallback): () => void {
    this.glitchTriggerCallbacks.add(callback);
    
    return () => {
      this.glitchTriggerCallbacks.delete(callback);
    };
  }

  /**
   * Notify all registered callbacks of glitch trigger
   */
  private notifyGlitchTrigger(glitchMode: GlitchMode): void {
    this.glitchTriggerCallbacks.forEach(callback => {
      try {
        callback(glitchMode);
      } catch (error) {
        console.error('Error in glitch trigger callback:', error);
      }
    });
  }

  /**
   * Check if a glitch is currently active
   */
  isGlitchActive(glitchMode: GlitchMode | null): boolean {
    if (!glitchMode) {
      return false;
    }

    const now = Date.now();
    const elapsed = now - glitchMode.startTime;
    return elapsed < glitchMode.duration;
  }

  /**
   * Clear glitch mode if duration has expired
   */
  clearExpiredGlitch(glitchMode: GlitchMode | null): GlitchMode | null {
    if (!glitchMode) {
      return null;
    }

    if (!this.isGlitchActive(glitchMode)) {
      return null;
    }

    return glitchMode;
  }

  /**
   * Reset all tracking state (useful for testing or manual reset)
   */
  reset(): void {
    this.buttonPressHistory = [];
    this.ffRewHistory = [];
    this.lastGlitchTime = 0;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.jumpscareSound) {
      try {
        await this.jumpscareSound.unloadAsync();
      } catch (error) {
        console.error('Error unloading jumpscare sound:', error);
      }
      this.jumpscareSound = null;
    }

    this.glitchTriggerCallbacks.clear();
    this.reset();
    this.isInitialized = false;
  }
}
