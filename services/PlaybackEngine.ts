/**
 * PlaybackEngine service for MoodyBeats
 * Handles audio playback, state management, and track transitions
 * Requirements: 6.1, 6.2, 10.1, 10.2, 10.3, 10.4
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import { Mixtape, PlaybackState, Track } from '../models';
import { AudioEffectsManager, PitchShiftManager } from './AudioEffectsManager';
import { GlitchController } from './GlitchController';
import { SoundEffects } from './SoundEffects';

type StateChangeCallback = (state: PlaybackState) => void;

// Constants
const FF_THRESHOLD_PERCENT = 85;
const OVERHEAT_MAX = 100;
const OVERHEAT_INCREMENT = 15;
const OVERHEAT_DECAY_RATE = 2; // Points per second
const OVERHEAT_COOLDOWN_DURATION = 5000; // 5 seconds in milliseconds

export class PlaybackEngine {
  private sound: Audio.Sound | null = null;
  private nextSound: Audio.Sound | null = null; // Preloaded next track
  private mixtape: Mixtape | null = null;
  private state: PlaybackState;
  private stateChangeCallbacks: Set<StateChangeCallback> = new Set();
  private isLoadingTrack: boolean = false;
  private ffInterval: ReturnType<typeof setInterval> | null = null;
  private rewInterval: ReturnType<typeof setInterval> | null = null;
  private overheatDecayInterval: ReturnType<typeof setInterval> | null = null;
  private cooldownTimeout: ReturnType<typeof setTimeout> | null = null;
  private ffSpeedMultiplier: number = 2.0;
  private rewSpeedMultiplier: number = 2.0;
  private ffSpeedIncreaseInterval: ReturnType<typeof setInterval> | null = null;
  private rewSpeedIncreaseInterval: ReturnType<typeof setInterval> | null = null;
  private audioEffects: AudioEffectsManager;
  private glitchController: GlitchController;
  private pausePlayPressCount: number = 0;
  private lastPausePlayPressTime: number = 0;
  private pausePlayResetTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.state = this.createInitialState();
    this.audioEffects = new AudioEffectsManager();
    this.glitchController = new GlitchController();
    this.startOverheatDecay();
    this.setupGlitchListener();
    // Initialize sound effects
    SoundEffects.getInstance().initialize().catch(console.error);
  }

  /**
   * Setup glitch controller listener
   */
  private setupGlitchListener(): void {
    this.glitchController.onGlitchTrigger((glitchMode) => {
      this.state.glitchMode = glitchMode;
      this.notifyStateChange();

      // Auto-clear glitch after duration
      setTimeout(() => {
        this.state.glitchMode = null;
        this.notifyStateChange();
      }, glitchMode.duration);
    });
  }

  private createInitialState(): PlaybackState {
    return {
      mixtapeId: '',
      currentSide: 'A',
      currentTrackIndex: 0,
      position: 0,
      duration: 0,
      isPlaying: false,
      isFastForwarding: false,
      isRewinding: false,
      overheatLevel: 0,
      isOverheated: false,
      glitchMode: null,
    };
  }

  /**
   * Load a mixtape for playback
   */
  async load(mixtape: Mixtape): Promise<void> {
    // Unload any existing sound
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    if (this.nextSound) {
      await this.nextSound.unloadAsync();
      this.nextSound = null;
    }

    this.mixtape = mixtape;
    this.state = {
      ...this.createInitialState(),
      mixtapeId: mixtape.id,
    };

    // Load the first track if available
    const tracks = this.getCurrentSideTracks();
    if (tracks.length > 0) {
      await this.loadTrack(tracks[0]);
      // Preload next track for seamless playback
      if (tracks.length > 1) {
        this.preloadNextTrack();
      }
    }

    this.notifyStateChange();
  }

  /**
   * Load a specific track into the audio player
   */
  private async loadTrack(track: Track): Promise<void> {
    if (this.isLoadingTrack) {
      return;
    }

    this.isLoadingTrack = true;

    try {
      // Unload previous sound
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Create and load new sound
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: track.source.uri },
        { shouldPlay: false },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;

      // Update duration from loaded status
      if (status.isLoaded) {
        this.state.duration = status.durationMillis || 0;
        this.state.position = 0;
      }
    } catch (error) {
      console.error('Error loading track:', error);
      // Skip to next track on error
      await this.skipToNextTrack();
    } finally {
      this.isLoadingTrack = false;
    }
  }

  /**
   * Handle playback status updates from Expo AV
   */
  private onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
    if (!status.isLoaded) {
      return;
    }

    const wasPlaying = this.state.isPlaying;
    
    this.state.position = status.positionMillis || 0;
    this.state.duration = status.durationMillis || 0;
    this.state.isPlaying = status.isPlaying;

    // Handle track completion
    if (status.didJustFinish) {
      this.handleTrackCompletion();
    }

    // Notify if playing state changed or position updated significantly
    if (wasPlaying !== this.state.isPlaying || status.positionMillis) {
      this.notifyStateChange();
    }
  }

  /**
   * Preload the next track for seamless playback
   */
  private async preloadNextTrack(): Promise<void> {
    const tracks = this.getCurrentSideTracks();
    const nextIndex = this.state.currentTrackIndex + 1;

    if (nextIndex < tracks.length) {
      try {
        // Unload previous preloaded track if exists
        if (this.nextSound) {
          await this.nextSound.unloadAsync();
          this.nextSound = null;
        }

        // Preload next track
        const { sound } = await Audio.Sound.createAsync(
          { uri: tracks[nextIndex].source.uri },
          { shouldPlay: false }
        );
        this.nextSound = sound;
      } catch (error) {
        console.error('Error preloading next track:', error);
        // Don't fail if preloading fails - we'll load it normally when needed
      }
    }
  }

  /**
   * Handle track completion and transition to next track
   */
  private async handleTrackCompletion(): Promise<void> {
    const tracks = this.getCurrentSideTracks();
    const nextIndex = this.state.currentTrackIndex + 1;

    if (nextIndex < tracks.length) {
      // Move to next track
      this.state.currentTrackIndex = nextIndex;
      
      // Use preloaded track if available for seamless transition
      if (this.nextSound) {
        // Unload current sound
        if (this.sound) {
          await this.sound.unloadAsync();
        }
        
        // Use preloaded sound
        this.sound = this.nextSound;
        this.nextSound = null;
        
        // Set up status update callback
        this.sound.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate.bind(this));
        
        // Update duration
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded) {
          this.state.duration = status.durationMillis || 0;
          this.state.position = 0;
        }
        
        // Preload next track
        if (nextIndex + 1 < tracks.length) {
          this.preloadNextTrack();
        }
      } else {
        // Fallback to normal loading if preload failed
        await this.loadTrack(tracks[nextIndex]);
        
        // Preload next track
        if (nextIndex + 1 < tracks.length) {
          this.preloadNextTrack();
        }
      }
      
      // Automatically continue playing the next track
      await this.play();
    } else {
      // End of side reached - set index beyond array to signal completion
      this.state.currentTrackIndex = tracks.length;
      this.state.isPlaying = false;
      this.notifyStateChange();
    }
  }

  /**
   * Skip to the next track
   * Handles side boundaries - stops at end of side
   */
  private async skipToNextTrack(): Promise<void> {
    const tracks = this.getCurrentSideTracks();
    const nextIndex = this.state.currentTrackIndex + 1;

    if (nextIndex < tracks.length) {
      this.state.currentTrackIndex = nextIndex;
      await this.loadTrack(tracks[nextIndex]);
      
      if (this.state.isPlaying) {
        await this.play();
      }
    } else {
      // End of side reached - stop playback and prompt for flip
      this.state.isPlaying = false;
      this.state.position = this.state.duration;
      this.notifyStateChange();
    }
  }

  /**
   * Get tracks for the current side
   */
  private getCurrentSideTracks(): Track[] {
    if (!this.mixtape) {
      return [];
    }
    return this.state.currentSide === 'A' ? this.mixtape.sideA : this.mixtape.sideB;
  }

  /**
   * Start or resume playback
   * Requirements: 6.1, 10.1
   */
  async play(): Promise<void> {
    if (!this.sound || !this.mixtape) {
      return;
    }

    // Record button press for glitch detection
    this.glitchController.recordButtonPress('play');
    
    // Track consecutive pause/play presses
    this.trackPausePlayPress();

    // Check if we're at the end of the side - if so, restart from beginning
    const tracks = this.getCurrentSideTracks();
    if (tracks.length === 0) {
      console.error('No tracks available to play');
      return;
    }
    
    if (this.state.currentTrackIndex >= tracks.length) {
      // Reset to first track
      this.state.currentTrackIndex = 0;
      await this.loadTrack(tracks[0]);
    }

    try {
      // Play click sound effect
      await this.audioEffects.playClickSound();
      
      await this.sound.playAsync();
      this.state.isPlaying = true;
      this.notifyStateChange();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  /**
   * Pause playback
   * Requirements: 6.2, 10.1
   */
  async pause(): Promise<void> {
    if (!this.sound) {
      return;
    }

    // Record button press for glitch detection
    this.glitchController.recordButtonPress('pause');
    
    // Track consecutive pause/play presses
    this.trackPausePlayPress();

    // Stop FF/REW if active
    if (this.state.isFastForwarding) {
      await this.stopFastForward();
    }
    if (this.state.isRewinding) {
      await this.stopRewind();
    }

    try {
      await this.sound.pauseAsync();
      this.state.isPlaying = false;
      this.notifyStateChange();
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  }

  /**
   * Start fast forward with speed multiplier (call on button press)
   * Requirements: 6.3, 8.1, 8.2, 9.1, 9.2, 10.2
   */
  async startFastForward(): Promise<void> {
    if (!this.sound || !this.mixtape) {
      return;
    }

    // Check if in glitch mode - play error sound and prevent FF
    if (this.state.glitchMode && this.glitchController.isGlitchActive(this.state.glitchMode)) {
      console.log('FF pressed during glitch mode! Playing error sound...');
      // Play random FF error sound during glitch mode
      await SoundEffects.getInstance().playRandomFFError();
      return;
    }

    // Check if overheated - disable FF/REW when overheated
    if (this.state.isOverheated) {
      return;
    }

    // If already fast forwarding, do nothing
    if (this.state.isFastForwarding) {
      return;
    }

    // Record button press and FF/REW action for glitch detection
    this.glitchController.recordButtonPress('ff');
    this.glitchController.recordFFREWAction('ff');

    // Increment overheat meter
    this.incrementOverheat();

    // Stop rewinding if active
    if (this.state.isRewinding) {
      await this.stopRewind();
    }

    // Reset speed multiplier
    this.ffSpeedMultiplier = 2.0;

    this.state.isFastForwarding = true;
    this.notifyStateChange();

    try {
      // Apply pitch shift effect for fast forward (chipmunk effect)
      await PitchShiftManager.applyFastForwardPitch(this.sound, this.ffSpeedMultiplier);
      
      // If not playing, start playing
      if (!this.state.isPlaying) {
        await this.sound.playAsync();
        this.state.isPlaying = true;
      }

      // Start monitoring for track skip threshold
      this.startFFMonitoring();
      
      // Start gradual speed increase
      this.startFFSpeedIncrease();
    } catch (error) {
      console.error('Error during fast forward:', error);
      this.state.isFastForwarding = false;
      this.notifyStateChange();
    }
  }

  /**
   * Gradually increase fast forward speed while held
   */
  private startFFSpeedIncrease(): void {
    // Clear any existing interval
    if (this.ffSpeedIncreaseInterval) {
      clearInterval(this.ffSpeedIncreaseInterval);
    }

    this.ffSpeedIncreaseInterval = setInterval(async () => {
      if (!this.state.isFastForwarding || !this.sound) {
        if (this.ffSpeedIncreaseInterval) {
          clearInterval(this.ffSpeedIncreaseInterval);
          this.ffSpeedIncreaseInterval = null;
        }
        return;
      }

      // Gradually increase speed up to 4x
      if (this.ffSpeedMultiplier < 4.0) {
        this.ffSpeedMultiplier += 0.2;
        try {
          await PitchShiftManager.applyFastForwardPitch(this.sound, this.ffSpeedMultiplier);
        } catch (error) {
          console.error('Error increasing FF speed:', error);
        }
      }
    }, 500); // Increase every 500ms
  }

  /**
   * Legacy method for backward compatibility
   */
  async fastForward(): Promise<void> {
    await this.startFastForward();
  }

  /**
   * Stop fast forward and return to normal playback (call on button release)
   * Requirements: 10.2
   */
  async stopFastForward(): Promise<void> {
    if (!this.sound || !this.state.isFastForwarding) {
      return;
    }

    this.state.isFastForwarding = false;

    // Clear monitoring interval
    if (this.ffInterval) {
      clearInterval(this.ffInterval);
      this.ffInterval = null;
    }

    // Clear speed increase interval
    if (this.ffSpeedIncreaseInterval) {
      clearInterval(this.ffSpeedIncreaseInterval);
      this.ffSpeedIncreaseInterval = null;
    }

    // Reset speed multiplier
    this.ffSpeedMultiplier = 2.0;

    try {
      // Reset pitch to normal playback
      await PitchShiftManager.resetPitch(this.sound);
      this.notifyStateChange();
    } catch (error) {
      console.error('Error stopping fast forward:', error);
    }
  }

  /**
   * Monitor playback position during fast forward for track skipping
   */
  private startFFMonitoring(): void {
    // Clear any existing interval
    if (this.ffInterval) {
      clearInterval(this.ffInterval);
    }

    this.ffInterval = setInterval(async () => {
      if (!this.state.isFastForwarding || !this.sound) {
        if (this.ffInterval) {
          clearInterval(this.ffInterval);
          this.ffInterval = null;
        }
        return;
      }

      // Check if we've passed the threshold
      const percentComplete = (this.state.position / this.state.duration) * 100;
      
      if (percentComplete >= FF_THRESHOLD_PERCENT) {
        // Skip to next track and continue FF
        const tracks = this.getCurrentSideTracks();
        const nextIndex = this.state.currentTrackIndex + 1;
        
        if (nextIndex < tracks.length) {
          // Move to next track
          this.state.currentTrackIndex = nextIndex;
          
          // Temporarily stop FF to load new track
          await this.stopFastForward();
          await this.loadTrack(tracks[nextIndex]);
          
          // Resume FF on new track
          await this.startFastForward();
        } else {
          // End of side - stop FF
          await this.stopFastForward();
          this.state.isPlaying = false;
          this.notifyStateChange();
        }
      }
    }, 100); // Check every 100ms
  }

  /**
   * Start rewind with reverse playback (call on button press)
   * Requirements: 6.4, 8.4, 9.1, 9.2, 10.3
   */
  async startRewind(): Promise<void> {
    if (!this.sound || !this.mixtape) {
      return;
    }

    // Check if in glitch mode - play rewind error sound and prevent REW
    if (this.state.glitchMode && this.glitchController.isGlitchActive(this.state.glitchMode)) {
      console.log('REW pressed during glitch mode! Playing rewind error sound...');
      // Play rewind error sound during glitch mode
      await SoundEffects.getInstance().playRewindError();
      return;
    }

    // Check if overheated - disable FF/REW when overheated
    if (this.state.isOverheated) {
      return;
    }

    // If already rewinding, do nothing
    if (this.state.isRewinding) {
      return;
    }

    // Record button press and FF/REW action for glitch detection
    this.glitchController.recordButtonPress('rew');
    this.glitchController.recordFFREWAction('rew');

    // Increment overheat meter
    this.incrementOverheat();

    // Stop fast forwarding if active
    if (this.state.isFastForwarding) {
      await this.stopFastForward();
    }

    // Reset speed multiplier
    this.rewSpeedMultiplier = 2.0;

    this.state.isRewinding = true;
    this.notifyStateChange();

    try {
      // Apply pitch shift effect for rewind
      await PitchShiftManager.applyRewindPitch(this.sound, this.rewSpeedMultiplier);
      
      // Start rewinding by seeking backwards
      this.startREWMonitoring();
      
      // Start gradual speed increase
      this.startREWSpeedIncrease();
    } catch (error) {
      console.error('Error during rewind:', error);
      this.state.isRewinding = false;
      this.notifyStateChange();
    }
  }

  /**
   * Gradually increase rewind speed while held
   */
  private startREWSpeedIncrease(): void {
    // Clear any existing interval
    if (this.rewSpeedIncreaseInterval) {
      clearInterval(this.rewSpeedIncreaseInterval);
    }

    this.rewSpeedIncreaseInterval = setInterval(async () => {
      if (!this.state.isRewinding || !this.sound) {
        if (this.rewSpeedIncreaseInterval) {
          clearInterval(this.rewSpeedIncreaseInterval);
          this.rewSpeedIncreaseInterval = null;
        }
        return;
      }

      // Gradually increase speed up to 4x
      if (this.rewSpeedMultiplier < 4.0) {
        this.rewSpeedMultiplier += 0.2;
        try {
          await PitchShiftManager.applyRewindPitch(this.sound, this.rewSpeedMultiplier);
        } catch (error) {
          console.error('Error increasing REW speed:', error);
        }
      }
    }, 500); // Increase every 500ms
  }

  /**
   * Legacy method for backward compatibility
   */
  async rewind(): Promise<void> {
    await this.startRewind();
  }

  /**
   * Stop rewind and return to normal playback (call on button release)
   * Requirements: 10.3
   */
  async stopRewind(): Promise<void> {
    if (!this.state.isRewinding) {
      return;
    }

    this.state.isRewinding = false;

    // Clear monitoring interval
    if (this.rewInterval) {
      clearInterval(this.rewInterval);
      this.rewInterval = null;
    }

    // Clear speed increase interval
    if (this.rewSpeedIncreaseInterval) {
      clearInterval(this.rewSpeedIncreaseInterval);
      this.rewSpeedIncreaseInterval = null;
    }

    // Reset speed multiplier
    this.rewSpeedMultiplier = 2.0;

    // Reset pitch to normal if sound is loaded
    if (this.sound) {
      try {
        await PitchShiftManager.resetPitch(this.sound);
      } catch (error) {
        console.error('Error resetting pitch after rewind:', error);
      }
    }

    this.notifyStateChange();
  }

  /**
   * Monitor and control rewind behavior
   */
  private startREWMonitoring(): void {
    // Clear any existing interval
    if (this.rewInterval) {
      clearInterval(this.rewInterval);
    }

    const rewStep = 500; // Seek backwards by 500ms each step
    const rewIntervalMs = 100; // Update every 100ms

    this.rewInterval = setInterval(async () => {
      if (!this.state.isRewinding || !this.sound) {
        if (this.rewInterval) {
          clearInterval(this.rewInterval);
          this.rewInterval = null;
        }
        return;
      }

      const newPosition = Math.max(0, this.state.position - rewStep);

      // Check if we've reached the beginning of the track
      if (newPosition <= 0) {
        // Skip to previous track and continue REW
        const tracks = this.getCurrentSideTracks();
        const prevIndex = this.state.currentTrackIndex - 1;
        
        if (prevIndex >= 0) {
          // Move to previous track
          this.state.currentTrackIndex = prevIndex;
          
          // Temporarily stop REW to load new track
          await this.stopRewind();
          await this.loadTrack(tracks[prevIndex]);
          
          // Seek to end of previous track
          if (this.sound && this.state.duration > 0) {
            await this.sound.setPositionAsync(this.state.duration);
            this.state.position = this.state.duration;
          }
          
          // Resume REW on previous track
          await this.startRewind();
        } else {
          // At beginning of side - stop REW
          await this.stopRewind();
          this.state.position = 0;
          this.notifyStateChange();
        }
      } else {
        // Seek backwards
        try {
          await this.sound.setPositionAsync(newPosition);
          this.state.position = newPosition;
          this.notifyStateChange();
        } catch (error) {
          console.error('Error seeking during rewind:', error);
        }
      }
    }, rewIntervalMs);
  }

  /**
   * Skip to the previous track
   */
  private async skipToPreviousTrack(): Promise<void> {
    const tracks = this.getCurrentSideTracks();
    const prevIndex = this.state.currentTrackIndex - 1;

    if (prevIndex >= 0) {
      this.state.currentTrackIndex = prevIndex;
      await this.loadTrack(tracks[prevIndex]);
      
      if (this.state.isPlaying) {
        await this.play();
      }
    } else {
      // At the beginning of the side, just restart current track
      this.state.position = 0;
      if (this.sound) {
        await this.sound.setPositionAsync(0);
      }
      this.notifyStateChange();
    }
  }

  /**
   * Flip to the opposite side with animation sequence
   * Requirements: 6.5, 8.3, 10.4
   */
  async flipSide(): Promise<void> {
    // Record button press for glitch detection
    this.glitchController.recordButtonPress('flip');

    // Stop any FF/REW operations
    if (this.state.isFastForwarding) {
      await this.stopFastForward();
    }
    if (this.state.isRewinding) {
      await this.stopRewind();
    }

    // Step 1: Stop reel animations (pause current playback)
    if (this.sound && this.state.isPlaying) {
      await this.sound.pauseAsync();
    }

    this.state.isPlaying = false;
    this.notifyStateChange();

    // Step 2: Play mechanical tape deck sounds for flip
    await this.audioEffects.playFlipSound();

    // Step 3: Execute tape eject animation (handled by UI)
    // Small delay to allow UI to show eject animation and sounds to play
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Step 4: Switch sides
    this.state.currentSide = this.state.currentSide === 'A' ? 'B' : 'A';
    this.state.currentTrackIndex = 0;
    this.state.position = 0;

    // Step 5: Load first track of new side
    const tracks = this.getCurrentSideTracks();
    if (tracks.length > 0) {
      await this.loadTrack(tracks[0]);
    }

    // Step 6: Restart reels (ready to play)
    this.notifyStateChange();
  }

  /**
   * Check if we're at the end of the current side
   */
  isAtEndOfSide(): boolean {
    const tracks = this.getCurrentSideTracks();
    return this.state.currentTrackIndex >= tracks.length - 1 &&
           this.state.position >= this.state.duration;
  }

  /**
   * Get the opposite side
   */
  getOppositeSide(): 'A' | 'B' {
    return this.state.currentSide === 'A' ? 'B' : 'A';
  }

  /**
   * Seek to a specific position in milliseconds
   */
  async seekTo(position: number): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.setPositionAsync(position);
      this.state.position = position;
      this.notifyStateChange();
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }

  /**
   * Get the current playback state
   */
  getCurrentState(): PlaybackState {
    return { ...this.state };
  }

  /**
   * Register a callback for state changes
   * Returns an unsubscribe function
   */
  onStateChange(callback: StateChangeCallback): () => void {
    this.stateChangeCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.stateChangeCallbacks.delete(callback);
    };
  }

  /**
   * Notify all registered callbacks of state changes
   */
  private notifyStateChange(): void {
    const stateCopy = this.getCurrentState();
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(stateCopy);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  /**
   * Track consecutive pause/play button presses
   * Play pause sound if pressed more than 3 times consecutively
   */
  private trackPausePlayPress(): void {
    const now = Date.now();
    const timeSinceLastPress = now - this.lastPausePlayPressTime;
    
    // Reset counter if more than 2 seconds have passed
    if (timeSinceLastPress > 2000) {
      this.pausePlayPressCount = 1;
    } else {
      this.pausePlayPressCount++;
    }
    
    this.lastPausePlayPressTime = now;
    
    // Clear existing timeout
    if (this.pausePlayResetTimeout) {
      clearTimeout(this.pausePlayResetTimeout);
    }
    
    // Reset counter after 2 seconds of inactivity
    this.pausePlayResetTimeout = setTimeout(() => {
      this.pausePlayPressCount = 0;
    }, 2000);
    
    // Play pause sound if pressed more than 3 times
    if (this.pausePlayPressCount > 3) {
      console.log('Pause/Play pressed more than 3 times consecutively!');
      SoundEffects.getInstance().playPause().catch(console.error);
      // Reset counter after playing sound
      this.pausePlayPressCount = 0;
    }
  }

  /**
   * Increment overheat meter when FF/REW is used
   * Requirements: 9.1, 9.2, 11.3
   */
  private incrementOverheat(): void {
    this.state.overheatLevel = Math.min(OVERHEAT_MAX, this.state.overheatLevel + OVERHEAT_INCREMENT);

    // Check overheat level for glitch trigger
    this.glitchController.checkOverheatLevel(this.state.overheatLevel);

    // Check if we've reached maximum overheat
    if (this.state.overheatLevel >= OVERHEAT_MAX) {
      this.triggerOverheat();
    }

    this.notifyStateChange();
  }

  /**
   * Trigger overheat state and start cooldown
   * Requirements: 9.2, 9.3, 9.4
   */
  private triggerOverheat(): void {
    this.state.isOverheated = true;
    this.notifyStateChange();

    // Clear any existing cooldown
    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
    }

    // Start cooldown timer
    this.cooldownTimeout = setTimeout(() => {
      this.resetOverheat();
    }, OVERHEAT_COOLDOWN_DURATION);
  }

  /**
   * Reset overheat state after cooldown
   * Requirements: 9.4
   */
  private resetOverheat(): void {
    this.state.overheatLevel = 0;
    this.state.isOverheated = false;
    this.cooldownTimeout = null;
    this.notifyStateChange();
  }

  /**
   * Start gradual overheat meter decay
   * Requirements: 9.5
   */
  private startOverheatDecay(): void {
    // Clear any existing decay interval
    if (this.overheatDecayInterval) {
      clearInterval(this.overheatDecayInterval);
    }

    // Decay overheat meter gradually over time (every second)
    this.overheatDecayInterval = setInterval(() => {
      if (this.state.overheatLevel > 0 && !this.state.isOverheated) {
        this.state.overheatLevel = Math.max(0, this.state.overheatLevel - OVERHEAT_DECAY_RATE);
        this.notifyStateChange();
      }
    }, 1000); // Run every second
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // Clear intervals
    if (this.ffInterval) {
      clearInterval(this.ffInterval);
      this.ffInterval = null;
    }
    if (this.rewInterval) {
      clearInterval(this.rewInterval);
      this.rewInterval = null;
    }
    if (this.overheatDecayInterval) {
      clearInterval(this.overheatDecayInterval);
      this.overheatDecayInterval = null;
    }
    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
      this.cooldownTimeout = null;
    }
    if (this.pausePlayResetTimeout) {
      clearTimeout(this.pausePlayResetTimeout);
      this.pausePlayResetTimeout = null;
    }

    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
    }
    
    // Clean up preloaded sound
    if (this.nextSound) {
      await this.nextSound.unloadAsync();
      this.nextSound = null;
    }
    
    // Clean up audio effects
    await this.audioEffects.cleanup();
    
    // Clean up glitch controller
    await this.glitchController.cleanup();
    
    this.stateChangeCallbacks.clear();
    this.mixtape = null;
    this.state = this.createInitialState();
  }
}
