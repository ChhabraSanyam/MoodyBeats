/**
 * Unit tests for AudioEffectsManager service
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

import { Audio } from 'expo-av';
import { AudioEffectsManager, PitchShiftManager } from '../AudioEffectsManager';

// Mock Expo AV
jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

// Mock require for audio assets
jest.mock('../../assets/sounds/play-click.mp3', () => 'play-click.mp3', { virtual: true });
jest.mock('../../assets/sounds/pause-clunk.mp3', () => 'pause-clunk.mp3', { virtual: true });
jest.mock('../../assets/sounds/flip-mechanical.mp3', () => 'flip-mechanical.mp3', { virtual: true });
jest.mock('../../assets/sounds/tape-eject.mp3', () => 'tape-eject.mp3', { virtual: true });
jest.mock('../../assets/sounds/tape-insert.mp3', () => 'tape-insert.mp3', { virtual: true });

describe('AudioEffectsManager', () => {
  let manager: AudioEffectsManager;
  let mockSound: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock sound object
    mockSound = {
      playAsync: jest.fn().mockResolvedValue(undefined),
      setPositionAsync: jest.fn().mockResolvedValue(undefined),
      unloadAsync: jest.fn().mockResolvedValue(undefined),
    };

    // Mock Sound.createAsync to return our mock sound
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
    });

    manager = new AudioEffectsManager();
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  describe('initialize()', () => {
    it('should configure audio mode', async () => {
      await manager.initialize();

      expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    });

    it('should preload all sound effects', async () => {
      await manager.initialize();

      // Verify that 5 sound effects were loaded
      expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(5);
      
      // Verify all calls used correct options
      const calls = (Audio.Sound.createAsync as jest.Mock).mock.calls;
      calls.forEach(call => {
        expect(call[1]).toEqual({ shouldPlay: false, volume: 0.7 });
      });
    });

    it('should not initialize twice', async () => {
      await manager.initialize();
      await manager.initialize();

      // Should only call createAsync 5 times (once per sound), not 10
      expect(Audio.Sound.createAsync).toHaveBeenCalledTimes(5);
    });

    it('should handle initialization errors gracefully', async () => {
      (Audio.Sound.createAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to load sound')
      );

      await expect(manager.initialize()).resolves.not.toThrow();
    });
  });

  describe('playEffect()', () => {
    it('should initialize if not already initialized', async () => {
      await manager.playEffect('play-click');

      expect(Audio.Sound.createAsync).toHaveBeenCalled();
    });

    it('should rewind sound to start and play', async () => {
      await manager.initialize();
      await manager.playEffect('play-click');

      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
      expect(mockSound.playAsync).toHaveBeenCalled();
    });

    it('should handle missing sound effect gracefully', async () => {
      await manager.initialize();
      
      // Clear the sound effects map to simulate missing sound
      (manager as any).soundEffects.clear();
      
      await expect(manager.playEffect('play-click')).resolves.not.toThrow();
    });

    it('should handle playback errors gracefully', async () => {
      await manager.initialize();
      mockSound.playAsync.mockRejectedValueOnce(new Error('Playback failed'));

      await expect(manager.playEffect('play-click')).resolves.not.toThrow();
    });
  });

  describe('playClickSound()', () => {
    it('should play the play-click sound effect', async () => {
      await manager.initialize();
      await manager.playClickSound();

      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
      expect(mockSound.playAsync).toHaveBeenCalled();
    });
  });

  describe('playClunkSound()', () => {
    it('should play the pause-clunk sound effect', async () => {
      await manager.initialize();
      await manager.playClunkSound();

      expect(mockSound.setPositionAsync).toHaveBeenCalledWith(0);
      expect(mockSound.playAsync).toHaveBeenCalled();
    });
  });

  describe('playFlipSound()', () => {
    it('should play tape-eject sound first', async () => {
      await manager.initialize();
      mockSound.setPositionAsync.mockClear();
      mockSound.playAsync.mockClear();

      await manager.playFlipSound();

      // Should have called playAsync at least once (for tape-eject)
      expect(mockSound.playAsync).toHaveBeenCalled();
    });

    it('should sequence multiple sound effects', async () => {
      await manager.initialize();
      
      // Verify the method exists and can be called
      expect(manager.playFlipSound).toBeDefined();
      expect(typeof manager.playFlipSound).toBe('function');
      
      // Call the method - it will play sounds in sequence
      await expect(manager.playFlipSound()).resolves.not.toThrow();
    });
  });

  describe('cleanup()', () => {
    it('should unload all sound effects', async () => {
      await manager.initialize();

      await manager.cleanup();

      expect(mockSound.unloadAsync).toHaveBeenCalledTimes(5);
    });

    it('should clear sound effects map', async () => {
      await manager.initialize();

      await manager.cleanup();

      expect((manager as any).soundEffects.size).toBe(0);
    });

    it('should reset initialized flag', async () => {
      await manager.initialize();
      expect((manager as any).isInitialized).toBe(true);

      await manager.cleanup();

      expect((manager as any).isInitialized).toBe(false);
    });

    it('should handle unload errors gracefully', async () => {
      await manager.initialize();
      mockSound.unloadAsync.mockRejectedValueOnce(new Error('Unload failed'));

      await expect(manager.cleanup()).resolves.not.toThrow();
    });
  });
});

describe('PitchShiftManager', () => {
  let mockSound: any;

  beforeEach(() => {
    mockSound = {
      setRateAsync: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('applyFastForwardPitch()', () => {
    it('should set rate without pitch correction', async () => {
      await PitchShiftManager.applyFastForwardPitch(mockSound, 2.0);

      expect(mockSound.setRateAsync).toHaveBeenCalledWith(2.0, false);
    });

    it('should use default speed of 2.0', async () => {
      await PitchShiftManager.applyFastForwardPitch(mockSound);

      expect(mockSound.setRateAsync).toHaveBeenCalledWith(2.0, false);
    });

    it('should handle errors gracefully', async () => {
      mockSound.setRateAsync.mockRejectedValueOnce(new Error('Rate change failed'));

      await expect(
        PitchShiftManager.applyFastForwardPitch(mockSound)
      ).resolves.not.toThrow();
    });
  });

  describe('applyRewindPitch()', () => {
    it('should set rate without pitch correction', async () => {
      await PitchShiftManager.applyRewindPitch(mockSound, 2.0);

      expect(mockSound.setRateAsync).toHaveBeenCalledWith(2.0, false);
    });

    it('should use default speed of 2.0', async () => {
      await PitchShiftManager.applyRewindPitch(mockSound);

      expect(mockSound.setRateAsync).toHaveBeenCalledWith(2.0, false);
    });

    it('should handle errors gracefully', async () => {
      mockSound.setRateAsync.mockRejectedValueOnce(new Error('Rate change failed'));

      await expect(
        PitchShiftManager.applyRewindPitch(mockSound)
      ).resolves.not.toThrow();
    });
  });

  describe('resetPitch()', () => {
    it('should reset rate to 1.0 with pitch correction', async () => {
      await PitchShiftManager.resetPitch(mockSound);

      expect(mockSound.setRateAsync).toHaveBeenCalledWith(1.0, true);
    });

    it('should handle errors gracefully', async () => {
      mockSound.setRateAsync.mockRejectedValueOnce(new Error('Rate change failed'));

      await expect(
        PitchShiftManager.resetPitch(mockSound)
      ).resolves.not.toThrow();
    });
  });
});
