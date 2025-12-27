/**
 * Unit tests for AudioEffectsManager service
 * Requirements: 10.1, 10.2, 10.3, 10.4
 */

import { AudioEffectsManager, PitchShiftManager } from '../AudioEffectsManager';

// Mock Expo Audio
const mockAudioPlayer = jest.fn().mockImplementation(() => ({
  load: jest.fn().mockResolvedValue(undefined),
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  seekTo: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  getCurrentStatus: jest.fn().mockResolvedValue({
    isLoaded: true,
    duration: 180,
    currentTime: 0,
    isPlaying: false,
  }),
  addListener: jest.fn(),
  setPlaybackRate: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: mockAudioPlayer,
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock require for audio assets
jest.mock('../../assets/sounds/play-click.mp3', () => 'play-click.mp3', { virtual: true });
jest.mock('../../assets/sounds/pause-clunk.mp3', () => 'pause-clunk.mp3', { virtual: true });
jest.mock('../../assets/sounds/flip-mechanical.mp3', () => 'flip-mechanical.mp3', { virtual: true });
jest.mock('../../assets/sounds/tape-eject.mp3', () => 'tape-eject.mp3', { virtual: true });
jest.mock('../../assets/sounds/tape-insert.mp3', () => 'tape-insert.mp3', { virtual: true });

describe('AudioEffectsManager', () => {
  let manager: AudioEffectsManager;
  let mockPlayer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock player object
    mockPlayer = {
      load: jest.fn().mockResolvedValue(undefined),
      play: jest.fn().mockResolvedValue(undefined),
      seekTo: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    // Mock createAudioPlayer to return our mock player
    mockAudioPlayer.mockImplementation(() => mockPlayer);

    manager = new AudioEffectsManager();
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  describe('initialize()', () => {
    it('should preload all sound effects', async () => {
      await manager.initialize();

      // Verify that 5 sound effects were loaded
      expect(mockAudioPlayer).toHaveBeenCalledTimes(5);
      
      // Verify all players were loaded
      expect(mockPlayer.load).toHaveBeenCalledTimes(5);
    });

    it('should not initialize twice', async () => {
      await manager.initialize();
      await manager.initialize();

      // Should only create 5 players (once per sound), not 10
      expect(mockAudioPlayer).toHaveBeenCalledTimes(5);
    });

    it('should handle initialization errors gracefully', async () => {
      (mockAudioPlayer as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to load sound')
      );

      await expect(manager.initialize()).resolves.not.toThrow();
    });
  });

  describe('playEffect()', () => {
    it('should initialize if not already initialized', async () => {
      await manager.playEffect('play-click');

      expect(mockAudioPlayer).toHaveBeenCalled();
    });

    it('should seek to start and play', async () => {
      await manager.initialize();
      await manager.playEffect('play-click');

      expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
      expect(mockPlayer.play).toHaveBeenCalled();
    });

    it('should handle missing sound effect gracefully', async () => {
      await manager.initialize();
      
      // Clear the sound effects map to simulate missing sound
      (manager as any).soundEffects.clear();
      
      await expect(manager.playEffect('play-click')).resolves.not.toThrow();
    });

    it('should handle playback errors gracefully', async () => {
      await manager.initialize();
      mockPlayer.play.mockRejectedValueOnce(new Error('Playback failed'));

      await expect(manager.playEffect('play-click')).resolves.not.toThrow();
    });
  });

  describe('playClickSound()', () => {
    it('should play the play-click sound effect', async () => {
      await manager.initialize();
      await manager.playClickSound();

      expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
      expect(mockPlayer.play).toHaveBeenCalled();
    });
  });

  describe('playClunkSound()', () => {
    it('should play the pause-clunk sound effect', async () => {
      await manager.initialize();
      await manager.playClunkSound();

      expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
      expect(mockPlayer.play).toHaveBeenCalled();
    });
  });

  describe('playFlipSound()', () => {
    it('should play tape-eject sound first', async () => {
      await manager.initialize();
      mockPlayer.seekTo.mockClear();
      mockPlayer.play.mockClear();

      await manager.playFlipSound();

      // Should have called play at least once (for tape-eject)
      expect(mockPlayer.play).toHaveBeenCalled();
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
    it('should remove all sound effects', async () => {
      await manager.initialize();

      await manager.cleanup();

      expect(mockPlayer.remove).toHaveBeenCalledTimes(5);
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

    it('should handle remove errors gracefully', async () => {
      await manager.initialize();
      mockPlayer.remove.mockRejectedValueOnce(new Error('Remove failed'));

      await expect(manager.cleanup()).resolves.not.toThrow();
    });
  });
});

describe('PitchShiftManager', () => {
  let mockPlayer: any;

  beforeEach(() => {
    mockPlayer = {
      setPlaybackRate: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('applyFastForwardPitch()', () => {
    it('should set rate without pitch correction', async () => {
      await PitchShiftManager.applyFastForwardPitch(mockPlayer, 2.0);

      expect(mockPlayer.setPlaybackRate).toHaveBeenCalledWith(2.0, { preservesPitch: false });
    });

    it('should use default speed of 2.0', async () => {
      await PitchShiftManager.applyFastForwardPitch(mockPlayer);

      expect(mockPlayer.setPlaybackRate).toHaveBeenCalledWith(2.0, { preservesPitch: false });
    });

    it('should handle errors gracefully', async () => {
      mockPlayer.setPlaybackRate.mockRejectedValueOnce(new Error('Rate change failed'));

      await expect(
        PitchShiftManager.applyFastForwardPitch(mockPlayer)
      ).resolves.not.toThrow();
    });
  });

  describe('applyRewindPitch()', () => {
    it('should set rate without pitch correction', async () => {
      await PitchShiftManager.applyRewindPitch(mockPlayer, 2.0);

      expect(mockPlayer.setPlaybackRate).toHaveBeenCalledWith(2.0, { preservesPitch: false });
    });

    it('should use default speed of 2.0', async () => {
      await PitchShiftManager.applyRewindPitch(mockPlayer);

      expect(mockPlayer.setPlaybackRate).toHaveBeenCalledWith(2.0, { preservesPitch: false });
    });

    it('should handle errors gracefully', async () => {
      mockPlayer.setPlaybackRate.mockRejectedValueOnce(new Error('Rate change failed'));

      await expect(
        PitchShiftManager.applyRewindPitch(mockPlayer)
      ).resolves.not.toThrow();
    });
  });

  describe('resetPitch()', () => {
    it('should reset rate to 1.0 with pitch correction', async () => {
      await PitchShiftManager.resetPitch(mockPlayer);

      expect(mockPlayer.setPlaybackRate).toHaveBeenCalledWith(1.0, { preservesPitch: true });
    });

    it('should handle errors gracefully', async () => {
      mockPlayer.setPlaybackRate.mockRejectedValueOnce(new Error('Rate change failed'));

      await expect(
        PitchShiftManager.resetPitch(mockPlayer)
      ).resolves.not.toThrow();
    });
  });
});
